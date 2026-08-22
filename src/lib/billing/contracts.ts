export type Money = {
  currency: "CNY";
  amountFen: number;
};

export type OneTimeOrderStatus = "pending" | "paid" | "expired" | "cancelled" | "refunded";

export type OneTimeOrder = {
  id: string;
  toolSlug: string;
  amount: Money;
  status: OneTimeOrderStatus;
  createdAt: string;
};

export type CheckoutRequest = {
  order: OneTimeOrder;
  returnUrl: string;
  notifyUrl: string;
};

export type CheckoutSession = {
  providerOrderId: string;
  paymentUrl: string;
  expiresAt: string;
};

export type PaymentNotification = {
  providerOrderId: string;
  paidAt: string;
  rawPayload: string;
  signature: string;
};

export interface OneTimePaymentProvider {
  createCheckout(request: CheckoutRequest): Promise<CheckoutSession>;
  verifyNotification(notification: PaymentNotification): Promise<{ valid: boolean; providerOrderId: string }>;
  closeCheckout(providerOrderId: string): Promise<void>;
}

export function validateMoney(money: Money): Money {
  if (!Number.isSafeInteger(money.amountFen) || money.amountFen < 1) {
    throw new Error("Payment amount must be a positive integer number of fen.");
  }
  return money;
}
