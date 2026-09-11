# پرامپت اجرایی برای Antigravity — سیستم اعلام قیمت روز محصولات

> این فایل را کامل کپی کن و به‌عنوان یک پرامپت واحد به Antigravity بده.  
> مسیر پروژه: `E:\tiraje` — پوشه متصل: `E:\tiraje\apps\web\src`  
> بعد از هر بخش `tsc --noEmit` در `apps/web` بزن — فقط با EXIT:0 ادامه بده.

---

## قوانین ثابت (نقض‌نشدنی)
1. بدون Tailwind utility class در `.tsx`
2. CSS فقط با design tokens: `--color-*`, `--radius-*`, `--shadow-*`, `--transition-*`
3. Lucide icon: `style={{ width: "Xrem", height: "Xrem" }}` — نه className
4. RTL: از `padding-inline-start/end`، `border-inline-start/end` استفاده کن
5. Scoped CSS با prefix منحصربه‌فرد در هر فایل
6. Bilingual fa/en — `const fa = locale === "fa"`

---

## ۰. خلاصه وضعیت فعلی (verify کن قبل از هر تغییری)

### Schema
- مدل `Product` فیلد `price: Decimal @db.Decimal(15, 0)` و `lastPriceUpdate: DateTime @default(now())` دارد.
- مدل `ProductPriceHistory` از قبل وجود دارد (`productId, oldPrice, newPrice, changedBy, reason, createdAt`) — **از همین استفاده کن، مدل جدید نساز**.
- مدل `TelegramLog` هم از قبل هست.

### Telegram Bot
- فایل `packages/integrations/src/telegram/price-flow.ts` یک state machine کامل برای فلوی `/price` در ربات تلگرام دارد:
  - ادمین `/price` می‌زند → لیست محصولات فعال با checkbox نمایش داده می‌شود → محصولات مورد نظر انتخاب → قیمت هر محصول وارد → پیش‌نمایش → ارسال به کانال.
  - **هنگام ارسال**: قیمت هر محصول انتخابی در دیتابیس آپدیت می‌شود (`product.price` + `product.lastPriceUpdate`).
  - امکان افزودن **محصول جدید موقت** (فقط نام + قیمت) هم هست.
  - پست خروجی شامل: تاریخ شمسی، لیست قیمت‌ها، هشتگ‌ها، لینک سایت و شماره تماس.

- فایل `packages/integrations/src/telegram/webhook.ts` در خط ۲۶۱–۳۰۶ هنگام `price_send`:
  1. پیام را به `TELEGRAM_CHANNEL_ID` ارسال می‌کند
  2. `product.price` و `product.lastPriceUpdate` را آپدیت می‌کند
  3. محصولات جدید موقت را create می‌کند

### صفحه اصلی
- فایل `apps/web/src/components/layout/storefront-layout.tsx` → `<Navbar />` سپس `<main>` سپس `<Footer />`
- navbar یک کامپوننت client component در `components/layout/navbar.tsx`

### پنل ادمین
- ناوبری: `apps/web/src/app/[locale]/(admin)/admin/admin-nav.tsx` — آرایه `NAV_ITEMS`
- اکشن‌ها: `apps/web/src/actions/admin-products.ts` و `admin-blog.ts` و `admin-quotes.ts` الگوهای موجود هستند.

---

## ۱. تصمیمات طراحی

### ۱.۱ مدل داده
**نیازی به مدل جدید نیست**. از همان `Product.price` و `Product.lastPriceUpdate` و `ProductPriceHistory` استفاده می‌کنیم.

یک مدل جدید `DailyPriceEntry` اضافه می‌شود برای ذخیره «اعلام قیمت روز» — یعنی فقط محصولاتی که ادمین انتخاب کرده قیمت روزشان اعلام شود. این جدا از خود `Product.price` است چون:
- ممکن است فقط ۲ محصول از ۱۸ تا اعلام قیمت شوند
- در نوار بالای سایت فقط محصولات اعلام‌شده نمایش داده می‌شوند
- تاریخچه اعلام قیمت روزانه باید حفظ شود

