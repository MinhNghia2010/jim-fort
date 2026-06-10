import { Check, UserCheck, X } from "lucide-react"

import {
  cancelPendingSubscription,
  decidePtAssignment,
  savePtPreference,
} from "@/app/(main)/member-actions"
import { PageShell } from "@/components/PageShell"
import { MemberActionForm } from "@/components/screens/member/MemberActionForm"
import { MemberPaymentForm } from "@/components/screens/member/subscriptions/MemberPaymentForm"
import { StatusBadge } from "@/components/StatusBadge"
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
import { cn } from "@/lib/utils"

type Props = {
  subscriptionId: string
}

type SubscriptionRow = {
  id: string
  status: string
  base_price: number | string
  discount_amount: number | string
  final_price: number | string
  has_pt_snapshot: boolean
  session_count_snapshot: number | null
  membership_packages: { name: string | null } | null
  gym_facilities: { name: string | null } | null
}

type PtRow = {
  pt_id: string
  users: { full_name: string | null } | null
}

type AssignmentRow = {
  id: string
  status: string
  schedule_note: string | null
  users: { full_name: string | null } | null
  membership_pt_assignment_schedule_slots:
    | { day_of_week: number; start_time: string; end_time: string }[]
    | null
}

type PreferenceRow = {
  id: string
  preferred_pt_id: string | null
  preferred_pt_gender: string
  experience_level: string
  training_goal: string | null
  notes: string | null
  sessions_per_week: number
  membership_pt_preference_time_slots:
    | { day_of_week: number; start_time: string; end_time: string }[]
    | null
}

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

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

function money(value: number | string) {
  return currency.format(Number(value) || 0)
}

