import { createClient } from "@/lib/supabase/server"

export interface PaymentDetailData {
  id: string
  amount: number
  method: string | null
  status: string
  paidAt: string | null
  createdAt: string
  updatedAt: string | null
  payerName: string | null
  payerPhone: string | null
  cardholderName: string | null
  cardLastFour: string | null
  cardExpiry: string | null
  subscription: {
    id: string
    status: string
    plan: string
    facility: string
    startsAt: string | null
    expiresAt: string | null
    createdAt: string
    finalPrice: number
  } | null
}

type PaymentRecord = {
  id: string
  amount: number | string
  method: string | null
  status: string
  paid_at: string | null
  created_at: string
  updated_at: string | null
  payer_name: string | null
  payer_phone: string | null
  cardholder_name: string | null
  card_last_four: string | null
  card_expiry: string | null
  membership_subscriptions: {
    id: string
    status: string
    starts_at: string | null
    expires_at: string | null
    created_at: string
    final_price: number | string
    membership_packages: { name: string | null } | null
    gym_facilities: { name: string | null } | null
  } | null
}

function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0) || 0
}

export async function getPaymentDetailData(
  paymentId: string
): Promise<PaymentDetailData | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("membership_payments")
    .select(
      `
        id,
        amount,
        method,
        status,
        paid_at,
        created_at,
        updated_at,
        payer_name,
        payer_phone,
        cardholder_name,
        card_last_four,
        card_expiry,
        membership_subscriptions(
          id,
          status,
          starts_at,
          expires_at,
          created_at,
          final_price,
          membership_packages(name),
          gym_facilities(name)
        )
      `
    )
    .eq("id", paymentId)
    .maybeSingle()

  if (error) {
    throw new Error(`Unable to load payment: ${error.message}`)
  }

  const payment = data as unknown as PaymentRecord | null

  if (!payment) {
    return null
  }

  return {
    id: payment.id,
    amount: toNumber(payment.amount),
    method: payment.method,
    status: payment.status,
    paidAt: payment.paid_at,
    createdAt: payment.created_at,
    updatedAt: payment.updated_at,
    payerName: payment.payer_name,
    payerPhone: payment.payer_phone,
    cardholderName: payment.cardholder_name,
    cardLastFour: payment.card_last_four,
    cardExpiry: payment.card_expiry,
    subscription: payment.membership_subscriptions
      ? {
          id: payment.membership_subscriptions.id,
          status: payment.membership_subscriptions.status,
          plan:
            payment.membership_subscriptions.membership_packages?.name ??
            "Membership",
          facility:
            payment.membership_subscriptions.gym_facilities?.name ?? "Facility",
          startsAt: payment.membership_subscriptions.starts_at,
          expiresAt: payment.membership_subscriptions.expires_at,
          createdAt: payment.membership_subscriptions.created_at,
          finalPrice: toNumber(payment.membership_subscriptions.final_price),
        }
      : null,
  }
}
