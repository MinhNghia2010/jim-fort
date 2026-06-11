import assert from "node:assert/strict"
import test from "node:test"

import {
  calculateVoucherDiscount,
  getVoucherAvailabilityError,
  toPositiveInteger,
} from "../lib/features/member/subscriptions/voucher.js"

test("calculateVoucherDiscount applies percentage discounts", () => {
  assert.equal(
    calculateVoucherDiscount(
      { discount_type: "percentage", percentage: 15, amount: null },
      200
    ),
    30
  )
})

test("calculateVoucherDiscount caps amount discounts at the base price", () => {
  assert.equal(
    calculateVoucherDiscount(
      { discount_type: "amount", percentage: null, amount: 500 },
      120
    ),
    120
  )
})

test("toPositiveInteger falls back for invalid quantities", () => {
  assert.equal(toPositiveInteger(10), 10)
  assert.equal(toPositiveInteger("3"), 3)
  assert.equal(toPositiveInteger(0), 1)
  assert.equal(toPositiveInteger("bad"), 1)
})

test("getVoucherAvailabilityError rejects unusable vouchers", () => {
  const now = new Date("2026-06-11T12:00:00.000Z")
  const baseVoucher = {
    status: "active",
    starts_at: "2026-06-01T00:00:00.000Z",
    expires_at: "2026-07-01T00:00:00.000Z",
    max_redemptions: 2,
  }

  assert.equal(getVoucherAvailabilityError(baseVoucher, 1, now), null)
  assert.equal(
    getVoucherAvailabilityError({ ...baseVoucher, status: "disabled" }, 1, now),
    "This voucher is not active."
  )
  assert.equal(
    getVoucherAvailabilityError(
      { ...baseVoucher, starts_at: "2026-06-12T00:00:00.000Z" },
      1,
      now
    ),
    "This voucher is not active yet."
  )
  assert.equal(
    getVoucherAvailabilityError(
      { ...baseVoucher, expires_at: "2026-06-10T00:00:00.000Z" },
      1,
      now
    ),
    "This voucher has expired."
  )
  assert.equal(
    getVoucherAvailabilityError(baseVoucher, 2, now),
    "This voucher has reached its redemption limit."
  )
})