### ۱.۲ نوار اعلام قیمت (Ticker Bar)
- مشابه نوار Community Trends سایت TradingView
- بالای navbar قرار می‌گیرد (نه زیر آن)
- یک نوار افقی اسکرول‌پذیر (marquee یا CSS scroll) با کارت‌های قیمت محصولات
- اگر تعداد محصولات کم باشد (۲–۳ تا): مرکز صفحه، بدون اسکرول
- اگر زیاد باشد (بیش از ۴–۵ تا): اسکرول افقی خودکار (marquee نرم)
- هر کارت: نام محصول + قیمت + درصد تغییر نسبت به قیمت قبلی (اختیاری)
- پس‌زمینه تیره (`--color-surface-dark` یا مشابه هدر تاریک سایت)
- ارتفاع ثابت ~40–48px

### ۱.۳ یکپارچه‌سازی با ربات تلگرام
- وقتی ادمین از **پنل سایت** قیمت ثبت کند → هم در دیتابیس ذخیره شود، هم پیام به کانال تلگرام ارسال شود (با همان فرمت `buildPricePostText`)
- وقتی ادمین از **ربات تلگرام** `/price` بزند → علاوه بر ارسال به کانال و آپدیت `Product.price`، رکوردهای `DailyPriceEntry` هم ساخته شوند تا در نوار سایت نمایش داده شوند
- **هر دو مسیر نتیجه یکسان دارند**: قیمت محصول آپدیت + تاریخچه قیمت ثبت + اعلام قیمت روز ساخته + پیام کانال ارسال

---

## ۲. فاز ۱ — Schema

فایل: `packages/database/prisma/schema.prisma`

### ۲.۱ مدل جدید `DailyPriceBulletin` و `DailyPriceItem`

```prisma
// ============================================================
// DAILY PRICE BULLETIN (اعلام قیمت روز)
// ============================================================

model DailyPriceBulletin {
  id              String            @id @default(uuid()) @db.Uuid
  date            DateTime          @db.Date
  publishedBy     String?           @map("published_by") @db.Uuid
  source          String            @default("ADMIN_PANEL") // "ADMIN_PANEL" | "TELEGRAM"
  telegramMsgId   String?           @map("telegram_msg_id")
  isActive        Boolean           @default(true) @map("is_active")
  createdAt       DateTime          @default(now()) @map("created_at")
  updatedAt       DateTime          @updatedAt @map("updated_at")

  publisher       User?             @relation("BulletinPublisher", fields: [publishedBy], references: [id])
  items           DailyPriceItem[]

  @@unique([date])
  @@index([isActive, date])
  @@map("daily_price_bulletin")
}

model DailyPriceItem {
  id           String             @id @default(uuid()) @db.Uuid
  bulletinId   String             @map("bulletin_id") @db.Uuid
  productId    String?            @map("product_id") @db.Uuid
  customName   String?            @map("custom_name")          // برای محصولات جدید موقت از تلگرام
  price        Decimal            @db.Decimal(15, 0)
  previousPrice Decimal?          @map("previous_price") @db.Decimal(15, 0)
  sortOrder    Int                @default(0) @map("sort_order")
  createdAt    DateTime           @default(now()) @map("created_at")

  bulletin     DailyPriceBulletin @relation(fields: [bulletinId], references: [id], onDelete: Cascade)
  product      Product?           @relation(fields: [productId], references: [id], onDelete: SetNull)

  @@index([bulletinId])
  @@index([productId])
  @@map("daily_price_item")
}
```

### ۲.۲ اضافه‌کردن رابطه به `Product`

```prisma
model Product {
  // ... فیلدهای موجود ...
  dailyPriceItems   DailyPriceItem[]
  // ... بقیه روابط ...
}
```

### ۲.۳ اضافه‌کردن رابطه به `User`

```prisma
model User {
  // ... فیلدهای موجود ...
  publishedBulletins DailyPriceBulletin[] @relation("BulletinPublisher")
}
```

