import type {
  OwnerRoomEquipmentRow,
  RoomEquipmentStatus,
} from "@/components/screens/owner/facility/OwnerRoomEquipmentTable"
import { createClient } from "@/lib/supabase/server"

export type RoomStatus = "active" | "maintenance" | "closed"

export interface FacilityListItem {
  id: string
  name: string
  address: string
  phone: string
  description: string
  roomCount: number
  equipmentCount: number
  activeEquipmentCount: number
  maintenanceEquipmentCount: number
  activeStaffCount: number
  activeMemberCount: number
}

export interface FacilityRoomView {
  id: string
  name: string
  description: string
  status: RoomStatus
  equipmentCount: number
  activeEquipmentCount: number
  issueEquipmentCount: number
  updatedAtLabel: string
}

export interface FacilityDetailView extends FacilityListItem {
  createdAtLabel: string
  updatedAtLabel: string
  rooms: FacilityRoomView[]
}

export interface FacilityPageData {
  facilities: FacilityListItem[]
  totalRooms: number
  totalEquipment: number
  activeEquipment: number
  activeMembers: number
  errorMessage?: string
}

export interface FacilityDetailPageData {
  facility: FacilityDetailView | null
  errorMessage?: string
}

export interface FacilityRoomPageData {
  facility: FacilityListItem | null
  room: FacilityRoomView | null
  statusCounts: Record<RoomEquipmentStatus, number>
  equipmentPreview: OwnerRoomEquipmentRow[]
  errorMessage?: string
}

export interface RoomEquipmentPageData {
  facility: FacilityListItem | null
  room: FacilityRoomView | null
  equipments: OwnerRoomEquipmentRow[]
  errorMessage?: string
}

export interface EquipmentDetailView extends OwnerRoomEquipmentRow {
  category: string
  description: string
  createdAtLabel: string
  updatedAtLabel: string
}

export interface EquipmentIssueReportView {
  id: string
  previousStatus: RoomEquipmentStatus
  newStatus: RoomEquipmentStatus
  issue: string
  createdAt: string
  createdAtLabel: string
  reporterName: string
}

export interface EquipmentDetailPageData {
  facility: FacilityListItem | null
  room: FacilityRoomView | null
  equipment: EquipmentDetailView | null
  issueReports: EquipmentIssueReportView[]
  errorMessage?: string
}

type FacilityRecord = {
  id: string
  name: string
  address: string | null
  phone: string | null
  description: string | null
  created_at: string
  updated_at: string
}

type RoomRecord = {
  id: string
  facility_id: string
  name: string
  description: string | null
  status: string | null
  created_at: string
  updated_at: string
}

type EquipmentRecord = {
  id: string
  facility_id: string
  room_id: string | null
  name: string
  category: string | null
  equipment_code: string | null
  serial_number: string | null
  brand: string | null
  model: string | null
  description: string | null
  purchase_date: string | null
  purchase_price: string | number | null
  status: string | null
  note: string | null
  created_at: string
  updated_at: string
}

type UserRelation = {
  full_name: string | null
}

type EquipmentIssueReportRecord = {
  id: string
  previous_status: string
  new_status: string
  issue: string
  created_at: string
  reporter: UserRelation | UserRelation[] | null
}

type StaffRecord = {
  id: string
  facility_id: string
  status: string
}

type SubscriptionRecord = {
  id: string
  facility_id: string
  member_id: string
  status: string
}

const equipmentStatuses: readonly RoomEquipmentStatus[] = [
  "active",
  "maintenance",
  "broken",
  "retired",
]

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC",
})

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Ho_Chi_Minh",
})

export function decodeRouteSegment(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export function getFacilityHref(facilityName: string) {
  return `/facility/${encodeURIComponent(facilityName)}`
}

export function getRoomHref(facilityName: string, roomId: string) {
  return `${getFacilityHref(facilityName)}/rooms/${roomId}`
}

export function getRoomEquipmentHref(facilityName: string, roomId: string) {
  return `${getRoomHref(facilityName, roomId)}/equipments`
}

export function getEquipmentHref(
  facilityName: string,
  roomId: string,
  equipmentId: string
) {
  return `${getRoomEquipmentHref(facilityName, roomId)}/${equipmentId}`
}

function normalizeRoomStatus(status: string | null | undefined): RoomStatus {
  if (status === "maintenance" || status === "closed") {
    return status
  }

  return "active"
}

function normalizeEquipmentStatus(
  status: string | null | undefined
): RoomEquipmentStatus {
  if (status === "maintenance" || status === "broken" || status === "retired") {
    return status
  }

  return "active"
}

function toNumber(value: string | number | null | undefined) {
  const number = Number(value ?? 0)

  return Number.isFinite(number) ? number : 0
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Not recorded"
  }

  const date = new Date(value)

  return Number.isNaN(date.valueOf())
    ? "Not recorded"
    : dateFormatter.format(date)
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Not recorded"
  }

  const date = new Date(value)

  return Number.isNaN(date.valueOf())
    ? "Not recorded"
    : dateTimeFormatter.format(date)
}

