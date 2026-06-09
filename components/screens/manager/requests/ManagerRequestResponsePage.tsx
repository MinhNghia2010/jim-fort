import { assignSubscriptionPt } from "@/app/(main)/manager-actions"
import { PageShell } from "@/components/PageShell"
import { ManagerActionForm } from "@/components/screens/manager/ManagerActionForm"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/server"
import {
  ManagerScheduleDatePicker,
  ManagerTimeSelect,
  ManagerTrainerSelect,
} from "./ManagerRequestResponseControls"

type Props = {
  requestId: string
}

type RequestRow = {
  id: string
  status: string
  facility_id: string
  users: { full_name: string | null } | null
  membership_packages: { name: string | null } | null
}

type PtRow = {
  pt_id: string
  users: { full_name: string | null } | null
}

type PreferenceRow = {
  sessions_per_week: number
  preferred_pt: { full_name: string | null } | null
  preferred_pt_gender: string
  experience_level: string
  training_goal: string | null
  notes: string | null
  membership_pt_preference_time_slots:
    | { day_of_week: number; start_time: string; end_time: string }[]
    | null
}

type AssignmentRow = {
  status: string
  users: { full_name: string | null } | null
}

const days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]
const weeklySlotIndexes = [0, 1, 2, 3, 4, 5, 6]

