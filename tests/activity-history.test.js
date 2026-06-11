import assert from "node:assert/strict"
import test from "node:test"

import { isPastOrCurrentActivityDate } from "../lib/features/shared/activity-history.js"

test("activity history dates only include valid past or current values", () => {
  const now = new Date("2026-06-11T12:00:00.000Z")

  assert.equal(isPastOrCurrentActivityDate(null, now), false)
  assert.equal(isPastOrCurrentActivityDate("", now), false)
  assert.equal(isPastOrCurrentActivityDate("not-a-date", now), false)
  assert.equal(
    isPastOrCurrentActivityDate("2026-06-10T12:00:00.000Z", now),
    true
  )
  assert.equal(
    isPastOrCurrentActivityDate("2026-06-11T12:00:00.000Z", now),
    true
  )
  assert.equal(
    isPastOrCurrentActivityDate("2026-06-12T12:00:00.000Z", now),
    false
  )
})
