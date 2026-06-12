import { createHash } from "node:crypto"
import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { createClient } from "@supabase/supabase-js"

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDirectory, "..")
const seedPassword = process.env.SEED_DEMO_PASSWORD || "SeedDemo123!"
const historyMonths = 12

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return
  }

  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue
    }

    const separatorIndex = trimmed.indexOf("=")
    const key = trimmed.slice(0, separatorIndex).trim()
    const value = trimmed
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "")

    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}

loadEnvFile(path.join(projectRoot, ".env.local"))
loadEnvFile(path.join(projectRoot, ".env"))

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !publishableKey || !serviceRoleKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, and SUPABASE_SERVICE_ROLE_KEY are required."
  )
}

const projectRef = new URL(supabaseUrl).hostname.split(".")[0]

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

function getManagementAccessToken() {
  if (process.env.SUPABASE_ACCESS_TOKEN) {
    return process.env.SUPABASE_ACCESS_TOKEN
  }

  if (process.platform !== "darwin") {
    throw new Error(
      "SUPABASE_ACCESS_TOKEN is required to seed Data API-protected tables."
    )
  }

  const keychainValue = execFileSync(
    "security",
    ["find-generic-password", "-s", "Supabase CLI", "-a", "supabase", "-w"],
    { encoding: "utf8" }
  ).trim()
  const encodedPrefix = "go-keyring-base64:"

  return keychainValue.startsWith(encodedPrefix)
    ? Buffer.from(keychainValue.slice(encodedPrefix.length), "base64").toString(
        "utf8"
      )
    : keychainValue
}

let managementAccessToken

async function runDatabaseQuery(query) {
  managementAccessToken ??= getManagementAccessToken()
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${managementAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    }
  )
  const responseText = await response.text()

  if (!response.ok) {
    throw new Error(
      `Database query failed (${response.status}): ${responseText}`
    )
  }

  return responseText ? JSON.parse(responseText) : []
}

function quoteIdentifier(value) {
  return `"${String(value).replaceAll('"', '""')}"`
}

function sqlLiteral(value) {
  if (value === null || value === undefined) {
    return "null"
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error(`Cannot seed non-finite number: ${value}`)
    }

    return String(value)
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false"
  }

  return `'${String(value).replaceAll("'", "''")}'`
}

async function sqlUpsertRows(table, rows, conflictColumns) {
  if (!rows.length) {
    return
  }

  for (const rowsChunk of chunk(rows, 100)) {
    const columns = Object.keys(rowsChunk[0])
    const conflictSet = new Set(conflictColumns)
    const updateColumns = columns.filter((column) => !conflictSet.has(column))
    const values = rowsChunk
      .map(
        (row) =>
          `(${columns.map((column) => sqlLiteral(row[column])).join(", ")})`
      )
      .join(",\n")
    const conflictAction = updateColumns.length
      ? `do update set ${updateColumns
          .map(
            (column) =>
              `${quoteIdentifier(column)} = excluded.${quoteIdentifier(column)}`
          )
          .join(", ")}`
      : "do nothing"
    const query = `
      insert into public.${quoteIdentifier(table)}
        (${columns.map(quoteIdentifier).join(", ")})
      values
        ${values}
      on conflict (${conflictColumns.map(quoteIdentifier).join(", ")})
      ${conflictAction};
    `

    await runDatabaseQuery(query)
  }
}

async function sqlInsertRowsDoNothing(table, rows, conflictColumns) {
  if (!rows.length) {
    return
  }

  for (const rowsChunk of chunk(rows, 100)) {
    const columns = Object.keys(rowsChunk[0])
    const values = rowsChunk
      .map(
        (row) =>
          `(${columns.map((column) => sqlLiteral(row[column])).join(", ")})`
      )
      .join(",\n")
    const query = `
      insert into public.${quoteIdentifier(table)}
        (${columns.map(quoteIdentifier).join(", ")})
      values
        ${values}
      on conflict (${conflictColumns.map(quoteIdentifier).join(", ")})
      do nothing;
    `

    await runDatabaseQuery(query)
  }
}

