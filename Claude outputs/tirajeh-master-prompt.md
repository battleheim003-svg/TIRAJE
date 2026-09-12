# پرامپت اصلی اجرای ممیزی تیراژه — برای Antigravity

> این فایل را کامل به Antigravity بده. مبنای آن گزارش «ممیزی فنی تیراژه» (commit `2ad37d3`) و سند `claude/tirajeh-audit-2026-09-11.md` است.
> مسیر پروژه: `E:\tiraje` — مونوریپو pnpm + Turborepo، Next.js 15، Prisma، NextAuth v5، grammy.
> **این پرامپت پنج فاز دارد. فازها را به ترتیب اجرا کن. هر تسک را جدا تمام کن، جدا commit کن و جدا گزارش بده. چند تسک را با هم قاطی نکن.**

---

## ۰. پروتکل کار (نقض‌نشدنی)

1. **یک تسک در هر مرحله.** تسک بعدی را شروع نکن تا تسک فعلی از چک‌لیست پذیرش خودش رد شود.
2. بعد از هر تسک این دو فرمان را اجرا کن و خروجی را در گزارش بیاور:
   ```
   pnpm --filter @tirajeh/web exec tsc --noEmit
   pnpm --filter @tirajeh/web exec vitest run
   ```
   اگر EXIT غیر صفر بود، تسک تمام‌نشده است. تا سبز شدن ادامه بده و به تسک بعدی نرو.
3. **commit جدا برای هر تسک** با این قالب:
   ```
   <type>(<scope>): <خلاصه انگلیسی>

   Task: T0.3
   ```
   `type` از مجموعه `feat|fix|refactor|chore|perf|docs`.
4. **فقط فایل‌هایی را که تسک لازم دارد لمس کن.** فایل کامل را بازنویسی یا reformat نکن. prettier سراسری نزن. فایل بی‌ربط را «مرتب» نکن.
5. هر جا مجبور شدی از مشخصات این سند فاصله بگیری (مثلاً فیلدی در اسکیما آن‌طور که نوشته شده وجود ندارد)، **کار را متوقف کن، تفاوت را گزارش بده و منتظر تأیید بمان.** خودت تصمیم جایگزین نگیر.
6. **بدون اجازه، پکیج جدید نصب نکن.** پکیج‌های مجاز در این اجرا فقط این‌ها هستند و هر کدام باید در گزارش دلیلش نوشته شود:
   `sanitize-html`, `@types/sanitize-html`, `@react-pdf/renderer` (فقط فاز ۲).
   برای تاریخ جلالی و منطقه زمانی **هیچ پکیجی نصب نکن** — با `Intl` انجام می‌شود.
7. هر تغییر اسکیمای Prisma با migration نام‌دار:
   ```
   pnpm --filter @tirajeh/database exec prisma migrate dev --name <نام_دقیق_تسک>
   ```
   داده موجود را نابود نکن؛ ستون جدید باید nullable یا با default باشد.
8. **هیچ راز جدیدی را hardcode نکن** و مقدار هیچ متغیر env را در گزارش کپی نکن. فقط نام متغیر را بنویس.
9. کد تجاری را در اکشن‌های سرور نگه دار؛ منطق مشترک در `packages/shared` یا `packages/integrations`. کلاینت هیچ‌وقت قیمت، کرایه یا جمع نهایی را محاسبه نمی‌کند — فقط عددی که سرور داده نمایش می‌دهد.

### قوانین ثابت UI (از قوانین پروژه — تغییر نمی‌کند)
1. بدون Tailwind utility class در `.tsx`
2. CSS فقط با design tokens: `--color-*`, `--radius-*`, `--shadow-*`, `--transition-*`
3. آیکون Lucide با `style={{ width: "Xrem", height: "Xrem" }}` — نه className
4. RTL با `padding-inline-start/end` و `border-inline-start/end`
5. CSS Module با prefix منحصربه‌فرد در هر فایل
6. دوزبانه fa/en با `const fa = locale === "fa"`
7. همه اعداد قیمت و وزن با `font-variant-numeric: tabular-nums` و ارقام فارسی در locale فا

---

## ۱. تصمیم‌های قطعی (بحث نکن، فقط اجرا کن)

| موضوع | تصمیم |
|---|---|
| واحد پول دیتابیس | **تومان صحیح** (همان وضع موجود داده‌ها و فرم‌ها). هیچ مهاجرت داده‌ای برای تبدیل به ریال انجام نمی‌شود. |
| تبدیل به ریال | فقط در **یک نقطه**: لایه درگاه پرداخت (`PaymentService`). `amount = toman * 10` |
| نمایش | همه‌جا با یک تابع واحد `formatToman` از `@tirajeh/shared` |
| رزرو موجودی | هنگام ساخت سفارش کم می‌شود (رزرو) و در شکست پرداخت، لغو یا انقضا برمی‌گردد |
| مهلت پرداخت | ۳۰ دقیقه؛ بعد از آن سفارش `CANCELLED` و موجودی آزاد |
| حذف محصول و کاربر | حذف نرم با `archivedAt`؛ `delete` واقعی ممنوع |
| اعلان‌ها | فاز ۰ مستقیم (کم‌هزینه)، فاز ۱ روی جدول `Outbox` بازنویسی می‌شود |
| منطقه زمانی | `Asia/Tehran` مرجع همه محاسبات «روز» است |

---

# فاز ۰ — پیش از deploy (بحرانی)

هدف: مسیر پول درست شود. تا پایان این فاز deploy نکن.

---

### T0.1 — یکی‌کردن واحد پول

**فایل جدید:** `packages/shared/src/utils/money.ts`

```ts
/** همه مبالغ دیتابیس تومان صحیح هستند. تبدیل به ریال فقط در لایه درگاه. */
export type Toman = number

export function toToman(value: unknown): Toman {
  const n = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.round(n)
}

export function tomanToRial(amount: Toman): number {
  return Math.round(amount) * 10
}

export function formatToman(
  amount: unknown,
  locale: "fa" | "en" = "fa",
  opts?: { unit?: boolean; zeroLabel?: string }
): string {
  const n = toToman(amount)
  const unit = opts?.unit ?? true
  if (n === 0) return opts?.zeroLabel ?? (locale === "fa" ? "تماس بگیرید" : "Contact us")
  const digits = n.toLocaleString(locale === "fa" ? "fa-IR" : "en-US")
  if (!unit) return digits
  return locale === "fa" ? `${digits} تومان` : `${digits} Toman`
}

/** قیمت هر تن از قیمت هر کیسه و وزن کیسه */
export function pricePerTon(unitPriceToman: Toman, unitWeightKg: number): Toman {
  if (!unitWeightKg) return 0
  return Math.round((unitPriceToman / unitWeightKg) * 1000)
}
```