function getSingleRelation<T>(relation: T | T[] | null | undefined) {
  if (Array.isArray(relation)) {
    return relation[0] ?? null
  }

  return relation ?? null
}

function groupByFacility<T extends { facility_id: string }>(
  rows: readonly T[]
) {
  const grouped = new Map<string, T[]>()

  for (const row of rows) {
    const facilityRows = grouped.get(row.facility_id) ?? []
    facilityRows.push(row)
    grouped.set(row.facility_id, facilityRows)
  }

  return grouped
}

function countActiveMembers(subscriptions: readonly SubscriptionRecord[]) {
  return new Set(
    subscriptions
      .filter((subscription) => subscription.status === "active")
      .map((subscription) => subscription.member_id)
  ).size
}

function buildFacilityListItem({
  facility,
  rooms,
  equipments,
  staffs,
  subscriptions,
}: {
  facility: FacilityRecord
  rooms: readonly RoomRecord[]
  equipments: readonly EquipmentRecord[]
  staffs: readonly StaffRecord[]
  subscriptions: readonly SubscriptionRecord[]
}): FacilityListItem {
  return {
    id: facility.id,
    name: facility.name,
    address: facility.address ?? "No address recorded",
    phone: facility.phone ?? "No phone recorded",
    description:
      facility.description ?? "No facility description has been added.",
    roomCount: rooms.length,
    equipmentCount: equipments.length,
    activeEquipmentCount: equipments.filter(
      (equipment) => normalizeEquipmentStatus(equipment.status) === "active"
    ).length,
    maintenanceEquipmentCount: equipments.filter(
      (equipment) =>
        normalizeEquipmentStatus(equipment.status) === "maintenance"
    ).length,
    activeStaffCount: staffs.filter((staff) => staff.status === "active")
      .length,
    activeMemberCount: countActiveMembers(subscriptions),
  }
}

function buildRoomView({
  room,
  equipments,
}: {
  room: RoomRecord
  equipments: readonly EquipmentRecord[]
}): FacilityRoomView {
  return {
    id: room.id,
    name: room.name,
    description: room.description ?? "No room description has been added.",
    status: normalizeRoomStatus(room.status),
    equipmentCount: equipments.length,
    activeEquipmentCount: equipments.filter(
      (equipment) => normalizeEquipmentStatus(equipment.status) === "active"
    ).length,
    issueEquipmentCount: equipments.filter((equipment) => {
      const status = normalizeEquipmentStatus(equipment.status)

      return status === "maintenance" || status === "broken"
    }).length,
    updatedAtLabel: formatDate(room.updated_at),
  }
}

function mapEquipment(equipment: EquipmentRecord): OwnerRoomEquipmentRow {
  const cost = toNumber(equipment.purchase_price)

  return {
    id: equipment.id,
    name: equipment.name,
    status: normalizeEquipmentStatus(equipment.status),
    code: equipment.equipment_code ?? "No code",
    serial: equipment.serial_number ?? "No serial",
    brand: equipment.brand ?? "Unknown brand",
    model: equipment.model ?? "Unknown model",
    purchasedAt: equipment.purchase_date,
    purchasedAtLabel: formatDate(equipment.purchase_date),
    cost,
    costLabel: currencyFormatter.format(cost),
    note: equipment.note,
  }
}

function mapEquipmentDetail(equipment: EquipmentRecord): EquipmentDetailView {
  return {
    ...mapEquipment(equipment),
    category: equipment.category ?? "Uncategorized",
    description:
      equipment.description ?? "No equipment description has been added.",
    createdAtLabel: formatDate(equipment.created_at),
    updatedAtLabel: formatDate(equipment.updated_at),
  }
}

function mapEquipmentIssueReport(
  report: EquipmentIssueReportRecord
): EquipmentIssueReportView {
  const reporter = getSingleRelation(report.reporter)

  return {
    id: report.id,
    previousStatus: normalizeEquipmentStatus(report.previous_status),
    newStatus: normalizeEquipmentStatus(report.new_status),
    issue: report.issue,
    createdAt: report.created_at,
    createdAtLabel: formatDateTime(report.created_at),
    reporterName: reporter?.full_name?.trim() || "Manager",
  }
}

