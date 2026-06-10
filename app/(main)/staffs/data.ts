import type {
  StaffStatus,
  StaffTableRow,
} from "@/components/screens/owner/staffs/StaffTable"
import { createClient } from "@/lib/supabase/server"

interface StaffRecord {
  id: string
  facility_id?: string
  full_name: string
  phone: string | null
  avatar_url: string | null
  role: string | null
  status: StaffStatus
  hired_at: string | null
  note: string | null
  created_at?: string | null
  updated_at?: string | null
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
  created_at?: string | null
  updated_at?: string | null
}

interface FacilityRecord {
  id: string
  name: string | null
  address: string | null
  phone: string | null
}

interface FacilityAssignmentRecord {
  facility_id: string
}

export interface StaffDetailFacility {
  id: string
  name: string
  address: string | null
  phone: string | null
}

export interface StaffDetailData {
  id: string
  kind: "staff_row" | "login_user"
  name: string
  phone: string | null
  avatarUrl: string | null
  role: string | null
  status: StaffStatus
  hiredAt: string | null
  note: string | null
  createdAt: string | null
  updatedAt: string | null
  facilities: StaffDetailFacility[]
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

function mapFacility(facility: FacilityRecord): StaffDetailFacility {
  return {
    id: facility.id,
    name: facility.name?.trim() || "Facility",
    address: facility.address,
    phone: facility.phone,
  }
}

async function getFacilitiesByIds(facilityIds: string[]) {
  const uniqueFacilityIds = Array.from(new Set(facilityIds))

  if (!uniqueFacilityIds.length) {
    return []
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("gym_facilities")
    .select("id, name, address, phone")
    .in("id", uniqueFacilityIds)

  if (error) {
    throw new Error(`Unable to load staff facilities: ${error.message}`)
  }

  return ((data ?? []) as unknown as FacilityRecord[]).map(mapFacility)
}

async function getLoginUserFacilities(userId: string, role: string | null) {
  const supabase = await createClient()

  if (role === "manager") {
    const { data, error } = await supabase
      .from("facility_managers")
      .select("facility_id")
      .eq("manager_id", userId)

    if (error) {
      throw new Error(`Unable to load manager facilities: ${error.message}`)
    }

    return getFacilitiesByIds(
      ((data ?? []) as unknown as FacilityAssignmentRecord[]).map(
        (assignment) => assignment.facility_id
      )
    )
  }

  if (role === "pt") {
    const { data, error } = await supabase
      .from("facility_pts")
      .select("facility_id")
      .eq("pt_id", userId)

    if (error) {
      throw new Error(`Unable to load PT facilities: ${error.message}`)
    }

    return getFacilitiesByIds(
      ((data ?? []) as unknown as FacilityAssignmentRecord[]).map(
        (assignment) => assignment.facility_id
      )
    )
  }

  return []
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

export async function getStaffDetailData(
  staffId: string
): Promise<StaffDetailData | null> {
  const supabase = await createClient()
  const { data: staffData, error: staffError } = await supabase
    .from("staffs")
    .select(
      "id, facility_id, full_name, phone, avatar_url, role, status, hired_at, note, created_at, updated_at"
    )
    .eq("id", staffId)
    .maybeSingle()

  if (staffError) {
    throw new Error(`Unable to load staff: ${staffError.message}`)
  }

  const staff = staffData as unknown as StaffRecord | null

  if (staff) {
    return {
      id: staff.id,
      kind: "staff_row",
      name: staff.full_name,
      phone: staff.phone,
      avatarUrl: staff.avatar_url,
      role: staff.role,
      status: staff.status,
      hiredAt: staff.hired_at,
      note: staff.note,
      createdAt: staff.created_at ?? null,
      updatedAt: staff.updated_at ?? null,
      facilities: staff.facility_id
        ? await getFacilitiesByIds([staff.facility_id])
        : [],
    }
  }

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id, full_name, phone, avatar_url, role, created_at, updated_at")
    .eq("id", staffId)
    .maybeSingle()

  if (userError) {
    throw new Error(`Unable to load staff login user: ${userError.message}`)
  }

  const user = userData as unknown as StaffUserRecord | null

  if (!user) {
    return null
  }

  return {
    id: user.id,
    kind: "login_user",
    name: user.full_name,
    phone: user.phone,
    avatarUrl: user.avatar_url,
    role: formatStaffUserRole(user.role),
    status: "active",
    hiredAt: null,
    note: "Login account assigned to this facility",
    createdAt: user.created_at ?? null,
    updatedAt: user.updated_at ?? null,
    facilities: await getLoginUserFacilities(user.id, user.role),
  }
}