### ۲.۴ اجرا
```bash
pnpm --filter @tirajeh/database prisma migrate dev --name add_daily_price_bulletin
pnpm --filter @tirajeh/database prisma generate
```

---

## ۳. فاز ۲ — سرویس مشترک اعلام قیمت

### ۳.۱ فایل جدید: `packages/integrations/src/telegram/daily-price-service.ts`

این فایل یک **سرویس مشترک** است که هم از پنل ادمین و هم از ربات تلگرام صدا زده می‌شود:

```ts
import { db } from "@tirajeh/database"
import { Decimal } from "@prisma/client/runtime/library"
import { buildPricePostText, getActiveProducts, type PriceFlowState } from "./price-flow"

export interface PriceSubmission {
  productId: string
  price: number
}

export interface CustomProductPrice {
  name: string
  price: number
}

export interface PublishDailyPriceParams {
  items: PriceSubmission[]
  customItems?: CustomProductPrice[]
  source: "ADMIN_PANEL" | "TELEGRAM"
  publishedBy?: string  // userId (for admin panel)
}

/**
 * Core function: creates a DailyPriceBulletin, updates product prices,
 * records price history, and optionally sends to Telegram channel.
 * Called from both admin panel actions and the Telegram bot /price flow.
 */
export async function publishDailyPrice(params: PublishDailyPriceParams): Promise<{
  bulletinId: string
  telegramSent: boolean
  error?: string
}> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 1. Upsert the bulletin for today (replace if same day)
  const existingBulletin = await db.dailyPriceBulletin.findUnique({
    where: { date: today },
    include: { items: true },
  })

  if (existingBulletin) {
    // Delete old items, we'll recreate
    await db.dailyPriceItem.deleteMany({
      where: { bulletinId: existingBulletin.id },
    })
  }

  const bulletin = existingBulletin
    ? await db.dailyPriceBulletin.update({
        where: { id: existingBulletin.id },
        data: {
          source: params.source,
          publishedBy: params.publishedBy ?? existingBulletin.publishedBy,
          isActive: true,
        },
      })
    : await db.dailyPriceBulletin.create({
        data: {
          date: today,
          source: params.source,
          publishedBy: params.publishedBy ?? null,
          isActive: true,
        },
      })

  // 2. Update product prices + create price history + create bulletin items
  const bulletinItems: Array<{
    productId?: string
    customName?: string
    price: number
    previousPrice?: number
    sortOrder: number
  }> = []

  for (let i = 0; i < params.items.length; i++) {
    const { productId, price } = params.items[i]
    const product = await db.product.findUnique({
      where: { id: productId },
      select: { price: true },
    })

    const oldPrice = product ? Number(product.price) : 0

    // Update product price
    await db.product.update({
      where: { id: productId },
      data: {
        price: price,
        lastPriceUpdate: new Date(),
      },
    })

    // Record price history (if publishedBy is available)
    if (params.publishedBy && oldPrice !== price) {
      await db.productPriceHistory.create({
        data: {
          productId,
          oldPrice: oldPrice,
          newPrice: price,
          changedBy: params.publishedBy,
          reason: params.source === "TELEGRAM" ? "اعلام قیمت روز (تلگرام)" : "اعلام قیمت روز (پنل ادمین)",
        },
      })
    }

    bulletinItems.push({
      productId,
      price,
      previousPrice: oldPrice,
      sortOrder: i,
    })
  }

  // Custom products (from Telegram flow)
  if (params.customItems) {
    for (let i = 0; i < params.customItems.length; i++) {
      bulletinItems.push({
        customName: params.customItems[i].name,
        price: params.customItems[i].price,
        sortOrder: params.items.length + i,
      })
    }
  }

  // 3. Bulk create bulletin items
  await db.dailyPriceItem.createMany({
    data: bulletinItems.map((item) => ({
      bulletinId: bulletin.id,
      productId: item.productId ?? null,
      customName: item.customName ?? null,
      price: item.price,
      previousPrice: item.previousPrice ?? null,
      sortOrder: item.sortOrder,
    })),
  })

  // 4. Send to Telegram channel
  let telegramSent = false
  let telegramError: string | undefined
  try {
    const channelId = process.env.TELEGRAM_CHANNEL_ID
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (channelId && botToken) {
      // Build the same format as the existing /price flow
      const products = await getActiveProducts()
      const fakeState: PriceFlowState = {
        step: "PREVIEW",
        page: 0,
        selected: params.items.map((i) => i.productId),
        prices: Object.fromEntries(params.items.map((i) => [i.productId, i.price])),
        currentIdx: 0,
        newProducts: (params.customItems ?? []).map((c) => ({
          name: c.name,
          price: c.price,
        })),
      }
      const { text: postText } = await buildPricePostText(fakeState, products)

      const { Bot } = await import("grammy")
      const bot = new Bot(botToken)
      const sentMsg = await bot.api.sendMessage(channelId, postText, { parse_mode: "HTML" })

      // Save telegram message ID to bulletin
      await db.dailyPriceBulletin.update({
        where: { id: bulletin.id },
        data: { telegramMsgId: String(sentMsg.message_id) },
      })
      telegramSent = true
    }
  } catch (err: any) {
    telegramError = err?.message || String(err)
    console.error("[daily-price] Failed to send to Telegram channel:", err)
  }

  return {
    bulletinId: bulletin.id,
    telegramSent,
    error: telegramError,
  }
}

/**
 * Get the active (latest) daily price bulletin for display on the website ticker.
 */
export async function getActiveDailyPriceBulletin() {
  return db.dailyPriceBulletin.findFirst({
    where: { isActive: true },
    orderBy: { date: "desc" },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
        include: {
          product: {
            select: {
              id: true,
              nameFa: true,
              nameEn: true,
              slug: true,
              packagingType: true,
            },
          },
        },
      },
    },
  })
}
```

