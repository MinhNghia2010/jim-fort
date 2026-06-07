"use client"

import { useActionState, useMemo, useState } from "react"
import Link from "next/link"
import { Archive, CircleAlert, CirclePlus, Loader2, Save } from "lucide-react"

<<<<<<< HEAD
=======
import { DatePickerField } from "@/components/DatePickerField"
>>>>>>> e3a4dbaba5182d183b9e8334e2e297b4e443febd
import { PageShell } from "@/components/PageShell"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldContent,
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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { MembershipColorPicker } from "@/components/screens/owner/memberships/form/MembershipColorPicker"
import { MembershipFeatureEditor } from "@/components/screens/owner/memberships/form/MembershipFeatureEditor"
import { MembershipPlanPreview } from "@/components/screens/owner/memberships/form/MembershipPlanPreview"
import { MembershipRoomSelector } from "@/components/screens/owner/memberships/form/MembershipRoomSelector"
import type {
  MembershipFormMode,
  MembershipFormState,
  MembershipPackageFormData,
  MembershipPackageFormValues,
  MembershipPlanKind,
  MembershipStatus,
} from "@/components/screens/owner/memberships/form/types"
import { initialMembershipFormState } from "@/components/screens/owner/memberships/form/types"

export type MembershipFormAction = (
  state: MembershipFormState,
  formData: FormData
) => Promise<MembershipFormState>

