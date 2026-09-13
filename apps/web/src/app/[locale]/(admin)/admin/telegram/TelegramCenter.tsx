"use client"

import React, { useState, useEffect, useTransition } from "react"
import {
  Send,
  RotateCcw,
  Calendar as CalendarIcon,
  ListFilter,
  FileText,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react"
import {
  getOutboxItemsAction,
  retryOutboxItemAction,
  getScheduledPostsAction,
  getTelegramLogAction,
  OutboxItem,
  ScheduledPost,
  TelegramLogItem,
} from "@/actions/admin-telegram"
import { useToast } from "@/components/admin/Toast"
import { toFarsiDigits } from "@/lib/cement"
import { toJalaliShort } from "@/lib/pdf-utils"
import { formatRelativeFa } from "@tirajeh/shared"
import styles from "./TelegramCenter.module.css"

export function TelegramCenter() {
  const [activeTab, setActiveTab] = useState<"outbox" | "logs" | "calendar">("outbox")
  const { toast } = useToast()

  // ─── Outbox State ──────────────────────────────────────────────────────────
  const [outboxItems, setOutboxItems] = useState<OutboxItem[]>([])
  const [outboxTotal, setOutboxTotal] = useState(0)
  const [outboxPage, setOutboxPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [channelFilter, setChannelFilter] = useState<string>("ALL")
  const [loadingOutbox, setLoadingOutbox] = useState(false)
  const [retryingId, setRetryingId] = useState<string | null>(null)

  // ─── Logs State ────────────────────────────────────────────────────────────
  const [logs, setLogs] = useState<TelegramLogItem[]>([])
  const [logsTotal, setLogsTotal] = useState(0)
  const [logsPage, setLogsPage] = useState(1)
  const [logChannelFilter, setLogChannelFilter] = useState<string>("ALL")
  const [loadingLogs, setLoadingLogs] = useState(false)

  // ─── Calendar State ────────────────────────────────────────────────────────
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([])
  const [calendarMonthOffset, setCalendarMonthOffset] = useState(0)
  const [hoveredDayKey, setHoveredDayKey] = useState<string | null>(null)

  // Load Outbox
  const loadOutbox = async () => {
    setLoadingOutbox(true)
    try {
      const res = await getOutboxItemsAction({
        status: statusFilter,
        channel: channelFilter,
        page: outboxPage,
      })
      if (res && res.success && res.data) {
        setOutboxItems(res.data.items)
        setOutboxTotal(res.data.total)
      }
    } catch {
      toast.error("خطا در بارگذاری صندوق خروجی")
    } finally {
      setLoadingOutbox(false)
    }
  }

  // Load Logs
  const loadLogs = async () => {
    setLoadingLogs(true)
    try {
      const res = await getTelegramLogAction({
        channel: logChannelFilter,
        page: logsPage,
      })
      if (res && res.success && res.data) {
        setLogs(res.data.items)
        setLogsTotal(res.data.total)
      }
    } catch {
      toast.error("خطا در بارگذاری لاگ تلگرام")
    } finally {
      setLoadingLogs(false)
    }
  }

  // Load Calendar Posts
  const loadScheduledPosts = async () => {
    try {
      const res = await getScheduledPostsAction()
      if (res && res.success && res.data) {
        setScheduledPosts(res.data)
      }
    } catch {
      toast.error("خطا در دریافت پست‌های زمان‌بندی‌شده")
    }
  }

  useEffect(() => {
    if (activeTab === "outbox") {
      void loadOutbox()
    } else if (activeTab === "logs") {
      void loadLogs()
    } else if (activeTab === "calendar") {
      void loadScheduledPosts()
    }
  }, [activeTab, outboxPage, statusFilter, channelFilter, logsPage, logChannelFilter])

  const handleRetry = async (id: string) => {
    setRetryingId(id)
    try {
      const res = await retryOutboxItemAction({ outboxId: id })
      if (res && res.success) {
        toast.success("پیام جهت ارسال مجدد در صف قرار گرفت")
        // Update local item
        setOutboxItems((prev) =>
          prev.map((i) => (i.id === id ? { ...i, status: "PENDING", attempts: 0 } : i))
        )
      } else {
        toast.error((res as any)?.error || "خطا در ارسال مجدد")
      }
    } catch {
      toast.error("خطای سیستمی در ارسال دوباره")
    } finally {
      setRetryingId(null)
    }
  }

  // ─── Calendar Math & Helpers ───────────────────────────────────────────────
  const getPersianDateParts = (d: Date) => {
    const parts = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      timeZone: "Asia/Tehran",
    }).formatToParts(d)
    return {
      year: Number(parts.find((p) => p.type === "year")!.value),
      month: Number(parts.find((p) => p.type === "month")!.value),
      day: Number(parts.find((p) => p.type === "day")!.value),
    }
  }

  const today = new Date()
  const currentPDate = getPersianDateParts(today)

  // Persian month names
  const PERSIAN_MONTH_NAMES = [
    "فروردین",
    "اردیبهشت",
    "خرداد",
    "تیر",
    "مرداد",
    "شهریور",
    "مهر",
    "آبان",
    "آذر",
    "دی",
    "بهمن",
    "اسفند",
  ]

  // Compute displayed month
  let targetMonth = currentPDate.month + calendarMonthOffset
  let targetYear = currentPDate.year
  while (targetMonth > 12) {
    targetMonth -= 12
    targetYear += 1
  }
  while (targetMonth < 1) {
    targetMonth += 12
    targetYear -= 1
  }

  const daysInMonth = targetMonth <= 6 ? 31 : targetMonth <= 11 ? 30 : 29

  // Map scheduled posts by key "YYYY-M-D"
  const postsMap = new Map<string, ScheduledPost[]>()
  for (const post of scheduledPosts) {
    const pDate = getPersianDateParts(new Date(post.runAfter))
    const key = `${pDate.year}-${pDate.month}-${pDate.day}`
    const arr = postsMap.get(key) ?? []
    arr.push(post)
    postsMap.set(key, arr)
  }

  const weekDayNames = ["ش", "ی", "د", "س", "چ", "پ", "ج"]

  return (
    <div className={styles["tc-container"]}>
      {/* Header Card */}
      <div className={styles["tc-header"]}>
        <div className={styles["tc-headerMain"]}>
          <div className={styles["tc-headerIconBox"]}>
            <Send style={{ width: "1.75rem", height: "1.75rem" }} />
          </div>
          <div>
            <h1 className={styles["tc-title"]}>مرکز انتشار تلگرام</h1>
            <p className={styles["tc-subtitle"]}>
              مدیریت و پایش صف پیام‌های ارسالی، تاریخچه لاگ و تقویم پست‌های زمان‌بندی‌شده
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles["tc-tabs"]}>
        <button
          type="button"
          onClick={() => setActiveTab("outbox")}
          className={[
            styles["tc-tab"],
            activeTab === "outbox" ? styles["tc-tab-active"] : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <ListFilter style={{ width: "1rem", height: "1rem" }} />
          <span>صندوق خروجی (Outbox)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("logs")}
          className={[
            styles["tc-tab"],
            activeTab === "logs" ? styles["tc-tab-active"] : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <FileText style={{ width: "1rem", height: "1rem" }} />
          <span>لاگ تلگرام</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("calendar")}
          className={[
            styles["tc-tab"],
            activeTab === "calendar" ? styles["tc-tab-active"] : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <CalendarIcon style={{ width: "1rem", height: "1rem" }} />
          <span>تقویم زمان‌بندی</span>
        </button>
      </div>

      {/* Tab 1: Outbox */}
      {activeTab === "outbox" && (
        <div className={styles["tc-card"]}>
          {/* Filters */}
          <div className={styles["tc-filterBar"]}>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setOutboxPage(1)
              }}
              className={styles["tc-select"]}
            >
              <option value="ALL">وضعیت: همه</option>
              <option value="PENDING">در انتظار (PENDING)</option>
              <option value="SENT">ارسال شده (SENT)</option>
              <option value="FAILED">خطا (FAILED)</option>
              <option value="DEAD">مرده (DEAD)</option>
            </select>

            <select
              value={channelFilter}
              onChange={(e) => {
                setChannelFilter(e.target.value)
                setOutboxPage(1)
              }}
              className={styles["tc-select"]}
            >
              <option value="ALL">کانال: همه</option>
              <option value="tg_channel">کانال تلگرام (tg_channel)</option>
              <option value="tg_admin">ادمین تلگرام (tg_admin)</option>
              <option value="tg_user">کاربر تلگرام (tg_user)</option>
              <option value="email">ایمیل (email)</option>
            </select>
          </div>

          {/* Table */}
          <div className={styles["tc-tableWrap"]}>
            <table className={styles["tc-table"]}>
              <thead>
                <tr>
                  <th className={styles["tc-th"]}>رویداد</th>
                  <th className={styles["tc-th"]}>کانال</th>
                  <th className={styles["tc-th"]}>وضعیت</th>
                  <th className={styles["tc-th"]}>تلاش‌ها</th>
                  <th className={styles["tc-th"]}>زمان اجرا</th>
                  <th className={styles["tc-th"]}>آخرین خطا</th>
                  <th className={styles["tc-th"]}>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {loadingOutbox ? (
                  <tr>
                    <td colSpan={7} className={styles["tc-empty"]}>
                      <Loader2
                        style={{
                          width: "1.25rem",
                          height: "1.25rem",
                          animation: "spin 1s linear infinite",
                          display: "inline-block",
                        }}
                      />{" "}
                      در حال بارگذاری...
                    </td>
                  </tr>
                ) : outboxItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={styles["tc-empty"]}>
                      هیچ پیامی در صندوق خروجی یافت نشد.
                    </td>
                  </tr>
                ) : (
                  outboxItems.map((item) => {
                    const isFuture = new Date(item.runAfter) > new Date()
                    const isRetrying = retryingId === item.id
                    const canRetry = item.status === "FAILED" || item.status === "DEAD"

                    return (
                      <tr key={item.id}>
                        <td className={styles["tc-td"]}>
                          <span style={{ fontWeight: 600 }}>{item.event}</span>
                        </td>
                        <td className={styles["tc-td"]}>{item.channel}</td>
                        <td className={styles["tc-td"]}>
                          <span
                            className={[
                              styles["tc-badge"],
                              item.status === "PENDING"
                                ? styles["tc-badge-pending"]
                                : item.status === "SENT"
                                ? styles["tc-badge-sent"]
                                : item.status === "FAILED"
                                ? styles["tc-badge-failed"]
                                : styles["tc-badge-dead"],
                            ]
                              .filter(Boolean)
                              .join(" ")}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className={styles["tc-td"]}>{toFarsiDigits(item.attempts)}</td>
                        <td className={styles["tc-td"]}>
                          {isFuture
                            ? toJalaliShort(item.runAfter)
                            : formatRelativeFa(item.runAfter)}
                        </td>
                        <td className={styles["tc-td"]}>
                          <span
                            style={{
                              color: "var(--color-danger)",
                              fontSize: "var(--font-size-xs)",
                              maxWidth: "200px",
                              display: "inline-block",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={item.lastError ?? ""}
                          >
                            {item.lastError ?? "—"}
                          </span>
                        </td>
                        <td className={styles["tc-td"]}>
                          {canRetry && (
                            <button
                              type="button"
                              disabled={isRetrying}
                              onClick={() => handleRetry(item.id)}
                              className={styles["tc-retryBtn"]}
                            >
                              {isRetrying ? (
                                <Loader2
                                  style={{
                                    width: "0.75rem",
                                    height: "0.75rem",
                                    animation: "spin 1s linear infinite",
                                  }}
                                />
                              ) : (
                                <RotateCcw style={{ width: "0.75rem", height: "0.75rem" }} />
                              )}
                              <span>ارسال دوباره</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className={styles["tc-pagination"]}>
            <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
              مجموع: {toFarsiDigits(outboxTotal)} پیام
            </span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                disabled={outboxPage <= 1 || loadingOutbox}
                onClick={() => setOutboxPage((p) => p - 1)}
                className={styles["tc-pageBtn"]}
              >
                صفحه قبل
              </button>
              <button
                type="button"
                disabled={outboxPage * 25 >= outboxTotal || loadingOutbox}
                onClick={() => setOutboxPage((p) => p + 1)}
                className={styles["tc-pageBtn"]}
              >
                صفحه بعد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Logs */}
      {activeTab === "logs" && (
        <div className={styles["tc-card"]}>
          {/* Filter */}
          <div className={styles["tc-filterBar"]}>
            <select
              value={logChannelFilter}
              onChange={(e) => {
                setLogChannelFilter(e.target.value)
                setLogsPage(1)
              }}
              className={styles["tc-select"]}
            >
              <option value="ALL">همه کانال‌ها</option>
              <option value="tg_channel">کانال (tg_channel)</option>
              <option value="tg_admin">ادمین (tg_admin)</option>
              <option value="tg_user">کاربر (tg_user)</option>
            </select>
          </div>

          {/* Table */}
          <div className={styles["tc-tableWrap"]}>
            <table className={styles["tc-table"]}>
              <thead>
                <tr>
                  <th className={styles["tc-th"]}>کانال / چت</th>
                  <th className={styles["tc-th"]}>رویداد</th>
                  <th className={styles["tc-th"]}>وضعیت</th>
                  <th className={styles["tc-th"]}>زمان ارسال</th>
                  <th className={styles["tc-th"]}>خطا</th>
                </tr>
              </thead>
              <tbody>
                {loadingLogs ? (
                  <tr>
                    <td colSpan={5} className={styles["tc-empty"]}>
                      <Loader2
                        style={{
                          width: "1.25rem",
                          height: "1.25rem",
                          animation: "spin 1s linear infinite",
                          display: "inline-block",
                        }}
                      />{" "}
                      در حال بارگذاری لاگ‌ها...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className={styles["tc-empty"]}>
                      هنوز لاگی ثبت نشده است.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td className={styles["tc-td"]}>{log.chatId || log.channel}</td>
                      <td className={styles["tc-td"]}>{log.event}</td>
                      <td className={styles["tc-td"]}>
                        <span
                          className={[
                            styles["tc-badge"],
                            log.status === "SENT" || log.status === "UPDATED"
                              ? styles["tc-badge-sent"]
                              : styles["tc-badge-failed"],
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className={styles["tc-td"]}>{toJalaliShort(log.sentAt)}</td>
                      <td className={styles["tc-td"]}>
                        <span
                          style={{
                            color: "var(--color-danger)",
                            fontSize: "var(--font-size-xs)",
                          }}
                        >
                          {log.errorMessage ?? "—"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className={styles["tc-pagination"]}>
            <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
              مجموع: {toFarsiDigits(logsTotal)} لاگ
            </span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                disabled={logsPage <= 1 || loadingLogs}
                onClick={() => setLogsPage((p) => p - 1)}
                className={styles["tc-pageBtn"]}
              >
                صفحه قبل
              </button>
              <button
                type="button"
                disabled={logsPage * 25 >= logsTotal || loadingLogs}
                onClick={() => setLogsPage((p) => p + 1)}
                className={styles["tc-pageBtn"]}
              >
                صفحه بعد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Calendar */}
      {activeTab === "calendar" && (
        <div className={styles["tc-card"]}>
          {/* Header */}
          <div className={styles["tc-calendar-header"]}>
            <span className={styles["tc-calendar-title"]}>
              {PERSIAN_MONTH_NAMES[targetMonth - 1]} {toFarsiDigits(targetYear)}
            </span>
            <div className={styles["tc-calendar-nav"]}>
              <button
                type="button"
                onClick={() => setCalendarMonthOffset((m) => m - 1)}
                className={styles["tc-pageBtn"]}
              >
                ماه قبل
              </button>
              <button
                type="button"
                onClick={() => setCalendarMonthOffset(0)}
                className={styles["tc-pageBtn"]}
              >
                امروز
              </button>
              <button
                type="button"
                onClick={() => setCalendarMonthOffset((m) => m + 1)}
                className={styles["tc-pageBtn"]}
              >
                ماه بعد
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className={styles["tc-calendar-grid"]}>
            {weekDayNames.map((name) => (
              <div key={name} className={styles["tc-calendar-dayname"]}>
                {name}
              </div>
            ))}

            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((dayNum) => {
              const key = `${targetYear}-${targetMonth}-${dayNum}`
              const dayPosts = postsMap.get(key) ?? []
              const hasPosts = dayPosts.length > 0
              const isToday =
                currentPDate.year === targetYear &&
                currentPDate.month === targetMonth &&
                currentPDate.day === dayNum

              return (
                <div
                  key={dayNum}
                  onMouseEnter={() => hasPosts && setHoveredDayKey(key)}
                  onMouseLeave={() => setHoveredDayKey(null)}
                  className={[
                    styles["tc-calendar-day"],
                    isToday ? styles["tc-calendar-day--today"] : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <span>{toFarsiDigits(dayNum)}</span>
                  {hasPosts && <div className={styles["tc-calendar-dot"]} />}

                  {/* Popover on hover */}
                  {hoveredDayKey === key && (
                    <div className={styles["tc-popover"]}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: "var(--font-size-xs)",
                          marginBottom: "4px",
                          borderBottom: "1px solid var(--color-border)",
                          paddingBottom: "2px",
                        }}
                      >
                        {toFarsiDigits(dayNum)} {PERSIAN_MONTH_NAMES[targetMonth - 1]}
                      </div>
                      {dayPosts.map((p) => (
                        <div key={p.id} className={styles["tc-popoverItem"]}>
                          <strong>{p.event}</strong> ({p.channel})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