سپس در `packages/integrations/src/index.ts` اکسپورت کن:
```ts
export { publishDailyPrice, getActiveDailyPriceBulletin } from "./telegram/daily-price-service"
```

### ۳.۲ اتصال به فلوی تلگرام — ویرایش `webhook.ts`

در بلوک `price_send` (خطوط ۲۶۱–۳۱۰ فعلی)، **کل بلوک** را با استفاده از `publishDailyPrice` بازنویسی کن:

```ts
if (data === "price_send") {
  await ctx.answerCallbackQuery({ text: "در حال انتشار و ثبت تغییرات..." }).catch(() => {})

  try {
    // Find admin user ID from database (optional — may not exist)
    let adminUserId: string | undefined
    const adminTgId = process.env.TELEGRAM_ADMIN_USER_ID
    if (adminTgId) {
      // Try to find the admin user — don't fail if not found
      // (publishDailyPrice handles missing publishedBy gracefully)
    }

    const items = state.selected.map((prodId) => ({
      productId: prodId,
      price: state.prices[prodId] ?? 0,
    }))

    const customItems = state.newProducts.map((np) => ({
      name: np.name,
      price: np.price,
    }))

    const result = await publishDailyPrice({
      items,
      customItems: customItems.length > 0 ? customItems : undefined,
      source: "TELEGRAM",
      publishedBy: adminUserId,
    })

    await clearPriceFlowState(chatId)

    if (result.telegramSent) {
      await ctx.reply("✅ لیست قیمت با موفقیت در کانال منتشر شد و قیمت‌ها در سایت به‌روزرسانی شدند.")
    } else if (result.error) {
      await ctx.reply(`⚠️ قیمت‌ها در سایت ثبت شدند ولی ارسال به کانال تلگرام خطا داد:\n${result.error}`)
    } else {
      await ctx.reply("✅ قیمت‌ها در سایت ثبت شدند. (کانال تلگرام پیکربندی نشده)")
    }
  } catch (err: any) {
    console.error("[telegram:priceFlow] publishDailyPrice failed:", err)
    await ctx.reply(`❌ خطا: ${err?.message || err}`)
  }
  return
}
```

