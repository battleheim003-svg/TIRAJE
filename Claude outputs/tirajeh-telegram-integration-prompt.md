# پرامپت اجرایی برای Antigravity — یکپارچه‌سازی کانال/بات تلگرام با پروژه تیراژه

> این فایل را کامل کپی کن و به‌عنوان یک پرامپت واحد به Antigravity بده. مسیر پروژه: `E:\tiraje`. هر فاز را به ترتیب پیاده‌سازی کن، بعد از هر فاز `tsc --noEmit` و `prisma validate` را اجرا کن و فقط در صورت EXIT:0 به فاز بعد برو.

## ۰. خلاصه وضعیت فعلی (نتیجه بررسی کدبیس — قبل از هر تغییری این‌ها را verify کن)

- سرویس تلگرام فعلی در `packages/integrations/src/telegram/service.ts` فقط برای **نوتیفیکیشن داخلی به ادمین** است (سفارش جدید، استعلام قیمت، پرداخت) — از طریق صف Redis (`tg:send_queue`) و grammy. هیچ تابعی برای **پست در کانال عمومی** وجود ندارد.
- `packages/integrations/src/telegram/webhook.ts` هندلر وبهوک را می‌سازد اما فایل `apps/web/src/app/api/telegram/route.ts` که باید آن را mount کند **اصلاً وجود ندارد** — وبهوک الان به هیچ روتی وصل نیست.
- در `apps/web/src/actions/contact.ts` یک پیاده‌سازی تلگرام **دوم و جدا** با `fetch` مستقیم وجود دارد که از `TELEGRAM_CHAT_ID` استفاده می‌کند — این نام env var با `TELEGRAM_ADMIN_CHAT_ID` که در `.env.example` و در `service.ts` استفاده شده **یکی نیست** (باگ/ناهماهنگی). باید یکپارچه شود.
- مدل `Contact` در `schema.prisma` همین الان وجود دارد (`status: UNREAD/READ/REPLIED`) ولی: (۱) فیلد دسته‌بندی (category) ندارد، (۲) فیلد منبع (وبسایت/تلگرام) ندارد، (۳) هیچ صفحه‌ای در پنل ادمین برایش نیست — نه در `admin-nav.tsx` نه در `app/[locale]/(admin)/admin/`.
- مدل `TelegramLog` از قبل در schema هست (`entityType, entityId, channelId, telegramMessageId, status, errorMessage, sentAt`) و دقیقاً برای لاگ‌کردن پست‌های کانال (بلاگ/محصول) طراحی شده — **از همین مدل استفاده کن، مدل جدید نساز**.
- مسیر ثبت مقاله: `apps/web/src/actions/admin-blog.ts` → `adminCreatePostAction` / `adminUpdatePostAction`. مدل `Post` فیلد `featuredImage` (تک‌عکس پوستر)، `categoryId` (تک دسته)، و رابطه `postTags` (چند تگ) دارد.
- مسیر ثبت محصول: `apps/web/src/actions/admin-products.ts` → `adminCreateProductAction` / `adminUpdateProductAction`. عکس محصول در مدل جدای `ProductImage` است (`isPrimary` مشخص‌کننده عکس اصلی) — **قبل از پیاده‌سازی، `product-form.tsx` را باز کن و ببین آپلود عکس در همان فرم ایجاد اتفاق می‌افتد یا در مرحله جدا بعد از create** (این فایل به‌خاطر عمق مسیر برای من قابل خواندن نبود؛ خودت مستقیم چک کن: `apps/web/src/app/[locale]/(admin)/admin/products/product-form.tsx`).
- Label فارسی enum ها (`CementType`, `PackagingType`) از قبل در `apps/web/src/lib/cement.ts` هست (`CEMENT_TYPE_LABEL`, `PACKAGING_LABEL`) — برای ساخت هشتگ از همین‌ها استفاده کن، دوباره تعریف نکن.
- Redis از قبل در پروژه هست و در `service.ts` استفاده می‌شود (`REDIS_URL`) — برای state موقت ربات پشتیبانی از همین Redis استفاده کن.
- دیپلوی هدف Vercel/Liara و Next.js API Route است یعنی **سرورلس و stateless بین request ها** — هر state موقتی (مثل «کاربر در حال انتخاب دسته تیکت است») باید در Redis/DB ذخیره شود، نه در متغیر حافظه (in-memory Map کار نمی‌کند).
- دامنه سایت در جاهای مختلف ناهماهنگ استفاده شده: `webhook.ts` هارد-کد `https://tirajeh.ir` دارد، ولی seed و config اخیر برای `tirajeconcrete.com` است. برای این کار از یک env var واحد به اسم `SITE_URL` استفاده کن و در هر دو جا همان را بخوان (تصمیم نهایی دامنه با کاربر است، فعلاً فقط hardcode نکن).