**کارها:**
1. از `packages/shared/src/index.ts` و `utils/index` این ماژول export شود.
2. `packages/shared/src/utils/currency.ts`: توابع `formatToman` و `formatRial` حذف شوند؛ `decimalToNumber` و `calculateFreight` باقی بمانند. کامنت بالای فایل که می‌گوید دیتابیس ریال است اصلاح شود به «تومان صحیح».
3. `apps/web/src/lib/ui.ts`: **فایل حذف شود.** همه importهایش به `@tirajeh/shared` تغییر کند.
4. `apps/web/src/lib/cement.ts`: `formatPrice` حذف و به جایش `export { formatToman } from "@tirajeh/shared"`؛ همه استفاده‌های `formatPrice(x, locale)` به `formatToman(x, locale as "fa" | "en")` تغییر کنند (با grep کامل: حداقل `checkout/CheckoutForm.tsx`، `account/orders/*`، `freight/FreightCalcForm.tsx`، `admin/**`، `components/admin/ProductsTableClient.tsx`).
5. `packages/integrations/src/telegram/service.ts`: در `notifyNewOrder` و `notifyPaymentReceived` تقسیم بر ۱۰ حذف شود و از `formatToman(amount, "fa")` استفاده شود.
6. `components/layout/price-ticker-client.tsx`: تابع محلی `formatToman` حذف و از shared استفاده شود.
7. `packages/integrations/src/payment/service.ts`: در `initiatePayment` و `verifyPayment`، مبلغ ارسالی به adapter با `tomanToRial(Number(order.totalAmount))` و `tomanToRial(Number(payment.order.totalAmount))` محاسبه شود. یک کامنت یک‌خطی بالای هر دو بگذار: `// مرز تبدیل تومان → ریال؛ تنها نقطه مجاز`.

**تست جدید:** `apps/web/src/actions/__tests__/money.test.ts` — سه تست: فرمت صفر، فرمت ۸۷۰۰۰۰ در fa و en، و `tomanToRial(870000) === 8700000`.

**پذیرش:**
- [ ] `grep -rn "/ 10" apps packages --include=*.ts --include=*.tsx` هیچ نتیجه‌ای مربوط به پول ندارد
- [ ] `grep -rn "formatPrice\|lib/ui" apps/web/src` خالی است
- [ ] قیمت یک محصول مشخص در کارت محصول، صفحه محصول، کشوی سبد، صفحه سبد، فرم پرداخت و پست کانال **عدد یکسان** است
- [ ] tsc و vitest سبز

---

### T0.2 — یکی‌کردن سبد خرید (منبع حقیقت: دیتابیس)

**فایل حذفی:** `apps/web/src/stores/cart.ts` (کل store زوستاند سبد حذف می‌شود؛ `stores/ui.ts` می‌ماند و وضعیت باز/بسته کشو به آن منتقل می‌شود).

**فایل‌های تغییر:** `apps/web/src/actions/cart.ts`، `components/layout/navbar.tsx`، `components/layout/storefront-layout.tsx`، `components/cart/cart-drawer.tsx`، `app/[locale]/(storefront)/cart/page.tsx`، `actions/auth.ts`

**۱. در `actions/cart.ts` این دو تابع اضافه شود:**

```ts
export interface CartLine {
  itemId: string
  productId: string
  slug: string
  nameFa: string
  nameEn: string | null
  imageUrl: string | null
  packagingTier: PackagingTier | null
  unitPriceToman: number      // قیمت واحد نهایی که سرور تأیید کرده
  quantity: number
  lineTotalToman: number
  unitWeightKg: number
  minOrderQty: number
  stockQty: number
}

export interface CartSummary {
  lines: CartLine[]
  itemCount: number           // مجموع quantity
  subtotalToman: number
  totalWeightKg: number
}

export async function getCartAction(): Promise<CartSummary>
export async function getCartCountAction(): Promise<number>   // کوئری سبک فقط برای badge
```
هر دو هم کاربر لاگین‌شده و هم مهمان (`session_id`) را پوشش می‌دهند و قیمت واحد را با `resolveUnitPriceToman` از T0.3 حساب می‌کنند.

**۲. `storefront-layout.tsx` (سرور) مقدار `getCartCountAction()` را به `navbar` پاس دهد؛ `navbar` prop `cartCount: number` بگیرد و دیگر از store نخواند.**

**۳. `cart-drawer.tsx`:** با باز شدن، `getCartAction()` را در `useTransition` صدا بزند و در state محلی نگه دارد. بعد از تغییر تعداد یا حذف، همان اکشن دوباره صدا زده شود. حالت‌های لازم: در حال بارگذاری (Skeleton)، خالی (EmptyState + دکمه «مشاهده محصولات»)، خطا.

**۴. اکشن‌های سبد بعد از تغییر، `revalidatePath("/[locale]/cart", "page")` و `revalidatePath("/[locale]", "layout")` بزنند تا badge تازه شود.**

**۵. ادغام سبد مهمان:** در `actions/auth.ts` → `loginAction`، بلافاصله بعد از `signIn` موفق `await mergeCartAction()` صدا زده شود. در `mergeCartAction` تجمیع باید سقف موجودی را رعایت کند: اگر مجموع از `stockQty` بیشتر شد، روی `stockQty` سقف بخورد.

**پذیرش:**
- [ ] افزودن محصول به سبد → عدد badge در navbar بدون رفرش دستی درست می‌شود
- [ ] کشوی سبد همان آیتم‌های دیتابیس را نشان می‌دهد
- [ ] مهمان سبد پر می‌کند، بعد ثبت‌نام/ورود می‌کند → آیتم‌ها حفظ می‌شوند و کوکی `session_id` پاک می‌شود
- [ ] `grep -rn "stores/cart" apps/web/src` خالی است

---

### T0.3 — قیمت سمت سرور و پله بسته‌بندی

**اسکیما (`packages/database/prisma/schema.prisma`), migration name: `cart_order_packaging_tier`:**
```prisma
model CartItem {
  packagingTier PackagingTier? @map("packaging_tier")
}
model OrderItem {
  packagingTier  PackagingTier? @map("packaging_tier")
  productNameFa  String         @map("product_name_fa") @default("")
  weightKg       Decimal?       @map("weight_kg") @db.Decimal(10, 2)
}
```

**فایل جدید:** `apps/web/src/lib/pricing.ts`
```ts
import type { PackagingTier } from "@tirajeh/database"

/** قیمت واحد (هر کیسه/هر تن فله) بر حسب تومان — تنها مرجع مجاز قیمت */
export function resolveUnitPriceToman(
  product: { price: unknown; packagingOptions?: Array<{ tier: PackagingTier; price: unknown; bagCount: number; isActive: boolean }> },
  tier: PackagingTier | null
): number
```
قاعده: اگر `tier` داده شده و گزینه فعالِ متناظر وجود دارد → `round(option.price / option.bagCount)`؛ در غیر این صورت → `round(product.price)`. اگر `tier` داده شده ولی گزینه‌اش نیست یا غیرفعال است → خطای `AppError("بسته‌بندی انتخابی موجود نیست", "INVALID_INPUT", 400)`.

**`actions/cart.ts` → امضای جدید و اعتبارسنجی zod:**
```ts
const AddToCartSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().positive().max(10_000),
  packagingTier: z.nativeEnum(PackagingTier).nullish(),
})
export async function addToCartAction(input: unknown): Promise<ActionResult>
```
- مقدار غیرعددی، `NaN`، اعشاری و منفی باید رد شود.
- بررسی سقف: `existingQty + quantity <= stockQty` (نه فقط `quantity`).
- `packagingTier` در `where` یکتایی سبد دخیل شود: unique جدید `@@unique([userId, productId, packagingTier])` و `@@unique([sessionId, productId, packagingTier])` — uniqueهای قبلی جایگزین شوند (در همان migration).