**مهم:** بلوک قدیمی `price_send` را کامل پاک کن و با این جایگزین کن. دیگر نیازی به `db.product.update` و `db.product.create` مستقیم در webhook نیست — `publishDailyPrice` همه‌چیز را انجام می‌دهد.

---

## ۴. فاز ۳ — پنل ادمین: صفحه اعلام قیمت روز

### ۴.۱ ناوبری

در `apps/web/src/app/[locale]/(admin)/admin/admin-nav.tsx` یک آیتم جدید اضافه کن (بعد از `quotes` و قبل از `tickets`):
```ts
import { ... TrendingUp ... } from "lucide-react"

// در آرایه NAV_ITEMS:
{ key: "daily-price", href: "/admin/daily-price", icon: TrendingUp, fa: "اعلام قیمت روز", en: "Daily Prices" },
```

### ۴.۲ اکشن‌ها

فایل جدید: `apps/web/src/actions/admin-daily-price.ts`

```ts
"use server"

import { db } from "@tirajeh/database"
import { auth } from "@tirajeh/auth"
import { publishDailyPrice } from "@tirajeh/integrations"
import { revalidatePath } from "next/cache"

/** Fetch all active products for the price form */
export async function getProductsForPricingAction() {
  const products = await db.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      nameFa: true,
      nameEn: true,
      price: true,
      lastPriceUpdate: true,
      packagingType: true,
      cementType: true,
      brand: { select: { nameFa: true } },
    },
    orderBy: [{ brandId: "asc" }, { nameFa: "asc" }],
  })
  return products
}

/** Get the current active bulletin */
export async function getActiveBulletinAction() {
  return db.dailyPriceBulletin.findFirst({
    where: { isActive: true },
    orderBy: { date: "desc" },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
        include: {
          product: { select: { id: true, nameFa: true, slug: true, packagingType: true } },
        },
      },
      publisher: { select: { name: true } },
    },
  })
}

/** Submit daily prices */
export async function submitDailyPriceAction(
  data: {
    items: Array<{ productId: string; price: number }>
    sendToTelegram: boolean
  }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "احراز هویت نشده" }
  }

  try {
    const result = await publishDailyPrice({
      items: data.items,
      source: "ADMIN_PANEL",
      publishedBy: session.user.id,
    })

    revalidatePath("/", "layout")

    return {
      success: true,
      bulletinId: result.bulletinId,
      telegramSent: result.telegramSent,
      telegramError: result.error,
    }
  } catch (err: any) {
    return { success: false, error: err?.message || "خطای ناشناخته" }
  }
}
```

### ۴.۳ صفحه

فایل جدید: `apps/web/src/app/[locale]/(admin)/admin/daily-price/page.tsx`

**رابط کاربری ساده و کاربردی:**

```
┌──────────────────────────────────────────────────────────┐
│  اعلام قیمت روز                           [تاریخ شمسی] │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ☐ سیمان تیپ ۲ تهران — کیسه ۵۰kg      [________] تومان │
│  ☐ سیمان تیپ ۲ اصفهان — کیسه ۵۰kg     [________] تومان │
│  ☐ سیمان سفید — کیسه ۵۰kg              [________] تومان │
│  ☐ سیمان پوزولانی — جامبوبگ            [________] تومان │
│  ... (لیست تمام محصولات فعال)                            │
│                                                          │
│  ☑ ارسال همزمان به کانال تلگرام                          │
│                                                          │
│  [    ثبت و انتشار قیمت روز    ]                         │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  📋 آخرین اعلام قیمت: ۱۷ شهریور ۱۴۰۵ — توسط: ادمین     │
│  سیمان تیپ ۲ تهران: ۹۵۰,۰۰۰ تومان                      │
│  سیمان تیپ ۲ اصفهان: ۸۸۰,۰۰۰ تومان                     │
└──────────────────────────────────────────────────────────┘
```