async function getFacilityByName(facilityName: string) {
  const supabase = await createClient()
  const decodedFacilityName = decodeRouteSegment(facilityName)

  const facilityResult = await supabase
    .from("gym_facilities")
    .select("id, name, address, phone, description, created_at, updated_at")
    .eq("name", decodedFacilityName)
    .limit(1)
    .maybeSingle()

  return {
    supabase,
    facility: facilityResult.data as FacilityRecord | null,
    error: facilityResult.error,
  }
}

export async function getFacilityPageData(): Promise<FacilityPageData> {
  const supabase = await createClient()
  const [
    facilitiesResult,
    roomsResult,
    equipmentResult,
    staffsResult,
    subscriptionsResult,
  ] = await Promise.all([
    supabase
      .from("gym_facilities")
      .select("id, name, address, phone, description, created_at, updated_at")
      .order("created_at", { ascending: true }),
    supabase
      .from("rooms")
      .select(
        "id, facility_id, name, description, status, created_at, updated_at"
      ),
    supabase
      .from("gym_equipments")
      .select(
        "id, facility_id, room_id, name, category, equipment_code, serial_number, brand, model, description, purchase_date, purchase_price, status, note, created_at, updated_at"
      ),
    supabase.from("staffs").select("id, facility_id, status"),
    supabase
      .from("membership_subscriptions")
      .select("id, facility_id, member_id, status"),
  ])

  const facilities = (facilitiesResult.data ?? []) as FacilityRecord[]
  const rooms = (roomsResult.data ?? []) as RoomRecord[]
  const equipments = (equipmentResult.data ?? []) as EquipmentRecord[]
  const staffs = (staffsResult.data ?? []) as StaffRecord[]
  const subscriptions = (subscriptionsResult.data ?? []) as SubscriptionRecord[]
  const roomsByFacility = groupByFacility(rooms)
  const equipmentByFacility = groupByFacility(equipments)
  const staffsByFacility = groupByFacility(staffs)
  const subscriptionsByFacility = groupByFacility(subscriptions)
  const facilityItems = facilities.map((facility) =>
    buildFacilityListItem({
      facility,
      rooms: roomsByFacility.get(facility.id) ?? [],
      equipments: equipmentByFacility.get(facility.id) ?? [],
      staffs: staffsByFacility.get(facility.id) ?? [],
      subscriptions: subscriptionsByFacility.get(facility.id) ?? [],
    })
  )
  const queryError = [
    facilitiesResult.error,
    roomsResult.error,
    equipmentResult.error,
    staffsResult.error,
    subscriptionsResult.error,
  ].find(Boolean)

  return {
    facilities: facilityItems,
    totalRooms: rooms.length,
    totalEquipment: equipments.length,
    activeEquipment: equipments.filter(
      (equipment) => normalizeEquipmentStatus(equipment.status) === "active"
    ).length,
    activeMembers: countActiveMembers(subscriptions),
    errorMessage: queryError?.message,
  }
}

export async function getFacilityDetailPageData(
  facilityName: string
): Promise<FacilityDetailPageData> {
  const {
    supabase,
    facility,
    error: facilityError,
  } = await getFacilityByName(facilityName)

  if (!facility) {
    return {
      facility: null,
      errorMessage: facilityError?.message,
    }
  }

  const [roomsResult, equipmentResult, staffsResult, subscriptionsResult] =
    await Promise.all([
      supabase
        .from("rooms")
        .select(
          "id, facility_id, name, description, status, created_at, updated_at"
        )
        .eq("facility_id", facility.id)
        .order("name", { ascending: true }),
      supabase
        .from("gym_equipments")
        .select(
          "id, facility_id, room_id, name, category, equipment_code, serial_number, brand, model, description, purchase_date, purchase_price, status, note, created_at, updated_at"
        )
        .eq("facility_id", facility.id),
      supabase
        .from("staffs")
        .select("id, facility_id, status")
        .eq("facility_id", facility.id),
      supabase
        .from("membership_subscriptions")
        .select("id, facility_id, member_id, status")
        .eq("facility_id", facility.id),
    ])
  const rooms = (roomsResult.data ?? []) as RoomRecord[]
  const equipments = (equipmentResult.data ?? []) as EquipmentRecord[]
  const equipmentsByRoom = new Map<string, EquipmentRecord[]>()

  for (const equipment of equipments) {
    if (!equipment.room_id) {
      continue
    }

    const roomEquipments = equipmentsByRoom.get(equipment.room_id) ?? []
    roomEquipments.push(equipment)
    equipmentsByRoom.set(equipment.room_id, roomEquipments)
  }

  const staffs = (staffsResult.data ?? []) as StaffRecord[]
  const subscriptions = (subscriptionsResult.data ?? []) as SubscriptionRecord[]
  const queryError = [
    facilityError,
    roomsResult.error,
    equipmentResult.error,
    staffsResult.error,
    subscriptionsResult.error,
  ].find(Boolean)

  return {
    facility: {
      ...buildFacilityListItem({
        facility,
        rooms,
        equipments,
        staffs,
        subscriptions,
      }),
      createdAtLabel: formatDate(facility.created_at),
      updatedAtLabel: formatDate(facility.updated_at),
      rooms: rooms.map((room) =>
        buildRoomView({
          room,
          equipments: equipmentsByRoom.get(room.id) ?? [],
        })
      ),
    },
    errorMessage: queryError?.message,
  }
}

