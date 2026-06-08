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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/server"

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

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const weeklySlotIndexes = [0, 1, 2, 3, 4, 5, 6]

export async function ManagerRequestResponsePage({ requestId }: Props) {
  const supabase = await createClient()
  const [requestResult, preferenceResult, assignmentResult] = await Promise.all([
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
  ])

  const request = requestResult.data as unknown as RequestRow | null
  const preference = preferenceResult.data as unknown as PreferenceRow | null
  const assignments = (assignmentResult.data ?? []) as unknown as AssignmentRow[]
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
      backLabel="Request detail"
    >
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Response form could not be loaded</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}

      {request ? (
        <div className="grid gap-4 xl:grid-cols-[1fr_460px]">
          <Card>
            <CardHeader>
              <CardTitle>{request.users?.full_name ?? "Member"}</CardTitle>
              <CardDescription>
                {request.membership_packages?.name ?? "Membership"}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Badge className="w-fit">
                {request.status.replaceAll("_", " ")}
              </Badge>
              <div className="rounded-lg border p-4">
                <p className="font-medium">Member request summary</p>
                <div className="my-3 grid gap-2 text-sm sm:grid-cols-2">
                  <p>
                    <span className="text-muted-foreground">Preferred PT:</span>{" "}
                    {preference?.preferred_pt?.full_name ?? "No preference"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Gender:</span>{" "}
                    {preference?.preferred_pt_gender?.replaceAll("_", " ") ??
                      "No preference"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Experience:</span>{" "}
                    {preference?.experience_level?.replaceAll("_", " ") ??
                      "No preference"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Weekly sessions:</span>{" "}
                    {preference?.sessions_per_week ?? 0}
                  </p>
                  <p className="sm:col-span-2">
                    <span className="text-muted-foreground">Goal:</span>{" "}
                    {preference?.training_goal ?? "Not entered"}
                  </p>
                  <p className="sm:col-span-2">
                    <span className="text-muted-foreground">Notes:</span>{" "}
                    {preference?.notes ?? "No notes"}
                  </p>
                </div>
                <p className="mb-3 font-medium">Member availability</p>
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
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Manager response form</CardTitle>
              <CardDescription>
                Choose trainer and proposed schedule for member decision.
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
                  <input type="hidden" name="subscriptionId" value={request.id} />
                  <div className="grid gap-2">
                    <Label htmlFor="ptId">Trainer</Label>
                    <NativeSelect id="ptId" name="ptId" className="w-full">
                      {pts.map((pt) => (
                        <option key={pt.pt_id} value={pt.pt_id}>
                          {pt.users?.full_name ?? "Trainer"}
                        </option>
                      ))}
                    </NativeSelect>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="startsOn">Schedule starts</Label>
                    <Input id="startsOn" name="startsOn" type="date" />
                  </div>
                  <div className="grid gap-3">
                    {weeklySlotIndexes.map((index) => (
                      <div
                        key={index}
                        className="grid gap-2 rounded-lg border p-3"
                      >
                        <Label>{days[index]}</Label>
                        <input
                          type="hidden"
                          name={`slotDay${index}`}
                          value={index}
                        />
                        <Input name={`slotStart${index}`} type="time" />
                        <Input name={`slotEnd${index}`} type="time" />
                      </div>
                    ))}
                  </div>
                  <Textarea name="note" placeholder="Message shown to member" />
                </ManagerActionForm>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </PageShell>
  )
}