**`app/[locale]/(storefront)/products/[slug]/add-to-cart.tsx`:** هنگام افزودن، `packagingTier: selectedOption?.tier ?? null` هم فرستاده شود. قیمت نمایش‌داده‌شده در همین کامپوننت از `resolveUnitPriceToman` سرور بیاید (به صورت prop از صفحه سرور، نه محاسبه محلی).

**پذیرش:**
- [ ] افزودن پله «پالت» و «تک‌کیسه» از یک محصول دو ردیف جدا در سبد می‌سازد
- [ ] قیمت واحدی که در صفحه محصول دیده می‌شود با ردیف سبد و با `OrderItem.unitPrice` یکسان است
- [ ] `addToCartAction(undefined)` و `quantity: "abc"` و `quantity: 2.5` خطای اعتبارسنجی می‌دهند، نه ۵۰۰

---

### T0.4 — کاهش اتمیک موجودی، برگشت موجودی، رویداد سفارش

**فایل:** `apps/web/src/actions/order.ts`, `apps/web/src/actions/admin-orders.ts`

**۱. در تراکنش ثبت سفارش، الگوی خواندن-سپس-نوشتن حذف و این جایگزین شود:**
```ts
for (const line of lines) {
  const res = await tx.product.updateMany({
    where: { id: line.productId, stockQty: { gte: line.quantity }, isActive: true },
    data: { stockQty: { decrement: line.quantity } },
  })
  if (res.count !== 1) throw new OutOfStockError(line.nameFa)
}
```
`OutOfStockError` را در `packages/shared/src/utils/errors.ts` به سبک خطاهای موجود اضافه کن (کد `OUT_OF_STOCK`، پیام فارسی با نام محصول).

**۲. فایل جدید `apps/web/src/lib/stock.ts`:**
```ts
export async function releaseOrderStock(tx: PrismaTx, orderId: string): Promise<void>
```
همه `OrderItem`های سفارش را با `increment` برمی‌گرداند. **باید idempotent باشد:** فیلد `stockReleasedAt DateTime?` روی `Order` اضافه شود (migration `order_stock_released_at`) و اگر پر بود، تابع هیچ کاری نکند.

**۳. `cancelOrderAction`:** در یک تراکنش، وضعیت به `CANCELLED` + `releaseOrderStock` + `OrderEvent` با یادداشت «لغو توسط مشتری».

**۴. `adminUpdateOrderStatusAction`:** اگر وضعیت جدید `CANCELLED` یا `REFUNDED` است، `releaseOrderStock` هم در همان تراکنش اجرا شود.

**۵. هر ثبت سفارش یک `OrderEvent` با وضعیت اولیه بسازد.**

**پذیرش:**
- [ ] تست جدید در `apps/web/src/actions/__tests__/checkout.test.ts`: دو فراخوانی هم‌زمان با `Promise.all` روی محصولی با موجودی ۱۰ و تعداد ۸ → یکی موفق، یکی `OUT_OF_STOCK`، موجودی نهایی ۲
- [ ] لغو سفارش موجودی را برمی‌گرداند و دو بار لغو، دو بار برنمی‌گرداند
- [ ] `stockQty` هیچ‌وقت منفی نمی‌شود

---

### T0.5 — کرایه حمل سمت سرور

**اسکیما (migration `order_shipping_fields`):**
```prisma
model Order {
  shippingTruckType TruckType? @map("shipping_truck_type")
  shippingProvince  String?    @map("shipping_province")
}
```

**فایل جدید:** `apps/web/src/lib/shipping.ts`
```ts
export interface ShippingQuote {
  zoneId: string
  zoneName: string
  truckType: TruckType
  freightCostToman: number
  estimatedDaysMin: number
  estimatedDaysMax: number
}
export async function quoteShipping(params: { province: string; totalWeightKg: number }): Promise<ShippingQuote[]>
```
از `ShippingZone` + `ShippingRate` فعال و `calculateFreight(baseCost, costPerTon, totalWeightTon)` استفاده کن. `totalWeightTon = totalWeightKg / 1000`.

**اکشن جدید در `actions/shipping.ts`:** `getShippingQuotesForCartAction(province: string): Promise<ActionResult<ShippingQuote[]>>` — وزن را خودش از سبد می‌گیرد، از کلاینت نمی‌پذیرد.

**`checkout/CheckoutForm.tsx`:**
- عدد ثابت `250000` و منطق `shippingMethod` حذف شود.
- با انتخاب استان، اکشن بالا صدا زده شود و گزینه‌های واقعی (نوع کامیون + کرایه + زمان تحویل) رادیویی نمایش داده شوند.
- فیلد مخفی `shippingRateId` (یا `zoneId` + `truckType`) به فرم اضافه شود.
- جمع کل = `subtotal + انتخاب‌شده.freightCostToman`، ولی این عدد **فقط نمایشی** است.
- استان‌ها از فهرست `ShippingZone` بیایند (اکشن `getShippingProvincesAction`)، نه آرایه hardcode.

**`checkoutAction`:** کرایه را **دوباره سمت سرور** با `quoteShipping` حساب کند و انتخاب کاربر را با آن مطابقت دهد؛ اگر مطابق نبود خطای «قیمت حمل تغییر کرده، صفحه را تازه کنید». مقادیر `shippingCost`، `shippingZoneId`، `shippingTruckType`، `shippingProvince` روی سفارش ذخیره شوند.

**پذیرش:**
- [ ] عددی که کاربر در فرم می‌بیند با `Order.shippingCost` و `totalAmount` ذخیره‌شده یکی است
- [ ] استانی که ناحیه ارسال ندارد، پیام روشن می‌دهد و اجازه ثبت سفارش نمی‌دهد
- [ ] دستکاری فیلد مخفی در devtools باعث کرایه ارزان‌تر نمی‌شود

---

### T0.6 — اتصال کامل درگاه زرین‌پال

**۱. اعتبارسنجی ورودی:** `checkoutAction` ورودی را با اسکیمای zod (استفاده از `CreateOrderSchema` موجود در `packages/shared/src/schemas/order.ts`؛ اگر فیلدها کم است، همان اسکیما را کامل کن) parse کند. الگوها: موبایل `^09\d{9}$`، کد پستی `^\d{10}$`، استان از فهرست ناحیه‌ها.

**۲. جریان جدید `checkoutAction`:**
```
zod parse → snapshot سبد → کاهش اتمیک موجودی (T0.4)
→ Order(status: AWAITING_PAYMENT, stockReleasedAt: null)
→ OrderItem با snapshot (نام، وزن، پله بسته‌بندی، unitPrice)
→ Payment(gateway: ZARINPAL, status: PENDING, amount: totalAmount)
→ پاک‌کردن سبد
→ paymentService.initiatePayment(order.id, `${SITE_URL}/api/payment/callback`)
→ redirect(redirectUrl)
```
اگر `initiatePayment` خطا داد: تراکنش برگردد یا `releaseOrderStock` اجرا و سفارش `CANCELLED` شود و پیام «اتصال به درگاه ممکن نشد» برگردد.