**نکات طراحی:**
1. لیست همه محصولات فعال نمایش داده می‌شود
2. هر محصول یک **checkbox** (برای انتخاب) + **input عددی** (برای قیمت) دارد
3. مقدار پیش‌فرض input: قیمت فعلی محصول (`product.price`)
4. فقط محصولاتی که checkbox‌شان فعال باشد ارسال می‌شوند
5. یک toggle برای «ارسال به کانال تلگرام» (پیش‌فرض: فعال)
6. بعد از ثبت: Toast موفقیت + نمایش خلاصه آخرین اعلام
7. اگر امروز قبلاً اعلام قیمت شده: نوار هشدار زرد «قیمت امروز قبلاً ثبت شده — ثبت جدید جایگزین می‌شود»
8. اعداد فارسی + جداکننده هزارگان در input (مثل `۹۵۰٬۰۰۰`)
9. CSS باید scoped باشد با prefix `dp-` (daily-price)

**کامپوننت client component:**
فایل: `apps/web/src/app/[locale]/(admin)/admin/daily-price/daily-price-form.tsx`

این فرم باید:
- محصولات را از props بگیرد
- state محلی: `selectedIds: Set<string>` و `prices: Record<string, string>`
- وقتی checkbox یک محصول زده می‌شود: اگر input قیمتش خالی بود، مقدار فعلی محصول را پر کند
- هنگام submit: فقط محصولات انتخاب‌شده + قیمت‌هایشان را بفرستد
- loading state هنگام submit
- نمایش نتیجه (موفقیت/خطا) با toast

---

## ۵. فاز ۴ — نوار اعلام قیمت (Price Ticker Bar)

### ۵.۱ کامپوننت سرور

فایل جدید: `apps/web/src/components/layout/price-ticker.tsx`

این یک **Server Component** است:

```ts
import { db } from "@tirajeh/database"
import { PriceTickerClient } from "./price-ticker-client"

export async function PriceTicker({ locale }: { locale: string }) {
  const bulletin = await db.dailyPriceBulletin.findFirst({
    where: { isActive: true },
    orderBy: { date: "desc" },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
        include: {
          product: {
            select: {
              id: true,
              nameFa: true,
              nameEn: true,
              slug: true,
              packagingType: true,
            },
          },
        },
      },
    },
  })

  if (!bulletin || bulletin.items.length === 0) return null

  const items = bulletin.items.map((item) => ({
    id: item.id,
    name: item.product?.nameFa ?? item.customName ?? "—",
    nameEn: item.product?.nameEn ?? item.customName ?? "—",
    price: Number(item.price),
    previousPrice: item.previousPrice ? Number(item.previousPrice) : null,
    slug: item.product?.slug ?? null,
    packaging: item.product?.packagingType ?? null,
  }))

  const jalaliDate = new Intl.DateTimeFormat("fa-IR", {
    year: "numeric", month: "long", day: "numeric",
    timeZone: "Asia/Tehran",
  }).format(bulletin.date)

  return (
    <PriceTickerClient
      items={items}
      date={jalaliDate}
      locale={locale}
    />
  )
}
```

### ۵.۲ کامپوننت کلاینت

فایل جدید: `apps/web/src/components/layout/price-ticker-client.tsx`

```
"use client"
```

**رفتار:**
- اگر تعداد آیتم‌ها ≤ ۴: نمایش ثابت مرکزی (`justify-content: center`)
- اگر > ۴: **marquee نرم** (CSS animation `@keyframes scroll-x` با `translateX`)
  - pause on hover
  - RTL-aware: در فارسی از راست به چپ اسکرول
  - duplicate items برای seamless loop
- هر آیتم یک کارت کوچک:
  - نام محصول (bold)
  - قیمت (با جداکننده هزارگان فارسی) + « تومان»
  - اگر `previousPrice` موجود بود و فرق داشت:
    - سبز + فلش بالا اگر کاهش یافته (↓ مشتری خوشحال)
    - قرمز + فلش بالا اگر افزایش یافته
    - درصد تغییر: `((new - old) / old * 100).toFixed(1)%`
  - لینک به صفحه محصول (اگر slug موجود)

