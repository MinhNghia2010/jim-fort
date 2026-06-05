import type {
  StaffStatus,
  StaffTableRow,
} from "@/components/screens/owner/staffs/StaffTable"
import { createClient } from "@/lib/supabase/server"

interface StaffRecord {
  id: string
  full_name: string
  phone: string | null
  avatar_url: string | null
  role: string | null
  status: StaffStatus
  hired_at: string | null
  note: string | null
}

interface FacilityManagerRecord {
  manager_id: string
}

interface FacilityPtRecord {
  pt_id: string
}

interface StaffUserRecord {
  id: string
  full_name: string
  phone: string | null
  avatar_url: string | null
  role: "manager" | "pt" | string
}

function formatStaffUserRole(role: string) {
  if (role === "pt") {
    return "PT"
  }

  if (role === "manager") {
    return "Manager"
  }

  return role
}

function mapStaffRecord(staff: StaffRecord): StaffTableRow {
  return {
    id: staff.id,
    name: staff.full_name,
    phone: staff.phone,
    avatarUrl: staff.avatar_url,
    role: staff.role,
    status: staff.status,
    hiredAt: staff.hired_at,
    note: staff.note,
  }
}

function mapStaffUser(user: StaffUserRecord): StaffTableRow {
  return {
    id: user.id,
    name: user.full_name,
    phone: user.phone,
    avatarUrl: user.avatar_url,
    role: formatStaffUserRole(user.role),
    status: "active",
    hiredAt: null,
    note: "Login account assigned to this facility",
  }
}

export async function getStaffPageData() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("staffs")
    .select(
      "id, full_name, phone, avatar_url, role, status, hired_at, note, created_at"
    )
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(`Unable to load staffs: ${error.message}`)
  }

  const staffRows = (data ?? []) as unknown as StaffRecord[]

  return staffRows.map(mapStaffRecord)
}

export async function getOwnerStaffPageData() {
  const supabase = await createClient()

  const [staffsResult, managersResult, ptsResult] = await Promise.all([
    supabase
      .from("staffs")
      .select(
        "id, full_name, phone, avatar_url, role, status, hired_at, note, created_at"
      )
      .order("created_at", { ascending: false }),
    supabase.from("facility_managers").select("manager_id"),
    supabase.from("facility_pts").select("pt_id"),
  ])

  if (staffsResult.error) {
    throw new Error(`Unable to load staffs: ${staffsResult.error.message}`)
  }

  if (managersResult.error) {
    throw new Error(
      `Unable to load facility managers: ${managersResult.error.message}`
    )
  }

  if (ptsResult.error) {
    throw new Error(`Unable to load facility PTs: ${ptsResult.error.message}`)
  }

  const staffRows = (staffsResult.data ?? []) as unknown as StaffRecord[]
  const managerRows = (managersResult.data ??
    []) as unknown as FacilityManagerRecord[]
  const ptRows = (ptsResult.data ?? []) as unknown as FacilityPtRecord[]
  const staffUserIds = Array.from(
    new Set([
      ...managerRows.map((manager) => manager.manager_id),
      ...ptRows.map((pt) => pt.pt_id),
    ])
  )

  if (!staffUserIds.length) {
    return staffRows.map(mapStaffRecord)
  }

  const { data: staffUsersData, error: staffUsersError } = await supabase
    .from("users")
    .select("id, full_name, phone, avatar_url, role")
    .in("id", staffUserIds)

  if (staffUsersError) {
    throw new Error(
      `Unable to load manager and PT users: ${staffUsersError.message}`
    )
  }

  const staffUsers = (staffUsersData ?? []) as unknown as StaffUserRecord[]

  return [
    ...staffUsers.map(mapStaffUser),
    ...staffRows.map(mapStaffRecord),
  ].sort((a, b) => a.name.localeCompare(b.name))
}

export async function getManagerStaffPageData() {
  const supabase = await createClient()

  const [staffsResult, ptsResult] = await Promise.all([
    supabase
      .from("staffs")
      .select(
        "id, full_name, phone, avatar_url, role, status, hired_at, note, created_at"
      )
      .order("created_at", { ascending: false }),
    supabase.from("facility_pts").select("pt_id"),
  ])

  if (staffsResult.error) {
    throw new Error(`Unable to load staffs: ${staffsResult.error.message}`)
  }

  if (ptsResult.error) {
    throw new Error(`Unable to load facility PTs: ${ptsResult.error.message}`)
  }

  const staffRows = (staffsResult.data ?? []) as unknown as StaffRecord[]
  const ptRows = (ptsResult.data ?? []) as unknown as FacilityPtRecord[]
  const ptUserIds = Array.from(new Set(ptRows.map((pt) => pt.pt_id)))

  if (!ptUserIds.length) {
    return staffRows.map(mapStaffRecord)
  }

  const { data: ptUsersData, error: ptUsersError } = await supabase
    .from("users")
    .select("id, full_name, phone, avatar_url, role")
    .in("id", ptUserIds)

  if (ptUsersError) {
    throw new Error(`Unable to load PT users: ${ptUsersError.message}`)
  }

  const ptUsers = (ptUsersData ?? []) as unknown as StaffUserRecord[]

  return [...ptUsers.map(mapStaffUser), ...staffRows.map(mapStaffRecord)].sort(
    (a, b) => a.name.localeCompare(b.name)
  )
}