function seededUuid(key) {
  const bytes = createHash("sha256")
    .update(`jim-fort:${key}`)
    .digest()
    .subarray(0, 16)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = bytes.toString("hex")

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join("-")
}

function assertResult(label, result) {
  if (result.error) {
    throw new Error(`${label}: ${result.error.message}`)
  }

  return result.data
}

function chunk(values, size = 100) {
  const chunks = []

  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size))
  }

  return chunks
}

async function upsertRows(client, table, rows, options = {}) {
  if (!rows.length) {
    return []
  }

  const returnedRows = []

  for (const rowsChunk of chunk(rows)) {
    const query = client.from(table).upsert(rowsChunk, options)
    const result = options.select
      ? await query.select(options.select)
      : await query

    if (
      result.error?.code === "42501" &&
      options.onConflict &&
      !options.select
    ) {
      await sqlUpsertRows(table, rowsChunk, options.onConflict.split(","))
      continue
    }

    const data = assertResult(`Upsert ${table}`, result)

    if (Array.isArray(data)) {
      returnedRows.push(...data)
    }
  }

  return returnedRows
}

async function getMissingRowsById(client, table, rows) {
  if (!rows.length) {
    return []
  }

  const existingIds = new Set()

  for (const rowsChunk of chunk(rows, 100)) {
    const result = await client
      .from(table)
      .select("id")
      .in(
        "id",
        rowsChunk.map((row) => row.id)
      )
    const data = assertResult(`Check existing ${table}`, result) ?? []

    for (const row of data) {
      existingIds.add(row.id)
    }
  }

  return rows.filter((row) => !existingIds.has(row.id))
}

function startOfMonth(date, monthOffset) {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth() + monthOffset,
      1,
      0,
      0,
      0
    )
  )
}

function dateInMonth(monthStart, day, hour = 3, minute = 0) {
  return new Date(
    Date.UTC(
      monthStart.getUTCFullYear(),
      monthStart.getUTCMonth(),
      day,
      hour,
      minute,
      0
    )
  )
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}

function isoDate(date) {
  return date.toISOString().slice(0, 10)
}

function monthKey(date) {
  return date.toISOString().slice(0, 7)
}

async function listAllAuthUsers() {
  const users = []

  for (let page = 1; ; page += 1) {
    const result = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    const pageUsers = assertResult("List auth users", result)?.users ?? []
    users.push(...pageUsers)

    if (pageUsers.length < 1000) {
      break
    }
  }

  return users
}

async function ensureLoginUser({
  email,
  fullName,
  phone,
  role,
  existingUsersByEmail,
  createdAt,
}) {
  const normalizedEmail = email.toLowerCase()
  let authUser = existingUsersByEmail.get(normalizedEmail)

  if (!authUser) {
    const result = await admin.auth.admin.createUser({
      email: normalizedEmail,
      password: seedPassword,
      email_confirm: true,
      app_metadata: { app_role: role },
      user_metadata: {
        full_name: fullName,
        phone,
        role,
      },
    })
    authUser = assertResult(`Create auth user ${normalizedEmail}`, result)?.user

    if (!authUser) {
      throw new Error(`Create auth user ${normalizedEmail}: no user returned`)
    }

    existingUsersByEmail.set(normalizedEmail, authUser)
  } else {
    const result = await admin.auth.admin.updateUserById(authUser.id, {
      email: normalizedEmail,
      password: seedPassword,
      email_confirm: true,
      app_metadata: { app_role: role },
      user_metadata: {
        full_name: fullName,
        phone,
        role,
      },
    })
    authUser = assertResult(`Update auth user ${normalizedEmail}`, result)?.user
  }

  const accountRows = await upsertRows(
    admin,
    "accounts",
    [
      {
        id: seededUuid(`account:${normalizedEmail}`),
        email: normalizedEmail,
        password_hash: `supabase-auth:${authUser.id}`,
        status: "active",
        created_at: createdAt,
        updated_at: new Date().toISOString(),
      },
    ],
    { onConflict: "email", select: "id" }
  )
  const accountId = accountRows[0]?.id

  if (!accountId) {
    throw new Error(`Create account ${normalizedEmail}: no account returned`)
  }

  await upsertRows(
    admin,
    "users",
    [
      {
        id: authUser.id,
        account_id: accountId,
        full_name: fullName,
        phone,
        avatar_url: null,
        role,
        created_at: createdAt,
        updated_at: new Date().toISOString(),
      },
    ],
    { onConflict: "id" }
  )

  return {
    id: authUser.id,
    email: normalizedEmail,
    fullName,
    phone,
    role,
  }
}

