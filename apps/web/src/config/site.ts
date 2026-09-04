/**
 * Site-wide configuration.
 * Static trust/contact values live here so they can be updated
 * in one place without touching individual page components.
 */
export const SITE_CONFIG = {
  phone: {
    fa: "۰۲۱-۰۰۰۰۰۰۰۰",
    raw: "+982100000000",
  },
  email: "info@tirajeh.ir",
  location: {
    fa: "تهران، ایران",
    en: "Tehran, Iran",
  },
  /** Total Iranian provinces served. Update when coverage changes. */
  provincesCovered: 31,
  supportHours: {
    fa: "۲۴/۷",
    en: "24/7",
  },
  brandName: {
    fa: "تیراژه",
    en: "Tirajeh",
  },
} as const
