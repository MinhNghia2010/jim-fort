"use client"

import { useActionState, useMemo, useState } from "react"
import Link from "next/link"
import {
  BadgePercent,
  CalendarDays,
  CircleAlert,
  CirclePlus,
  Loader2,
  Save,
  TicketCheck,
} from "lucide-react"

import { DatePickerInput } from "@/components/DatePickerInput"
import { PageShell } from "@/components/PageShell"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type {
  VoucherDiscountType,
  VoucherFormData,
  VoucherFormMode,
  VoucherFormState,
  VoucherStatus,
} from "@/components/screens/owner/vouchers/form/types"
import { initialVoucherFormState } from "@/components/screens/owner/vouchers/form/types"

export type VoucherFormAction = (
  state: VoucherFormState,
  formData: FormData
) => Promise<VoucherFormState>

interface VoucherFormProps {
  data: VoucherFormData
  action: VoucherFormAction
  mode?: VoucherFormMode
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

function formatAmount(value: string) {
  const number = Number(value)

  if (!Number.isFinite(number)) {
    return "$0"
  }

  return currencyFormatter.format(number)
}

function formatDiscount(
  discountType: VoucherDiscountType,
  percentage: string,
  amount: string
) {
  if (discountType === "percentage") {
    return `${percentage || "0"}% off`
  }

  return `${formatAmount(amount)} off`
}

function formatDateLabel(value: string, fallback: string) {
  if (!value) {
    return fallback
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`))
}

export function VoucherForm({
  data,
  action,
  mode = "create",
}: VoucherFormProps) {
  const [facilityId, setFacilityId] = useState(data.defaultValues.facilityId)
  const [code, setCode] = useState(data.defaultValues.code)
  const [discountType, setDiscountType] = useState<VoucherDiscountType>(
    data.defaultValues.discountType
  )
  const [percentage, setPercentage] = useState(data.defaultValues.percentage)
  const [amount, setAmount] = useState(data.defaultValues.amount)
  const [status, setStatus] = useState<VoucherStatus>(data.defaultValues.status)
  const [startsAt, setStartsAt] = useState(data.defaultValues.startsAt)
  const [expiresAt, setExpiresAt] = useState(data.defaultValues.expiresAt)
  const [quantity, setQuantity] = useState(data.defaultValues.quantity)
  const [state, formAction, pending] = useActionState(
    action,
    initialVoucherFormState
  )

  const facilityName = useMemo(
    () =>
      data.facilities.find((facility) => facility.id === facilityId)?.name ??
      "Select a facility",
    [data.facilities, facilityId]
  )
  const discountLabel = formatDiscount(discountType, percentage, amount)
  const quantityLabel = `${quantity || "0"} redemption${
    quantity === "1" ? "" : "s"
  }`
  const isEditMode = mode === "edit"

  return (
    <PageShell
      backHref="/vouchers"
      backLabel="Back to vouchers"
      title={isEditMode ? "Edit voucher" : "Create voucher"}
      description={
        isEditMode
          ? "Update the voucher code, discount, launch window, and quantity."
          : "Create a real discount code with launch dates, end dates, and a redemption quantity."
      }
    >
      {data.errorMessage ? (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertTitle>Voucher form data could not be loaded</AlertTitle>
          <AlertDescription>{data.errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <form action={formAction} className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        {data.voucherCode ? (
          <input type="hidden" name="originalCode" value={data.voucherCode} />
        ) : null}
        <input type="hidden" name="facilityId" value={facilityId} />
        <input type="hidden" name="discountType" value={discountType} />
        <input type="hidden" name="status" value={status} />

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Voucher details</CardTitle>
              <CardDescription>
                Select the facility, code, and current status.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel>Facility</FieldLabel>
                    <Select
                      value={facilityId}
                      onValueChange={setFacilityId}
                      disabled={!data.facilities.length}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select facility" />
                      </SelectTrigger>
                      <SelectContent>
                        {data.facilities.map((facility) => (
                          <SelectItem key={facility.id} value={facility.id}>
                            {facility.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel>Status</FieldLabel>
                    <Select
                      value={status}
                      onValueChange={(nextStatus) =>
                        setStatus(nextStatus as VoucherStatus)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="disabled">Disabled</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="voucher-code">Voucher code</FieldLabel>
                  <Input
                    id="voucher-code"
                    name="code"
                    value={code}
                    onChange={(event) =>
                      setCode(event.target.value.toUpperCase())
                    }
                    placeholder="SUMMER2026"
                    required
                  />
                  <FieldDescription>
                    Use letters, numbers, underscores, or hyphens. Codes are
                    saved uppercase.
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Discount and availability</CardTitle>
              <CardDescription>
                Configure the discount, launch window, and redemption quantity.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel>Discount type</FieldLabel>
                    <Select
                      value={discountType}
                      onValueChange={(nextDiscountType) =>
                        setDiscountType(nextDiscountType as VoucherDiscountType)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select discount type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="amount">Fixed amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  {discountType === "percentage" ? (
                    <Field>
                      <FieldLabel htmlFor="voucher-percentage">
                        Percentage off
                      </FieldLabel>
                      <Input
                        id="voucher-percentage"
                        name="percentage"
                        type="number"
                        min="1"
                        max="100"
                        step="0.01"
                        value={percentage}
                        onChange={(event) => setPercentage(event.target.value)}
                        required
                      />
                    </Field>
                  ) : (
                    <Field>
                      <FieldLabel htmlFor="voucher-amount">
                        Amount off
                      </FieldLabel>
                      <Input
                        id="voucher-amount"
                        name="amount"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={amount}
                        onChange={(event) => setAmount(event.target.value)}
                        required
                      />
                    </Field>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <Field>
                    <FieldLabel htmlFor="voucher-starts-at">
                      Launch date
                    </FieldLabel>
                    <DatePickerInput
                      id="voucher-starts-at"
                      name="startsAt"
                      value={startsAt}
                      onChange={setStartsAt}
                      ariaLabel="Voucher launch date"
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="voucher-expires-at">
                      End date
                    </FieldLabel>
                    <DatePickerInput
                      id="voucher-expires-at"
                      name="expiresAt"
                      min={startsAt || undefined}
                      value={expiresAt}
                      onChange={setExpiresAt}
                      ariaLabel="Voucher end date"
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="voucher-quantity">Quantity</FieldLabel>
                    <Input
                      id="voucher-quantity"
                      name="quantity"
                      type="number"
                      min="1"
                      step="1"
                      value={quantity}
                      onChange={(event) => setQuantity(event.target.value)}
                      required
                    />
                  </Field>
                </div>
              </FieldGroup>
            </CardContent>
          </Card>

          {state.error ? (
            <Alert variant="destructive">
              <CircleAlert />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-col gap-2 rounded-xl border bg-card p-3 sm:flex-row sm:justify-end">
            <Button variant="outline" asChild>
              <Link href="/vouchers">Cancel</Link>
            </Button>
            <Button type="submit" disabled={pending || !data.facilities.length}>
              {pending ? (
                <>
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                  Saving
                </>
              ) : (
                <>
                  {isEditMode ? (
                    <Save data-icon="inline-start" />
                  ) : (
                    <CirclePlus data-icon="inline-start" />
                  )}
                  {isEditMode ? "Save changes" : "Create voucher"}
                </>
              )}
            </Button>
          </div>
        </div>

        <Card className="h-fit lg:sticky lg:top-8">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Voucher preview</CardTitle>
                <CardDescription>{facilityName}</CardDescription>
              </div>
              <Badge variant="outline" className="capitalize">
                {status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BadgePercent aria-hidden="true" className="size-4" />
                Discount code
              </div>
              <div className="mt-3 font-mono text-2xl font-semibold tracking-tight">
                {code || "VOUCHER2026"}
              </div>
              <p className="mt-1 text-sm font-medium">{discountLabel}</p>
            </div>

            <div className="grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays aria-hidden="true" className="size-4" />
                  Launch
                </span>
                <span className="font-mono text-xs">
                  {formatDateLabel(startsAt, "Not set")}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays aria-hidden="true" className="size-4" />
                  End
                </span>
                <span className="font-mono text-xs">
                  {formatDateLabel(expiresAt, "Not set")}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <TicketCheck aria-hidden="true" className="size-4" />
                  Quantity
                </span>
                <span className="font-mono text-xs">{quantityLabel}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            The saved quantity becomes the maximum redemption count for this
            code.
          </CardFooter>
        </Card>
      </form>
    </PageShell>
  )
}
