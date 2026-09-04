"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations, useLocale } from "next-intl"
import { useSession } from "next-auth/react"
import { ShoppingCart, User, Menu, X, Package } from "lucide-react"
import { useCartStore } from "@/stores/cart"
import { useUIStore } from "@/stores/ui"

export function Navbar() {
  const t = useTranslations("nav")
  const locale = useLocale()
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
    href === "/" ? pathname === href : pathname.startsWith(href)

  return (
    <>
      <header className={`nb-header${scrolled ? " nb-header--scrolled" : ""}`}>
        <div className="nb-inner">
          {/* Logo */}
          <Link href={`/${locale}`} className="nb-logo" aria-label="تیراژه — صفحه اصلی">
            <Package className="nb-logo-icon" aria-hidden="true" />
            <span className="nb-logo-text">تیراژه</span>
          </Link>

          {/* Desktop nav */}
          <nav className="nb-nav" aria-label="منوی اصلی">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`nb-link${isActive(link.href) ? " nb-link--active" : ""}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="nb-actions">
            {/* Cart */}
            <button
              type="button"
              onClick={toggleCart}
              aria-label={`${t("cart")}${cartCount > 0 ? ` — ${cartCount} قلم` : ""}`}
              className="nb-icon-btn"
            >
              <ShoppingCart className="nb-icon" aria-hidden="true" />
              {cartCount > 0 && (
                <span aria-hidden="true" className="nb-badge">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </button>

            {/* Account */}
            {session ? (
              <Link href={`/${locale}/account`} aria-label={t("account")} className="nb-icon-btn">
                <User className="nb-icon" aria-hidden="true" />
              </Link>
            ) : (
              <Link href={`/${locale}/auth/login`} className="nb-btn-login">
                {t("login")}
              </Link>
            )}

            {/* Mobile toggle */}
            <button
              type="button"
              onClick={toggleMobileMenu}
              aria-label={mobileMenuOpen ? "بستن منو" : "باز کردن منو"}
              aria-expanded={mobileMenuOpen}
              className="nb-icon-btn nb-menu-toggle"
            >
              {mobileMenuOpen ? (
                <X className="nb-icon" aria-hidden="true" />
              ) : (
                <Menu className="nb-icon" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="nb-mobile">
            <nav className="nb-mobile-nav" aria-label="منوی موبایل">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nb-mobile-link${isActive(link.href) ? " nb-mobile-link--active" : ""}`}
                >
                  {link.label}
                </Link>
              ))}
              {!session && (
                <div className="nb-mobile-auth">
                  <Link href={`/${locale}/auth/login`} className="nb-btn-login nb-btn-login--full">
                    {t("login")}
                  </Link>
                  <Link href={`/${locale}/auth/register`} className="nb-btn-register nb-btn-register--full">
                    {t("register")}
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>

      <style>{`
        .nb-header {
          position: sticky; top: 0; z-index: 40; width: 100%;
          border-bottom: 1px solid transparent;
          background-color: color-mix(in srgb, var(--color-surface) 80%, transparent);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          transition: border-color var(--transition-base), background-color var(--transition-base), box-shadow var(--transition-base);
        }
        .nb-header--scrolled {
          border-bottom-color: var(--color-border);
          background-color: var(--color-surface);
          box-shadow: var(--shadow-sm);
        }
        .nb-inner {
          max-width: 80rem; margin-inline: auto;
          padding-inline: 1rem;
          display: flex; height: 4rem; align-items: center; justify-content: space-between; gap: 1rem;
        }
        .nb-logo {
          display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0;
          color: var(--color-accent); text-decoration: none;
        }
        .nb-logo:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; border-radius: var(--radius-sm); }
        .nb-logo-icon { width: 1.75rem; height: 1.75rem; }
        .nb-logo-text { font-size: 1.25rem; font-weight: 700; letter-spacing: -0.01em; }
        .nb-nav {
          display: none; align-items: center; gap: 0.25rem;
        }
        @media (min-width: 768px) { .nb-nav { display: flex; } }
        .nb-link {
          border-radius: var(--radius-md); padding: 0.5rem 0.75rem;
          font-size: 0.875rem; font-weight: 500; text-decoration: none;
          color: var(--color-text-secondary);
          transition: color var(--transition-fast), background-color var(--transition-fast);
        }
        .nb-link:hover { background-color: var(--color-border-subtle); color: var(--color-text); }
        .nb-link--active { background-color: var(--color-accent-subtle); color: var(--color-accent); }
        .nb-actions { display: flex; align-items: center; gap: 0.375rem; }
        .nb-icon-btn {
          position: relative; border-radius: var(--radius-md); padding: 0.5rem;
          background: none; border: none; cursor: pointer;
          color: var(--color-text-secondary);
          transition: color var(--transition-fast), background-color var(--transition-fast);
          display: flex; align-items: center; justify-content: center;
        }
        .nb-icon-btn:hover { background-color: var(--color-border-subtle); color: var(--color-text); }
        .nb-icon-btn:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
        .nb-icon { width: 1.25rem; height: 1.25rem; }
        .nb-badge {
          position: absolute; top: -0.125rem; inset-inline-end: -0.125rem;
          display: flex; align-items: center; justify-content: center;
          width: 1rem; height: 1rem; border-radius: 999px;
          background-color: var(--color-accent); color: #fff;
          font-size: 0.625rem; font-weight: 700;
        }
        .nb-btn-login {
          display: none; align-items: center;
          background-color: var(--color-accent); color: #fff;
          font-size: 0.8125rem; font-weight: 600; padding: 0.4375rem 0.875rem;
          border-radius: var(--radius-md); text-decoration: none; white-space: nowrap;
          transition: background-color var(--transition-fast);
        }
        @media (min-width: 640px) { .nb-btn-login { display: inline-flex; } }
        .nb-btn-login:hover { background-color: var(--color-accent-hover); }
        .nb-btn-login:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
        .nb-btn-login--full { display: flex; flex: 1; justify-content: center; }
        .nb-btn-register {
          display: flex; align-items: center; justify-content: center;
          border: 1px solid var(--color-border); color: var(--color-text-secondary);
          font-size: 0.8125rem; font-weight: 600; padding: 0.4375rem 0.875rem;
          border-radius: var(--radius-md); text-decoration: none; white-space: nowrap;
          background: none; transition: border-color var(--transition-fast), color var(--transition-fast);
        }
        .nb-btn-register:hover { border-color: var(--color-accent); color: var(--color-accent); }
        .nb-btn-register--full { flex: 1; }
        .nb-menu-toggle { display: flex; }
        @media (min-width: 768px) { .nb-menu-toggle { display: none; } }
        .nb-mobile {
          border-top: 1px solid var(--color-border);
          background-color: var(--color-surface);
          padding: 0.5rem 1rem 1rem;
        }
        @media (min-width: 768px) { .nb-mobile { display: none; } }
        .nb-mobile-nav { display: flex; flex-direction: column; gap: 0.25rem; }
        .nb-mobile-link {
          border-radius: var(--radius-md); padding: 0.625rem 0.75rem;
          font-size: 0.875rem; font-weight: 500; text-decoration: none;
          color: var(--color-text-secondary);
          transition: color var(--transition-fast), background-color var(--transition-fast);
        }
        .nb-mobile-link:hover { background-color: var(--color-border-subtle); color: var(--color-text); }
        .nb-mobile-link--active { background-color: var(--color-accent-subtle); color: var(--color-accent); }
        .nb-mobile-auth {
          display: flex; gap: 0.5rem; margin-top: 0.75rem;
          padding-top: 0.75rem; border-top: 1px solid var(--color-border-subtle);
        }
      `}</style>
    </>
  )
}
