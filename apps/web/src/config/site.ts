/**
 * Site-wide configuration.
 * Static trust/contact values live here so they can be updated
 * in one place without touching individual page components.
 */
export const SITE_CONFIG = {
  phone: {
    fa: "۰۵۱-۳۸۳۳۱۹۰۴",
    raw: "+985138331904",
  },
  mobile: {
    fa: "۰۹۱۵۵۳۰۰۶۳۱",
    raw: "+989155300631",
  },
  email: "info@tirajeconcrete.com",
  address: {
    fa: "مشهد، احمدآباد، ملاصدرای ۱۱، پلاک ۹",
    en: "Mashhad, Ahmadabad, Mollasadra 11, No. 9",
  },
  location: {
    fa: "مشهد، ایران",
    en: "Mashhad, Iran",
  },
  /** Total Iranian provinces served. Update when coverage changes. */
  provincesCovered: 31,
  supportHours: {
    fa: "شنبه تا چهارشنبه ۸ الی ۱۶ و پنجشنبه ۸ الی ۱۲:۳۰",
    en: "Sat–Wed 8:00–16:00, Thu 8:00–12:30",
  },
  brandName: {
    fa: "تیراژه صنعت خاک",
    en: "Tirajeh Concrete",
  },
} as const
