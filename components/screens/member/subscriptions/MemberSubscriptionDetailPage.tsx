<<<<<<< HEAD
import { notFound } from "next/navigation"
import {
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Dumbbell,
  Ticket,
} from "lucide-react"

import {
  applyVoucher,
  decidePtAssignment,
  paySubscription,
  savePtPreference,
} from "@/app/(main)/member-actions"
import { PageShell } from "@/components/PageShell"
import { MemberActionForm } from "@/components/screens/member/MemberActionForm"
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
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/server"

type SubscriptionRow = {
  id: string
  status: string
  base_price: number | string
  discount_amount: number | string
  final_price: number | string
  has_pt_snapshot: boolean
  duration_days_snapshot: number | null
  session_count_snapshot: number | null
  starts_at: string | null
  expires_at: string | null
  facility_id: string
  membership_packages: { name: string | null } | null
  gym_facilities: { name: string | null } | null
}

type PtPreferenceRow = {
  id: string
  preferred_pt_id: string | null
  preferred_pt_gender: string
  sessions_per_week: number
  training_goal: string | null
  experience_level: string
  notes: string | null
}

type PtAssignmentRow = {
  id: string
  status: string
  member_response_note: string | null
  schedule_starts_on: string | null
  schedule_note: string | null
  users: { full_name: string | null } | null
}

type ScheduleSlotRow = {
  assignment_id: string
  day_of_week: number
  start_time: string
  end_time: string
}

type PaymentRow = {
  id: string
  amount: number | string
  method: string | null
  status: string
  paid_at: string | null
  created_at: string
}

type FacilityPtRow = {
  pt_id: string
  users: { full_name: string | null } | null
}

interface MemberSubscriptionDetailPageProps {
  subscriptionId: string
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
})

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
})

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function formatCurrency(value: number | string) {
  return currencyFormatter.format(Number(value) || 0)
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not set"
  }

  return dateFormatter.format(new Date(value))
}

function statusVariant(status: string) {
  if (status === "active" || status === "accepted" || status === "paid") {
    return "default" as const
  }

  if (status === "rejected" || status === "cancelled" || status === "expired") {
    return "outline" as const
  }

  return "secondary" as const
}

function SelectField({
  label,
  name,
  defaultValue,
  children,
}: {
  label: string
  name: string
  defaultValue?: string | number | null
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        name={name}
        defaultValue={String(defaultValue ?? "")}
        className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
      >
        {children}
      </select>
    </div>
  )
}

