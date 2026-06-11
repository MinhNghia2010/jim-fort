import assert from "node:assert/strict"
import test from "node:test"

import {
  cancellablePlanStatuses,
  isCancellablePlanStatus,
} from "../lib/features/owner/members/cancel-plan.js"

test("cancellation statuses stay aligned", () => {
  assert.deepEqual(cancellablePlanStatuses, [
    "active",
    "pending_payment",
    "pending_pt_setup",
  ])
})

test("only active and pending plans can be cancelled", () => {
  assert.equal(isCancellablePlanStatus("active"), true)
  assert.equal(isCancellablePlanStatus("pending_payment"), true)
  assert.equal(isCancellablePlanStatus("pending_pt_setup"), true)
  assert.equal(isCancellablePlanStatus("expired"), false)
  assert.equal(isCancellablePlanStatus("cancelled"), false)
})