export async function ManagerRequestResponsePage({ requestId }: Props) {
  const supabase = await createClient()
  const [requestResult, preferenceResult, assignmentResult] = await Promise.all(
    [
      supabase
        .from("membership_subscriptions")
        .select(
          "id,status,facility_id,users:member_id(full_name),membership_packages(name)"
        )
        .eq("id", requestId)
        .single(),
      supabase
        .from("membership_pt_preferences")
        .select(
          "sessions_per_week,preferred_pt:preferred_pt_id(full_name),preferred_pt_gender,experience_level,training_goal,notes,membership_pt_preference_time_slots(day_of_week,start_time,end_time)"
        )
        .eq("subscription_id", requestId)
        .maybeSingle(),
      supabase
        .from("membership_pt_assignments")
        .select("status,users:pt_id(full_name)")
        .eq("subscription_id", requestId)
        .order("created_at", { ascending: false }),
    ]
  )

  const request = requestResult.data as unknown as RequestRow | null
  const preference = preferenceResult.data as unknown as PreferenceRow | null
  const assignments = (assignmentResult.data ??
    []) as unknown as AssignmentRow[]
  const pendingAssignment = assignments.find(
    (assignment) => assignment.status === "pending_member_decision"
  )
  const preferenceSlots =
    preference?.membership_pt_preference_time_slots?.sort(
      (first, second) =>
        first.day_of_week - second.day_of_week ||
        first.start_time.localeCompare(second.start_time)
    ) ?? []
  const { data: ptData, error: ptError } = request
    ? await supabase
        .from("facility_pts")
        .select("pt_id,users:pt_id(full_name)")
        .eq("facility_id", request.facility_id)
        .order("created_at", { ascending: true })
    : { data: [], error: null }
  const pts = (ptData ?? []) as unknown as PtRow[]
  const error =
    requestResult.error ??
    preferenceResult.error ??
    assignmentResult.error ??
    ptError

  return (
    <PageShell
      eyebrow="Manager"
      title="Create Response"
      description="Propose a trainer and schedule without changing the member request."
      backHref={`/request/${requestId}`}
    >
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Response form could not be loaded</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}

      {request ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem] 2xl:grid-cols-[minmax(0,1fr)_26rem]">
          <Card>
            <CardHeader>
              <CardTitle>Manager response input</CardTitle>
              <CardDescription>
                Choose the trainer, start date, and weekly schedule sent to the
                member.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingAssignment ? (
                <div className="grid gap-3 rounded-lg border bg-muted/30 p-4">
                  <Badge className="w-fit" variant="secondary">
                    Waiting for member decision
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    A pending proposal already exists for{" "}
                    {pendingAssignment.users?.full_name ?? "Trainer"}.
                  </p>
                </div>
              ) : request.status !== "pending_pt_setup" ? (
                <div className="grid gap-3 rounded-lg border bg-muted/30 p-4">
                  <Badge className="w-fit" variant="secondary">
                    Assignment closed
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    This subscription is no longer waiting for PT setup.
                  </p>
                </div>
              ) : (
                <ManagerActionForm
                  action={assignSubscriptionPt}
                  submitLabel="Send response"
                >
                  <input
                    type="hidden"
                    name="subscriptionId"
                    value={request.id}
                  />
                  <FieldGroup>
                    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_18rem]">
                      <Field>
                        <FieldLabel htmlFor="ptId">Trainer</FieldLabel>
                        <ManagerTrainerSelect
                          name="ptId"
                          trainers={pts.map((pt) => ({
                            value: pt.pt_id,
                            label: pt.users?.full_name ?? "Trainer",
                          }))}
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="startsOn">
                          Schedule starts
                        </FieldLabel>
                        <ManagerScheduleDatePicker name="startsOn" />
                      </Field>
                    </div>

                    <Field>
                      <FieldLabel>Proposed weekly schedule</FieldLabel>
                      <FieldDescription>
                        The saved member availability is prefilled where
                        possible.
                      </FieldDescription>
                      <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                        {weeklySlotIndexes.map((index) => {
                          const slot = preferenceSlots.find(
                            (item) => item.day_of_week === index
                          )

                          return (
                            <div
                              key={index}
                              className="flex min-h-36 flex-col gap-3 rounded-lg border p-3"
                            >
                              <div className="flex min-h-6 items-center justify-between gap-2">
                                <p className="text-sm font-medium">
                                  {days[index]}
                                </p>
                                {slot ? (
                                  <Badge variant="secondary">
                                    Member preferred
                                  </Badge>
                                ) : null}
                              </div>
                              <input
                                type="hidden"
                                name={`slotDay${index}`}
                                value={index}
                              />
                              <div className="grid gap-2">
                                <ManagerTimeSelect
                                  name={`slotStart${index}`}
                                  defaultValue={slot?.start_time.slice(0, 5)}
                                  placeholder="Start"
                                />
                                <ManagerTimeSelect
                                  name={`slotEnd${index}`}
                                  defaultValue={slot?.end_time.slice(0, 5)}
                                  placeholder="End"
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="note">Message to member</FieldLabel>
                      <Textarea
                        id="note"
                        name="note"
                        placeholder="Add context about the trainer or schedule"
                      />
                    </Field>
                  </FieldGroup>
                </ManagerActionForm>
              )}
            </CardContent>
          </Card>

          <Card className="h-fit xl:sticky xl:top-6">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="truncate">
                    {request.users?.full_name ?? "Member"}
                  </CardTitle>
                  <CardDescription className="truncate">
                    {request.membership_packages?.name ?? "Membership"}
                  </CardDescription>
                </div>
                <Badge className="shrink-0">
                  {request.status.replaceAll("_", " ")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 text-sm">
              <div className="grid gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Preferred PT</p>
                  <p className="font-medium">
                    {preference?.preferred_pt?.full_name ?? "No preference"}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                  <div>
                    <p className="text-xs text-muted-foreground">Gender</p>
                    <p className="font-medium">
                      {preference?.preferred_pt_gender?.replaceAll("_", " ") ??
                        "No preference"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Experience</p>
                    <p className="font-medium">
                      {preference?.experience_level?.replaceAll("_", " ") ??
                        "No preference"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Sessions</p>
                    <p className="font-medium">
                      {preference?.sessions_per_week ?? 0} per week
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Goal</p>
                  <p className="font-medium">
                    {preference?.training_goal ?? "Not entered"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <p className="font-medium">
                    {preference?.notes ?? "No notes"}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <p className="font-medium">Member availability</p>
                {preferenceSlots.length ? (
                  <div className="flex flex-wrap gap-2">
                    {preferenceSlots.map((slot) => (
                      <Badge
                        key={`${slot.day_of_week}-${slot.start_time}-${slot.end_time}`}
                        variant="secondary"
                      >
                        {days[slot.day_of_week]} {slot.start_time.slice(0, 5)}-
                        {slot.end_time.slice(0, 5)}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    No availability slots saved.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </PageShell>
  )
}