**CSS (scoped با prefix `ptk-`):**
```css
.ptk-bar {
  width: 100%;
  background: var(--color-surface-elevated, #0a1628);
  border-bottom: 1px solid var(--color-border-subtle);
  overflow: hidden;
  height: 3rem;
  display: flex;
  align-items: center;
  position: relative;
  z-index: 50;
}

.ptk-track {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  white-space: nowrap;
  padding-inline: 1rem;
}

/* Static mode (few items) */
.ptk-track--static {
  justify-content: center;
  width: 100%;
}

/* Scroll mode (many items) */
.ptk-track--scroll {
  animation: ptk-scroll var(--ptk-duration, 30s) linear infinite;
}
.ptk-track--scroll:hover {
  animation-play-state: paused;
}

@keyframes ptk-scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

/* RTL override */
[dir="rtl"] .ptk-track--scroll {
  animation-name: ptk-scroll-rtl;
}
@keyframes ptk-scroll-rtl {
  0% { transform: translateX(0); }
  100% { transform: translateX(50%); }
}

.ptk-item {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-md);
  text-decoration: none;
  color: var(--color-text-on-dark, #e2e8f0);
  transition: background var(--transition-fast);
  font-size: 0.8125rem;
  flex-shrink: 0;
}
.ptk-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.ptk-name {
  font-weight: 600;
  color: var(--color-text-on-dark, #f1f5f9);
}

.ptk-price {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--color-accent-gold, #d4a853);
}

.ptk-change {
  font-size: 0.75rem;
  font-weight: 500;
}
.ptk-change--up { color: var(--color-danger, #ef4444); }
.ptk-change--down { color: var(--color-success, #22c55e); }

.ptk-date {
  font-size: 0.6875rem;
  color: var(--color-text-muted);
  padding-inline-end: 1rem;
  border-inline-end: 1px solid var(--color-border-subtle);
  margin-inline-end: 0.5rem;
  flex-shrink: 0;
}

/* Separator between items */
.ptk-sep {
  width: 1px;
  height: 1.25rem;
  background: var(--color-border-subtle);
  flex-shrink: 0;
}
```

**نکته مهم — ارتفاع ثابت و عدم اختلال در layout:**
- ارتفاع نوار دقیقاً `3rem` (48px) ثابت
- overflow: hidden — هیچ‌چیزی بیرون نمی‌زند
- اگر bulletin خالی باشد: کامپوننت `null` برمی‌گرداند و هیچ فضایی اشغال نمی‌کند

### ۵.۳ اضافه به Layout

فایل: `apps/web/src/components/layout/storefront-layout.tsx`

```tsx
import { Navbar } from "./navbar"
import { Footer } from "./footer"
import { CartDrawer } from "@/components/cart/cart-drawer"
import { PriceTicker } from "./price-ticker"
import { getLocale } from "next-intl/server"

interface StorefrontLayoutProps {
  children: React.ReactNode
}

export async function StorefrontLayout({ children }: StorefrontLayoutProps) {
  const locale = await getLocale()
  return (
    <>
      <PriceTicker locale={locale} />
      <Navbar />
      <main id="main-content" style={{ minHeight: "calc(100dvh - 4rem)" }}>
        {children}
      </main>
      <Footer />
      <CartDrawer />
    </>
  )
}
```

**توجه:** `StorefrontLayout` باید از sync client component به **async server component** تبدیل شود (حذف `SessionProvider` wrapper — آن را به `layout.tsx` منتقل کن اگر لازم است، یا `PriceTicker` را مستقیماً در `layout.tsx` بگذار نه اینجا). **قبل از تغییر حتماً `storefront-layout.tsx` و `layout.tsx` را بخوان و ببین `SessionProvider` کجا wrap شده و چه وابستگی‌هایی دارد.** اگر `StorefrontLayout` نمی‌تواند async شود، `PriceTicker` را مستقیماً در `app/[locale]/(storefront)/layout.tsx` قبل از `<StorefrontLayout>` بگذار.