**۳. فایل جدید:** `apps/web/src/app/api/payment/callback/route.ts`
```ts
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export async function GET(req: Request)   // زرین‌پال با Authority و Status برمی‌گردد
```
- `Status === "OK"` → `paymentService.verifyPayment(authority)`؛ در موفقیت: redirect به `/fa/checkout/success?order=<orderNumber>` و ارسال اعلان‌های T0.9.
- در شکست یا `Status === "NOK"` → `releaseOrderStock` + سفارش `CANCELLED` + `OrderEvent` + redirect به `/fa/checkout/failed?order=<orderNumber>&reason=...`
- **idempotent باشد:** دو بار خوردن callback نباید دو بار موجودی برگرداند یا دو اعلان بفرستد (`Payment.status === "COMPLETED"` را اول چک کن).

**۴. صفحه جدید:** `app/[locale]/(storefront)/checkout/failed/page.tsx` + CSS Module، با دکمه «تلاش مجدد پرداخت» که به `/api/payment/retry?order=` یا اکشن `retryPaymentAction(orderId)` وصل است (سفارش `AWAITING_PAYMENT` مالِ همان کاربر را دوباره به درگاه می‌برد).

**۵. فایل جدید:** `apps/web/src/app/api/cron/expire-orders/route.ts` — سفارش‌های `AWAITING_PAYMENT` قدیمی‌تر از ۳۰ دقیقه را `CANCELLED` کند، موجودی را آزاد کند و `OrderEvent` بسازد. محافظت با `CRON_SECRET` به شکل fail-closed (T0.8).

**۶. گزینه B2B:** در فرم پرداخت رادیوی «پرداخت آنلاین» / «صدور پیش‌فاکتور و پرداخت بعدی». حالت دوم سفارش را `PENDING` می‌سازد، به درگاه نمی‌رود و اعلان «سفارش اعتباری» برای مدیر می‌فرستد. این گزینه فقط برای کاربرانی که `customerType !== "NORMAL"` است نمایش داده شود.

**پذیرش:**
- [ ] با `ZARINPAL_SANDBOX=true` یک پرداخت کامل تا `CONFIRMED` انجام می‌شود و `Payment.gatewayTrackId` پر است
- [ ] پرداخت ناموفق: سفارش `CANCELLED` و موجودی برگشته
- [ ] مبلغ ارسالی به زرین‌پال دقیقاً ۱۰ برابر `totalAmount` تومانی است
- [ ] فراخوانی دوباره callback هیچ تغییر دومی ایجاد نمی‌کند
- [ ] سفارش رهاشده پس از ۳۰ دقیقه با اجرای cron آزاد می‌شود

---

### T0.7 — آپلود تصویر به Object Storage

**۱. اکشن جدید:** `apps/web/src/actions/upload.ts`
```ts
const UploadSchema = z.object({
  kind: z.enum(["products", "blog", "avatars"]),
  contentType: z.enum(["image/webp", "image/jpeg", "image/png"]),
  sizeBytes: z.number().int().positive().max(5 * 1024 * 1024),
})
export async function createUploadUrlAction(input: unknown): Promise<ActionResult<{ uploadUrl: string; publicUrl: string; key: string }>>
```
- گارد ادمین (در فاز ۱ به `requireAdminPerm` تغییر می‌کند).
- کلید را **سرور** بسازد: `${kind}/${yyyy}/${MM}/${randomUUID()}.${ext}` و از `storageService.presignedUploadUrl` استفاده کند. `publicUrl = ${S3_PUBLIC_URL}/${key}`.

**۲. `components/admin/ImageUploadDropzone.tsx` بازنویسی:**
- `readAsDataURL` فقط برای پیش‌نمایش محلی مجاز است؛ **مقدار ذخیره‌شده در فرم هرگز data URL نباشد.**
- قبل از آپلود، تصویر در مرورگر با canvas به WebP با کیفیت ۰٫۸۵ و حداکثر عرض ۱۶۰۰ پیکسل تبدیل شود.
- مراحل: `createUploadUrlAction` → `fetch(uploadUrl, { method: "PUT", body: blob, headers: { "Content-Type": type } })` → در صورت ۲۰۰، `onChange(publicUrl)`.
- نمایش نوار پیشرفت، خطای شفاف («حجم فایل بیش از ۵ مگابایت»، «فرمت پشتیبانی نمی‌شود»، «آپلود ناموفق — دوباره تلاش کنید») و دکمه حذف.

**۳. چند تصویری برای محصول:** آرایه URL با ترتیب قابل جابه‌جایی و انتخاب «تصویر اصلی»؛ در `adminCreate/UpdateProductAction` به‌جای یک `productImage`، همه ردیف‌ها با `sortOrder` و `isPrimary` ذخیره شوند.

**۴. `apps/web/next.config.ts`:** میزبان `S3_PUBLIC_URL` به `images.remotePatterns` اضافه شود؛ `experimental.serverActions.allowedOrigins` با دامنه واقعی جایگزین یا حذف شود.

**۵. اسکریپت مهاجرت:** `scripts/migrate-base64-images.ts`
- همه `ProductImage.url` و `Post.featuredImage` که با `data:` شروع می‌شوند را بخواند، decode کند، با `storageService.upload` بفرستد و URL را جایگزین کند.
- حالت `--dry-run` داشته باشد و تعداد و حجم را گزارش دهد. خطای یک ردیف، کل اسکریپت را متوقف نکند؛ در پایان فهرست شکست‌ها را چاپ کند.

**پذیرش:**
- [ ] آپلود عکس ۳ مگابایتی از موبایل موفق است (محدودیت ۱ مگابایتی Server Action دیگر بی‌ربط است)
- [ ] `SELECT count(*) FROM product_images WHERE url LIKE 'data:%'` پس از مهاجرت صفر است
- [ ] پست محصول در کانال با عکس منتشر می‌شود
- [ ] تصویر با `next/image` بهینه بارگذاری می‌شود

---

### T0.8 — escape، secretهای اجباری، اعتبارسنجی env

**۱. فایل جدید:** `packages/shared/src/utils/html.ts`
```ts
export function escapeHtml(input: unknown): string   // & < > " ' را جایگزین می‌کند
```
اعمال روی **همه** مقادیر متنی که از کاربر می‌آیند و با `parse_mode: "HTML"` ارسال می‌شوند:
`telegram/service.ts` → `notifyNewOrder`, `notifyNewQuote`, `notifyNewContact`, `buildCaption` (title و body)؛
`telegram/webhook.ts` → پیام گروه پشتیبانی و هر جای دیگری که `ctx.message.text` یا نام کاربر در متن HTML می‌نشیند؛
`actions/admin-tickets.ts` → `replyText`.

**۲. ایمیل فرم تماس:** در `packages/integrations/src/email/templates.tsx` کامپوننت `ContactNoticeEmail` با propهای `{ name, email, phone, subject, message }` اضافه شود (React خودش escape می‌کند) و متد `sendContactNotice(params)` به `EmailService`. در `actions/contact.ts` رشته HTML دستی **حذف** و این متد استفاده شود.

**۳. fail-closed کردن secretها:**
- `app/api/cron/telegram/route.ts` و هر route کران دیگر: اگر `CRON_SECRET` تنظیم نیست → پاسخ ۵۰۳ با `{ error: "CRON_SECRET not configured" }`؛ اگر هست و هدر مطابق نیست → ۴۰۱. مقایسه با `crypto.timingSafeEqual`.
- `telegram/webhook.ts`: اگر `TELEGRAM_WEBHOOK_SECRET` نیست → ۵۰۳ و ربات ساخته نشود.
- چک ادمین در callbackهای قیمت: شرط `if (adminUserId && …)` به `if (!adminUserId || senderId !== adminUserId)` تغییر کند (نبودن env = رد دسترسی).

