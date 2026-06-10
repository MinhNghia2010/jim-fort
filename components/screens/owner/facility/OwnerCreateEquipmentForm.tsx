"use client"

import { useActionState } from "react"
import { Dumbbell, Loader2, Save } from "lucide-react"

import type { FacilityCreateFormState } from "@/app/(main)/facility/actions"
import { DatePickerField } from "@/components/DatePickerField"
import { FormSelect } from "@/components/FormSelect"
import { PageShell } from "@/components/PageShell"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type CreateEquipmentAction = (
  state: FacilityCreateFormState,
  formData: FormData
) => Promise<FacilityCreateFormState>

interface OwnerCreateEquipmentFormProps {
  action: CreateEquipmentAction
  facility: {
    id: string
    name: string
  }
  room: {
    id: string
    name: string
  }
  backHref: string
}

const equipmentStatusOptions = [
  { value: "active", label: "Active" },
  { value: "maintenance", label: "Maintenance" },
  { value: "broken", label: "Broken" },
  { value: "retired", label: "Retired" },
] as const

export function OwnerCreateEquipmentForm({
  action,
  facility,
  room,
  backHref,
}: OwnerCreateEquipmentFormProps) {
  const [state, formAction, pending] = useActionState(action, {})

  return (
    <PageShell
      backHref={backHref}
      backLabel="Back to room"
      eyebrow={`${facility.name} / ${room.name}`}
      title="Add equipment"
      description="Create an individual machine record with its identifiers, purchase details, and initial status."
    >
      <form action={formAction} className="w-full max-w-5xl">
        <input type="hidden" name="facilityId" value={facility.id} />
        <input type="hidden" name="roomId" value={room.id} />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell aria-hidden="true" className="size-4" />
              Equipment details
            </CardTitle>
            <CardDescription>
              This equipment will be assigned to {room.name}.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <FieldGroup>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="equipment-name">
                    Equipment name
                  </FieldLabel>
                  <Input
                    id="equipment-name"
                    name="name"
                    placeholder="Treadmill 13"
                    maxLength={120}
                    required
                    autoFocus
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="equipment-code">
                    Equipment code
                  </FieldLabel>
                  <Input
                    id="equipment-code"
                    name="equipmentCode"
                    placeholder="TM-013"
                    maxLength={64}
                    autoCapitalize="characters"
                    required
                  />
                  <FieldDescription>
                    Unique within the facility. Letters, numbers, underscores,
                    and hyphens are allowed.
                  </FieldDescription>
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="equipment-category">
                    Category
                  </FieldLabel>
                  <Input
                    id="equipment-category"
                    name="category"
                    placeholder="Treadmill"
                    maxLength={80}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="equipment-status">Status</FieldLabel>
                  <FormSelect
                    id="equipment-status"
                    name="status"
                    options={equipmentStatusOptions}
                    defaultValue="active"
                    required
                  />
                </Field>
              </div>

              <FieldSeparator>Manufacturer</FieldSeparator>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="equipment-brand">Brand</FieldLabel>
                  <Input
                    id="equipment-brand"
                    name="brand"
                    placeholder="Life Fitness"
                    maxLength={100}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="equipment-model">Model</FieldLabel>
                  <Input
                    id="equipment-model"
                    name="model"
                    placeholder="T5"
                    maxLength={100}
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="equipment-serial">
                  Serial number
                </FieldLabel>
                <Input
                  id="equipment-serial"
                  name="serialNumber"
                  placeholder="JF-TM-013-2026"
                  maxLength={120}
                />
              </Field>

              <FieldSeparator>Purchase information</FieldSeparator>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="equipment-purchase-date">
                    Purchase date
                  </FieldLabel>
                  <DatePickerField
                    id="equipment-purchase-date"
                    name="purchaseDate"
                    ariaLabel="Equipment purchase date"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="equipment-purchase-price">
                    Purchase price
                  </FieldLabel>
                  <Input
                    id="equipment-purchase-price"
                    name="purchasePrice"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="2500"
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="equipment-description">
                  Description
                </FieldLabel>
                <Textarea
                  id="equipment-description"
                  name="description"
                  className="min-h-24"
                  placeholder="Describe the machine and its intended use."
                  maxLength={1000}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="equipment-note">Note</FieldLabel>
                <Textarea
                  id="equipment-note"
                  name="note"
                  className="min-h-24"
                  placeholder="Add maintenance, installation, or operational notes."
                  maxLength={1000}
                />
              </Field>
            </FieldGroup>

            {state.error ? (
              <Alert variant="destructive">
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                  Creating equipment
                </>
              ) : (
                <>
                  <Save data-icon="inline-start" />
                  Create equipment
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </PageShell>
  )
}