## ۱. تصمیمات فنی پیش‌فرض (اگر با نظر کاربر فرق دارد قبل از اجرا هماهنگ کن)

1. برای پست‌های کانال (بلاگ/محصول) به‌جای لینک متنی در پایین پست، از **دکمه inline keyboard** استفاده می‌شود (`InlineKeyboard().url(...)`) — طبق خواسته کاربر. **توجه:** تلگرام به دکمه‌های inline رنگ‌بندی یا فونت سفارشی نمی‌دهد؛ ظاهر دکمه کاملاً دست کلاینت تلگرام (و تم روشن/تاریک کاربر) است. تنها چیزی که می‌توانیم برای «هماهنگی با روح پروژه» کنترل کنیم متن دکمه (با ایموجی مناسب) است، نه رنگ. این محدودیت را به کاربر هم گفته‌ام؛ در پیاده‌سازی دنبال رنگ نگرد.
2. کپشن عکس در تلگرام حداکثر **۱۰۲۴ کاراکتر** است (نه ۴۰۹۶ مثل پیام متنی). خلاصه/توضیح کلی باید با یک تابع `truncate()` به حداکثر ~۹۰۰ کاراکتر بریده شود تا جا برای هشتگ‌ها و فوتر بماند؛ توضیحات کامل همیشه فقط در سایت است (که با دکمه لینک می‌شود) — این دقیقاً همان چیزی است که کاربر خواسته.
3. برای «دسته‌بندی و بخش‌بندی بهتر» در تلگرام، پیشنهاد می‌شود علاوه بر هشتگ، یک **گروه پشتیبانی با حالت Forum/Topics** (نه کانال) برای تیکت‌ها ساخته شود — هر دسته تیکت (اکانت، استعلام قیمت، سایر) می‌تواند یک Topic مجزا باشد. اگر کاربر این را نمی‌خواهد، همان راه‌حل ساده‌تر (فقط ذخیره category در دیتابیس، بدون Topic واقعی تلگرام) کافی است — این را به‌صورت یک فلگ قابل خاموش/روشن کردن (`SUPPORT_USE_FORUM_TOPICS`) پیاده کن تا هزینه رفت‌وبرگشت نداشته باشد.
4. حالت ارسال به کانال: **خودکار و بلافاصله بعد از ثبت** — طبق خواسته کاربر، نه دستی. برای بلاگ فقط وقتی `status === "PUBLISHED"` ارسال شود (نه DRAFT/ARCHIVED). برای SCHEDULED، ارسال باید به‌محض رسیدن زمان `publishedAt` توسط یک cron مشابه `drainTelegramQueue` انجام شود (فاز ۲.۴). برای محصول، ارسال وقتی `isActive === true` **و** حداقل یک عکس (`ProductImage`) دارد.
5. اگر پستی/محصولی که قبلاً در کانال منتشر شده دوباره ویرایش شود، به‌جای پست تکراری، پیام قبلی در کانال با `editMessageCaption` / `editMessageMedia` آپدیت شود (با استفاده از `telegramMessageId` ذخیره‌شده در `TelegramLog`).

## ۲. فاز ۱ — Schema (Prisma)

فایل: `packages/database/prisma/schema.prisma`

۲.۱. اضافه‌کردن enum ها:
```prisma
enum ContactCategory {
  ACCOUNT_ISSUE
  PRICE_INQUIRY
  ORDER_ISSUE
  PRODUCT_INQUIRY
  TECHNICAL_ISSUE
  OTHER
}

enum ContactSource {
  WEBSITE
  TELEGRAM
}
```

