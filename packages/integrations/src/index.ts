// Payment
export type { PaymentGatewayAdapter, PaymentInitResult, PaymentVerifyResult } from "./payment/types"
export { ZarinpalAdapter, getZarinpalAdapter } from "./payment/zarinpal"
export { PaymentService, paymentService } from "./payment/service"

// Email
export { EmailService, emailService } from "./email/service"
export { OrderConfirmEmail, QuoteResponseEmail, WelcomeEmail } from "./email/templates"

// Telegram
export {
  enqueueTelegramMessage,
  drainTelegramQueue,
  notifyNewOrder,
  notifyNewQuote,
  notifyPaymentReceived,
  notifyNewContact,
  publishPostToChannel,
  publishProductToChannel,
  publishScheduledPosts,
  sendTelegramDirectMessage,
} from "./telegram/service"
export { POST as telegramWebhookHandler } from "./telegram/webhook"
export { publishDailyPrice, getActiveDailyPriceBulletin } from "./telegram/daily-price-service"

// Storage
export { StorageService, storageService } from "./storage/service"

// Search — SQL file imported as string via ?raw bundler convention
// consumers: import ftsSQL from "@tirajeh/integrations/search/fts-migration.sql?raw"
