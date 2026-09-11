"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useTranslations, useLocale } from "next-intl"
import { useSession } from "next-auth/react"
import { ShoppingCart, User, Menu, X } from "lucide-react"
import { Button, Badge } from "@tirajeh/ui"
import { useCartStore } from "@/stores/cart"
import { useUIStore } from "@/stores/ui"
import styles from "./Navbar.module.css"

export function Navbar() {
  const t = useTranslations("nav")
  const locale = useLocale()
  const fa = locale === "fa"
  const pathname = usePathname()
  const { data: session } = useSession()
  const { toggleCart, totalItems, _hydrated } = useCartStore()
  const { mobileMenuOpen, toggleMobileMenu, setMobileMenuOpen } = useUIStore()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname, setMobileMenuOpen])

  const navLinks = [
    { href: `/${locale}`, label: t("home") },
    { href: `/${locale}/products`, label: t("products") },
    { href: `/${locale}/blog`, label: t("blog") },
    { href: `/${locale}/about`, label: t("about") },
    { href: `/${locale}/contact`, label: t("contact") },
  ]

  const cartCount = _hydrated ? totalItems() : 0

  const isActive = (href: string) =>
    href === `/${locale}` ? pathname === href : pathname.startsWith(href)

  const headerCls = [
    styles["web-nav__header"],
    scrolled ? styles["web-nav__header--scrolled"] : undefined,
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <header className={headerCls}>
      <div className={styles["web-nav__inner"]}>
        {/* Logo */}
        <Link
          href={`/${locale}`}
          className={styles["web-nav__logo"]}
          aria-label={fa ? "تیراژه — صفحه اصلی" : "Tirajeh — Home"}
        >
          <Image
            src="/tirajeh-logo.svg"
            alt={fa ? "تیراژه صنعت خاک" : "Tirajeh Sanat Khak"}
            width={312}
            height={420}
            className={styles["web-nav__logo-img"]}
            priority
          />
        </Link>

        {/* Desktop nav */}
        <nav
          className={styles["web-nav__nav"]}
          aria-label={fa ? "منوی اصلی" : "Main Navigation"}
        >
          {navLinks.map((link) => {
            const active = isActive(link.href)
            const linkCls = [
              styles["web-nav__link"],
              active ? styles["web-nav__link--active"] : undefined,
            ]
              .filter(Boolean)
              .join(" ")

            return (
              <Link key={link.href} href={link.href} className={linkCls}>
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Actions */}
        <div className={styles["web-nav__actions"]}>
          {/* Cart */}
          <div className={styles["web-nav__cart-wrapper"]}>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCart}
              aria-label={`${t("cart")}${cartCount > 0 ? ` — ${cartCount} ${fa ? "قلم" : "items"}` : ""}`}
            >
              <ShoppingCart
                style={{ width: "1.25rem", height: "1.25rem" }}
                aria-hidden="true"
              />
            </Button>
            {cartCount > 0 && (
              <div className={styles["web-nav__cart-badge"]}>
                <Badge
                  variant="primary"
                  style={{
                    paddingInline: "0.35rem",
                    minWidth: "1.25rem",
                    height: "1.25rem",
                    justifyContent: "center",
                  }}
                >
                  {cartCount > 9 ? "9+" : cartCount}
                </Badge>
              </div>
            )}
          </div>

          {/* Account */}
          {session ? (
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/${locale}/account`} aria-label={t("account")}>
                <User
                  style={{ width: "1.25rem", height: "1.25rem" }}
                  aria-hidden="true"
                />
              </Link>
            </Button>
          ) : (
            <div className={styles["web-nav__login-desktop"]}>
              <Button variant="primary" size="md" asChild>
                <Link href={`/${locale}/auth/login`}>{t("login")}</Link>
              </Button>
            </div>
          )}

          {/* Mobile toggle */}
          <div className={styles["web-nav__menu-toggle"]}>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMobileMenu}
              aria-label={
                mobileMenuOpen
                  ? fa
                    ? "بستن منو"
                    : "Close menu"
                  : fa
                    ? "باز کردن منو"
                    : "Open menu"
              }
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X
                  style={{ width: "1.25rem", height: "1.25rem" }}
                  aria-hidden="true"
                />
              ) : (
                <Menu
                  style={{ width: "1.25rem", height: "1.25rem" }}
                  aria-hidden="true"
                />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className={styles["web-nav__mobile"]}>
          <nav
            className={styles["web-nav__mobile-nav"]}
            aria-label={fa ? "منوی موبایل" : "Mobile Navigation"}
          >
            {navLinks.map((link) => {
              const active = isActive(link.href)
              const mobileLinkCls = [
                styles["web-nav__mobile-link"],
                active ? styles["web-nav__mobile-link--active"] : undefined,
              ]
                .filter(Boolean)
                .join(" ")

              return (
                <Link key={link.href} href={link.href} className={mobileLinkCls}>
                  {link.label}
                </Link>
              )
            })}
            {!session && (
              <div className={styles["web-nav__mobile-auth"]}>
                <Button variant="primary" size="md" asChild style={{ width: "100%" }}>
                  <Link href={`/${locale}/auth/login`}>{t("login")}</Link>
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  asChild
                  style={{ width: "100%" }}
                >
                  <Link href={`/${locale}/auth/register`}>{t("register")}</Link>
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