۲.۲. گسترش مدل `Contact` (فیلدهای جدید، بدون حذف چیزی):
```prisma
model Contact {
  // ...فیلدهای موجود بدون تغییر...
  category         ContactCategory? 
  source           ContactSource    @default(WEBSITE)
  telegramChatId   String?          @map("telegram_chat_id")
  telegramUserId   String?          @map("telegram_user_id")
  telegramUsername String?          @map("telegram_username")

  @@index([source, status])
  @@index([category])
}
```

۲.۳. اجرا: `pnpm --filter @tirajeh/database prisma migrate dev --name add_telegram_support_ticket_fields` و سپس `pnpm --filter @tirajeh/database prisma generate`.

۲.۴. در `packages/shared/src/constants/permissions.ts` اضافه کن:
```ts
CONTACT_READ: "contact:read",
CONTACT_RESPOND: "contact:respond",
```
و در seed نقش‌ها (`packages/database/src/seed.ts`) این پرمیشن‌ها را به نقش‌های `super_admin` و `admin` وصل کن (همان الگوی پرمیشن‌های موجود مثل `POST_PUBLISH` را دنبال کن).

۲.۵. در `packages/shared/src/schemas/` یک فایل جدید `ticket.ts` بساز با Zod schema برای فیلتر/پاسخ تیکت (هم‌الگو با `contact.ts` و `quote.ts` موجود).

## ۳. فاز ۲ — لایه سرویس تلگرام

### ۲.۱ رفع ناهماهنگی env var
در `apps/web/src/actions/contact.ts` تابع `notifyTelegram` (fetch مستقیم با `TELEGRAM_CHAT_ID`) را **حذف کن** و به‌جایش از `enqueueTelegramMessage` در `@tirajeh/integrations` (همانی که در `service.ts` هست) با `TELEGRAM_ADMIN_CHAT_ID` استفاده کن. یک تابع جدید `notifyNewContact` در `service.ts` مشابه `notifyNewQuote` اضافه کن و از `contact.ts` صدایش بزن.

### ۲.۲ افزودن env vars جدید
در `.env.example` زیر بخش Telegram اضافه کن:
```
TELEGRAM_CHANNEL_ID=your_public_channel_numeric_id      # مثل -1001234567890
TELEGRAM_CHANNEL_USERNAME=@TirajehConcrete               # برای درج در پایین هر پست
TELEGRAM_SUPPORT_CHAT_ID=your_support_group_or_topic_id  # می‌تواند همان ADMIN_CHAT_ID باشد
SUPPORT_USE_FORUM_TOPICS=false
SITE_URL=https://tirajeconcrete.com
```
(چهار مقدار اول را کاربر باید بعد از ساخت کانال/گروه و افزودن بات به‌عنوان ادمین از تلگرام بگیرد — این کار دستی است، در پرامپت جداگانه راهنمای دریافت این مقادیر را هم بنویس: افزودن بات به کانال با نقش Administrator + دسترسی Post Messages، و گرفتن chat id عددی کانال با فوروارد یک پیام کانال به `@userinfobot` یا با `getUpdates`.)

### ۲.۳ ماژول هشتگ‌ساز — فایل جدید `packages/integrations/src/telegram/hashtags.ts`
```ts
/** نرمال‌سازی یک برچسب فارسی/انگلیسی به هشتگ معتبر تلگرام (بدون فاصله، بدون خط‌تیره) */
export function toHashtag(label: string): string {
  return (
    "#" +
    label
      .trim()
      .replace(/[\s\u200c\-–—]+/g, "_") // فاصله، نیم‌فاصله، خط‌تیره → آندرلاین
      .replace(/[^\p{L}\p{N}_]/gu, "")   // حذف هر کاراکتر غیرمجاز
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "")
  )
}

export function buildPostHashtags(params: { categoryFa?: string | null; tagFa: string[] }): string[] {
  const tags = ["#وبلاگ", "#تیراژه"]
  if (params.categoryFa) tags.push(toHashtag(params.categoryFa))
  for (const t of params.tagFa.slice(0, 4)) tags.push(toHashtag(t))
  return [...new Set(tags)]
}

export function buildProductHashtags(params: {
  categoriesFa: string[]
  brandFa?: string | null
  cementTypeLabelFa?: string | null
  packagingLabelFa?: string | null
}): string[] {
  const tags = ["#محصولات", "#تیراژه"]
  for (const c of params.categoriesFa.slice(0, 2)) tags.push(toHashtag(c))
  if (params.brandFa) tags.push(toHashtag(params.brandFa))
  if (params.cementTypeLabelFa) tags.push(toHashtag(params.cementTypeLabelFa))
  if (params.packagingLabelFa) tags.push(toHashtag(params.packagingLabelFa))
  return [...new Set(tags)]
}
```
(اسامی enum مثل `CEMENT_TYPE_LABEL[cementType].fa` را در سمت caller — یعنی `packages/integrations` نباید مستقیماً از `apps/web/src/lib/cement.ts` ایمپورت کند چون آن فایل داخل app است، نه package مشترک. یا این label map را از `apps/web/lib/cement.ts` به `packages/shared/src/constants/` منتقل کن تا هم UI هم integrations بتوانند استفاده کنند — **این جابه‌جایی را انجام بده**، از دوباره‌نویسی مقادیر پرهیز کن.)

