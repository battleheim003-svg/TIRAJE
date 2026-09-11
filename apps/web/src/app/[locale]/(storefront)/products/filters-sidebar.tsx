/**
 * Server-rendered filter sidebar.
 * Uses native <details>/<summary> for mobile collapse — no client JS.
 * All filters submit via GET <form> — works without JS.
 */
import { SlidersHorizontal, Search } from "lucide-react"
import { CEMENT_TYPE_LABEL, PACKAGING_LABEL } from "@/lib/cement"
import styles from "./FiltersSidebar.module.css"

interface FilterCategory {
  id: string
  slug: string
  nameFa: string
  nameEn?: string | null
}

interface FilterBrand {
  id: string
  slug: string
  nameFa: string
  nameEn?: string | null
}

interface FilterFactory {
  id: string
  nameFa: string
  nameEn?: string | null
  city: string
  province: string
}

interface FiltersSidebarProps {
  locale: string
  categories: FilterCategory[]
  brands: FilterBrand[]
  factories: FilterFactory[]
  current: {
    q: string
    categories: string[]
    brands: string[]
    factories: string[]
    packagingTypes: string[]
    cementTypes: string[]
    stock: string
    minPrice: string
    maxPrice: string
  }
  basePath: string
}

const PACKAGING_KEYS = ["BAG_50KG", "JUMBO_1500KG", "BULK"] as const
const CEMENT_TYPE_KEYS = [
  "TYPE_1_325", "TYPE_1_425", "TYPE_2", "TYPE_3", "TYPE_5",
  "WHITE", "POZZOLANIC", "SLAG", "OIL_WELL", "COMPOSITE",
] as const