async function createAuthenticatedClient(email) {
  const client = createClient(supabaseUrl, publishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
  const result = await client.auth.signInWithPassword({
    email,
    password: seedPassword,
  })
  assertResult(`Sign in ${email}`, result)

  return client
}

function buildWorkspaceDefinition(index) {
  const facilityNames = [
    "Jim Fort Riverside",
    "Jim Fort Midtown",
    "Jim Fort Westlake",
  ]
  const addresses = [
    "18 Ton Duc Thang, District 1, Ho Chi Minh City",
    "72 Nguyen Thi Minh Khai, District 3, Ho Chi Minh City",
    "105 Xuan Dieu, Tay Ho, Hanoi",
  ]

  return {
    index,
    ownerEmail: `jimfort.owner${index}.seed@example.com`,
    ownerName: `Seed Owner ${index}`,
    managerEmail: `jimfort.manager${index}.seed@example.com`,
    managerName: `Seed Manager ${index}`,
    ptEmails: [1, 2].map(
      (ptIndex) => `jimfort.pt${index}${ptIndex}.seed@example.com`
    ),
    memberEmails: Array.from(
      { length: 10 },
      (_, memberIndex) =>
        `jimfort.member${index}.${String(memberIndex + 1).padStart(2, "0")}.seed@example.com`
    ),
    facility: {
      id: seededUuid(`facility:${index}`),
      name: facilityNames[index - 1],
      address: addresses[index - 1],
      phone: `0287300${index}00`,
      description: `Seeded owner workspace ${index} with twelve months of operating history.`,
    },
  }
}

async function seedWorkspace(definition, existingUsersByEmail, months, now) {
  const seedStartedAt = months[0].toISOString()
  const staffPhonePrefix = `090${definition.index}`
  const loginPhonePrefix = `098${definition.index}`
  const memberPhonePrefix = `097${definition.index}`
  const owner = await ensureLoginUser({
    email: definition.ownerEmail,
    fullName: definition.ownerName,
    phone: `${loginPhonePrefix}000001`,
    role: "owner",
    existingUsersByEmail,
    createdAt: seedStartedAt,
  })
  const manager = await ensureLoginUser({
    email: definition.managerEmail,
    fullName: definition.managerName,
    phone: `${loginPhonePrefix}000002`,
    role: "manager",
    existingUsersByEmail,
    createdAt: seedStartedAt,
  })
  const pts = []

  for (let ptIndex = 0; ptIndex < definition.ptEmails.length; ptIndex += 1) {
    pts.push(
      await ensureLoginUser({
        email: definition.ptEmails[ptIndex],
        fullName: `Seed Trainer ${definition.index}-${ptIndex + 1}`,
        phone: `${loginPhonePrefix}00001${ptIndex + 1}`,
        role: "pt",
        existingUsersByEmail,
        createdAt: seedStartedAt,
      })
    )
  }

  const members = []

  for (
    let memberIndex = 0;
    memberIndex < definition.memberEmails.length;
    memberIndex += 1
  ) {
    members.push(
      await ensureLoginUser({
        email: definition.memberEmails[memberIndex],
        fullName: `Seed Member ${definition.index}-${String(memberIndex + 1).padStart(2, "0")}`,
        phone: `${memberPhonePrefix}${String(memberIndex + 1).padStart(6, "0")}`,
        role: "member",
        existingUsersByEmail,
        createdAt: dateInMonth(
          months[memberIndex % months.length],
          2
        ).toISOString(),
      })
    )
  }

  const facility = {
    ...definition.facility,
    owner_id: owner.id,
    created_at: seedStartedAt,
    updated_at: now.toISOString(),
  }

  await sqlUpsertRows("gym_facilities", [facility], ["id"])
  await upsertRows(
    admin,
    "facility_managers",
    [
      {
        facility_id: facility.id,
        manager_id: manager.id,
        created_at: seedStartedAt,
      },
    ],
    { onConflict: "facility_id,manager_id" }
  )
  await upsertRows(
    admin,
    "facility_pts",
    pts.map((pt) => ({
      facility_id: facility.id,
      pt_id: pt.id,
      assigned_by_manager_id: manager.id,
      created_at: seedStartedAt,
    })),
    { onConflict: "facility_id,pt_id" }
  )

  await upsertRows(
    admin,
    "staffs",
    ["Front Desk", "Operations", "Cleaner", "Security"].map(
      (role, staffIndex) => ({
        id: seededUuid(`staff:${definition.index}:${staffIndex}`),
        facility_id: facility.id,
        full_name: `${role} Staff ${definition.index}`,
        phone: `${staffPhonePrefix}0001${String(staffIndex + 1).padStart(2, "0")}`,
        avatar_url: null,
        role: role.toLowerCase(),
        note: "Historical demo staff record.",
        status: staffIndex === 3 ? "on_leave" : "active",
        hired_at: isoDate(addDays(months[0], staffIndex * 14)),
        created_at: seedStartedAt,
        updated_at: now.toISOString(),
      })
    ),
    { onConflict: "id" }
  )

  const ownerClient = await createAuthenticatedClient(owner.email)
  const roomDefinitions = [
    ["Strength Floor", "Free weights, racks, and strength machines."],
    ["Cardio Studio", "Treadmills, bikes, and rowing equipment."],
    ["Functional Zone", "Open training area for mobility and PT sessions."],
  ]
  const rooms = roomDefinitions.map(([name, description], roomIndex) => ({
    id: seededUuid(`room:${definition.index}:${roomIndex}`),
    facility_id: facility.id,
    name,
    description,
    status: "active",
    created_at: seedStartedAt,
    updated_at: now.toISOString(),
  }))

  await sqlUpsertRows("rooms", rooms, ["id"])

  const equipmentTemplates = [
    ["Power Rack", "Strength", "Iron Forge", "PR-900", 2800],
    ["Adjustable Bench", "Strength", "Iron Forge", "AB-400", 850],
    ["Cable Crossover", "Strength", "Motion Pro", "CC-2", 3600],
    ["Treadmill", "Cardio", "RunTech", "T8", 4200],
    ["Air Bike", "Cardio", "Pulse", "AB-X", 1600],
    ["Rowing Machine", "Cardio", "WaterRow", "WR-5", 2100],
    ["Kettlebell Set", "Functional", "CoreLab", "KB-SET", 950],
    ["Battle Ropes", "Functional", "CoreLab", "BR-15", 320],
    ["Sled Track", "Functional", "Motion Pro", "SL-20", 1300],
  ]
  const equipment = equipmentTemplates.map(
    ([name, category, brand, model, price], equipmentIndex) => {
      const purchaseMonth = months[equipmentIndex % months.length]
      const status =
        equipmentIndex === 4
          ? "maintenance"
          : equipmentIndex === 7
            ? "broken"
            : "active"

      return {
        id: seededUuid(`equipment:${definition.index}:${equipmentIndex}`),
        facility_id: facility.id,
        room_id: rooms[Math.floor(equipmentIndex / 3)].id,
        name,
        category,
        equipment_code: `SEED-${definition.index}-${String(equipmentIndex + 1).padStart(2, "0")}`,
        serial_number: `JF${definition.index}${String(equipmentIndex + 1).padStart(4, "0")}`,
        brand,
        model,
        description: `${name} used in the seeded historical workspace.`,
        purchase_date: isoDate(dateInMonth(purchaseMonth, 12)),
        purchase_price: price + definition.index * 50,
        status,
        note:
          status === "active"
            ? "Operational."
            : "Seeded issue status for facility health reporting.",
        created_at: dateInMonth(purchaseMonth, 12).toISOString(),
        updated_at: now.toISOString(),
      }
    }
  )

  await sqlUpsertRows("gym_equipments", equipment, ["id"])

  const packageDefinitions = [
    {
      key: "monthly",
      name: "Seed Monthly Access",
      description: "Thirty-day access to the strength and cardio rooms.",
      price: 49 + definition.index * 2,
      has_pt: false,
      duration_days: 30,
      session_count: null,
      roomIndexes: [0, 1],
    },
    {
      key: "quarterly",
      name: "Seed Quarterly Access",
      description: "Ninety-day access to every facility room.",
      price: 129 + definition.index * 5,
      has_pt: false,
      duration_days: 90,
      session_count: null,
      roomIndexes: [0, 1, 2],
    },
    {
      key: "pt",
      name: "Seed PT 8 Sessions",
      description: "Eight personal-training sessions with full room access.",
      price: 239 + definition.index * 10,
      has_pt: true,
      duration_days: null,
      session_count: 8,
      roomIndexes: [0, 1, 2],
    },
  ]
  const packages = packageDefinitions.map((membershipPackage) => ({
    id: seededUuid(`package:${definition.index}:${membershipPackage.key}`),
    facility_id: facility.id,
    name: membershipPackage.name,
    description: membershipPackage.description,
    price: membershipPackage.price,
    has_pt: membershipPackage.has_pt,
    duration_days: membershipPackage.duration_days,
    session_count: membershipPackage.session_count,
    status: "active",
    release_date: isoDate(months[0]),
    end_date: null,
    created_at: seedStartedAt,
    updated_at: now.toISOString(),
    roomIndexes: membershipPackage.roomIndexes,
  }))

  await upsertRows(
    ownerClient,
    "membership_packages",
    packages.map((membershipPackage) => ({
      id: membershipPackage.id,
      facility_id: membershipPackage.facility_id,
      name: membershipPackage.name,
      description: membershipPackage.description,
      price: membershipPackage.price,
      has_pt: membershipPackage.has_pt,
      duration_days: membershipPackage.duration_days,
      session_count: membershipPackage.session_count,
      status: membershipPackage.status,
      release_date: membershipPackage.release_date,
      end_date: membershipPackage.end_date,
      created_at: membershipPackage.created_at,
      updated_at: membershipPackage.updated_at,
    })),
    { onConflict: "id" }
  )
  await sqlUpsertRows(
    "membership_package_rooms",
    packages.flatMap((membershipPackage) =>
      membershipPackage.roomIndexes.map((roomIndex) => ({
        package_id: membershipPackage.id,
        room_id: rooms[roomIndex].id,
        created_at: seedStartedAt,
      }))
    ),
    ["package_id", "room_id"]
  )

  const vouchers = [
    {
      id: seededUuid(`voucher:${definition.index}:10`),
      facility_id: facility.id,
      code: `SEED${definition.index}SAVE10`,
      discount_type: "percentage",
      percentage: 10,
      amount: null,
      status: "active",
      starts_at: months[0].toISOString(),
      expires_at: addDays(now, 365).toISOString(),
      max_redemptions: 500,
      created_at: seedStartedAt,
      updated_at: now.toISOString(),
    },
    {
      id: seededUuid(`voucher:${definition.index}:expired`),
      facility_id: facility.id,
      code: `SEED${definition.index}OLD15`,
      discount_type: "amount",
      percentage: null,
      amount: 15,
      status: "expired",
      starts_at: months[0].toISOString(),
      expires_at: addDays(months[5], 20).toISOString(),
      max_redemptions: 100,
      created_at: seedStartedAt,
      updated_at: now.toISOString(),
    },
  ]

  await upsertRows(ownerClient, "vouchers", vouchers, { onConflict: "id" })

  const subscriptions = []
  const payments = []
  const redemptions = []
  const assignments = []
  const sessions = []
  const sessionFeedbacks = []
  const facilityFeedbacks = []

  for (let monthIndex = 0; monthIndex < months.length; monthIndex += 1) {
    const monthStart = months[monthIndex]
    const isCurrentMonth = monthIndex === months.length - 1

    for (let sequence = 0; sequence < 5; sequence += 1) {
      const member = members[(monthIndex * 5 + sequence) % members.length]
      const membershipPackage = sequence < 3 ? packages[0] : packages[1]
      const activatedAt = dateInMonth(monthStart, 4 + sequence, 2 + sequence)
      const expiryDays = membershipPackage.duration_days
      const expiresAt = addDays(activatedAt, expiryDays)
      const subscriptionId = seededUuid(
        `subscription:${definition.index}:${monthKey(monthStart)}:${sequence}`
      )
      const discount = 0
      const finalPrice = membershipPackage.price
      const status = isCurrentMonth ? "active" : "expired"

      subscriptions.push({
        id: subscriptionId,
        member_id: member.id,
        facility_id: facility.id,
        package_id: membershipPackage.id,
        status,
        base_price: membershipPackage.price,
        discount_amount: discount,
        final_price: finalPrice,
        has_pt_snapshot: membershipPackage.has_pt,
        duration_days_snapshot: membershipPackage.duration_days,
        session_count_snapshot: membershipPackage.session_count,
        activated_at: activatedAt.toISOString(),
        starts_at: activatedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        cancelled_at: null,
        cancelled_reason: null,
        created_at: addDays(activatedAt, -1).toISOString(),
        updated_at: isCurrentMonth
          ? now.toISOString()
          : expiresAt.toISOString(),
      })
      payments.push({
        id: seededUuid(`payment:${subscriptionId}`),
        subscription_id: subscriptionId,
        member_id: member.id,
        amount: finalPrice,
        method: sequence % 2 === 0 ? "card" : "bank_transfer",
        status: "paid",
        paid_at: activatedAt.toISOString(),
        created_at: activatedAt.toISOString(),
        updated_at: activatedAt.toISOString(),
        payer_name: null,
        payer_phone: null,
        cardholder_name: sequence % 2 === 0 ? member.fullName : null,
        card_last_four:
          sequence % 2 === 0
            ? `${definition.index}${monthIndex}${sequence}7`.slice(-4)
            : null,
        card_expiry: sequence % 2 === 0 ? "12/29" : null,
      })
    }

    const feedbackMember = members[monthIndex % members.length]
    const responded = monthIndex % 3 !== 0
    const feedbackCreatedAt = dateInMonth(monthStart, 18, 10)

    facilityFeedbacks.push({
      id: seededUuid(
        `facility-feedback:${definition.index}:${monthKey(monthStart)}`
      ),
      facility_id: facility.id,
      member_id: feedbackMember.id,
      subject: [
        "Equipment availability",
        "Helpful front desk team",
        "Peak-hour cleanliness",
        "Training atmosphere",
      ][monthIndex % 4],
      message:
        monthIndex % 2 === 0
          ? "The facility is running well overall. More equipment availability during peak hours would improve the experience."
          : "The team was helpful and the gym environment supported a productive training session.",
      rating: 3 + (monthIndex % 3),
      status: responded ? "responded" : "open",
      manager_response: responded
        ? "Thanks for the feedback. The facility team has reviewed this item."
        : null,
      responded_by_manager_id: responded ? manager.id : null,
      responded_at: responded
        ? addDays(feedbackCreatedAt, 2).toISOString()
        : null,
      created_at: feedbackCreatedAt.toISOString(),
      updated_at: responded
        ? addDays(feedbackCreatedAt, 2).toISOString()
        : feedbackCreatedAt.toISOString(),
    })
  }

  const pendingSubscriptions = subscriptions.map((subscription) => ({
    ...subscription,
    status: "pending_payment",
    discount_amount: 0,
    final_price: subscription.base_price,
    activated_at: null,
    starts_at: null,
    expires_at: null,
    updated_at: subscription.created_at,
  }))
  const seededSubscriptionIds = subscriptions.map(
    (subscription) => subscription.id
  )
  const seededSubscriptionIdList = seededSubscriptionIds
    .map(sqlLiteral)
    .join(", ")

  // Clear only deterministic seed history so interrupted runs can resume cleanly.
  await runDatabaseQuery(`
    delete from public.pt_session_feedbacks
    where subscription_id in (${seededSubscriptionIdList});

    delete from public.membership_pt_sessions
    where subscription_id in (${seededSubscriptionIdList});

    delete from public.membership_pt_assignment_schedule_slots
    where assignment_id in (
      select id
      from public.membership_pt_assignments
      where subscription_id in (${seededSubscriptionIdList})
    );

    delete from public.membership_pt_assignments
    where subscription_id in (${seededSubscriptionIdList});

    delete from public.membership_pt_preference_time_slots
    where pt_preference_id in (
      select id
      from public.membership_pt_preferences
      where subscription_id in (${seededSubscriptionIdList})
    );

    delete from public.membership_pt_preferences
    where subscription_id in (${seededSubscriptionIdList});

    delete from public.voucher_redemptions
    where subscription_id in (${seededSubscriptionIdList});

    delete from public.membership_payments
    where subscription_id in (${seededSubscriptionIdList});

    delete from public.membership_subscriptions
    where id in (${seededSubscriptionIdList});
  `)

  await sqlInsertRowsDoNothing(
    "membership_subscriptions",
    pendingSubscriptions,
    ["id"]
  )
  await runDatabaseQuery(`
    update public.membership_subscriptions as subscription
    set
      discount_amount = 0,
      final_price = base_price
    where
      subscription.id in (${subscriptions
        .map((subscription) => sqlLiteral(subscription.id))
        .join(", ")})
      and subscription.status = 'pending_payment'
      and not exists (
        select 1
        from public.membership_payments as payment
        where payment.subscription_id = subscription.id
      );
  `)
  const missingRedemptions = await getMissingRowsById(
    admin,
    "voucher_redemptions",
    redemptions
  )

  await upsertRows(admin, "voucher_redemptions", missingRedemptions, {
    onConflict: "id",
  })
  await upsertRows(admin, "membership_payments", payments, {
    onConflict: "id",
  })

  // Payment triggers can activate subscriptions, so restore the historical snapshot.
  const historicalSubscriptionRows = subscriptions.map((subscription) => ({
    id: subscription.id,
    status: subscription.status,
    activated_at: subscription.activated_at,
    starts_at: subscription.starts_at,
    expires_at: subscription.expires_at,
    cancelled_at: subscription.cancelled_at,
    cancelled_reason: subscription.cancelled_reason,
    updated_at: subscription.updated_at,
  }))

  await runDatabaseQuery(`
    with history as (
      select *
      from jsonb_to_recordset(
        ${sqlLiteral(JSON.stringify(historicalSubscriptionRows))}::jsonb
      ) as row(
        id uuid,
        status text,
        activated_at timestamptz,
        starts_at timestamptz,
        expires_at timestamptz,
        cancelled_at timestamptz,
        cancelled_reason text,
        updated_at timestamptz
      )
    )
    update public.membership_subscriptions as subscription
    set
      status = history.status,
      activated_at = history.activated_at,
      starts_at = history.starts_at,
      expires_at = history.expires_at,
      cancelled_at = history.cancelled_at,
      cancelled_reason = history.cancelled_reason,
      updated_at = history.updated_at
    from history
    where subscription.id = history.id;
  `)
  await upsertRows(admin, "membership_pt_assignments", assignments, {
    onConflict: "id",
  })

  const ptSubscriptionIds = assignments.map(
    (assignment) => assignment.subscription_id
  )

  for (const idsChunk of chunk(ptSubscriptionIds, 50)) {
    assertResult(
      "Delete seeded PT feedback",
      await admin
        .from("pt_session_feedbacks")
        .delete()
        .in("subscription_id", idsChunk)
    )
    assertResult(
      "Delete seeded PT sessions",
      await admin
        .from("membership_pt_sessions")
        .delete()
        .in("subscription_id", idsChunk)
    )
  }

  await upsertRows(admin, "membership_pt_sessions", sessions, {
    onConflict: "id",
  })
  await upsertRows(admin, "pt_session_feedbacks", sessionFeedbacks, {
    onConflict: "id",
  })
  await upsertRows(admin, "facility_feedbacks", facilityFeedbacks, {
    onConflict: "id",
  })

  await ownerClient.auth.signOut()

  return {
    owner,
    manager,
    pts,
    members,
    facility,
    rooms,
    equipment,
    packages,
    vouchers,
    subscriptions,
    payments,
    assignments,
    sessions,
    facilityFeedbacks,
  }
}

async function validateWorkspace(workspace, months) {
  const ownerClient = await createAuthenticatedClient(workspace.owner.email)
  const facilityId = workspace.facility.id
  const [
    facilitiesResult,
    roomsResult,
    equipmentResult,
    packagesResult,
    subscriptionsResult,
    paymentsResult,
    feedbackResult,
  ] = await Promise.all([
    ownerClient.from("gym_facilities").select("id").eq("id", facilityId),
    ownerClient.from("rooms").select("id").eq("facility_id", facilityId),
    ownerClient
      .from("gym_equipments")
      .select("id")
      .eq("facility_id", facilityId),
    ownerClient
      .from("membership_packages")
      .select("id")
      .eq("facility_id", facilityId),
    ownerClient
      .from("membership_subscriptions")
      .select("id,status,activated_at,has_pt_snapshot")
      .eq("facility_id", facilityId),
    ownerClient
      .from("membership_payments")
      .select("id,paid_at,amount,membership_subscriptions!inner(facility_id)")
      .eq("membership_subscriptions.facility_id", facilityId),
    ownerClient
      .from("facility_feedbacks")
      .select("id")
      .eq("facility_id", facilityId),
  ])
  const facilities = assertResult("Validate facilities", facilitiesResult) ?? []
  const rooms = assertResult("Validate rooms", roomsResult) ?? []
  const equipment = assertResult("Validate equipment", equipmentResult) ?? []
  const packages = assertResult("Validate packages", packagesResult) ?? []
  const subscriptions =
    assertResult("Validate subscriptions", subscriptionsResult) ?? []
  const payments = assertResult("Validate payments", paymentsResult) ?? []
  const feedback = assertResult("Validate feedback", feedbackResult) ?? []
  const monthCoverage = new Set(
    subscriptions.map((subscription) => subscription.activated_at?.slice(0, 7))
  )
  const expectedMonths = new Set(months.map(monthKey))

  for (const expectedMonth of expectedMonths) {
    if (!monthCoverage.has(expectedMonth)) {
      throw new Error(
        `Validate ${workspace.facility.name}: missing subscription history for ${expectedMonth}`
      )
    }
  }

  const currentSubscriptions = subscriptions.filter(
    (subscription) => subscription.status === "active"
  )
  const summary = {
    owner: workspace.owner.email,
    facility: workspace.facility.name,
    facilities: facilities.length,
    rooms: rooms.length,
    equipment: equipment.length,
    packages: packages.length,
    subscriptions: subscriptions.length,
    payments: payments.length,
    feedback: feedback.length,
    historyMonths: monthCoverage.size,
    currentActive: currentSubscriptions.length,
    currentPt: currentSubscriptions.filter(
      (subscription) => subscription.has_pt_snapshot
    ).length,
    currentNonPt: currentSubscriptions.filter(
      (subscription) => !subscription.has_pt_snapshot
    ).length,
  }

  await ownerClient.auth.signOut()

  return summary
}

async function main() {
  const now = new Date()
  const months = Array.from({ length: historyMonths }, (_, index) =>
    startOfMonth(now, index - (historyMonths - 1))
  )
  const authUsers = await listAllAuthUsers()
  const existingUsersByEmail = new Map(
    authUsers
      .filter((user) => user.email)
      .map((user) => [user.email.toLowerCase(), user])
  )
  const workspaces = []

  console.log(
    `Seeding ${historyMonths} months (${monthKey(months[0])} through ${monthKey(months.at(-1))})...`
  )

  for (let index = 1; index <= 2; index += 1) {
    const definition = buildWorkspaceDefinition(index)
    console.log(`Seeding ${definition.facility.name}...`)
    workspaces.push(
      await seedWorkspace(definition, existingUsersByEmail, months, now)
    )
  }

  const summaries = []

  for (const workspace of workspaces) {
    summaries.push(await validateWorkspace(workspace, months))
  }

  console.table(summaries)
  console.log("\nOwner login credentials:")

  for (const workspace of workspaces) {
    console.log(`- ${workspace.owner.email} / ${seedPassword}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
