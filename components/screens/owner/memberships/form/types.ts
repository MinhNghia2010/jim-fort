export type MembershipStatus = "active" | "inactive" | "archived"

export type MembershipPlanKind = "access" | "pt"

export type MembershipFormMode = "create" | "edit"

export type MembershipFormState = {
  error?: string
}

export const initialMembershipFormState: MembershipFormState = {}

export type MembershipFacilityOption = {
  id: string
  name: string
}

export type MembershipRoomOption = {
  id: string
  facilityId: string
  name: string
}

export type MembershipPackageFormValues = {
  id: string
  facilityId: string
  name: string
  description: string
  price: string
  planKind: MembershipPlanKind
  durationDays: string
  sessionCount: string
  status: MembershipStatus
  releaseDate: string
  endDate: string
  roomIds: string[]
  color: string
  features: string[]
  activeMembers: number
  revenueLabel: string
}

export type MembershipPackageFormData = {
  facilities: MembershipFacilityOption[]
  rooms: MembershipRoomOption[]
  packages: MembershipPackageFormValues[]
  defaultValues: MembershipPackageFormValues
  selectedPackage: MembershipPackageFormValues | null
  errorMessage?: string
}