function PaymentSummaryCard({
  subscription,
}: {
  subscription: SubscriptionRow
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment summary</CardTitle>
        <CardDescription>
          {subscription.gym_facilities?.name ?? "Jim Fort"}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Plan</span>
          <span className="text-right font-medium">
            {subscription.membership_packages?.name ?? "Membership"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Status</span>
          <StatusBadge status={subscription.status} showDot />
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Base</span>
          <span className="font-medium">{money(subscription.base_price)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Discount</span>
          <span className="font-medium">
            {money(subscription.discount_amount)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 border-t pt-3 text-base">
          <span className="font-medium">Total</span>
          <span className="font-semibold">
            {money(subscription.final_price)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

export async function MemberSubscriptionDetailPage({ subscriptionId }: Props) {
  const supabase = await createClient()
  const [subscriptionResult, ptResult, preferenceResult, assignmentResult] =
    await Promise.all([
      supabase
        .from("membership_subscriptions")
        .select(
          "id,status,base_price,discount_amount,final_price,has_pt_snapshot,session_count_snapshot,membership_packages(name),gym_facilities(name)"
        )
        .eq("id", subscriptionId)
        .single(),
      supabase
        .from("facility_pts")
        .select("pt_id,users:pt_id(full_name)")
        .order("created_at", { ascending: true }),
      supabase
        .from("membership_pt_preferences")
        .select(
          "id,preferred_pt_id,preferred_pt_gender,experience_level,training_goal,notes,sessions_per_week,membership_pt_preference_time_slots(day_of_week,start_time,end_time)"
        )
        .eq("subscription_id", subscriptionId)
        .maybeSingle(),
      supabase
        .from("membership_pt_assignments")
        .select(
          "id,status,schedule_note,users:pt_id(full_name),membership_pt_assignment_schedule_slots(day_of_week,start_time,end_time)"
        )
        .eq("subscription_id", subscriptionId)
        .order("created_at", { ascending: false }),
    ])

  const subscription =
    subscriptionResult.data as unknown as SubscriptionRow | null
  const preference = preferenceResult.data as unknown as PreferenceRow | null
  const preferenceSlots =
    preference?.membership_pt_preference_time_slots?.sort(
      (first, second) =>
        first.day_of_week - second.day_of_week ||
        first.start_time.localeCompare(second.start_time)
    ) ?? []
  const pts = (ptResult.data ?? []) as unknown as PtRow[]
  const assignments = (assignmentResult.data ??
    []) as unknown as AssignmentRow[]
  const pendingAssignment = assignments.find(
    (assignment) => assignment.status === "pending_member_decision"
  )
  const acceptedAssignment = assignments.find(
    (assignment) => assignment.status === "accepted"
  )
  const error =
    subscriptionResult.error ??
    ptResult.error ??
    preferenceResult.error ??
    assignmentResult.error
  const isPendingPayment = subscription?.status === "pending_payment"
  const isPtSubscription = Boolean(subscription?.has_pt_snapshot)
  const isPtSetupPending = subscription?.status === "pending_pt_setup"
  const showCheckout = Boolean(
    subscription &&
    isPendingPayment &&
    (!isPtSubscription || acceptedAssignment)
  )
  const showPtWorkflow = Boolean(
    subscription && isPtSubscription && isPtSetupPending
  )
  const showPreferenceForm = Boolean(showPtWorkflow && !pendingAssignment)
  const showAcceptedSummary = Boolean(
    subscription && acceptedAssignment && !showCheckout
  )
  const showStatusCard = Boolean(subscription && !showCheckout)
  const showMainColumn = Boolean(
    showStatusCard ||
    showPreferenceForm ||
    pendingAssignment ||
    showAcceptedSummary
  )

  return (
    <PageShell
      eyebrow="Member"
      title={subscription?.membership_packages?.name ?? "Subscription"}
      description="Complete PT setup, accept assignment, and manage payment."
      backHref="/subscriptions"
    >
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Subscription could not be loaded</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}

      {subscription ? (
        <div
          className={cn(
            "grid gap-4",
            showCheckout
              ? "lg:grid-cols-[minmax(0,1fr)_360px]"
              : showMainColumn
                ? "xl:grid-cols-[1fr_420px]"
                : "lg:grid-cols-[minmax(0,1fr)_360px]"
          )}
        >
          {showMainColumn ? (
            <div className="grid gap-4">
              {showStatusCard ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Current status</CardTitle>
                    <CardDescription>
                      {subscription.gym_facilities?.name ?? "Jim Fort"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <StatusBadge status={subscription.status} showDot />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Facility</p>
                      <p className="font-medium">
                        {subscription.gym_facilities?.name ?? "Jim Fort"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Plan type</p>
                      <p className="font-medium">
                        {subscription.has_pt_snapshot
                          ? "PT package"
                          : "Access package"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Sessions</p>
                      <p className="font-medium">
                        {subscription.has_pt_snapshot
                          ? (subscription.session_count_snapshot ?? "Not set")
                          : "Access only"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              {showPreferenceForm ? (
                <Card>
                  <CardHeader>
                    <CardTitle>PT preferences</CardTitle>
                    <CardDescription>
                      {preference
                        ? "Your request is waiting for the manager response. You can update it until a trainer is proposed."
                        : "Send your preferences first so the manager can propose a trainer and schedule."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <MemberActionForm
                      action={savePtPreference}
                      submitLabel={
                        preference ? "Update request" : "Send request"
                      }
                      successMessage="PT preference request sent"
                    >
                      <input
                        type="hidden"
                        name="subscriptionId"
                        value={subscription.id}
                      />
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="grid gap-2">
                          <Label htmlFor="preferredPtId">Preferred PT</Label>
                          <NativeSelect
                            id="preferredPtId"
                            name="preferredPtId"
                            className="w-full"
                            defaultValue={preference?.preferred_pt_id ?? ""}
                          >
                            <option value="">No preference</option>
                            {pts.map((pt) => (
                              <option key={pt.pt_id} value={pt.pt_id}>
                                {pt.users?.full_name ?? "Trainer"}
                              </option>
                            ))}
                          </NativeSelect>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="preferredPtGender">PT gender</Label>
                          <NativeSelect
                            id="preferredPtGender"
                            name="preferredPtGender"
                            className="w-full"
                            defaultValue={
                              preference?.preferred_pt_gender ?? "no_preference"
                            }
                          >
                            <option value="no_preference">No preference</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                          </NativeSelect>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="experienceLevel">Experience</Label>
                          <NativeSelect
                            id="experienceLevel"
                            name="experienceLevel"
                            className="w-full"
                            defaultValue={
                              preference?.experience_level ?? "no_preference"
                            }
                          >
                            <option value="no_preference">No preference</option>
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                          </NativeSelect>
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="trainingGoal">Training goal</Label>
                        <Textarea
                          id="trainingGoal"
                          name="trainingGoal"
                          defaultValue={preference?.training_goal ?? ""}
                        />
                      </div>
                      <div className="grid gap-3">
                        <div>
                          <Label>Preferred weekly schedule</Label>
                          <p className="text-sm text-muted-foreground">
                            Fill the days you want to train. The number of
                            filled days becomes your sessions per week.
                          </p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          {weeklySlotIndexes.map((index) => {
                            const slot = preferenceSlots.find(
                              (item) => item.day_of_week === index
                            )

                            return (
                              <div
                                key={index}
                                className="grid gap-2 rounded-lg border p-3"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <Label>{days[index]}</Label>
                                  {slot ? (
                                    <Badge variant="secondary">Selected</Badge>
                                  ) : null}
                                </div>
                                <input
                                  type="hidden"
                                  name={`slotDay${index}`}
                                  value={index}
                                />
                                <Input
                                  name={`slotStart${index}`}
                                  type="time"
                                  defaultValue={
                                    slot?.start_time.slice(0, 5) ?? ""
                                  }
                                />
                                <Input
                                  name={`slotEnd${index}`}
                                  type="time"
                                  defaultValue={
                                    slot?.end_time.slice(0, 5) ?? ""
                                  }
                                />
                              </div>
                            )
                          })}
                        </div>
                      </div>
                      <Textarea
                        name="notes"
                        placeholder="Notes for manager"
                        defaultValue={preference?.notes ?? ""}
                      />
                    </MemberActionForm>
                  </CardContent>
                </Card>
              ) : null}

              {showPtWorkflow && pendingAssignment ? (
                <Card>
                  <CardHeader>
                    <CardTitle>PT assignment decision</CardTitle>
                    <CardDescription>
                      Review the proposed trainer and weekly schedule.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <div className="rounded-lg border p-3">
                      <p className="font-medium">
                        {pendingAssignment.users?.full_name ?? "Trainer"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {pendingAssignment.schedule_note ?? "No manager note"}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 text-sm">
                        {pendingAssignment.membership_pt_assignment_schedule_slots?.map(
                          (slot) => (
                            <Badge
                              key={`${slot.day_of_week}-${slot.start_time}`}
                              variant="secondary"
                            >
                              {days[slot.day_of_week]}{" "}
                              {slot.start_time.slice(0, 5)}-
                              {slot.end_time.slice(0, 5)}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <MemberActionForm
                        action={decidePtAssignment}
                        submitLabel="Accept assignment"
                      >
                        <input
                          type="hidden"
                          name="subscriptionId"
                          value={subscription.id}
                        />
                        <input
                          type="hidden"
                          name="assignmentId"
                          value={pendingAssignment.id}
                        />
                        <input type="hidden" name="decision" value="accepted" />
                        <input type="hidden" name="note" value="Accepted" />
                        <Check data-icon="inline-start" />
                      </MemberActionForm>
                      <MemberActionForm
                        action={decidePtAssignment}
                        submitLabel="Reject assignment"
                        buttonVariant="outline"
                      >
                        <input
                          type="hidden"
                          name="subscriptionId"
                          value={subscription.id}
                        />
                        <input
                          type="hidden"
                          name="assignmentId"
                          value={pendingAssignment.id}
                        />
                        <input type="hidden" name="decision" value="rejected" />
                        <Input
                          name="note"
                          placeholder="Reason or new preference"
                        />
                        <X data-icon="inline-start" />
                      </MemberActionForm>
                    </div>
                  </CardContent>
                </Card>
              ) : showAcceptedSummary && acceptedAssignment ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Accepted PT</CardTitle>
                    <CardDescription>
                      {acceptedAssignment.users?.full_name ?? "Trainer"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <StatusBadge status={acceptedAssignment.status} showDot>
                      <UserCheck data-icon="inline-start" />
                      Ready for payment
                    </StatusBadge>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          ) : null}

          {showCheckout ? (
            <div className="grid content-start gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Checkout</CardTitle>
                  <CardDescription>
                    Successful payment activates the subscription.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MemberPaymentForm
                    subscriptionId={subscription.id}
                    amountLabel={money(subscription.final_price)}
                  />
                </CardContent>
              </Card>
            </div>
          ) : null}

          <div className="grid content-start gap-4">
            <PaymentSummaryCard subscription={subscription} />

            {subscription.status === "pending_pt_setup" ? (
              <Card>
                <CardHeader>
                  <CardTitle>Cancel pending subscription</CardTitle>
                  <CardDescription>
                    Stop this setup before choosing another membership plan.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MemberActionForm
                    action={cancelPendingSubscription}
                    submitLabel="Cancel subscription"
                    pendingLabel="Cancelling"
                    buttonVariant="outline"
                    successMessage="Subscription cancelled"
                  >
                    <input
                      type="hidden"
                      name="subscriptionId"
                      value={subscription.id}
                    />
                    <X data-icon="inline-start" />
                  </MemberActionForm>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      ) : null}
    </PageShell>
  )
}
