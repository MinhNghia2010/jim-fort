import assert from "node:assert/strict"
import test from "node:test"

import { buildCsv, escapeCsvCell } from "../lib/csv.js"

test("escapeCsvCell leaves simple values unchanged", () => {
  assert.equal(escapeCsvCell("Active"), "Active")
  assert.equal(escapeCsvCell(1200), "1200")
})

test("escapeCsvCell quotes commas, quotes, and newlines", () => {
  assert.equal(escapeCsvCell("Smith, John"), '"Smith, John"')
  assert.equal(escapeCsvCell('Say "hi"'), '"Say ""hi"""')
  assert.equal(escapeCsvCell("Line 1\nLine 2"), '"Line 1\nLine 2"')
})

test("buildCsv writes headers and rows", () => {
  const csv = buildCsv(
    [
      { name: "Ava", status: "active", revenue: 100 },
      { name: "Bo, Jr.", status: "cancelled", revenue: 0 },
    ],
    [
      { header: "Name", value: (row) => row.name },
      { header: "Status", value: (row) => row.status },
      { header: "Revenue", value: (row) => row.revenue },
    ]
  )

  assert.equal(
    csv,
    ['Name,Status,Revenue', 'Ava,active,100', '"Bo, Jr.",cancelled,0'].join(
      "\n"
    )
  )
})