export async function MemberSubscriptionDetailPage({
  subscriptionId,
}: MemberSubscriptionDetailPageProps) {
  const supabase = await createClient()
  const { data: subscriptionData, error: subscriptionError } = await supabase
    .from("membership_subscriptions")
    .select(
      "id,status,base_price,discount_amount,final_price,has_pt_snapshot,duration_days_snapshot,session_count_snapshot,starts_at,expires_at,facility_id,membership_packages(name),gym_facilities(name)"
    )
    .eq("id", subscriptionId)
    .maybeSingle()

  if (!subscriptionData && !subscriptionError) {
    notFound()
  }

  const subscription = subscriptionData as SubscriptionRow | null

  const [
    preferenceResult,
    assignmentResult,
    paymentResult,
    ptResult,
    slotResult,
  ] = await Promise.all([
    supabase
      .from("membership_pt_preferences")
      .select(
        "id,preferred_pt_id,preferred_pt_gender,sessions_per_week,training_goal,experience_level,notes"
      )
      .eq("subscription_id", subscriptionId)
      .maybeSingle(),
    supabase
      .from("membership_pt_assignments")
      .select(
        "id,status,member_response_note,schedule_starts_on,schedule_note,users:pt_id(full_name)"
      )
      .eq("subscription_id", subscriptionId)
      .order("assigned_at", { ascending: false }),
    supabase
      .from("membership_payments")
      .select("id,amount,method,status,paid_at,created_at")
      .eq("subscription_id", subscriptionId)
      .order("created_at", { ascending: false }),
    subscription
      ? supabase
          .from("facility_pts")
          .select("pt_id,users:pt_id(full_name)")
          .eq("facility_id", subscription.facility_id)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("membership_pt_assignment_schedule_slots")
      .select("assignment_id,day_of_week,start_time,end_time")
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true }),
  ])

  const preference = preferenceResult.data as PtPreferenceRow | null
  const assignments = (assignmentResult.data ?? []) as unknown as PtAssignmentRow[]
  const payments = (paymentResult.data ?? []) as PaymentRow[]
  const pts = (ptResult.data ?? []) as unknown as FacilityPtRow[]
  const slots = (slotResult.data ?? []) as ScheduleSlotRow[]
  const pendingAssignment = assignments.find(
    (assignment) => assignment.status === "pending_member_decision"
  )
  const canPay = subscription?.status === "pending_payment"
  const canSavePtPreference =
    subscription?.has_pt_snapshot && subscription.status === "pending_pt_setup"

  return (
    <PageShell
      backHref="/subscriptions"
      backLabel="Back to subscriptions"
      eyebrow="Member"
      title={subscription?.membership_packages?.name ?? "Subscription"}
      description="Manage setup, voucher, payment, and generated PT workflow."
    >
      {subscriptionError ? (
        <Alert variant="destructive">
          <AlertTitle>Subscription could not be loaded</AlertTitle>
          <AlertDescription>{subscriptionError.message}</AlertDescription>
        </Alert>
      ) : null}

      {subscription ? (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={statusVariant(subscription.status)}>
                  {subscription.status.replaceAll("_", " ")}
                </Badge>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Final price</CardTitle>
              </CardHeader>
              <CardContent className="font-mono text-xl font-semibold">
                {formatCurrency(subscription.final_price)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Starts</CardTitle>
              </CardHeader>
              <CardContent>{formatDate(subscription.starts_at)}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Expires</CardTitle>
              </CardHeader>
              <CardContent>{formatDate(subscription.expires_at)}</CardContent>
            </Card>
          </div>

          {canSavePtPreference ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Dumbbell className="size-5" />
                  PT preferences
                </CardTitle>
                <CardDescription>
                  Saved preferences are used by managers when assigning your PT.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MemberActionForm
                  action={savePtPreference}
                  submitLabel="Save PT preferences"
                >
                  <input
                    type="hidden"
                    name="subscriptionId"
                    value={subscription.id}
                  />
                  <div className="grid gap-4 md:grid-cols-2">
                    <SelectField
                      label="Preferred PT"
                      name="preferredPtId"
                      defaultValue={preference?.preferred_pt_id}
                    >
                      <option value="">No preference</option>
                      {pts.map((pt) => (
                        <option key={pt.pt_id} value={pt.pt_id}>
                          {pt.users?.full_name ?? "Trainer"}
                        </option>
                      ))}
                    </SelectField>
                    <SelectField
                      label="Preferred gender"
                      name="preferredPtGender"
                      defaultValue={preference?.preferred_pt_gender}
                    >
                      <option value="no_preference">No preference</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </SelectField>
                    <SelectField
                      label="Sessions per week"
                      name="sessionsPerWeek"
                      defaultValue={preference?.sessions_per_week ?? 2}
                    >
                      {[1, 2, 3, 4, 5, 6, 7].map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </SelectField>
                    <SelectField
                      label="Experience level"
                      name="experienceLevel"
                      defaultValue={preference?.experience_level}
                    >
                      <option value="no_preference">No preference</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </SelectField>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="trainingGoal">Training goal</Label>
                      <Textarea
                        id="trainingGoal"
                        name="trainingGoal"
                        defaultValue={preference?.training_goal ?? ""}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        name="notes"
                        defaultValue={preference?.notes ?? ""}
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    {[0, 1, 2].map((index) => (
                      <div key={index} className="grid gap-2 rounded-lg border p-3">
                        <SelectField label="Day" name={`slotDay${index}`}>
                          <option value="">Skip</option>
                          {dayLabels.map((label, day) => (
                            <option key={label} value={day}>
                              {label}
                            </option>
                          ))}
                        </SelectField>
                        <Input
                          type="time"
                          name={`slotStart${index}`}
                          defaultValue={index === 0 ? "08:00" : ""}
                        />
                        <Input
                          type="time"
                          name={`slotEnd${index}`}
                          defaultValue={index === 0 ? "09:00" : ""}
                        />
                      </div>
                    ))}
                  </div>
                </MemberActionForm>
              </CardContent>
            </Card>
          ) : null}

          {pendingAssignment ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="size-5" />
                  PT assignment proposal
                </CardTitle>
                <CardDescription>
                  Review the proposed trainer and weekly schedule.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-2 text-sm">
                  <p>
                    Trainer:{" "}
                    <span className="font-medium">
                      {pendingAssignment.users?.full_name ?? "Trainer"}
                    </span>
                  </p>
                  <p>Starts: {formatDate(pendingAssignment.schedule_starts_on)}</p>
                  {pendingAssignment.schedule_note ? (
                    <p className="text-muted-foreground">
                      {pendingAssignment.schedule_note}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    {slots
                      .filter((slot) => slot.assignment_id === pendingAssignment.id)
                      .map((slot) => (
                        <Badge
                          key={`${slot.day_of_week}-${slot.start_time}`}
                          variant="secondary"
                        >
                          {dayLabels[slot.day_of_week]} {slot.start_time.slice(0, 5)}
                          -{slot.end_time.slice(0, 5)}
                        </Badge>
                      ))}
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
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
                    <input type="hidden" name="note" value="Accepted." />
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
                      placeholder="Optional reason"
                      defaultValue="Schedule does not fit."
                    />
                  </MemberActionForm>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {canPay ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ticket className="size-5" />
                    Voucher
                  </CardTitle>
                  <CardDescription>
                    Apply one voucher before payment. The database calculates
                    the discount.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MemberActionForm
                    action={applyVoucher}
                    submitLabel="Apply voucher"
                    buttonVariant="outline"
                  >
                    <input
                      type="hidden"
                      name="subscriptionId"
                      value={subscription.id}
                    />
                    <Input name="code" placeholder="VOUCHER_CODE" />
                  </MemberActionForm>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="size-5" />
                    Payment
                  </CardTitle>
                  <CardDescription>
                    Mark payment as paid to let the database activate the
                    subscription.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MemberActionForm
                    action={paySubscription}
                    submitLabel={`Pay ${formatCurrency(subscription.final_price)}`}
                  >
                    <input
                      type="hidden"
                      name="subscriptionId"
                      value={subscription.id}
                    />
                    <SelectField label="Method" name="method" defaultValue="card">
                      <option value="card">Card</option>
                      <option value="bank_transfer">Bank transfer</option>
                      <option value="cash">Cash</option>
                      <option value="e_wallet">E-wallet</option>
                      <option value="other">Other</option>
                    </SelectField>
                  </MemberActionForm>
                </CardContent>
              </Card>
            </div>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="size-5" />
                Payment history
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {payments.length ? (
                payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium">
                        {formatCurrency(payment.amount)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {payment.method ?? "No method"} ·{" "}
                        {formatDate(payment.paid_at ?? payment.created_at)}
                      </p>
                    </div>
                    <Badge variant={statusVariant(payment.status)}>
                      {payment.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No payment attempts yet.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </PageShell>
  )
=======
import { RoutePlaceholder } from "@/components/RoutePlaceholder"

export function MemberSubscriptionDetailPage() {
  return <RoutePlaceholder title="Member Subscription Detail" />
>>>>>>> e3a4dbaba5182d183b9e8334e2e297b4e443febd
}
