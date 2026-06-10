"use client"

import Link from "next/link"
import { useMemo, useState } from "react"

import { createStaff } from "@/app/(main)/staffs/actions"
import { DatePickerField } from "@/components/DatePickerField"
import { FormSelect, type FormSelectOption } from "@/components/FormSelect"
import { ManagerActionForm } from "@/components/screens/manager/ManagerActionForm"
import type { StaffFacilityOption } from "@/app/(main)/staffs/data"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type StaffCreateKind = "staff_row" | "manager" | "pt"

interface StaffCreateFormProps {
  facilities: readonly StaffFacilityOption[]
  canCreateLoginUsers: boolean
}

const baseKindOptions = [
  { value: "staff_row", label: "Directory staff" },
] as const

const ownerKindOptions = [
  ...baseKindOptions,
  { value: "manager", label: "Manager login account" },
  { value: "pt", label: "PT login account" },
] as const

const staffStatusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "on_leave", label: "On leave" },
  { value: "terminated", label: "Terminated" },
] as const

function todayInputValue() {
  const now = new Date()

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-")
}

export function StaffCreateForm({
  facilities,
  canCreateLoginUsers,
}: StaffCreateFormProps) {
  const [staffKind, setStaffKind] = useState<StaffCreateKind>("staff_row")
  const kindOptions = canCreateLoginUsers ? ownerKindOptions : baseKindOptions
  const facilityOptions: FormSelectOption[] = useMemo(
    () =>
      facilities.map((facility) => ({
        value: facility.id,
        label: facility.name,
      })),
    [facilities]
  )
  const isLoginUser = staffKind === "manager" || staffKind === "pt"

  return (
    <ManagerActionForm
      action={createStaff}
      submitLabel="Create staff"
      pendingLabel="Creating"
      successMessage="Staff created"
      secondaryAction={
        <Button asChild variant="outline">
          <Link href="/staffs">Cancel</Link>
        </Button>
      }
      actionsClassName="sm:flex-row"
    >
      <FieldGroup>
        {canCreateLoginUsers ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="staffKind">Staff type</FieldLabel>
              <FormSelect
                id="staffKind"
                name="staffKind"
                options={kindOptions}
                value={staffKind}
                onValueChange={(value) =>
                  setStaffKind(value as StaffCreateKind)
                }
              />
              <FieldDescription>
                Manager and PT types create login accounts and facility
                assignments.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="facilityId">Facility</FieldLabel>
              <FormSelect
                id="facilityId"
                name="facilityId"
                options={facilityOptions}
                defaultValue={facilities[0]?.id}
                placeholder="Select facility"
                required
              />
            </Field>
          </div>
        ) : (
          <Field>
            <FieldLabel htmlFor="facilityId">Facility</FieldLabel>
            <FormSelect
              id="facilityId"
              name="facilityId"
              options={facilityOptions}
              defaultValue={facilities[0]?.id}
              placeholder="Select facility"
              required
            />
          </Field>
        )}

        {canCreateLoginUsers ? null : (
          <input type="hidden" name="staffKind" value="staff_row" />
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="fullName">Full name</FieldLabel>
            <Input
              id="fullName"
              name="fullName"
              placeholder="Staff full name"
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="phone">Phone</FieldLabel>
            <Input id="phone" name="phone" placeholder="Phone number" />
          </Field>
        </div>

        {isLoginUser ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={`${staffKind}@example.com`}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Temporary password</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                minLength={8}
                placeholder="At least 8 characters"
                required
              />
              <FieldDescription>
                The account is email-confirmed immediately for first login.
              </FieldDescription>
            </Field>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            <Field>
              <FieldLabel htmlFor="role">Role</FieldLabel>
              <Input
                id="role"
                name="role"
                placeholder="front desk, cleaner..."
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="status">Status</FieldLabel>
              <FormSelect
                id="status"
                name="status"
                options={staffStatusOptions}
                defaultValue="active"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="hiredAt">Hired date</FieldLabel>
              <DatePickerField
                id="hiredAt"
                name="hiredAt"
                defaultValue={todayInputValue()}
                ariaLabel="Staff hired date"
              />
            </Field>
          </div>
        )}

        {isLoginUser ? null : (
          <Field>
            <FieldLabel htmlFor="note">Notes</FieldLabel>
            <Textarea
              id="note"
              name="note"
              placeholder="Optional internal staff note"
            />
            <FieldDescription>
              Notes are visible in the staff directory and detail page.
            </FieldDescription>
          </Field>
        )}

        {isLoginUser ? (
          <input type="hidden" name="hiredAt" value="" />
        ) : null}
      </FieldGroup>
    </ManagerActionForm>
  )
}
