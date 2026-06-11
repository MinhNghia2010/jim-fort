export function toMoneyNumber(value) {
  const numberValue = Number(value ?? 0)

  return Number.isFinite(numberValue) ? numberValue : 0
}

export function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function toPositiveInteger(value) {
  const numberValue = Number(value ?? 1)

  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    return 1
  }

  return numberValue
}

export function calculateVoucherDiscount(voucher, basePriceValue) {
  const basePrice = toMoneyNumber(basePriceValue)

  if (!voucher || basePrice <= 0) {
    return 0
  }

  if (voucher.discount_type === "percentage") {
    const percentage = Math.min(
      100,
      Math.max(0, toMoneyNumber(voucher.percentage))
    )

    return Math.min(basePrice, roundMoney((basePrice * percentage) / 100))
  }

  if (voucher.discount_type === "amount") {
    return Math.min(basePrice, roundMoney(toMoneyNumber(voucher.amount)))
  }

  return 0
}

export function getVoucherAvailabilityError(
  voucher,
  redemptionCount,
  now = new Date()
) {
  if (!voucher) {
    return "Voucher is unavailable or cannot be used here."
  }

  if (voucher.status !== "active") {
    return "This voucher is not active."
  }

  if (voucher.starts_at && new Date(voucher.starts_at) > now) {
    return "This voucher is not active yet."
  }

  if (voucher.expires_at && new Date(voucher.expires_at) <= now) {
    return "This voucher has expired."
  }

  if (redemptionCount >= toPositiveInteger(voucher.max_redemptions)) {
    return "This voucher has reached its redemption limit."
  }

  return null
}
