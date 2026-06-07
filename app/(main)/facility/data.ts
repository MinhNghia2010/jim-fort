import type { EquipmentStatus } from "@/lib/owner-overview"
import { equipmentStatuses } from "@/lib/owner-overview"
import { createClient } from "@/lib/supabase/server"

type FacilityRow = {
  id: string
  name: string
}

type RoomRow = {
  id: string
  facility_id: string
  name: string
  status: string | null
}

type EquipmentRow = {
  id: string
  facility_id: string
  room_id: string | null
  name: string
  category: string | null
  equipment_code: string
  serial_number: string | null
  brand: string | null
  model: string | null
  description: string | null
  purchase_date: string | null
  purchase_price: string | number | null
  status: string | null
  note: string | null
}

export type RoomStatus = "active" | "maintenance" | "closed"

export type EquipmentStatusSummary = {
  status: EquipmentStatus
  label: string
  count: number
}

export type FacilityEquipmentGroup = {
  category: string
  name: string
  description: string
  brandLabel: string
  modelLabel: string
  count: number
  statusCounts: EquipmentStatusSummary[]
}

export type FacilityRoomSummary = {
  id: string
  name: string
  status: RoomStatus
  statusLabel: string
  equipmentCount: number
  statusCounts: EquipmentStatusSummary[]
  equipmentGroups: FacilityEquipmentGroup[]
}

export type OwnerFacilityPageData = {
  facility: FacilityRow | null
  rooms: FacilityRoomSummary[]
  totalEquipmentCount: number
  assignedEquipmentCount: number
  facilityLevelEquipmentCount: number
  totalStatusCounts: EquipmentStatusSummary[]
  errorMessage?: string
}

export type EquipmentMachineRow = {
  id: string
  name: string
  category: string
  code: string
  serialNumber: string
  brandLabel: string
  modelLabel: string
  status: EquipmentStatus
  statusLabel: string
  purchaseDate: string | null
  purchaseDateLabel: string
  purchasePrice: number
  purchasePriceLabel: string
  note: string
}

export type OwnerRoomEquipmentPageData = {
  facility: FacilityRow | null
  room: {
    id: string
    name: string
    status: RoomStatus
    statusLabel: string
  } | null
  category: string | null
  title: string
  description: string
  machines: EquipmentMachineRow[]
  statusCounts: EquipmentStatusSummary[]
  errorMessage?: string
}

const statusLabels: Record<EquipmentStatus, string> = {
  active: "Active",
  maintenance: "Maintenance",
  broken: "Broken",
  retired: "Retired",
}

const roomStatusLabels: Record<RoomStatus, string> = {
  active: "Active",
  maintenance: "Maintenance",
  closed: "Closed",
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC",
})

function getRouteSegmentLabel(value?: string) {
  const segment = value?.trim()

  if (!segment) {
    return undefined
  }

  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

function selectFacility(
  facilities: readonly FacilityRow[],
  facilityName?: string
) {
  const selectedName = getRouteSegmentLabel(facilityName)

  if (!selectedName) {
    return facilities[0] ?? null
  }

  const selectedNameLower = selectedName.toLowerCase()

  return (
    facilities.find(
      (facility) => facility.name.toLowerCase() === selectedNameLower
    ) ??
    facilities.find(
      (facility) => encodeURIComponent(facility.name) === facilityName
    ) ??
    facilities[0] ??
    null
  )
}

function normalizeRoomStatus(status: string | null | undefined): RoomStatus {
  if (status === "maintenance" || status === "closed") {
    return status
  }

  return "active"
}

function normalizeEquipmentStatus(
  status: string | null | undefined
): EquipmentStatus {
  if (equipmentStatuses.includes(status as EquipmentStatus)) {
    return status as EquipmentStatus
  }

  return "maintenance"
}

function toTitleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join(" ")
}

function getCategoryKey(row: EquipmentRow) {
  return row.category?.trim().toLowerCase() || "uncategorized"
}

function getEquipmentTypeName(row: EquipmentRow) {
  const baseName = row.name.replace(/\s+\d+$/, "").trim()

  return baseName || toTitleCase(getCategoryKey(row))
}