interface MembershipPackageFormProps {
  mode: MembershipFormMode
  data: MembershipPackageFormData
  action: MembershipFormAction
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

function formatCurrency(value: string) {
  const number = Number(value)

  if (!Number.isFinite(number)) {
    return "$0"
  }

  return currencyFormatter.format(number)
}

function formatTerm(planKind: MembershipPlanKind, value: string) {
  const number = Number(value)

  if (!Number.isFinite(number) || number <= 0) {
    return planKind === "pt" ? "0 sessions" : "0 days"
  }

  if (planKind === "pt") {
    return `${number} ${number === 1 ? "session" : "sessions"}`
  }

  if (number % 365 === 0) {
    const years = number / 365
    return `${years} ${years === 1 ? "year" : "years"}`
  }

  if (number % 30 === 0) {
    const months = number / 30
    return `${months} ${months === 1 ? "month" : "months"}`
  }

  return `${number} days`
}

function formatDateLabel(value: string) {
  if (!value) {
    return null
  }

  const date = new Date(`${value}T00:00:00.000Z`)

  if (Number.isNaN(date.valueOf())) {
    return null
  }

  return dateFormatter.format(date)
}

function formatAvailabilityFeature(releaseDate: string, endDate: string) {
  const releaseDateLabel = formatDateLabel(releaseDate)
  const endDateLabel = formatDateLabel(endDate)

  if (releaseDateLabel && endDateLabel) {
    return `Available ${releaseDateLabel} through ${endDateLabel}`
  }

  if (releaseDateLabel) {
    return `Available from ${releaseDateLabel}`
  }

  if (endDateLabel) {
    return `Available until ${endDateLabel}`
  }

  return "Available immediately"
}

function visibleFeatures(
  features: readonly string[],
  fallbackFeatures: readonly string[]
) {
  const cleanedFeatures = features
    .map((feature) => feature.trim())
    .filter(Boolean)

  return [...new Set([...fallbackFeatures, ...cleanedFeatures])]
}

export function MembershipPackageForm({
  mode,
  data,
  action,
}: MembershipPackageFormProps) {
  const initialValues =
    mode === "edit" && data.selectedPackage
      ? data.selectedPackage
      : data.defaultValues
  const [packageId, setPackageId] = useState(initialValues.id)
  const [facilityId, setFacilityId] = useState(initialValues.facilityId)
  const [name, setName] = useState(initialValues.name)
  const [description, setDescription] = useState(initialValues.description)
  const [price, setPrice] = useState(initialValues.price)
  const [planKind, setPlanKind] = useState<MembershipPlanKind>(
    initialValues.planKind
  )
  const [durationDays, setDurationDays] = useState(initialValues.durationDays)
  const [sessionCount, setSessionCount] = useState(initialValues.sessionCount)
  const [status, setStatus] = useState<MembershipStatus>(initialValues.status)
  const [releaseDate, setReleaseDate] = useState(initialValues.releaseDate)
  const [endDate, setEndDate] = useState(initialValues.endDate)
  const [color, setColor] = useState(initialValues.color)
  const [roomIds, setRoomIds] = useState<string[]>(initialValues.roomIds)
  const [features, setFeatures] = useState<string[]>(initialValues.features)
  const [activeMembers, setActiveMembers] = useState(
    initialValues.activeMembers
  )
  const [revenueLabel, setRevenueLabel] = useState(initialValues.revenueLabel)
  const [state, formAction, pending] = useActionState(
    action,
    initialMembershipFormState
  )

  const roomsForFacility = useMemo(
    () => data.rooms.filter((room) => room.facilityId === facilityId),
    [data.rooms, facilityId]
  )
  const selectedRoomNames = useMemo(
    () =>
      roomsForFacility
        .filter((room) => roomIds.includes(room.id))
        .map((room) => room.name),
    [roomIds, roomsForFacility]
  )
  const fallbackFeatures = useMemo(() => {
    const accessLabel =
      planKind === "pt"
        ? `${sessionCount || "0"} personal training sessions`
        : `${durationDays || "0"} days of facility access`
    const roomLabel = selectedRoomNames.length
      ? `Room access: ${selectedRoomNames.join(", ")}`
      : "No room access assigned"
    const availabilityLabel = formatAvailabilityFeature(releaseDate, endDate)

    return planKind === "pt"
      ? [
          accessLabel,
          roomLabel,
          availabilityLabel,
          "Personal trainer assignment included",
        ]
      : [accessLabel, roomLabel, availabilityLabel]
  }, [
    durationDays,
    endDate,
    planKind,
    releaseDate,
    selectedRoomNames,
    sessionCount,
  ])
  const previewFeatures = visibleFeatures(features, fallbackFeatures)
  const termLabel = formatTerm(
    planKind,
    planKind === "pt" ? sessionCount : durationDays
  )

  function applyValues(nextValues: MembershipPackageFormValues) {
    setPackageId(nextValues.id)
    setFacilityId(nextValues.facilityId)
    setName(nextValues.name)
    setDescription(nextValues.description)
    setPrice(nextValues.price)
    setPlanKind(nextValues.planKind)
    setDurationDays(nextValues.durationDays)
    setSessionCount(nextValues.sessionCount)
    setStatus(nextValues.status)
    setReleaseDate(nextValues.releaseDate)
    setEndDate(nextValues.endDate)
    setColor(nextValues.color)
    setRoomIds(nextValues.roomIds)
    setFeatures(nextValues.features)
    setActiveMembers(nextValues.activeMembers)
    setRevenueLabel(nextValues.revenueLabel)
  }

  function handleFacilityChange(nextFacilityId: string) {
    setFacilityId(nextFacilityId)
    const nextFacilityRoomIds = new Set(
      data.rooms
        .filter((room) => room.facilityId === nextFacilityId)
        .map((room) => room.id)
    )
    setRoomIds((currentRoomIds) =>
      currentRoomIds.filter((roomId) => nextFacilityRoomIds.has(roomId))
    )
  }

  const title =
    mode === "create" ? "Create membership plan" : "Edit membership plan"
  const descriptionText =
    mode === "create"
      ? "Build a package from real facility, room, and pricing data."
      : "Update an existing package and preview the card before saving."
  const canEdit = mode === "create" || data.packages.length > 0

  if (!canEdit) {
    return (
      <PageShell
        backHref="/memberships"
        backLabel="Back to memberships"
        title={title}
        description={descriptionText}
      >
        <Card>
          <CardHeader>
            <CardTitle>No membership plans found</CardTitle>
            <CardDescription>
              Create a package before opening the edit form.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/memberships/create">
                <CirclePlus data-icon="inline-start" />
                Create membership
              </Link>
            </Button>
          </CardContent>
        </Card>
      </PageShell>
    )
  }

  return (
    <PageShell
      backHref="/memberships"
      backLabel="Back to memberships"
      title={title}
      description={descriptionText}
    >
      {data.errorMessage ? (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertTitle>Membership form data could not be loaded</AlertTitle>
          <AlertDescription>{data.errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <form
        action={formAction}
        className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_23rem]"
      >
        <input type="hidden" name="id" value={packageId} />
        <input type="hidden" name="facilityId" value={facilityId} />
        <input type="hidden" name="planKind" value={planKind} />
        <input type="hidden" name="status" value={status} />
        <input type="hidden" name="color" value={color} />
        {roomIds.map((roomId) => (
          <input key={roomId} type="hidden" name="roomIds" value={roomId} />
        ))}
        {features.map((feature, index) => (
          <input key={index} type="hidden" name="features" value={feature} />
        ))}

        <div className="flex min-w-0 flex-col gap-4">
          {mode === "edit" ? (
            <Card>
              <CardHeader>
                <CardTitle>Plan to edit</CardTitle>
                <CardDescription>
                  Select any package available to your role.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Field>
                  <FieldLabel>Membership plan</FieldLabel>
                  <Select
                    value={packageId}
                    onValueChange={(nextPackageId) => {
                      const nextValues = data.packages.find(
                        (membershipPackage) =>
                          membershipPackage.id === nextPackageId
                      )

                      if (nextValues) {
                        applyValues(nextValues)
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {data.packages.map((membershipPackage) => (
                        <SelectItem
                          key={membershipPackage.id}
                          value={membershipPackage.id}
                        >
                          {membershipPackage.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Plan details</CardTitle>
              <CardDescription>
                Name, facility, availability, and description.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="membership-name">Plan name</FieldLabel>
                  <Input
                    id="membership-name"
                    name="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Elite 1 Year"
                    required
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel>Facility</FieldLabel>
                    <Select
                      value={facilityId}
                      onValueChange={handleFacilityChange}
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
                </div>

                <Field
                  orientation="horizontal"
                  data-disabled={status === "archived" ? true : undefined}
                  className="rounded-xl border bg-card p-3"
                >
                  <FieldContent>
                    <FieldLabel htmlFor="membership-active">
                      {status === "archived" ? "Archived plan" : "Active plan"}
                    </FieldLabel>
                    <FieldDescription>
                      {status === "archived"
                        ? "Archived plans cannot be toggled active from this form."
                        : "Turn this on when the plan should be available to sell."}
                    </FieldDescription>
                  </FieldContent>
                  <Switch
                    id="membership-active"
                    checked={status === "active"}
                    disabled={status === "archived"}
                    onCheckedChange={(checked) =>
                      setStatus(checked ? "active" : "inactive")
                    }
                    aria-label="Set membership plan active"
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
<<<<<<< HEAD
                  <Field>
                    <FieldLabel htmlFor="membership-release-date">
                      Release date
                    </FieldLabel>
                    <Input
                      id="membership-release-date"
                      name="releaseDate"
                      type="date"
                      value={releaseDate}
                      onChange={(event) => setReleaseDate(event.target.value)}
                    />
                    <FieldDescription>
                      Leave empty to release this plan immediately.
                    </FieldDescription>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="membership-end-date">
                      End date
                    </FieldLabel>
                    <Input
                      id="membership-end-date"
                      name="endDate"
                      type="date"
                      min={releaseDate || undefined}
                      value={endDate}
                      onChange={(event) => setEndDate(event.target.value)}
                    />
                    <FieldDescription>
                      Optional. Leave empty if the plan has no end date.
                    </FieldDescription>
                  </Field>
=======
                  <DatePickerField
                    id="membership-release-date"
                    name="releaseDate"
                    label="Release date"
                    value={releaseDate}
                    onChange={setReleaseDate}
                    description="Leave empty to release this plan immediately."
                    placeholder="Release immediately"
                  />

                  <DatePickerField
                    id="membership-end-date"
                    name="endDate"
                    label="End date"
                    value={endDate}
                    onChange={setEndDate}
                    description="Optional. Leave empty if the plan has no end date."
                    placeholder="No end date"
                    minDate={releaseDate}
                  />
>>>>>>> e3a4dbaba5182d183b9e8334e2e297b4e443febd
                </div>

                <Field>
                  <FieldLabel htmlFor="membership-description">
                    Description
                  </FieldLabel>
                  <Textarea
                    id="membership-description"
                    name="description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Best for committed members who need full access."
                    rows={3}
                  />
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pricing and package type</CardTitle>
              <CardDescription>
                Non-PT plans use duration days. PT plans use session count.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="membership-price">Price</FieldLabel>
                    <Input
                      id="membership-price"
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(event) => setPrice(event.target.value)}
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Package type</FieldLabel>
                    <Select
                      value={planKind}
                      onValueChange={(nextPlanKind) =>
                        setPlanKind(nextPlanKind as MembershipPlanKind)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="access">Facility access</SelectItem>
                        <SelectItem value="pt">Personal training</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                {planKind === "pt" ? (
                  <Field>
                    <FieldLabel htmlFor="membership-session-count">
                      Session count
                    </FieldLabel>
                    <Input
                      id="membership-session-count"
                      name="sessionCount"
                      type="number"
                      min="1"
                      step="1"
                      value={sessionCount}
                      onChange={(event) => setSessionCount(event.target.value)}
                      required
                    />
                  </Field>
                ) : (
                  <Field>
                    <FieldLabel htmlFor="membership-duration-days">
                      Duration days
                    </FieldLabel>
                    <Input
                      id="membership-duration-days"
                      name="durationDays"
                      type="number"
                      min="1"
                      step="1"
                      value={durationDays}
                      onChange={(event) => setDurationDays(event.target.value)}
                      required
                    />
                  </Field>
                )}
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Room access</CardTitle>
              <CardDescription>
                Assign rooms from the selected facility.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MembershipRoomSelector
                rooms={roomsForFacility}
                selectedRoomIds={roomIds}
                onChange={setRoomIds}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Card style and preview highlights</CardTitle>
              <CardDescription>
                These controls tune the live card preview. The persisted data is
                still the package fields above.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel>Color</FieldLabel>
                  <MembershipColorPicker value={color} onChange={setColor} />
                </Field>

                <Field>
                  <FieldLabel>Preview highlights</FieldLabel>
                  <MembershipFeatureEditor
                    features={features}
                    onChange={setFeatures}
                  />
                  <FieldDescription>
                    Duration and room access stay in the preview. Add optional
                    highlights here for extra selling points.
                  </FieldDescription>
                </Field>
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
            {mode === "edit" ? (
              <Button
                type="submit"
                name="_intent"
                value="archive"
                variant="destructive"
                disabled={pending}
                formNoValidate
              >
                <Archive data-icon="inline-start" />
                Archive plan
              </Button>
            ) : null}
            <Button variant="outline" asChild>
              <Link href="/memberships">Cancel</Link>
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                  Saving
                </>
              ) : mode === "create" ? (
                <>
                  <CirclePlus data-icon="inline-start" />
                  Create membership
                </>
              ) : (
                <>
                  <Save data-icon="inline-start" />
                  Save changes
                </>
              )}
            </Button>
          </div>
        </div>

        <aside className="h-fit lg:sticky lg:top-8">
          <div className="flex flex-col gap-3">
            <div>
              <h2 className="font-heading text-lg font-semibold tracking-tight">
                Plan card preview
              </h2>
              <p className="text-sm text-muted-foreground">
                This mirrors the membership card shown on the listing page.
              </p>
            </div>
            <MembershipPlanPreview
              name={name}
              description={description}
              priceLabel={formatCurrency(price)}
              termLabel={termLabel}
              status={status}
              color={color}
              features={previewFeatures}
              activeMembers={activeMembers}
              revenueLabel={revenueLabel}
            />
            {mode === "edit" ? (
              <p className="text-xs text-muted-foreground">
                Member and revenue numbers are read-only statistics from the
                current package.
              </p>
            ) : null}
          </div>
        </aside>
      </form>
    </PageShell>
  )
}
