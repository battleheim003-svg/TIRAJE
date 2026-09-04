/**
 * Server-rendered filter sidebar.
 * Uses native <details>/<summary> for mobile collapse — no client JS.
 * All filters submit via GET <form> — works without JS.
 */
import { SlidersHorizontal, Search } from "lucide-react"
import { CEMENT_TYPE_LABEL, PACKAGING_LABEL, STOCK_LABEL } from "@/lib/cement"

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
    <aside className="filters-sidebar" aria-label={t.filters}>
      {/* ── Mobile toggle wrapper ── */}
      <details className="filters-details" open>
        <summary className="filters-summary">
          <span className="filters-summary__label">
            <SlidersHorizontal style={{ width: "1rem", height: "1rem" }} aria-hidden="true" />
            {t.filters}
          </span>
          {hasFilters && (
            <a
              href={basePath}
              className="filters-clear"
              aria-label={t.clearAll}
            >
              {t.clearAll}
            </a>
          )}
        </summary>

        <form
          method="GET"
          action={basePath}
          className="filters-form"
          aria-label={t.filters}
        >
          {/* ── Search ── */}
          <div className="filter-group">
            <div className="filter-search-wrap">
              <Search
                className="filter-search__icon"
                aria-hidden="true"
              />
              <input
                type="search"
                name="q"
                defaultValue={current.q}
                placeholder={t.search}
                className="filter-search"
                aria-label={t.search}
              />
            </div>
          </div>

          {/* ── Categories ── */}
          {categories.length > 0 && (
            <fieldset className="filter-group">
              <legend className="filter-legend">{t.categories}</legend>
              <div className="filter-checks">
                {categories.map((cat) => {
                  const label = fa ? cat.nameFa : (cat.nameEn ?? cat.nameFa)
                  const checked = current.categories.includes(cat.slug)
                  return (
                    <label key={cat.id} className="filter-check-label">
                      <input
                        type="checkbox"
                        name="category"
                        value={cat.slug}
                        defaultChecked={checked}
                        className="filter-checkbox"
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
            <fieldset className="filter-group">
              <legend className="filter-legend">{t.brands}</legend>
              <div className="filter-checks">
                {brands.map((brand) => {
                  const label = fa ? brand.nameFa : (brand.nameEn ?? brand.nameFa)
                  const checked = current.brands.includes(brand.slug)
                  return (
                    <label key={brand.id} className="filter-check-label">
                      <input
                        type="checkbox"
                        name="brand"
                        value={brand.slug}
                        defaultChecked={checked}
                        className="filter-checkbox"
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
            <fieldset className="filter-group">
              <legend className="filter-legend">{t.factories}</legend>
              <div className="filter-checks">
                {factories.map((factory) => {
                  const label = fa ? factory.nameFa : (factory.nameEn ?? factory.nameFa)
                  const sub = fa
                    ? `${factory.city}، ${factory.province}`
                    : `${factory.city}, ${factory.province}`
                  const checked = current.factories.includes(factory.id)
                  return (
                    <label key={factory.id} className="filter-check-label">
                      <input
                        type="checkbox"
                        name="factory"
                        value={factory.id}
                        defaultChecked={checked}
                        className="filter-checkbox"
                      />
                      <span>
                        {label}
                        <span className="filter-check-sub">{sub}</span>
                      </span>
                    </label>
                  )
                })}
              </div>
            </fieldset>
          )}

          {/* ── Packaging Type ── */}
          <fieldset className="filter-group">
            <legend className="filter-legend">{t.packagingType}</legend>
            <div className="filter-checks">
              {PACKAGING_KEYS.map((key) => {
                const label = fa
                  ? PACKAGING_LABEL[key]!.fa
                  : PACKAGING_LABEL[key]!.en
                return (
                  <label key={key} className="filter-check-label">
                    <input
                      type="checkbox"
                      name="packaging"
                      value={key}
                      defaultChecked={current.packagingTypes.includes(key)}
                      className="filter-checkbox"
                    />
                    <span>{label}</span>
                  </label>
                )
              })}
            </div>
          </fieldset>

          {/* ── Cement Type ── */}
          <fieldset className="filter-group">
            <legend className="filter-legend">{t.cementType}</legend>
            <div className="filter-checks">
              {CEMENT_TYPE_KEYS.map((key) => {
                const label = fa
                  ? CEMENT_TYPE_LABEL[key]!.fa
                  : CEMENT_TYPE_LABEL[key]!.en
                return (
                  <label key={key} className="filter-check-label">
                    <input
                      type="checkbox"
                      name="cementType"
                      value={key}
                      defaultChecked={current.cementTypes.includes(key)}
                      className="filter-checkbox"
                    />
                    <span>{label}</span>
                  </label>
                )
              })}
            </div>
          </fieldset>

          {/* ── Stock ── */}
          <fieldset className="filter-group">
            <legend className="filter-legend">{t.stock}</legend>
            <div className="filter-checks">
              {(
                [
                  { value: "all", label: t.allStock },
                  { value: "in_stock", label: t.inStock },
                  { value: "available", label: t.available },
                ] as const
              ).map(({ value, label }) => (
                <label key={value} className="filter-check-label">
                  <input
                    type="radio"
                    name="stock"
                    value={value}
                    defaultChecked={current.stock === value}
                    className="filter-checkbox"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* ── Price Range ── */}
          <fieldset className="filter-group">
            <legend className="filter-legend">{t.priceRange}</legend>
            <div className="filter-price-row">
              <input
                type="number"
                name="minPrice"
                defaultValue={current.minPrice}
                placeholder={t.minPrice}
                min={0}
                className="filter-price-input"
                aria-label={t.minPrice}
              />
              <span className="filter-price-sep" aria-hidden="true">—</span>
              <input
                type="number"
                name="maxPrice"
                defaultValue={current.maxPrice}
                placeholder={t.maxPrice}
                min={0}
                className="filter-price-input"
                aria-label={t.maxPrice}
              />
            </div>
          </fieldset>

          {/* ── Submit ── */}
          <button type="submit" className="filters-apply">
            {fa ? "اعمال فیلترها" : "Apply Filters"}
          </button>
        </form>
      </details>

      <style>{`
        .filters-sidebar {
          width: 100%;
        }
        @media (min-width: 1024px) {
          .filters-sidebar {
            width: 17rem;
            flex-shrink: 0;
          }
        }

        /* details/summary — mobile collapsible, desktop always open */
        .filters-details {
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          overflow: hidden;
        }
        .filters-summary {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.125rem;
          cursor: pointer;
          user-select: none;
          list-style: none;
          gap: 0.5rem;
        }
        .filters-summary::-webkit-details-marker { display: none; }
        .filters-summary__label {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9375rem;
          font-weight: 700;
          color: var(--color-text);
        }
        @media (min-width: 1024px) {
          .filters-summary { cursor: default; pointer-events: none; }
        }
        .filters-clear {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--color-danger);
          text-decoration: none;
          padding: 0.2rem 0.5rem;
          border-radius: var(--radius-sm);
          transition: background-color var(--transition-fast);
        }
        .filters-clear:hover { background-color: var(--color-danger-subtle); }
        .filters-clear:focus-visible { outline: 2px solid var(--color-danger); outline-offset: 2px; }

        .filters-form {
          display: flex;
          flex-direction: column;
          gap: 0;
          border-top: 1px solid var(--color-border);
        }

        .filter-group {
          padding: 1rem 1.125rem;
          border: 0;
          margin: 0;
        }
        .filter-group + .filter-group {
          border-top: 1px solid var(--color-border-subtle);
        }
        .filter-legend {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--color-text-muted);
          margin-bottom: 0.75rem;
          padding: 0;
          width: 100%;
        }

        /* search */
        .filter-search-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .filter-search__icon {
          position: absolute;
          inset-inline-start: 0.75rem;
          width: 0.9rem;
          height: 0.9rem;
          color: var(--color-text-muted);
          pointer-events: none;
        }
        .filter-search {
          width: 100%;
          background-color: var(--color-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 0.5rem 0.75rem;
          padding-inline-start: 2.25rem;
          font-size: 0.8125rem;
          color: var(--color-text);
          transition: border-color var(--transition-fast);
        }
        .filter-search::placeholder { color: var(--color-text-muted); }
        .filter-search:focus { outline: none; border-color: var(--color-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 15%, transparent); }

        /* checkboxes / radios */
        .filter-checks {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .filter-check-label {
          display: inline-flex;
          align-items: center;
          gap: 0.625rem;
          font-size: 0.8125rem;
          color: var(--color-text-secondary);
          cursor: pointer;
          transition: color var(--transition-fast);
        }
        .filter-check-label:hover { color: var(--color-text); }
        .filter-checkbox {
          width: 1rem;
          height: 1rem;
          accent-color: var(--color-accent);
          cursor: pointer;
          flex-shrink: 0;
        }
        .filter-check-sub {
          display: block;
          font-size: 0.5625rem;
          color: var(--color-text-muted);
          line-height: 1.3;
        }

        /* price range */
        .filter-price-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .filter-price-input {
          flex: 1;
          min-width: 0;
          background-color: var(--color-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 0.4rem 0.625rem;
          font-size: 0.8125rem;
          color: var(--color-text);
          text-align: center;
          transition: border-color var(--transition-fast);
          font-variant-numeric: tabular-nums;
        }
        .filter-price-input:focus { outline: none; border-color: var(--color-accent); }
        .filter-price-sep { color: var(--color-text-muted); font-size: 0.875rem; flex-shrink: 0; }

        /* apply button */
        .filters-apply {
          margin: 0.75rem 1.125rem 1.125rem;
          width: calc(100% - 2.25rem);
          background-color: var(--color-accent);
          color: #fff;
          font-size: 0.875rem;
          font-weight: 700;
          padding: 0.625rem 1rem;
          border-radius: var(--radius-lg);
          border: none;
          cursor: pointer;
          transition: background-color var(--transition-fast), transform var(--transition-fast);
        }
        .filters-apply:hover { background-color: var(--color-accent-hover); }
        .filters-apply:active { transform: scale(0.98); }
        .filters-apply:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
      `}</style>
    </aside>
  )
}