### ۲.۴ توابع انتشار در کانال — اضافه به `packages/integrations/src/telegram/service.ts`
```ts
import { InlineKeyboard } from "grammy"

function truncateCaption(text: string, max = 900): string {
  return text.length <= max ? text : text.slice(0, max - 1).trimEnd() + "…"
}

function buildCaption(params: {
  emoji: string
  title: string
  body: string
  hashtags: string[]
  channelUsername: string
}): string {
  return [
    `${params.emoji} <b>${params.title}</b>`,
    "",
    truncateCaption(params.body),
    "",
    params.hashtags.join(" "),
    "",
    params.channelUsername,
  ].join("\n")
}

export async function publishPostToChannel(post: {
  id: string
  titleFa: string
  excerptFa: string | null
  featuredImage: string | null
  categoryFa?: string | null
  tagsFa: string[]
  slug: string
}): Promise<void> {
  // caption + InlineKeyboard().url("📖 مطالعه مقاله کامل", `${SITE_URL}/fa/blog/${post.slug}`)
  // اگر رکورد TelegramLog با entityType="post" و status="SENT" موجود بود → editMessageCaption/editMessageMedia
  // در غیر این‌صورت → bot.api.sendPhoto(channelId, featuredImage, {caption, parse_mode:"HTML", reply_markup})
  // نتیجه (موفق/خطا + telegramMessageId) را در جدول TelegramLog ثبت کن (entityType/entityId/channelId/status/telegramMessageId/errorMessage/sentAt)
}

export async function publishProductToChannel(product: {
  id: string
  nameFa: string
  descriptionFa: string | null
  primaryImageUrl: string | null
  price: number
  categoriesFa: string[]
  brandFa?: string | null
  cementTypeLabelFa?: string | null
  packagingLabelFa?: string | null
  slug: string
}): Promise<void> {
  // همان الگو، دکمه: "🛒 مشاهده و خرید محصول" → `${SITE_URL}/fa/products/${product.slug}`
  // اگر primaryImageUrl نبود، ارسال را رد کن و در TelegramLog با status="SKIPPED_NO_IMAGE" ثبت کن، throw نکن (نباید ثبت محصول را خراب کند)
}
```
هر دو تابع باید **خطا را قورت بدهند و لاگ کنند، نه throw** — چون این‌ها side-effect غیربحرانی بعد از یک عملیات دیتابیسی موفق‌اند و نباید تجربه ادمین را خراب کنند (دقیقاً مثل الگوی `void notifyTelegram(...)` که همین الان در `contact.ts` هست).

سپس در `packages/integrations/src/index.ts` این دو تابع را export کن.

### ۲.۵ Cron برای پست‌های زمان‌بندی‌شده
تابع جدید `publishScheduledPosts()` در `service.ts`: پست‌های `status=SCHEDULED` با `publishedAt <= now()` را پیدا کن، `status` را `PUBLISHED` کن و `publishPostToChannel` را صدا بزن. این را کنار `drainTelegramQueue` در همان cron/route موجود (هر جا `drainTelegramQueue` صدا زده می‌شود) اضافه کن.

## ۴. فاز ۳ — اتصال به اکشن‌های ادمین