---

## ۶. فاز ۵ — نمایش قیمت روز در صفحه محصول

فایل: `apps/web/src/app/[locale]/(storefront)/products/[slug]/page.tsx`

در صفحه جزئیات محصول، بخش قیمت را به‌روز کن:
- اگر `product.lastPriceUpdate` امروز باشد (تاریخ شمسی): یک badge سبز «قیمت به‌روز» کنار قیمت نمایش بده
- تاریخ آخرین بروزرسانی قیمت را به شمسی نمایش بده: «آخرین بروزرسانی قیمت: ۱۷ شهریور ۱۴۰۵»
- اگر `ProductPriceHistory` رکوردی برای امروز دارد: قیمت قبلی را خط‌خورده نمایش بده

**قبل از پیاده‌سازی حتماً `products/[slug]/page.tsx` را کامل بخوان** و بخش نمایش قیمت فعلی را پیدا کن.

---

## ۷. فاز ۶ — API Route برای revalidation (اختیاری)

فایل جدید: `apps/web/src/app/api/daily-price/route.ts`

یک GET endpoint ساده که آخرین اعلام قیمت فعال را برمی‌گرداند (برای مصارف آتی مثل widget خارجی):

```ts
import { getActiveDailyPriceBulletin } from "@tirajeh/integrations"
import { NextResponse } from "next/server"

export async function GET() {
  const bulletin = await getActiveDailyPriceBulletin()
  if (!bulletin) {
    return NextResponse.json({ items: [] })
  }
  return NextResponse.json({
    date: bulletin.date,
    items: bulletin.items.map((item) => ({
      name: item.product?.nameFa ?? item.customName,
      price: Number(item.price),
      previousPrice: item.previousPrice ? Number(item.previousPrice) : null,
    })),
  })
}

export const revalidate = 60
```

---

## ۸. چک‌لیست پذیرش نهایی

- [ ] `pnpm --filter @tirajeh/database prisma validate` بدون خطا
- [ ] `tsc --noEmit` در `apps/web` و `packages/integrations` بدون خطا
- [ ] هیچ Tailwind utility class جدیدی در `.tsx` های جدید نیست
- [ ] آیکون‌های lucide با `style={{width,height}}` نه className
- [ ] **پنل ادمین**: صفحه `/admin/daily-price` لیست محصولات را نمایش می‌دهد، می‌توان قیمت وارد کرد و ثبت نمود
- [ ] **ثبت از پنل**: بعد از ثبت، `Product.price` آپدیت شده، `ProductPriceHistory` رکورد جدید دارد، `DailyPriceBulletin` و `DailyPriceItem`ها ساخته شده‌اند
- [ ] **ارسال تلگرام از پنل**: اگر checkbox ارسال فعال باشد، پیام با فرمت صحیح (مشابه خروجی `/price`) به `TELEGRAM_CHANNEL_ID` ارسال شده
- [ ] **نوار اعلام قیمت**: در صفحه اصلی بالای navbar نمایش داده می‌شود با قیمت‌های امروز
- [ ] **نوار — ۲ محصول**: مرکزی، بدون اسکرول، متوازن
- [ ] **نوار — ۱۰ محصول**: اسکرول نرم marquee، pause on hover
- [ ] **نوار — بدون اعلام**: هیچ‌چیزی نمایش داده نمی‌شود (null)، layout بالا نمی‌پرد
- [ ] **همسازی تلگرام**: وقتی از ربات `/price` ثبت قیمت می‌شود، رکوردهای `DailyPriceBulletin` هم ساخته می‌شوند و نوار سایت آپدیت می‌شود
- [ ] **صفحه محصول**: تاریخ آخرین بروزرسانی قیمت نمایش داده می‌شود
- [ ] RTL/LTR: نوار در هر دو حالت صحیح کار می‌کند
- [ ] موبایل: نوار اعلام قیمت اسکرول‌پذیر و خوانا است