**۴. فایل جدید:** `packages/shared/src/env.ts`
```ts
export const serverEnvSchema = z.object({ /* DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, SITE_URL, S3_*, TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, TELEGRAM_CHANNEL_ID, CRON_SECRET, ZARINPAL_MERCHANT_ID, RESEND_API_KEY, REDIS_URL */ })
export function assertServerEnv(): void   // در production پرتاب خطا، در development فقط warn
```
در `apps/web/src/app/layout.tsx` (یا یک `instrumentation.ts`) یک بار صدا زده شود. `.env.example` با متغیرهای جدید (`TELEGRAM_API_ROOT`, `S3_PUBLIC_URL`, `CRON_SECRET`, `SITE_URL`) کامل شود.

**۵. `sanitize-html`** روی `contentFa`/`contentEn` مقاله **هنگام ذخیره** در `actions/admin-blog.ts` اعمال شود (allowlist: تگ‌های متنی، `a[href]`, `img[src|alt]`, `h2..h4`, لیست‌ها، `table`).

**پذیرش:**
- [ ] ارسال پیام تماس با متن `<b>test</b> & "x"` هم در تلگرام و هم در ایمیل عیناً و بی‌خطا نمایش داده می‌شود
- [ ] بدون `CRON_SECRET`، فراخوانی کران ۵۰۳ می‌دهد
- [ ] بدون `TELEGRAM_WEBHOOK_SECRET`، وبهوک ۵۰۳ می‌دهد
- [ ] اجرای build در production با env ناقص با خطای روشن متوقف می‌شود

---

### T0.9 — فعال‌کردن اعلان‌ها (نسخه موقت، بدون Outbox)

در این تسک فقط فراخوانی‌های گم‌شده وصل می‌شوند؛ فاز ۱ همه را به Outbox منتقل می‌کند. هر فراخوانی `try/catch` داشته باشد و **هرگز جریان کاربر را نشکند**.

| نقطه | اعلان |
|---|---|
| موفقیت callback پرداخت | `notifyNewOrder` + `notifyPaymentReceived` + `emailService.sendOrderConfirmation` (اگر ایمیل کاربر هست) |
| سفارش اعتباری B2B | `notifyNewOrder` با برچسب «پرداخت در محل/اعتباری» |
| `createQuoteAction` | `notifyNewQuote` |
| تغییر وضعیت سفارش توسط ادمین | ایمیل به مشتری با وضعیت جدید (قالب جدید `OrderStatusEmail`) |

**پذیرش:**
- [ ] یک پرداخت آزمایشی کامل: پیام تلگرام در چت مدیر و ایمیل تأیید برای مشتری می‌رسد
- [ ] قطع بودن تلگرام یا Resend، ثبت سفارش را با خطا مواجه نمی‌کند (فقط لاگ)

---

### T0.10 — سنجش دسترسی به API تلگرام و لایه relay

**۱. متغیر جدید `TELEGRAM_API_ROOT`** (پیش‌فرض `https://api.telegram.org`) و استفاده از آن در **همه** جاهایی که `new Bot(token)` ساخته می‌شود:
```ts
const bot = new Bot(token, { client: { apiRoot: process.env.TELEGRAM_API_ROOT ?? "https://api.telegram.org" } })
```
نقاط: `telegram/service.ts` (`getBot`, `enqueueTelegramMessage`, `drainTelegramQueue`), `telegram/webhook.ts` (`createSupportBot`), `scripts/*.ts`.

**۲. اسکریپت جدید:** `scripts/check-telegram-egress.ts` — `getMe` را با `TELEGRAM_API_ROOT` صدا می‌زند و زمان پاسخ، وضعیت و خطا را چاپ می‌کند. **این اسکریپت را روی سرور مقصد (لیارا) اجرا کن، نه فقط لوکال، و نتیجه را در گزارش بیاور.**

**۳. اگر دسترسی نبود:** فقط ساختار را آماده کن و توقف کن تا تصمیم بگیریم (Cloudflare Worker یا VPS). هیچ سروری راه‌اندازی نکن.

**پذیرش:**
- [ ] خروجی `check-telegram-egress` از سرور مقصد در گزارش هست
- [ ] تغییر `TELEGRAM_API_ROOT` بدون تغییر کد، همه تماس‌ها را جابه‌جا می‌کند

---

## چک‌لیست پایان فاز ۰ (قبل از deploy)
- [ ] یک خرید کامل end-to-end در sandbox: سبد → کرایه واقعی → پرداخت → تأیید → اعلان → سفارش در پنل
- [ ] هیچ قیمت یا کرایه‌ای در کلاینت محاسبه نمی‌شود
- [ ] هیچ `data:` در دیتابیس نیست
- [ ] tsc و vitest سبز، بدون `@ts-ignore` جدید
- [ ] `git log --oneline` یک commit به ازای هر تسک نشان می‌دهد

---

# فاز ۱ — سخت‌کردن (هفته دوم)

### T1.1 — گارد مجوزمحور و حذف کد تکراری
- فایل جدید `apps/web/src/lib/admin-guard.ts`:
  ```ts
  export async function requireAdminPerm(permission: string | string[]): Promise<SessionUser>
  ```
  بر پایه `requirePerm` از `@tirajeh/auth`.
- **۹ نسخه کپی‌شده `requireAdmin`** در `actions/admin-*.ts` حذف و با آن جایگزین شوند. نگاشت مجوزها:
  `products:create|update|delete`، `orders:read|update`، `users:read|update`، `blog:*`، `prices:publish`، `tickets:reply`، `quotes:update`، `categories:*`، `brands:*`.
- `packages/shared/src/constants/permissions.ts` کامل شود و `packages/database/src/seed.ts` همه مجوزها و نقش‌های `super_admin`, `admin`, `operator`, `support`, `customer` را seed کند (idempotent).
- سایدبار ادمین آیتم‌ها را بر اساس مجوز کاربر فیلتر کند.
- فایل جدید `apps/web/types/next-auth.d.ts` برای augment کردن `Session["user"]` و `JWT`؛ `as any`های مربوط به session در فایل‌های لمس‌شده حذف شوند.

**پذیرش:** کاربری با نقش `support` به `/admin/products` دسترسی ندارد و آیتمش در منو دیده نمی‌شود؛ tsc سبز؛ `grep -c "as any" ` در فایل‌های تغییر‌یافته کاهش یافته.

### T1.2 — Audit log
- `apps/web/src/lib/audit.ts`:
  ```ts
  export async function audit(params: { userId: string; action: string; resource: string; resourceId?: string; before?: unknown; after?: unknown; ip?: string | null }): Promise<void>
  ```
- در همه اکشن‌های ادمین (ایجاد/ویرایش/حذف/تغییر وضعیت/انتشار قیمت) صدا زده شود.
- منع خودتخریبی: ادمین نتواند خودش را غیرفعال/حذف کند و آخرین `super_admin` فعال نتواند حذف شود.