export async function getFacilityRoomPageData(
  facilityName: string,
  roomId: string
): Promise<FacilityRoomPageData> {
  const detailData = await getFacilityDetailPageData(facilityName)
  const room = detailData.facility?.rooms.find(
    (facilityRoom) => facilityRoom.id === roomId
  )

  if (!detailData.facility || !room) {
    return {
      facility: detailData.facility,
      room: null,
      statusCounts: {
        active: 0,
        maintenance: 0,
        broken: 0,
        retired: 0,
      },
      equipmentPreview: [],
      errorMessage: detailData.errorMessage,
    }
  }

  const supabase = await createClient()
  const equipmentResult = await supabase
    .from("gym_equipments")
    .select(
      "id, facility_id, room_id, name, category, equipment_code, serial_number, brand, model, description, purchase_date, purchase_price, status, note, created_at, updated_at"
    )
    .eq("room_id", roomId)
    .order("name", { ascending: true })
  const equipmentRecords = (equipmentResult.data ?? []) as EquipmentRecord[]
  const statusCounts = equipmentStatuses.reduce(
    (counts, status) => ({
      ...counts,
      [status]: equipmentRecords.filter(
        (equipment) => normalizeEquipmentStatus(equipment.status) === status
      ).length,
    }),
    {
      active: 0,
      maintenance: 0,
      broken: 0,
      retired: 0,
    } satisfies Record<RoomEquipmentStatus, number>
  )

  return {
    facility: detailData.facility,
    room,
    statusCounts,
    equipmentPreview: equipmentRecords.slice(0, 5).map(mapEquipment),
    errorMessage: detailData.errorMessage ?? equipmentResult.error?.message,
  }
}

export async function getRoomEquipmentPageData(
  facilityName: string,
  roomId: string
): Promise<RoomEquipmentPageData> {
  const roomData = await getFacilityRoomPageData(facilityName, roomId)
  const supabase = await createClient()
  const equipmentResult = await supabase
    .from("gym_equipments")
    .select(
      "id, facility_id, room_id, name, category, equipment_code, serial_number, brand, model, description, purchase_date, purchase_price, status, note, created_at, updated_at"
    )
    .eq("room_id", roomId)
    .order("name", { ascending: true })

  return {
    facility: roomData.facility,
    room: roomData.room,
    equipments: ((equipmentResult.data ?? []) as EquipmentRecord[]).map(
      mapEquipment
    ),
    errorMessage: roomData.errorMessage ?? equipmentResult.error?.message,
  }
}

export async function getEquipmentDetailPageData(
  facilityName: string,
  roomId: string,
  equipmentId: string
): Promise<EquipmentDetailPageData> {
  const roomData = await getFacilityRoomPageData(facilityName, roomId)
  const supabase = await createClient()
  const equipmentResult = await supabase
    .from("gym_equipments")
    .select(
      "id, facility_id, room_id, name, category, equipment_code, serial_number, brand, model, description, purchase_date, purchase_price, status, note, created_at, updated_at"
    )
    .eq("id", equipmentId)
    .eq("room_id", roomId)
    .limit(1)
    .maybeSingle()
  const issueReportsResult = equipmentResult.data
    ? await supabase
        .from("equipment_issue_reports")
        .select(
          `
            id,
            previous_status,
            new_status,
            issue,
            created_at,
            reporter:users!equipment_issue_reports_reported_by_manager_id_fkey(
              full_name
            )
          `
        )
        .eq("equipment_id", equipmentId)
        .order("created_at", { ascending: false })
    : { data: [], error: null }

  return {
    facility: roomData.facility,
    room: roomData.room,
    equipment: equipmentResult.data
      ? mapEquipmentDetail(equipmentResult.data as EquipmentRecord)
      : null,
    issueReports: (
      (issueReportsResult.data ?? []) as unknown as EquipmentIssueReportRecord[]
    ).map(mapEquipmentIssueReport),
    errorMessage:
      roomData.errorMessage ??
      equipmentResult.error?.message ??
      issueReportsResult.error?.message,
  }
}
