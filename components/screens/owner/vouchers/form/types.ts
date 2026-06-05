export type VoucherDiscountType = "percentage" | "amount"

export type VoucherStatus = "active" | "disabled" | "expired"

export type VoucherFormMode = "create" | "edit"

export type VoucherFormState = {
  error?: string
}

export const initialVoucherFormState: VoucherFormState = {}

export type VoucherFacilityOption = {
  id: string
  name: string
}

export type VoucherFormValues = {
  facilityId: string
  code: string
  discountType: VoucherDiscountType
  percentage: string
  amount: string
  status: VoucherStatus
  startsAt: string
  expiresAt: string
  quantity: string
}

export type VoucherFormData = {
  voucherCode?: string
  facilities: VoucherFacilityOption[]
  defaultValues: VoucherFormValues
  errorMessage?: string
}