### T1.3 — تازه‌سازی نشست
- `packages/auth/src/index.ts`: در callback `jwt`، اگر `Date.now() - token.refreshedAt > 5 دقیقه`، کاربر از DB خوانده شود؛ اگر `!isActive` یا نبود کاربر → توکن باطل (`return null`)؛ در غیر این صورت نقش، `roleName`، `permissions` و `tokenVersion` به‌روز شوند.
- فیلد `tokenVersion Int @default(0)` روی `User` (migration `user_token_version`)؛ تغییر نقش یا غیرفعال‌سازی آن را `increment` کند و در `jwt` عدم تطابق = باطل.
- `session.maxAge` برای همه ۷ روز.

### T1.4 — ماشین حالت سفارش
- فایل جدید `packages/shared/src/constants/order-status.ts`:
  ```ts
  export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]>
  export function canTransition(from: OrderStatus, to: OrderStatus): boolean
  ```
  مسیر مجاز: `PENDING → AWAITING_PAYMENT|CONFIRMED|CANCELLED`، `AWAITING_PAYMENT → CONFIRMED|CANCELLED`، `CONFIRMED → PROCESSING|CANCELLED`، `PROCESSING → SHIPPED|CANCELLED`، `SHIPPED → DELIVERED`، `DELIVERED → REFUNDED`، `CANCELLED/REFUNDED → []`.
- `adminUpdateOrderStatusAction`: `status` با `z.nativeEnum(OrderStatus)` parse شود، `canTransition` چک شود، `as any` حذف شود، اثرهای جانبی (برگشت موجودی، اعلان، ساخت `Shipment` در `SHIPPED`) در همان تراکنش.
- در UI فقط وضعیت‌های مجاز در `<select>` نمایش داده شوند.

### T1.5 — حذف نرم
- `archivedAt DateTime?` روی `Product`, `User`, `Brand`, `Category`, `Post` (migration `soft_delete`).
- `adminDeleteProductAction` / `adminDeleteUserAction` به‌جای `delete` مقدار `archivedAt` را پر کنند و `isActive: false` بزنند.
- همه کوئری‌های فروشگاه `archivedAt: null` را در `where` داشته باشند؛ در ادمین فیلتر «آرشیو» اضافه شود با دکمه «بازگردانی».

### T1.6 — منطقه زمانی تهران و تاریخ جلالی
- فایل جدید `packages/shared/src/utils/date-tehran.ts`:
  ```ts
  export const TEHRAN_TZ = "Asia/Tehran"
  export function tehranDayStart(d?: Date): Date          // نیمه‌شب تهران به UTC
  export function tehranDateKey(d?: Date): string          // "1405-06-21"
  export function formatJalali(d: Date | string, opts?: { withTime?: boolean }): string  // Intl با fa-IR-u-ca-persian
  export function formatRelativeFa(d: Date | string): string
  ```
- `daily-price-service.ts` از `tehranDayStart()` استفاده کند و فیلد جدید `dateKey String @unique` روی `DailyPriceBulletin` (migration `bulletin_date_key`) مرجع یکتایی شود.
- داشبورد ادمین و همه نمایش‌های تاریخ در فروشگاه و پنل از `formatJalali` استفاده کنند (`formatRelativeTime` فعلی در `lib/cement.ts` به این ماژول منتقل شود).
- `TZ=Asia/Tehran` در `docker-compose.yml` و مستندات deploy.

### T1.7 — محدودیت نرخ و ضداسپم
- فایل جدید `packages/integrations/src/rate-limit.ts`:
  ```ts
  export async function rateLimit(key: string, limit: number, windowSec: number): Promise<{ ok: boolean; remaining: number; retryAfterSec: number }>
  ```
  پنجره لغزان با Redis (`INCR` + `EXPIRE`)؛ اگر Redis نبود، در production خطا و در development اجازه.
- اعمال: `loginAction` (۵ در ۱۵ دقیقه به ازای IP و به ازای ایمیل)، `registerAction` (۳ در ساعت به ازای IP)، `contactAction` و `createQuoteAction` (۵ در ساعت)، `createUploadUrlAction` (۳۰ در ساعت).
- فیلد honeypot مخفی در فرم تماس و استعلام (اگر پر بود، پاسخ موفق جعلی بده و چیزی ذخیره نکن).
- IP از هدر `x-forwarded-for` با fallback.

### T1.8 — Outbox و worker
**اسکیما (migration `outbox`):**
```prisma
model Outbox {
  id        String   @id @default(uuid()) @db.Uuid
  event     String
  channel   String
  payload   Json
  status    String   @default("PENDING")   // PENDING | SENT | FAILED | DEAD
  attempts  Int      @default(0)
  runAfter  DateTime @default(now()) @map("run_after")
  lastError String?  @map("last_error") @db.Text
  sentAt    DateTime? @map("sent_at")
  createdAt DateTime @default(now()) @map("created_at")
  @@index([status, runAfter])
  @@index([event, createdAt])
  @@map("outbox")
}
```
**فایل‌های جدید در `packages/integrations/src/outbox/`:**
- `publish.ts` → `enqueue(tx, { event, channel, payload })` (داخل همان تراکنش دامنه)
- `handlers.ts` → نگاشت `channel → handler`: `tg_channel`, `tg_admin`, `tg_user`, `email`, `sms` (sms فعلاً no-op با لاگ)
- `worker.ts` → `drainOutbox(limit = 25)`: انتخاب `PENDING` با `runAfter <= now` و قفل با `UPDATE ... SET status='PROCESSING'`؛ backoff نمایی `2^attempts دقیقه` تا ۵ تلاش، سپس `DEAD`؛ خطای ۴۲۹ تلگرام: `runAfter = now + retry_after`.
- route جدید `apps/web/src/app/api/cron/outbox/route.ts` با محافظت `CRON_SECRET`.
- **صف Redis فعلی (`tg:send_queue`) و همه `void notify…` حذف و با `enqueue` جایگزین شوند.** رویدادها: `order.created`, `order.paid`, `order.status_changed`, `quote.created`, `quote.answered`, `contact.created`, `price.published`, `product.updated`.

**پذیرش:** با توکن تلگرام غلط، رویداد سه بار retry و بعد `DEAD` می‌شود و هیچ داده‌ای گم نمی‌شود؛ با اصلاح توکن، اجرای دوباره worker پیام را می‌فرستد.

### T1.9 — کلاینت Redis واحد
`packages/integrations/src/redis.ts` با یک کلاینت lazy و reconnect؛ همه `createClient()`های `service.ts`, `webhook.ts`, `price-flow.ts` حذف شوند. `memoryPending` فقط در `NODE_ENV !== "production"` مجاز باشد.

### T1.10 — اعتبارسنجی کامل ورودی‌ها
همه اکشن‌های سرور (`apps/web/src/actions/*`) ورودی را zod parse کنند و `ActionResult` با `fieldErrors` برگردانند. `as string` و `!` روی `formData.get` باید صفر شود. اسکیماهای مشترک در `packages/shared/src/schemas/`.

---

# فاز ۲ — پنل ادمین

هر تسک جدا commit شود. قوانین UI فاز ۶ قبلی (`tirajeh-admin-ux-phase6-prompt.md`) همچنان معتبر است.