function toNumber(value: string | number | null | undefined) {
  const number = Number(value ?? 0)

  return Number.isFinite(number) ? number : 0
}

function formatCurrency(value: string | number | null | undefined) {
  const amount = toNumber(value)

  if (!amount) {
    return "Not recorded"
  }

  return currencyFormatter.format(amount)
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Not recorded"
  }

  const date = new Date(`${value}T00:00:00.000Z`)

  if (Number.isNaN(date.valueOf())) {
    return "Not recorded"
  }

  return dateFormatter.format(date)
}

function buildStatusCounts(rows: readonly EquipmentRow[]) {
  const counts = new Map<EquipmentStatus, number>(
    equipmentStatuses.map((status) => [status, 0])
  )

  rows.forEach((row) => {
    const status = normalizeEquipmentStatus(row.status)
    counts.set(status, (counts.get(status) ?? 0) + 1)
  })

  return equipmentStatuses.map((status) => ({
    status,
    label: statusLabels[status],
    count: counts.get(status) ?? 0,
  }))
}

function buildEquipmentGroups(rows: readonly EquipmentRow[]) {
  const groupsByCategory = new Map<string, EquipmentRow[]>()

  rows.forEach((row) => {
    const category = getCategoryKey(row)
    const groupRows = groupsByCategory.get(category) ?? []
    groupRows.push(row)
    groupsByCategory.set(category, groupRows)
  })

  return Array.from(groupsByCategory.entries())
    .map(([category, groupRows]) => {
      const firstRow = groupRows[0]

      return {
        category,
        name: firstRow ? getEquipmentTypeName(firstRow) : toTitleCase(category),
        description: firstRow?.description ?? "No equipment details recorded.",
        brandLabel: firstRow?.brand ?? "Mixed brands",
        modelLabel: firstRow?.model ?? "Mixed models",
        count: groupRows.length,
        statusCounts: buildStatusCounts(groupRows),
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

function mapMachine(row: EquipmentRow): EquipmentMachineRow {
  const status = normalizeEquipmentStatus(row.status)

  return {
    id: row.id,
    name: row.name,
    category: getCategoryKey(row),
    code: row.equipment_code,
    serialNumber: row.serial_number ?? "Not recorded",
    brandLabel: row.brand ?? "Not recorded",
    modelLabel: row.model ?? "Not recorded",
    status,
    statusLabel: statusLabels[status],
    purchaseDate: row.purchase_date,
    purchaseDateLabel: formatDate(row.purchase_date),
    purchasePrice: toNumber(row.purchase_price),
    purchasePriceLabel: formatCurrency(row.purchase_price),
    note: row.note ?? "No note recorded.",
  }
}

async function getSelectedFacility(facilityName?: string) {
  const supabase = await createClient()
  const facilitiesResult = await supabase
    .from("gym_facilities")
    .select("id, name")
    .order("created_at", { ascending: true })

  const facilities = (facilitiesResult.data ?? []) as FacilityRow[]

  return {
    supabase,
    facility: selectFacility(facilities, facilityName),
    errorMessage: facilitiesResult.error?.message,
  }
}

export async function getOwnerFacilityPageData(
  facilityName?: string
): Promise<OwnerFacilityPageData> {
  const {
    supabase,
    facility,
    errorMessage: facilityError,
  } = await getSelectedFacility(facilityName)

  if (!facility) {
    return {
      facility: null,
      rooms: [],
      totalEquipmentCount: 0,
      assignedEquipmentCount: 0,
      facilityLevelEquipmentCount: 0,
      totalStatusCounts: buildStatusCounts([]),
      errorMessage: facilityError,
    }
  }

  const [roomsResult, equipmentsResult] = await Promise.all([
    supabase
      .from("rooms")
      .select("id, facility_id, name, status")
      .eq("facility_id", facility.id)
      .order("name", { ascending: true }),
    supabase
      .from("gym_equipments")
      .select(
        "id, facility_id, room_id, name, category, equipment_code, serial_number, brand, model, description, purchase_date, purchase_price, status, note"
      )
      .eq("facility_id", facility.id)
      .order("category", { ascending: true })
      .order("equipment_code", { ascending: true }),
  ])

  const rooms = (roomsResult.data ?? []) as RoomRow[]
  const equipments = (equipmentsResult.data ?? []) as EquipmentRow[]
  const errorMessages = [
    facilityError,
    roomsResult.error?.message,
    equipmentsResult.error?.message,
  ].filter(Boolean)

  const equipmentsByRoomId = new Map<string, EquipmentRow[]>()

  equipments.forEach((equipment) => {
    if (!equipment.room_id) {
      return
    }

    const roomEquipments = equipmentsByRoomId.get(equipment.room_id) ?? []
    roomEquipments.push(equipment)
    equipmentsByRoomId.set(equipment.room_id, roomEquipments)
  })

  const roomSummaries = rooms.map((room) => {
    const roomEquipments = equipmentsByRoomId.get(room.id) ?? []
    const status = normalizeRoomStatus(room.status)

    return {
      id: room.id,
      name: room.name,
      status,
      statusLabel: roomStatusLabels[status],
      equipmentCount: roomEquipments.length,
      statusCounts: buildStatusCounts(roomEquipments),
      equipmentGroups: buildEquipmentGroups(roomEquipments),
    }
  })

  const assignedEquipmentCount = equipments.filter(
    (equipment) => equipment.room_id
  ).length

  return {
    facility,
    rooms: roomSummaries,
    totalEquipmentCount: equipments.length,
    assignedEquipmentCount,
    facilityLevelEquipmentCount: equipments.length - assignedEquipmentCount,
    totalStatusCounts: buildStatusCounts(equipments),
    errorMessage: errorMessages.length ? errorMessages.join("; ") : undefined,
  }
}

export async function getOwnerRoomEquipmentPageData({
  facilityName,
  roomId,
  category,
}: {
  facilityName?: string
  roomId?: string
  category?: string
}): Promise<OwnerRoomEquipmentPageData> {
  const {
    supabase,
    facility,
    errorMessage: facilityError,
  } = await getSelectedFacility(facilityName)
  const selectedCategory = getRouteSegmentLabel(category)?.toLowerCase() ?? null

  if (!facility || !roomId) {
    return {
      facility,
      room: null,
      category: selectedCategory,
      title: "Room equipment",
      description: "The requested room could not be found.",
      machines: [],
      statusCounts: buildStatusCounts([]),
      errorMessage: facilityError,
    }
  }

  const [roomResult, equipmentsResult] = await Promise.all([
    supabase
      .from("rooms")
      .select("id, facility_id, name, status")
      .eq("facility_id", facility.id)
      .eq("id", roomId)
      .maybeSingle(),
    supabase
      .from("gym_equipments")
      .select(
        "id, facility_id, room_id, name, category, equipment_code, serial_number, brand, model, description, purchase_date, purchase_price, status, note"
      )
      .eq("facility_id", facility.id)
      .eq("room_id", roomId)
      .order("equipment_code", { ascending: true }),
  ])

  const roomRow = roomResult.data as RoomRow | null
  const equipmentRows = (equipmentsResult.data ?? []) as EquipmentRow[]
  const filteredEquipmentRows = selectedCategory
    ? equipmentRows.filter((row) => getCategoryKey(row) === selectedCategory)
    : equipmentRows
  const firstMachine = filteredEquipmentRows[0]
  const title = firstMachine
    ? getEquipmentTypeName(firstMachine)
    : selectedCategory
      ? toTitleCase(selectedCategory)
      : "Room equipment"
  const roomStatus = normalizeRoomStatus(roomRow?.status)
  const errorMessages = [
    facilityError,
    roomResult.error?.message,
    equipmentsResult.error?.message,
  ].filter(Boolean)

  return {
    facility,
    room: roomRow
      ? {
          id: roomRow.id,
          name: roomRow.name,
          status: roomStatus,
          statusLabel: roomStatusLabels[roomStatus],
        }
      : null,
    category: selectedCategory,
    title,
    description: roomRow
      ? `${title} machines in ${roomRow.name}.`
      : "The requested room could not be found.",
    machines: filteredEquipmentRows.map(mapMachine),
    statusCounts: buildStatusCounts(filteredEquipmentRows),
    errorMessage: errorMessages.length ? errorMessages.join("; ") : undefined,
  }
}
