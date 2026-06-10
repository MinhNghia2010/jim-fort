"use client"

import { useActionState } from "react"
import { Loader2, MapPin, Save } from "lucide-react"

import type { FacilityCreateFormState } from "@/app/(main)/facility/actions"
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
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type CreateRoomAction = (
  state: FacilityCreateFormState,
  formData: FormData
) => Promise<FacilityCreateFormState>

interface OwnerCreateRoomFormProps {
  action: CreateRoomAction
  facility: {
    id: string
    name: string
  }
  backHref: string
}

const roomStatusOptions = [
  { value: "active", label: "Active" },
  { value: "maintenance", label: "Maintenance" },
  { value: "closed", label: "Closed" },
] as const

export function OwnerCreateRoomForm({
  action,
  facility,
  backHref,
}: OwnerCreateRoomFormProps) {
  const [state, formAction, pending] = useActionState(action, {})

  return (
    <PageShell
      backHref={backHref}
      backLabel="Back to facility"
      eyebrow={facility.name}
      title="Add room"
      description="Create a room and set its initial operating status."
    >
      <form action={formAction} className="w-full max-w-3xl">
        <input type="hidden" name="facilityId" value={facility.id} />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin aria-hidden="true" className="size-4" />
              Room details
            </CardTitle>
            <CardDescription>
              The room will be added to {facility.name}.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <FieldGroup>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="room-name">Room name</FieldLabel>
                  <Input
                    id="room-name"
                    name="name"
                    placeholder="Cardio Room"
                    maxLength={120}
                    required
                    autoFocus
                  />
                  <FieldDescription>
                    Use a clear name that staff and members will recognize.
                  </FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="room-status">Status</FieldLabel>
                  <FormSelect
                    id="room-status"
                    name="status"
                    options={roomStatusOptions}
                    defaultValue="active"
                    required
                  />
                  <FieldDescription>
                    New rooms normally start as active.
                  </FieldDescription>
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="room-description">
                  Description
                </FieldLabel>
                <Textarea
                  id="room-description"
                  name="description"
                  className="min-h-28"
                  placeholder="Describe the room, training area, or intended use."
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
                  Creating room
                </>
              ) : (
                <>
                  <Save data-icon="inline-start" />
                  Create room
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </PageShell>
  )
}