- **T2.1 شمارنده‌های واقعی:** `unreadNotificationsCount = 3` حذف؛ `AdminShell` یک `counts` واقعی (سفارش‌های در انتظار، تیکت خوانده‌نشده، استعلام بی‌پاسخ) از یک کوئری `Promise.all` در layout بگیرد و به سایدبار و تاپ‌بار بدهد. زنگوله، یک popover با آخرین ۱۰ رویداد (از `Outbox` و `OrderEvent`) باز کند.
- **T2.2 صف «کارهای امروز» در داشبورد:** بالای KPIها، فهرست اقدام‌محور: سفارش منتظر تأیید، استعلام بی‌پاسخ >۲ ساعت، تیکت باز، محصول با `lastPriceUpdate` قدیمی‌تر از ۲۴ ساعت، محصول با `stockQty` زیر آستانه (فیلد جدید `lowStockThreshold Int @default(0)` روی `Product`). هر ردیف دکمه اقدام مستقیم.
- **T2.3 نمودار فروش:** درآمد و تناژ ۳۰ روز (SVG دست‌ساز، بدون کتابخانه)، تفکیک برند و استان، نرخ تبدیل استعلام→سفارش. sparkline روی کارت‌های KPI.
- **T2.4 صفحه‌های مدیریتی گم‌شده:** CRUD برای `ShippingZone` + `ShippingRate`، `Factory`، `Setting` (تلفن، آدرس، کانال، آستانه‌ها)، `ProductPackagingOption` داخل فرم محصول، `ProductDocument`، و مدیریت نقش/مجوز.
- **T2.5 قیمت روز حرفه‌ای:** ستون «دیروز» + درصد تغییر با فلش، دکمه «کپی قیمت‌های دیروز»، جست‌وجو و فیلتر برند، و **پیش‌نمایش همان PNG** (`renderPriceCardPng`) قبل از انتشار از طریق یک route ادمین `GET /api/admin/price-card/preview`.
- **T2.6 ویرایش درجا و گروهی قیمت:** ویرایش سلول قیمت در جدول محصولات با Enter؛ اکشن `adminBulkAdjustPricesAction({ brandId?, categoryId?, percent })` با صفحه پیش‌نمایش قبل/بعد و تأیید دومرحله‌ای؛ ثبت در `ProductPriceHistory` و `AuditLog`.
- **T2.7 برد کانبان سفارش‌ها:** ستون بر اساس وضعیت، drag فقط در گذارهای مجاز (`canTransition`)، کارت با تناژ/شهر/کامیون/مبلغ.
- **T2.8 پیش‌فاکتور و بارنامه PDF:** با `@react-pdf/renderer`، تاریخ جلالی، مشخصات شرکت از `Setting`، شناسه ملی و کد اقتصادی از `CustomerProfile`، فونت Vazirmatn محلی. route: `GET /api/admin/orders/[id]/invoice`.
- **T2.9 مرکز انتشار تلگرام:** جدول `Outbox` + `TelegramLog` با فیلتر وضعیت، دکمه «ارسال دوباره» (`runAfter=now, attempts=0`)، و تقویم پست‌های `SCHEDULED`.
- **T2.10 پرونده ۳۶۰ مشتری:** `/admin/users/[id]` با سفارش‌ها، استعلام‌ها، تیکت‌ها، حساب تلگرام متصل، جمع خرید، و تغییر `customerType`.
- **T2.11 گفت‌وگوی تیکت:** مدل جدید `ContactMessage` (`contactId`, `body`, `authorType: CUSTOMER|ADMIN`, `authorId`, `createdAt`) و مهاجرت `replyText` موجود به اولین پیام ادمین؛ پاسخ از همان کانال ورودی (تلگرام یا ایمیل) ارسال شود.
- **T2.12 جست‌وجوی سراسری Ctrl+K:** پرش به سفارش با شماره، محصول با نام، کاربر با موبایل، و فرمان‌های سریع.
- **T2.13 تم تاریک و تراکم جدول:** سوییچ تم (کلاس روی `html` + `localStorage`) با استفاده از tokens موجود، و حالت فشرده/راحت برای ارتفاع ردیف.

---

# فاز ۳ — اتوماسیون دوطرفه تلگرام

پیش‌نیاز: Outbox فاز ۱.

- **T3.1 اتصال حساب مشتری:** فیلدهای `telegramUserId String? @unique` و `telegramChatId String?` روی `User`؛ مدل `TelegramLinkToken` (توکن یک‌بارمصرف ۱۰ دقیقه‌ای)؛ دکمه «اتصال به تلگرام» در `/account` که لینک `t.me/<bot>?start=link_<token>` می‌سازد؛ هندلر `start` در وبهوک آن را مصرف می‌کند و پیام تأیید می‌فرستد. دکمه «قطع اتصال» هم باشد.
- **T3.2 اعلان وضعیت سفارش به مشتری:** کانال `tg_user` در Outbox؛ متن‌ها برای `CONFIRMED`, `PROCESSING`, `SHIPPED` (با پلاک و شماره راننده از `Shipment`), `DELIVERED`, `CANCELLED` + دکمه «پیگیری سفارش».
- **T3.3 دکمه‌های اقدام مدیران:** اعلان سفارش در `TELEGRAM_ADMIN_CHAT_ID` با `InlineKeyboard`: `order_confirm:<id>`, `order_contacted:<id>`, `order_reject:<id>`, و لینک پنل. هندلر callback: بررسی مجوز با `telegramUserId` کاربر ادمین → `canTransition` → به‌روزرسانی وضعیت + `OrderEvent` با `createdBy` همان ادمین + **ویرایش همان پیام** با خطی مثل «✅ تأیید شد توسط مریم · ۰۹:۴۵».
- **T3.4 پاسخ استعلام از ربات:** دکمه «ارسال قیمت» روی اعلان استعلام → گفت‌وگوی کوتاه (قیمت هر تن، یادداشت) → `QuoteRequest.quotedPrice` + `status: QUOTED` + اعلان به مشتری با لینک تبدیل به سفارش.
- **T3.5 زمان‌بندی قیمت روز:** route `POST /api/cron/daily-price` که ساعت ۹ تهران آخرین قیمت‌ها را به کانال می‌فرستد، پست جدید را `pinChatMessage` و پست دیروز را `unpinChatMessage` می‌کند. اگر همان روز دوباره اعلام شد، **همان پست ویرایش شود** (`telegramMessageId` بولتن روز را در `DailyPriceBulletin` ذخیره کن: فیلد `telegramMessageId Int?`).
- **T3.6 هم‌گامی پست محصول:** رویداد `product.updated` → اگر قیمت یا موجودی عوض شد کپشن ویرایش شود؛ ناموجود → «⛔ فعلاً ناموجود»؛ تغییر تصویر → `editMessageMedia`؛ اگر ویرایش شکست خورد **پست تکراری نساز**، خطا را در `TelegramLog` ثبت کن و در مرکز انتشار نشان بده.
- **T3.7 حالت inline:** `bot.on("inline_query")` → جست‌وجوی محصول با قیمت روز، خروجی `InlineQueryResultArticle` با دکمه خرید و UTM. در BotFather باید inline mode روشن شود (در گزارش یادآوری کن).
- **T3.8 هشدار قیمت:** مدل `PriceAlert` (`userId|telegramChatId`, `productId`, `direction: BELOW|ANY`, `thresholdToman?`)؛ بعد از هر `price.published` بررسی و اعلان.
- **T3.9 پیش‌نویس → تأیید → انتشار:** هر پست کانالی که از پنل ساخته می‌شود ابتدا به چت خصوصی مدیر با دکمه‌های «انتشار»/«لغو» می‌رود (قابل خاموش‌کردن با `Setting`).
- **T3.10 UTM و گزارش اثر:** همه لینک‌های کانال `?utm_source=telegram&utm_medium=channel&utm_campaign=<kind>_<dateKey>` بگیرند؛ اکشن سبک ثبت بازدید با UTM و کارت «فروش با منشأ تلگرام» در داشبورد.
- **T3.11 جمع‌بندی هفتگی:** جمعه‌ها تصویر روند قیمت هفته با همان موتور canvas + پرفروش‌ها + مقالات هفته.
- **T3.12 آلبوم محصولات جدید:** `sendMediaGroup` هفتگی از محصولات اضافه‌شده.
- **T3.13 چند ادمین تلگرامی:** حذف وابستگی به `TELEGRAM_ADMIN_USER_ID` تکی و نگاشت `phone` (کد فعلی در `webhook.ts:270`)؛ مبنا `User.telegramUserId` + مجوز.
- **T3.14 آداپتور بله:** `packages/integrations/src/messengers/` با اینترفیس `ChannelPublisher` و دو پیاده‌سازی `telegram` و `bale` (فقط `apiRoot` و توکن متفاوت). ابتدا با یک کانال آزمایشی سازگاری را تست کن و **قبل از اتکا نتیجه را گزارش بده**.

