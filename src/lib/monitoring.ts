type LogContext = Record<string, unknown>;

export function logCheckoutIssue(message: string, context: LogContext = {}) {
  console.error(`[checkout] ${message}`, context);
}

export function logWebhookIssue(message: string, context: LogContext = {}) {
  console.error(`[paystack-webhook] ${message}`, context);
}