export function FiltersSidebar({
  locale,
  categories,
  brands,
  factories,
  current,
  basePath,
}: FiltersSidebarProps) {
  const fa = locale === "fa"

  const t = {
    filters: fa ? "فیلترها" : "Filters",
    clearAll: fa ? "پاک کردن" : "Clear all",
    search: fa ? "جستجو در محصولات" : "Search products",
    categories: fa ? "دسته‌بندی" : "Categories",
    brands: fa ? "برند" : "Brand",
    factories: fa ? "کارخانه" : "Factory",
    packagingType: fa ? "نوع بسته‌بندی" : "Packaging",
    cementType: fa ? "نوع سیمان" : "Cement Type",
    stock: fa ? "موجودی" : "Availability",
    priceRange: fa ? "محدوده قیمت" : "Price Range",
    minPrice: fa ? "حداقل" : "Min",
    maxPrice: fa ? "حداکثر" : "Max",
    applyPrice: fa ? "اعمال" : "Apply",
    allStock: fa ? "همه" : "All",
    inStock: fa ? "موجود" : "In Stock",
    available: fa ? "موجود و رو به اتمام" : "In Stock & Low",
  }

  const hasFilters =
    current.q ||
    current.categories.length ||
    current.brands.length ||
    current.factories.length ||
    current.packagingTypes.length ||
    current.cementTypes.length ||
    current.stock !== "all" ||
    current.minPrice ||
    current.maxPrice

  return (
    <aside className={styles["web-fltr"]} aria-label={t.filters}>
      {/* ── Mobile toggle wrapper ── */}
      <details className={styles["web-fltr__details"]} open>
        <summary className={styles["web-fltr__summary"]}>
          <span className={styles["web-fltr__summary-label"]}>
            <SlidersHorizontal style={{ width: "1rem", height: "1rem" }} aria-hidden="true" />
            {t.filters}
          </span>
          {hasFilters && (
            <a
              href={basePath}
              className={styles["web-fltr__clear"]}
              aria-label={t.clearAll}
            >
              {t.clearAll}
            </a>
          )}
        </summary>

        <form
          method="GET"
          action={basePath}
          className={styles["web-fltr__form"]}
          aria-label={t.filters}
        >
          {/* ── Search ── */}
          <div className={styles["web-fltr__group"]}>
            <div className={styles["web-fltr__search-wrap"]}>
              <Search
                className={styles["web-fltr__search-icon"]}
                style={{ width: "0.9rem", height: "0.9rem" }}
                aria-hidden="true"
              />
              <input
                type="search"
                name="q"
                defaultValue={current.q}
                placeholder={t.search}
                className={styles["web-fltr__search-input"]}
                aria-label={t.search}
              />
            </div>
          </div>

          {/* ── Categories ── */}
          {categories.length > 0 && (
            <fieldset className={styles["web-fltr__group"]}>
              <legend className={styles["web-fltr__legend"]}>{t.categories}</legend>
              <div className={styles["web-fltr__checks"]}>
                {categories.map((cat) => {
                  const label = fa ? cat.nameFa : (cat.nameEn ?? cat.nameFa)
                  const checked = current.categories.includes(cat.slug)
                  return (
                    <label key={cat.id} className={styles["web-fltr__check-label"]}>
                      <input
                        type="checkbox"
                        name="category"
                        value={cat.slug}
                        defaultChecked={checked}
                        className={styles["web-fltr__checkbox"]}
                      />
                      <span>{label}</span>
                    </label>
                  )
                })}
              </div>
            </fieldset>
          )}

          {/* ── Brands ── */}
          {brands.length > 0 && (
            <fieldset className={styles["web-fltr__group"]}>
              <legend className={styles["web-fltr__legend"]}>{t.brands}</legend>
              <div className={styles["web-fltr__checks"]}>
                {brands.map((brand) => {
                  const label = fa ? brand.nameFa : (brand.nameEn ?? brand.nameFa)
                  const checked = current.brands.includes(brand.slug)
                  return (
                    <label key={brand.id} className={styles["web-fltr__check-label"]}>
                      <input
                        type="checkbox"
                        name="brand"
                        value={brand.slug}
                        defaultChecked={checked}
                        className={styles["web-fltr__checkbox"]}
                      />
                      <span>{label}</span>
                    </label>
                  )
                })}
              </div>
            </fieldset>
          )}

          {/* ── Factories ── */}
          {factories.length > 0 && (
            <fieldset className={styles["web-fltr__group"]}>
              <legend className={styles["web-fltr__legend"]}>{t.factories}</legend>
              <div className={styles["web-fltr__checks"]}>
                {factories.map((factory) => {
                  const label = fa ? factory.nameFa : (factory.nameEn ?? factory.nameFa)
                  const sub = fa
                    ? `${factory.city}، ${factory.province}`
                    : `${factory.city}, ${factory.province}`
                  const checked = current.factories.includes(factory.id)
                  return (
                    <label key={factory.id} className={styles["web-fltr__check-label"]}>
                      <input
                        type="checkbox"
                        name="factory"
                        value={factory.id}
                        defaultChecked={checked}
                        className={styles["web-fltr__checkbox"]}
                      />
                      <span>
                        {label}
                        <span className={styles["web-fltr__check-sub"]}>{sub}</span>
                      </span>
                    </label>
                  )
                })}
              </div>
            </fieldset>
          )}

          {/* ── Packaging Type ── */}
          <fieldset className={styles["web-fltr__group"]}>
            <legend className={styles["web-fltr__legend"]}>{t.packagingType}</legend>
            <div className={styles["web-fltr__checks"]}>
              {PACKAGING_KEYS.map((key) => {
                const label = fa
                  ? PACKAGING_LABEL[key]!.fa
                  : PACKAGING_LABEL[key]!.en
                return (
                  <label key={key} className={styles["web-fltr__check-label"]}>
                    <input
                      type="checkbox"
                      name="packaging"
                      value={key}
                      defaultChecked={current.packagingTypes.includes(key)}
                      className={styles["web-fltr__checkbox"]}
                    />
                    <span>{label}</span>
                  </label>
                )
              })}
            </div>
          </fieldset>

          {/* ── Cement Type ── */}
          <fieldset className={styles["web-fltr__group"]}>
            <legend className={styles["web-fltr__legend"]}>{t.cementType}</legend>
            <div className={styles["web-fltr__checks"]}>
              {CEMENT_TYPE_KEYS.map((key) => {
                const label = fa
                  ? CEMENT_TYPE_LABEL[key]!.fa
                  : CEMENT_TYPE_LABEL[key]!.en
                return (
                  <label key={key} className={styles["web-fltr__check-label"]}>
                    <input
                      type="checkbox"
                      name="cementType"
                      value={key}
                      defaultChecked={current.cementTypes.includes(key)}
                      className={styles["web-fltr__checkbox"]}
                    />
                    <span>{label}</span>
                  </label>
                )
              })}
            </div>
          </fieldset>

          {/* ── Stock ── */}
          <fieldset className={styles["web-fltr__group"]}>
            <legend className={styles["web-fltr__legend"]}>{t.stock}</legend>
            <div className={styles["web-fltr__checks"]}>
              {(
                [
                  { value: "all", label: t.allStock },
                  { value: "in_stock", label: t.inStock },
                  { value: "available", label: t.available },
                ] as const
              ).map(({ value, label }) => (
                <label key={value} className={styles["web-fltr__check-label"]}>
                  <input
                    type="radio"
                    name="stock"
                    value={value}
                    defaultChecked={current.stock === value}
                    className={styles["web-fltr__checkbox"]}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* ── Price Range ── */}
          <fieldset className={styles["web-fltr__group"]}>
            <legend className={styles["web-fltr__legend"]}>{t.priceRange}</legend>
            <div className={styles["web-fltr__price-row"]}>
              <input
                type="number"
                name="minPrice"
                defaultValue={current.minPrice}
                placeholder={t.minPrice}
                min={0}
                className={styles["web-fltr__price-input"]}
                aria-label={t.minPrice}
              />
              <span className={styles["web-fltr__price-sep"]} aria-hidden="true">—</span>
              <input
                type="number"
                name="maxPrice"
                defaultValue={current.maxPrice}
                placeholder={t.maxPrice}
                min={0}
                className={styles["web-fltr__price-input"]}
                aria-label={t.maxPrice}
              />
            </div>
          </fieldset>

          {/* ── Submit ── */}
          <button type="submit" className={styles["web-fltr__apply"]}>
            {fa ? "اعمال فیلترها" : "Apply Filters"}
          </button>
        </form>
      </details>
    </aside>
  )
}