---

# فاز ۴ — تجربه کاربری و رشد

- **T4.1 صفحه «قیمت روز»:** `/[locale]/prices` با جدول همه برندها، ستون دیروز و درصد تغییر، فیلتر تیپ/بسته‌بندی، زمان به‌روزرسانی جلالی، دکمه اشتراک در تلگرام، و `og:image` از همان کارت PNG.
- **T4.2 سئو:** `app/sitemap.ts`، `app/robots.ts`، JSON-LD `Product`+`Offer` (با `priceCurrency: "IRR"`، مبلغ ریالی، `priceValidUntil` پایان روز تهران) و `BreadcrumbList`، `Organization` در layout، و `alternates.languages` برای fa/en.
- **T4.3 کش تگ‌دار:** `unstable_cache` + `cache()` برای محصول، دسته، برند و بولتن قیمت؛ `revalidateTag("product:<slug>")` در اکشن‌های ادمین و انتشار قیمت؛ حذف کوئری تکراری محصول در `generateMetadata` با `cache()`.
- **T4.4 جست‌وجوی فارسی:** ستون `searchText` نرمال‌شده (ی/ك/همزه/نیم‌فاصله/ارقام) + `pg_trgm` + اعمال `fts-migration.sql`؛ `search-bar` با پیشنهاد زنده و «نتیجه‌ای نبود؟ این‌ها را ببینید».
- **T4.5 برچسب تازگی قیمت:** روی کارت و صفحه محصول: «قیمت امروز · ۲ ساعت پیش» از `lastPriceUpdate`.
- **T4.6 نمودار ۳۰ روزه قیمت:** از `ProductPriceHistory`، SVG سبک با کمینه/بیشینه ماه و دکمه «هشدار قیمت» (وصل به T3.8).
- **T4.7 محاسبه‌گر مصرف:** ورودی متر مکعب و عیار → تعداد کیسه ۵۰ کیلویی / تن فله + تعداد سرویس کامیون + دکمه «افزودن به سبد».
- **T4.8 نوار ظرفیت کامیون در سبد:** «۱۸ از ۲۵ تن» + پیام صرفه‌جویی کرایه در صورت پر شدن بار.
- **T4.9 مقایسه محصولات:** انتخاب ۲ تا ۴ محصول و جدول مقایسه تیپ/مقاومت/کارخانه/بسته‌بندی/قیمت هر تن.
- **T4.10 پیگیری سفارش زنده:** `order-timeline` به `OrderEvent` و `Shipment` وصل شود (پلاک، راننده، زمان تخمینی).
- **T4.11 ابزار B2B:** آدرس‌ها و پروژه‌های ذخیره‌شده، «سفارش دوباره»، تبدیل استعلام پاسخ‌داده‌شده به سفارش، دانلود پیش‌فاکتور.
- **T4.12 نوار خرید چسبان موبایل** در صفحه محصول + بازبینی همه صفحه‌ها در عرض ۳۶۰ پیکسل.
- **T4.13 اسکلت و حالت خالی فروشگاه:** نسخه فروشگاهی `EmptyState` و `Skeleton` برای لیست محصول، سبد خالی و جست‌وجوی بی‌نتیجه.
- **T4.14 بهینه‌سازی دارایی‌ها:** `public/hero-logo-3d.png` (۱٫۴ مگابایت) به AVIF/WebP زیر ۱۵۰ کیلوبایت؛ فونت Vazirmatn از `next/font/google` به `next/font/local` با woff2 داخل `apps/web/public/fonts` (فایل‌های ttf موجود در `packages/integrations/src/telegram/assets/fonts` را تبدیل کن، ربات همچنان از ttf استفاده می‌کند).
- **T4.15 پاک‌سازی کد مرده:** حذف `apps/admin` (یا تبدیل به README یک‌خطی)، حذف `app/[locale]/(admin)/admin/admin-nav.tsx`، حذف Tailwind و `@tailwindcss/postcss` از `apps/web/package.json` و `postcss.config.mjs` اگر بلااستفاده است، حذف `allowedOrigins` لوکال.

---

## ۵. قالب گزارش پس از هر تسک (دقیقاً همین را بده)

```
## T0.3 — قیمت سمت سرور و پله بسته‌بندی
وضعیت: تمام‌شده | نیمه‌کاره | مسدود

### فایل‌های تغییر‌یافته
- apps/web/src/lib/pricing.ts (جدید، 48 خط)
- apps/web/src/actions/cart.ts (±۶۲ خط)
- packages/database/prisma/schema.prisma (+3 فیلد)
- migration: 20260913_cart_order_packaging_tier

### خروجی بررسی‌ها
tsc --noEmit: EXIT 0
vitest: 14 passed

### تصمیم‌هایی که خودم گرفتم (اگر هست)
- …

### انحراف از پرامپت یا مسدودی
- …

### چیزی که باید دستی تست شود
- افزودن پله پالت و تک‌کیسه از یک محصول

### commit
feat(cart): resolve unit price server-side per packaging tier
```

**بعد از هر فاز** یک گزارش تجمیعی + خروجی `git log --oneline` آن فاز + فهرست کارهای باقی‌مانده بده.

---

## ۶. کارهای ممنوع

- deploy کردن یا اجرای `prisma migrate deploy` روی دیتابیس production
- `prisma migrate reset` یا هر فرمانی که داده را پاک کند
- دست‌کاری `.env` واقعی؛ فقط `.env.example` را کامل کن
- افزودن Tailwind class، کتابخانه UI جدید، ORM دیگر یا state manager جدید
- refactor سراسری، تغییر نام پوشه‌ها، جابه‌جایی معماری مونوریپو
- خاموش‌کردن خطا با `@ts-ignore`، `any`، `eslint-disable` یا `try {} catch {}` خالی
- تغییر منطق قیمت، کرایه یا موجودی در سمت کلاینت
- ارسال پیام آزمایشی به کانال یا گروه واقعی؛ برای تست از یک کانال خصوصی آزمایشی استفاده کن