### ۳.۱ بلاگ — `apps/web/src/actions/admin-blog.ts`
در `adminCreatePostAction` و `adminUpdatePostAction`، بعد از موفقیت `db.post.create`/`update`، اگر `status === "PUBLISHED"`:
```ts
if (status === "PUBLISHED") {
  const full = await db.post.findUnique({
    where: { id: post.id },
    include: { category: true, postTags: { include: { tag: true } } },
  })
  void publishPostToChannel({
    id: full.id,
    titleFa: full.titleFa,
    excerptFa: full.excerptFa,
    featuredImage: full.featuredImage,
    categoryFa: full.category?.nameFa ?? null,
    tagsFa: full.postTags.map(pt => pt.tag.nameFa),
    slug: full.slug,
  })
}
```
(fire-and-forget با `void`، مثل الگوی موجود در contact.ts — منتظرش نمان چون کاربر باید فوراً redirect شود.)

### ۳.۲ محصول — `apps/web/src/actions/admin-products.ts`
بعد از `db.product.create`/`update`، اگر `isActive === true`، محصول را با `include: { images: true, brand: true, productCategories: { include: { category: true } } }` دوباره بخوان، عکس `isPrimary` را پیدا کن، و `publishProductToChannel` را صدا بزن (همان الگوی fire-and-forget).

**نکته:** اگر آپلود عکس محصول در همان submit فرم اتفاق نمی‌افتد (بلکه بعد از create، در یک مرحله جدا)، این هوک را به همان اکشنی منتقل کن که عکس اول را ذخیره می‌کند، نه به `adminCreateProductAction` — قبل از پیاده‌سازی حتماً `product-form.tsx` را بخوان و جریان واقعی را تأیید کن.

## ۵. فاز ۴ — وبهوک و ربات پشتیبانی (تیکت)

### ۴.۱ ساخت روت webhook که وجود ندارد
فایل جدید: `apps/web/src/app/api/telegram/route.ts`
```ts
export { POST } from "@tirajeh/integrations/telegram/webhook"
export const runtime = "nodejs"
```

### ۴.۲ بازنویسی `packages/integrations/src/telegram/webhook.ts`
منطق فعلی (`bot.on("message:text")` که فقط اکو می‌کند) را با یک state machine مبتنی بر Redis جایگزین کن:

- `/start`, `/support` → پیام خوش‌آمد + `InlineKeyboard` با دکمه‌های دسته‌بندی تیکت (هر دکمه یک ردیف، callback_data مثل `ticket_cat:ACCOUNT_ISSUE`). دسته‌ها دقیقاً معادل `ContactCategory` enum:
  - 🔐 مشکل ورود/حساب کاربری → `ACCOUNT_ISSUE`
  - 💰 استعلام قیمت → `PRICE_INQUIRY`
  - 📦 پیگیری سفارش → `ORDER_ISSUE`
  - 🧱 سوال درباره محصول → `PRODUCT_INQUIRY`
  - ⚙️ مشکل فنی سایت → `TECHNICAL_ISSUE`
  - ❓ سایر موارد → `OTHER`
- `bot.on("callback_query:data")` با پیشوند `ticket_cat:` → دسته انتخابی را در Redis ذخیره کن: `SET tg:ticket_pending:{chatId} {category} EX 600` (۱۰ دقیقه انقضا)، و از کاربر بخواه توضیح مشکلش را تایپ کند. حتماً `ctx.answerCallbackQuery()` را صدا بزن.
- `bot.on("message:text")` → اول چک کن آیا `tg:ticket_pending:{chatId}` مقدار دارد:
  - اگر بله: یک رکورد `Contact` بساز (`source: "TELEGRAM"`, `category`, `telegramChatId: String(ctx.chat.id)`, `telegramUserId`, `telegramUsername`, `name: ctx.from.first_name + ' ' + (ctx.from.last_name ?? '')`, `subject`: برچسب فارسی دسته, `message: ctx.message.text`, `status: "UNREAD"`)، کلید Redis را پاک کن، به کاربر شماره/تأیید تیکت را برگردان، و `notifyNewContact` را صدا بزن تا ادمین در `TELEGRAM_ADMIN_CHAT_ID` مطلع شود.
  - اگر نه: پیام راهنمای فعلی («برای پشتیبانی /support را بزنید») را برگردان — چیزی را echo نکن.
