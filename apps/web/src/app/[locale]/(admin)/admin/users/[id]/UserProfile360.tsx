"use client"

import React, { useState, useTransition } from "react"
import Link from "next/link"
import {
  ArrowRight,
  User,
  Phone,
  Mail,
  Calendar,
  Building,
  ShoppingBag,
  FileText,
  MessageSquare,
  Send,
  Loader2,
} from "lucide-react"
import { formatToman } from "@/lib/cement"
import { useToast } from "@/components/admin/Toast"
import {
  UserProfile,
  changeCustomerTypeAction,
  getUserOrdersAction,
  getUserQuotesAction,
  getUserContactsAction,
} from "@/actions/admin-users"
import styles from "./UserProfile360.module.css"

interface UserProfile360Props {
  initialProfile: UserProfile
  userId: string
  locale: string
}

type TabKey = "orders" | "quotes" | "contacts" | "telegram"

export function UserProfile360({
  initialProfile,
  userId,
  locale,
}: UserProfile360Props) {
  const { toast } = useToast()
  const [profile, setProfile] = useState<UserProfile>(initialProfile)
  const [customerType, setCustomerType] = useState(initialProfile.customerType)
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<TabKey>("orders")

  // Tab data states
  const [orders, setOrders] = useState<
    Array<{
      id: string
      orderNumber: string
      status: string
      totalAmount: number
      createdAt: string
    }>
  >([])
  const [ordersTotal, setOrdersTotal] = useState(initialProfile._stats.orderCount)
  const [ordersPage, setOrdersPage] = useState(1)
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersLoaded, setOrdersLoaded] = useState(false)

  const [quotes, setQuotes] = useState<
    Array<{
      id: string
      status: string
      productName: string
      quantityTon: number
      createdAt: string
    }>
  >([])
  const [quotesTotal, setQuotesTotal] = useState(initialProfile._stats.quoteCount)
  const [quotesPage, setQuotesPage] = useState(1)
  const [quotesLoading, setQuotesLoading] = useState(false)
  const [quotesLoaded, setQuotesLoaded] = useState(false)

  const [contacts, setContacts] = useState<
    Array<{
      id: string
      subject: string
      status: string
      createdAt: string
    }>
  >([])
  const [contactsTotal, setContactsTotal] = useState(initialProfile._stats.contactCount)
  const [contactsPage, setContactsPage] = useState(1)
  const [contactsLoading, setContactsLoading] = useState(false)
  const [contactsLoaded, setContactsLoaded] = useState(false)

  // Load orders
  const loadOrders = async (page: number) => {
    setOrdersLoading(true)
    try {
      const res = await getUserOrdersAction({ userId, page })
      if (res.ok && res.data) {
        setOrders(res.data.items)
        setOrdersTotal(res.data.total)
        setOrdersPage(page)
        setOrdersLoaded(true)
      } else {
        toast.error("خطا در دریافت سفارش‌ها")
      }
    } catch {
      toast.error("خطا در دریافت سفارش‌ها")
    } finally {
      setOrdersLoading(false)
    }
  }

  // Load quotes
  const loadQuotes = async (page: number) => {
    setQuotesLoading(true)
    try {
      const res = await getUserQuotesAction({ userId, page })
      if (res.ok && res.data) {
        setQuotes(res.data.items)
        setQuotesTotal(res.data.total)
        setQuotesPage(page)
        setQuotesLoaded(true)
      } else {
        toast.error("خطا در دریافت استعلام‌ها")
      }
    } catch {
      toast.error("خطا در دریافت استعلام‌ها")
    } finally {
      setQuotesLoading(false)
    }
  }

  // Load contacts
  const loadContacts = async (page: number) => {
    setContactsLoading(true)
    try {
      const res = await getUserContactsAction({ userId, page })
      if (res.ok && res.data) {
        setContacts(res.data.items)
        setContactsTotal(res.data.total)
        setContactsPage(page)
        setContactsLoaded(true)
      } else {
        toast.error("خطا در دریافت تیکت‌ها")
      }
    } catch {
      toast.error("خطا در دریافت تیکت‌ها")
    } finally {
      setContactsLoading(false)
    }
  }

  // Effect to load data on tab change
  React.useEffect(() => {
    if (activeTab === "orders" && !ordersLoaded) {
      loadOrders(1)
    } else if (activeTab === "quotes" && !quotesLoaded) {
      loadQuotes(1)
    } else if (activeTab === "contacts" && !contactsLoaded) {
      loadContacts(1)
    }
  }, [activeTab, ordersLoaded, quotesLoaded, contactsLoaded])

  const handleTypeChange = (newType: string) => {
    setCustomerType(newType)
    startTransition(async () => {
      const res = await changeCustomerTypeAction({
        userId,
        customerType: newType,
      })
      if (res.ok) {
        toast.success("نوع مشتری با موفقیت تغییر یافت")
        setProfile((prev) => ({ ...prev, customerType: newType }))
      } else {
        toast.error(res.error || "خطا در تغییر نوع مشتری")
        setCustomerType(profile.customerType)
      }
    })
  }

  const formatJalali = (isoStr: string) => {
    try {
      return new Intl.DateTimeFormat("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(isoStr))
    } catch {
      return isoStr
    }
  }

  const formatJalaliShort = (isoStr: string) => {
    try {
      return new Intl.DateTimeFormat("fa-IR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(isoStr))
    } catch {
      return isoStr
    }
  }

  const orderStatusMap: Record<string, { label: string; color: string }> = {
    PENDING_PAYMENT: { label: "در انتظار پرداخت", color: "#eab308" },
    PROCESSING: { label: "در حال پردازش", color: "#3b82f6" },
    CONFIRMED: { label: "تأیید شده", color: "#10b981" },
    SHIPPED: { label: "ارسال شده", color: "#8b5cf6" },
    DELIVERED: { label: "تحویل شده", color: "#16a34a" },
    CANCELLED: { label: "لغو شده", color: "#ef4444" },
    REFUNDED: { label: "مرجوعی", color: "#6b7280" },
  }

  const quoteStatusMap: Record<string, { label: string; color: string }> = {
    PENDING: { label: "در انتظار بررسی", color: "#eab308" },
    QUOTED: { label: "قیمت‌گذاری شده", color: "#3b82f6" },
    ACCEPTED: { label: "پذیرفته شده", color: "#16a34a" },
    REJECTED: { label: "رد شده", color: "#ef4444" },
    EXPIRED: { label: "منقضی شده", color: "#6b7280" },
  }

  return (
    <div className={styles["up-container"]}>
      {/* Back Link */}
      <Link href={`/${locale}/admin/users`} className={styles["up-backLink"]}>
        <ArrowRight style={{ width: "1rem", height: "1rem" }} />
        <span>بازگشت به همه کاربران</span>
      </Link>

      {/* Header Profile Card */}
      <div className={styles["up-headerCard"]}>
        <div className={styles["up-userInfo"]}>
          <div className={styles["up-avatar"]}>
            {profile.name ? profile.name.slice(0, 1) : <User style={{ width: "1.5rem", height: "1.5rem" }} />}
          </div>
          <div className={styles["up-userDetails"]}>
            <div className={styles["up-nameRow"]}>
              <h1 className={styles["up-userName"]}>
                {profile.name || "کاربر بدون نام"}
              </h1>
              <span
                className={`${styles["up-badge"]} ${
                  profile.isActive ? styles["up-badgeActive"] : styles["up-badgeInactive"]
                }`}
              >
                {profile.isActive ? "فعال" : "غیرفعال"}
              </span>
            </div>
            <div className={styles["up-metaList"]}>
              {profile.phone && (
                <span className={styles["up-metaItem"]}>
                  <Phone style={{ width: "0.875rem", height: "0.875rem" }} />
                  <span>{profile.phone}</span>
                </span>
              )}
              {profile.email && (
                <span className={styles["up-metaItem"]}>
                  <Mail style={{ width: "0.875rem", height: "0.875rem" }} />
                  <span>{profile.email}</span>
                </span>
              )}
              <span className={styles["up-metaItem"]}>
                <Calendar style={{ width: "0.875rem", height: "0.875rem" }} />
                <span>عضویت: {formatJalali(profile.createdAt)}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Customer Type Selector */}
        <div className={styles["up-actionsGroup"]}>
          <label htmlFor="customerTypeSelect" className={styles["up-typeLabel"]}>
            نوع مشتری:
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <select
              id="customerTypeSelect"
              className={styles["up-select"]}
              value={customerType}
              onChange={(e) => handleTypeChange(e.target.value)}
              disabled={isPending}
            >
              <option value="NORMAL">عادی</option>
              <option value="CONTRACTOR">پیمانکار</option>
              <option value="COMPANY">شرکتی / حقوقی</option>
            </select>
            {isPending && (
              <Loader2
                style={{
                  width: "1.125rem",
                  height: "1.125rem",
                  animation: "spin 1s linear infinite",
                  color: "var(--color-accent)",
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className={styles["up-statsGrid"]}>
        <div className={styles["up-statCard"]}>
          <span className={styles["up-statTitle"]}>
            <ShoppingBag style={{ width: "1rem", height: "1rem", color: "var(--color-accent)" }} />
            مجموع خرید موفق
          </span>
          <span className={styles["up-statValue"]}>
            {formatToman(profile._stats.totalPurchaseToman)}
          </span>
        </div>
        <div className={styles["up-statCard"]}>
          <span className={styles["up-statTitle"]}>
            <ShoppingBag style={{ width: "1rem", height: "1rem", color: "#3b82f6" }} />
            تعداد سفارش‌ها
          </span>
          <span className={styles["up-statValue"]}>
            {profile._stats.orderCount.toLocaleString("fa-IR")}
          </span>
        </div>
        <div className={styles["up-statCard"]}>
          <span className={styles["up-statTitle"]}>
            <FileText style={{ width: "1rem", height: "1rem", color: "#10b981" }} />
            تعداد استعلام‌ها
          </span>
          <span className={styles["up-statValue"]}>
            {profile._stats.quoteCount.toLocaleString("fa-IR")}
          </span>
        </div>
        <div className={styles["up-statCard"]}>
          <span className={styles["up-statTitle"]}>
            <MessageSquare style={{ width: "1rem", height: "1rem", color: "#8b5cf6" }} />
            تعداد تیکت‌ها و پیام‌ها
          </span>
          <span className={styles["up-statValue"]}>
            {profile._stats.contactCount.toLocaleString("fa-IR")}
          </span>
        </div>
      </div>

      {/* Company Profile (Read-only if exists) */}
      {profile.customerProfile && (
        <div className={styles["up-companyCard"]}>
          <h2 className={styles["up-companyTitle"]}>
            <Building style={{ width: "1.125rem", height: "1.125rem", color: "var(--color-accent)" }} />
            مشخصات شرکت و حقوقی
          </h2>
          <div className={styles["up-companyGrid"]}>
            <div className={styles["up-fieldItem"]}>
              <span className={styles["up-fieldLabel"]}>نام شرکت</span>
              <span className={styles["up-fieldValue"]}>
                {profile.customerProfile.companyName || "—"}
              </span>
            </div>
            <div className={styles["up-fieldItem"]}>
              <span className={styles["up-fieldLabel"]}>شناسه ملی</span>
              <span className={styles["up-fieldValue"]}>
                {profile.customerProfile.nationalId || "—"}
              </span>
            </div>
            <div className={styles["up-fieldItem"]}>
              <span className={styles["up-fieldLabel"]}>کد اقتصادی</span>
              <span className={styles["up-fieldValue"]}>
                {profile.customerProfile.economicCode || "—"}
              </span>
            </div>
            <div className={styles["up-fieldItem"]}>
              <span className={styles["up-fieldLabel"]}>کد پستی</span>
              <span className={styles["up-fieldValue"]}>
                {profile.customerProfile.postalCode || "—"}
              </span>
            </div>
            <div className={styles["up-fieldItem"]} style={{ gridColumn: "1 / -1" }}>
              <span className={styles["up-fieldLabel"]}>نشانی شرکت</span>
              <span className={styles["up-fieldValue"]}>
                {profile.customerProfile.address || "—"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 4 Tabs Section */}
      <div className={styles["up-tabsContainer"]}>
        <div className={styles["up-tabsNav"]}>
          <button
            type="button"
            className={`${styles["up-tabBtn"]} ${
              activeTab === "orders" ? styles["up-tabBtnActive"] : ""
            }`}
            onClick={() => setActiveTab("orders")}
          >
            <ShoppingBag style={{ width: "1rem", height: "1rem" }} />
            <span>سفارش‌ها</span>
            <span className={styles["up-tabCount"]}>
              {profile._stats.orderCount.toLocaleString("fa-IR")}
            </span>
          </button>
          <button
            type="button"
            className={`${styles["up-tabBtn"]} ${
              activeTab === "quotes" ? styles["up-tabBtnActive"] : ""
            }`}
            onClick={() => setActiveTab("quotes")}
          >
            <FileText style={{ width: "1rem", height: "1rem" }} />
            <span>استعلام‌ها</span>
            <span className={styles["up-tabCount"]}>
              {profile._stats.quoteCount.toLocaleString("fa-IR")}
            </span>
          </button>
          <button
            type="button"
            className={`${styles["up-tabBtn"]} ${
              activeTab === "contacts" ? styles["up-tabBtnActive"] : ""
            }`}
            onClick={() => setActiveTab("contacts")}
          >
            <MessageSquare style={{ width: "1rem", height: "1rem" }} />
            <span>تیکت‌ها</span>
            <span className={styles["up-tabCount"]}>
              {profile._stats.contactCount.toLocaleString("fa-IR")}
            </span>
          </button>
          <button
            type="button"
            className={`${styles["up-tabBtn"]} ${
              activeTab === "telegram" ? styles["up-tabBtnActive"] : ""
            }`}
            onClick={() => setActiveTab("telegram")}
          >
            <Send style={{ width: "1rem", height: "1rem" }} />
            <span>حساب تلگرام</span>
          </button>
        </div>

        <div className={styles["up-tabContent"]}>
          {/* TAB 1: ORDERS */}
          {activeTab === "orders" && (
            <div>
              {ordersLoading && !ordersLoaded ? (
                <div className={styles["up-loading"]}>در حال بارگذاری سفارش‌ها...</div>
              ) : orders.length === 0 ? (
                <div className={styles["up-empty"]}>
                  <ShoppingBag style={{ width: "2rem", height: "2rem", opacity: 0.4 }} />
                  <span>هیچ سفارشی برای این کاربر ثبت نشده است.</span>
                </div>
              ) : (
                <>
                  <div style={{ overflowX: "auto" }}>
                    <table className={styles["up-table"]}>
                      <thead>
                        <tr>
                          <th>شماره سفارش</th>
                          <th>وضعیت</th>
                          <th>مبلغ کل</th>
                          <th>تاریخ ثبت</th>
                          <th>عملیات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((ord) => {
                          const badge = orderStatusMap[ord.status] || {
                            label: ord.status,
                            color: "var(--color-text-secondary)",
                          }
                          return (
                            <tr key={ord.id}>
                              <td style={{ fontWeight: 600 }}>{ord.orderNumber}</td>
                              <td>
                                <span
                                  style={{
                                    display: "inline-block",
                                    padding: "0.2rem 0.6rem",
                                    borderRadius: "var(--radius-full)",
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                    backgroundColor: `${badge.color}15`,
                                    color: badge.color,
                                    border: `1px solid ${badge.color}30`,
                                  }}
                                >
                                  {badge.label}
                                </span>
                              </td>
                              <td style={{ fontVariantNumeric: "tabular-nums" }}>
                                {formatToman(ord.totalAmount)}
                              </td>
                              <td>{formatJalaliShort(ord.createdAt)}</td>
                              <td>
                                <Link
                                  href={`/${locale}/admin/orders/${ord.id}`}
                                  className={styles["up-link"]}
                                >
                                  مشاهده جزئیات
                                </Link>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  {ordersTotal > 10 && (
                    <div className={styles["up-pagination"]}>
                      <span>
                        صفحه {ordersPage} از {Math.ceil(ordersTotal / 10)}
                      </span>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          type="button"
                          className={styles["up-pageBtn"]}
                          disabled={ordersPage <= 1 || ordersLoading}
                          onClick={() => loadOrders(ordersPage - 1)}
                        >
                          قبلی
                        </button>
                        <button
                          type="button"
                          className={styles["up-pageBtn"]}
                          disabled={ordersPage >= Math.ceil(ordersTotal / 10) || ordersLoading}
                          onClick={() => loadOrders(ordersPage + 1)}
                        >
                          بعدی
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* TAB 2: QUOTES */}
          {activeTab === "quotes" && (
            <div>
              {quotesLoading && !quotesLoaded ? (
                <div className={styles["up-loading"]}>در حال بارگذاری استعلام‌ها...</div>
              ) : quotes.length === 0 ? (
                <div className={styles["up-empty"]}>
                  <FileText style={{ width: "2rem", height: "2rem", opacity: 0.4 }} />
                  <span>هیچ استعلامی برای این کاربر ثبت نشده است.</span>
                </div>
              ) : (
                <>
                  <div style={{ overflowX: "auto" }}>
                    <table className={styles["up-table"]}>
                      <thead>
                        <tr>
                          <th>محصول / شرح</th>
                          <th>مقدار (تن)</th>
                          <th>وضعیت</th>
                          <th>تاریخ ثبت</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quotes.map((q) => {
                          const badge = quoteStatusMap[q.status] || {
                            label: q.status,
                            color: "var(--color-text-secondary)",
                          }
                          return (
                            <tr key={q.id}>
                              <td style={{ fontWeight: 600 }}>{q.productName}</td>
                              <td style={{ fontVariantNumeric: "tabular-nums" }}>
                                {q.quantityTon.toLocaleString("fa-IR")}
                              </td>
                              <td>
                                <span
                                  style={{
                                    display: "inline-block",
                                    padding: "0.2rem 0.6rem",
                                    borderRadius: "var(--radius-full)",
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                    backgroundColor: `${badge.color}15`,
                                    color: badge.color,
                                    border: `1px solid ${badge.color}30`,
                                  }}
                                >
                                  {badge.label}
                                </span>
                              </td>
                              <td>{formatJalaliShort(q.createdAt)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  {quotesTotal > 10 && (
                    <div className={styles["up-pagination"]}>
                      <span>
                        صفحه {quotesPage} از {Math.ceil(quotesTotal / 10)}
                      </span>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          type="button"
                          className={styles["up-pageBtn"]}
                          disabled={quotesPage <= 1 || quotesLoading}
                          onClick={() => loadQuotes(quotesPage - 1)}
                        >
                          قبلی
                        </button>
                        <button
                          type="button"
                          className={styles["up-pageBtn"]}
                          disabled={quotesPage >= Math.ceil(quotesTotal / 10) || quotesLoading}
                          onClick={() => loadQuotes(quotesPage + 1)}
                        >
                          بعدی
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* TAB 3: TICKETS / CONTACTS */}
          {activeTab === "contacts" && (
            <div>
              {contactsLoading && !contactsLoaded ? (
                <div className={styles["up-loading"]}>در حال بارگذاری تیکت‌ها...</div>
              ) : contacts.length === 0 ? (
                <div className={styles["up-empty"]}>
                  <MessageSquare style={{ width: "2rem", height: "2rem", opacity: 0.4 }} />
                  <span>هیچ تیکت یا پیامی برای این کاربر ثبت نشده است.</span>
                </div>
              ) : (
                <>
                  <div style={{ overflowX: "auto" }}>
                    <table className={styles["up-table"]}>
                      <thead>
                        <tr>
                          <th>موضوع پیام</th>
                          <th>وضعیت</th>
                          <th>تاریخ ثبت</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contacts.map((c) => (
                          <tr key={c.id}>
                            <td style={{ fontWeight: 600 }}>{c.subject}</td>
                            <td>
                              <span
                                style={{
                                  display: "inline-block",
                                  padding: "0.2rem 0.6rem",
                                  borderRadius: "var(--radius-full)",
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  backgroundColor: "var(--color-surface-hover)",
                                  color: "var(--color-text-secondary)",
                                }}
                              >
                                {c.status}
                              </span>
                            </td>
                            <td>{formatJalaliShort(c.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {contactsTotal > 10 && (
                    <div className={styles["up-pagination"]}>
                      <span>
                        صفحه {contactsPage} از {Math.ceil(contactsTotal / 10)}
                      </span>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          type="button"
                          className={styles["up-pageBtn"]}
                          disabled={contactsPage <= 1 || contactsLoading}
                          onClick={() => loadContacts(contactsPage - 1)}
                        >
                          قبلی
                        </button>
                        <button
                          type="button"
                          className={styles["up-pageBtn"]}
                          disabled={contactsPage >= Math.ceil(contactsTotal / 10) || contactsLoading}
                          onClick={() => loadContacts(contactsPage + 1)}
                        >
                          بعدی
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* TAB 4: TELEGRAM */}
          {activeTab === "telegram" && (
            <div className={styles["up-telegramBox"]}>
              <div className={styles["up-telegramIcon"]}>
                <Send style={{ width: "1.75rem", height: "1.75rem" }} />
              </div>
              <p className={styles["up-telegramNotice"]}>
                {profile.telegramUserId ? (
                  <>
                    شناسه تلگرام کاربر: <strong>{profile.telegramUserId}</strong>
                  </>
                ) : (
                  "این کاربر هنوز حساب تلگرام خود را به سیستم متصل نکرده است. (امکان اتصال خودکار در به‌روزرسانی بعدی ربات تلگرام فعال خواهد شد)"
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