- `bot.command("orders", ...)` را نگه دار ولی لینک هارد-کد `https://tirajeh.ir/...` را با `${process.env.SITE_URL}/account/orders` عوض کن.
- در ابتدای فایل (یا در یک اسکریپت deploy جدا) `bot.api.setMyCommands([...])` را برای منوی دستورات (`start`, `support`, `orders`) صدا بزن.

### ۴.۳ (اختیاری، پشت فلگ `SUPPORT_USE_FORUM_TOPICS`)
اگر فلگ روشن بود، هنگام ساخت تیکت به‌جای پیام ساده در `TELEGRAM_SUPPORT_CHAT_ID`، با `bot.api.createForumTopic` یک تاپیک به نام دسته‌بندی (اگر از قبل نساخته) بساز/پیدا کن و پیام تیکت را با `message_thread_id` همان تاپیک بفرست — این یعنی هر دسته پشتیبانی عملاً یک زیرگروه مجزا و مرتب در همان گروه است.

## ۶. فاز ۵ — پنل ادمین: بخش تیکت‌ها

### ۵.۱ ناوبری
در `apps/web/src/app/[locale]/(admin)/admin/admin-nav.tsx` یک آیتم جدید اضافه کن (آیکون `Headset` یا `LifeBuoy` از lucide-react):
```ts
{ key: "tickets", href: "/admin/tickets", icon: LifeBuoy, fa: "تیکت‌های پشتیبانی", en: "Support Tickets" },
```

### ۵.۲ اکشن‌ها
فایل جدید `apps/web/src/actions/admin-tickets.ts` هم‌الگو با `admin-quotes.ts` (نه blog/products — چون تیکت به order/quote نزدیک‌تر است): `listTicketsAction` (فیلتر بر اساس status/category/source)، `adminReplyTicketAction` (آپدیت `Contact.status=REPLIED`, `replyText`, `repliedAt`, `handlerId`؛ اگر `source === "TELEGRAM"` علاوه‌براین `bot.api.sendMessage(telegramChatId, replyText)` را هم صدا بزن — تلگرام برخلاف واتس‌اپ محدودیت ۲۴ ساعته برای پاسخ به کاربرانی که با بات چت کرده‌اند ندارد).

### ۵.۳ صفحات
`app/[locale]/(admin)/admin/tickets/page.tsx` (لیست + فیلتر دسته/وضعیت/منبع، هم‌الگو با `admin/quotes/page.tsx`) و `app/[locale]/(admin)/admin/tickets/[id]/page.tsx` (جزئیات + فرم پاسخ).

## ۷. چک‌لیست پذیرش نهایی (قبل از تحویل)

- [x] `pnpm --filter @tirajeh/database prisma validate` بدون خطا
- [x] `tsc --noEmit` در `apps/web` و `packages/integrations` بدون خطا
- [x] هیچ Tailwind utility class جدیدی در `.tsx` های جدید نیست؛ فقط CSS با design token ها (طبق قوانین پروژه)
- [x] آیکون‌های lucide با `style={{width,height}}` نه className
- [x] یک پست بلاگ تستی با `status=PUBLISHED` می‌سازی و پیام واقعی (با عکس، کپشن، دکمه، هشتگ) در کانال تست ظاهر می‌شود و در `TelegramLog` رکورد `SENT` ثبت می‌شود
- [x] یک محصول تستی با عکس و `isActive=true` می‌سازی و همان رفتار تکرار می‌شود
- [x] ویرایش همان پست/محصول → پیام کانال ادیت می‌شود، پست جدید ساخته نمی‌شود
- [x] از تلگرام `/support` می‌زنی → دسته انتخاب می‌کنی → پیام می‌فرستی → رکورد `Contact` با `source=TELEGRAM` و `category` درست در دیتابیس ساخته می‌شود و پیام به `TELEGRAM_ADMIN_CHAT_ID` می‌رود
- [x] از پنل ادمین `/admin/tickets` تیکت بالا را می‌بینی و پاسخ می‌دهی → پیام در تلگرام کاربر دریافت می‌شود و status به `REPLIED` تغییر می‌کند
- [x] کپشن هیچ پستی از ۱۰۲۴ کاراکتر رد نمی‌شود (تست با یک `descriptionFa` خیلی بلند)
