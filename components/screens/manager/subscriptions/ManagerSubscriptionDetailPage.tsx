import type { ReactNode } from "react"
import Link from "next/link"
import {
  CalendarClock,
  CircleDollarSign,
  ClipboardList,
  Dumbbell,
  SearchX,
  UserRound,
} from "lucide-react"

import { PageShell } from "@/components/PageShell"
import { ManagementMetricCard } from "@/components/screens/owner/ManagementMetricCard"
import { StatusBadge } from "@/components/StatusBadge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/server"

type Props = {
  subscriptionId: string
}

type Relation<T> = T | T[] | null

type MemberRelation = {
  full_name: string | null
  phone: string | null
}

type PackageRelation = {
  name: string | null
  description: string | null
}

type FacilityRelation = {
  name: string | null
  address: string | null
  phone: string | null
}

type TimeSlotRow = {
  day_of_week: number
  start_time: string
  end_time: string
}

type SubscriptionRow = {
  id: string
  member_id: string
  status: string
  base_price: number | string
  discount_amount: number | string
  final_price: number | string
  has_pt_snapshot: boolean
  duration_days_snapshot: number | null
  session_count_snapshot: number | null
  activated_at: string | null
  starts_at: string | null
  expires_at: string | null
  cancelled_at: string | null
  cancelled_reason: string | null
  created_at: string
  updated_at: string | null
  member: Relation<MemberRelation>
  package: Relation<PackageRelation>
  facility: Relation<FacilityRelation>
}

type PreferenceRow = {
  sessions_per_week: number
  preferred_pt_gender: string
  experience_level: string
  training_goal: string | null
  notes: string | null
  preferred_pt: Relation<{ full_name: string | null }>
  membership_pt_preference_time_slots: TimeSlotRow[] | null
}

type AssignmentRow = {
  id: string
  status: string
  schedule_note: string | null
  member_response_note: string | null
  assigned_at: string | null
  member_decided_at: string | null
  users: Relation<{ full_name: string | null }>
  membership_pt_assignment_schedule_slots: TimeSlotRow[] | null
}

type PaymentRow = {
  id: string
  amount: number | string
  method: string | null
  status: string
  paid_at: string | null
  created_at: string
  payer_name: string | null
  payer_phone: string | null
  cardholder_name: string | null
  card_last_four: string | null
  card_expiry: string | null
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Ho_Chi_Minh",
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

function getSingleRelation<T>(relation: Relation<T> | undefined) {
  if (Array.isArray(relation)) {
    return relation[0] ?? null
  }

  return relation ?? null
}

function toNumber(value: number | string | null | undefined) {
  const numberValue = Number(value ?? 0)

  return Number.isFinite(numberValue) ? numberValue : 0
}

function money(value: number | string | null | undefined) {
  return currencyFormatter.format(toNumber(value))
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Not recorded"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "Not recorded"
  }

  return dateFormatter.format(date)
}

function formatLabel(value: string | null | undefined) {
  if (!value) {
    return "Not set"
  }

  return value
    .replaceAll("_", " ")
    .split(" ")
    .map((word) => (word.toLowerCase() === "pt" ? "PT" : word))
    .map((word) =>
      word === "PT" ? word : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ")
}

function getTermLabel(subscription: SubscriptionRow) {
  if (subscription.has_pt_snapshot) {
    return `${subscription.session_count_snapshot ?? 0} PT sessions`
  }

  return `${subscription.duration_days_snapshot ?? 0} access days`
}

function sortSlots(slots: TimeSlotRow[] | null | undefined) {
  return [...(slots ?? [])].sort(
    (first, second) =>
      first.day_of_week - second.day_of_week ||
      first.start_time.localeCompare(second.start_time)
  )
}

function formatSlot(slot: TimeSlotRow) {
  return `${days[slot.day_of_week] ?? "Day"} ${slot.start_time.slice(
    0,
    5
  )}-${slot.end_time.slice(0, 5)}`
}

function DetailRow({
  label,
  value,
  children,
}: {
  label: string
  value?: string
  children?: ReactNode
}) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {children ?? <p className="text-sm break-words">{value}</p>}
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  )
}

function SubscriptionNotFound({
  subscriptionId,
  errorMessage,
}: Props & { errorMessage?: string }) {
  return (
    <PageShell
      backHref="/subscriptions"
      eyebrow="Manager"
      title="Subscription not found"
      description="No accessible membership subscription matched this record."
    >
      {errorMessage ? (
        <Alert variant="destructive">
          <AlertTitle>Subscription could not be loaded</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SearchX className="size-5 text-muted-foreground" />
            No matching subscription
          </CardTitle>
          <CardDescription>
            No accessible subscription matched{" "}
            <span className="font-mono text-foreground">{subscriptionId}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/subscriptions">Return to subscriptions</Link>
          </Button>
        </CardContent>
      </Card>
    </PageShell>
  )
}

export async function ManagerSubscriptionDetailPage({ subscriptionId }: Props) {
  const supabase = await createClient()
  const [
    subscriptionResult,
    preferenceResult,
    assignmentResult,
    paymentResult,
  ] = await Promise.all([
    supabase
      .from("membership_subscriptions")
      .select(
        `
          id,
          member_id,
          status,
          base_price,
          discount_amount,
          final_price,
          has_pt_snapshot,
          duration_days_snapshot,
          session_count_snapshot,
          activated_at,
          starts_at,
          expires_at,
          cancelled_at,
          cancelled_reason,
          created_at,
          updated_at,
          member:users!membership_subscriptions_member_id_fkey(
            full_name,
            phone
          ),
          package:membership_packages!membership_subscriptions_package_id_fkey(
            name,
            description
          ),
          facility:gym_facilities!membership_subscriptions_facility_id_fkey(
            name,
            address,
            phone
          )
        `
      )
      .eq("id", subscriptionId)
      .maybeSingle(),
    supabase
      .from("membership_pt_preferences")
      .select(
        "sessions_per_week,preferred_pt:preferred_pt_id(full_name),preferred_pt_gender,experience_level,training_goal,notes,membership_pt_preference_time_slots(day_of_week,start_time,end_time)"
      )
      .eq("subscription_id", subscriptionId)
      .maybeSingle(),
    supabase
      .from("membership_pt_assignments")
      .select(
        "id,status,schedule_note,member_response_note,assigned_at,member_decided_at,users:pt_id(full_name),membership_pt_assignment_schedule_slots(day_of_week,start_time,end_time)"
      )
      .eq("subscription_id", subscriptionId)
      .order("created_at", { ascending: false }),
    supabase
      .from("membership_payments")
      .select(
        "id,amount,method,status,paid_at,created_at,payer_name,payer_phone,cardholder_name,card_last_four,card_expiry"
      )
      .eq("subscription_id", subscriptionId)
      .order("created_at", { ascending: false }),
  ])

  const subscription =
    subscriptionResult.data as unknown as SubscriptionRow | null
  const preference = preferenceResult.data as unknown as PreferenceRow | null
  const assignments = (assignmentResult.data ??
    []) as unknown as AssignmentRow[]
  const payments = (paymentResult.data ?? []) as unknown as PaymentRow[]
  const error =
    subscriptionResult.error ??
    preferenceResult.error ??
    assignmentResult.error ??
    paymentResult.error

  if (!subscription) {
    return (
      <SubscriptionNotFound
        subscriptionId={subscriptionId}
        errorMessage={error?.message}
      />
    )
  }

  const member = getSingleRelation(subscription.member)
  const plan = getSingleRelation(subscription.package)
  const facility = getSingleRelation(subscription.facility)
  const preferredPt = getSingleRelation(preference?.preferred_pt)
  const planName = plan?.name?.trim() || "Membership"
  const memberName = member?.full_name?.trim() || "Member"
  const planType = subscription.has_pt_snapshot
    ? "PT package"
    : "Access package"
  const preferenceSlots = sortSlots(
    preference?.membership_pt_preference_time_slots
  )
  const totalPaid = payments
    .filter((payment) => payment.status === "paid")
    .reduce((total, payment) => total + toNumber(payment.amount), 0)

  return (
    <PageShell
      backHref="/subscriptions"
      eyebrow="Manager"
      title={planName}
      description={`Review ${memberName}'s membership subscription details.`}
    >
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Subscription data could not be fully loaded</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ManagementMetricCard
          title="Final price"
          value={money(subscription.final_price)}
          detail="Subscription total"
          icon={CircleDollarSign}
        />
        <ManagementMetricCard
          title="Status"
          value={formatLabel(subscription.status)}
          detail="Current lifecycle state"
          icon={ClipboardList}
        />
        <ManagementMetricCard
          title="Plan type"
          value={planType}
          detail={getTermLabel(subscription)}
          icon={Dumbbell}
        />
        <ManagementMetricCard
          title="Created"
          value={formatDate(subscription.created_at)}
          detail="Subscription request date"
          icon={CalendarClock}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-4">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Subscription details</CardTitle>
              <CardDescription>
                {plan?.description ?? "Membership plan and lifecycle details."}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <DetailRow label="Member" value={memberName} />
                <DetailRow
                  label="Member phone"
                  value={member?.phone ?? "Not recorded"}
                />
                <DetailRow
                  label="Facility"
                  value={facility?.name?.trim() || "Facility"}
                />
                <DetailRow label="Status">
                  <StatusBadge status={subscription.status} showDot />
                </DetailRow>
                <DetailRow
                  label="Started"
                  value={formatDate(subscription.starts_at)}
                />
                <DetailRow
                  label="Expires"
                  value={formatDate(subscription.expires_at)}
                />
                <DetailRow
                  label="Activated"
                  value={formatDate(subscription.activated_at)}
                />
                <DetailRow
                  label="Cancelled"
                  value={formatDate(subscription.cancelled_at)}
                />
                <DetailRow
                  label="Updated"
                  value={formatDate(subscription.updated_at)}
                />
              </div>

              {subscription.cancelled_reason ? (
                <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                  <p className="font-medium">Cancellation reason</p>
                  <p className="mt-1 text-muted-foreground">
                    {subscription.cancelled_reason}
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Payment history</CardTitle>
              <CardDescription>
                {payments.length
                  ? `${payments.length} payment record${
                      payments.length === 1 ? "" : "s"
                    }, ${money(totalPaid)} paid.`
                  : "No payment attempts have been recorded."}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {payments.length ? (
                payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="grid gap-3 rounded-lg border p-3 text-sm sm:grid-cols-4"
                  >
                    <div>
                      <p className="text-xs text-muted-foreground">Amount</p>
                      <p className="font-medium">{money(payment.amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <StatusBadge status={payment.status} showDot />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Method</p>
                      <p className="font-medium">
                        {formatLabel(payment.method)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Date</p>
                      <p className="font-medium">
                        {formatDate(payment.paid_at ?? payment.created_at)}
                      </p>
                    </div>
                    <div className="sm:col-span-4">
                      <p className="text-xs text-muted-foreground">
                        Payment details
                      </p>
                      <p className="text-muted-foreground">
                        {payment.payer_name ??
                          payment.cardholder_name ??
                          "No payer name"}
                        {payment.payer_phone ? ` · ${payment.payer_phone}` : ""}
                        {payment.card_last_four
                          ? ` · Card ending ${payment.card_last_four}${
                              payment.card_expiry
                                ? `, expires ${payment.card_expiry}`
                                : ""
                            }`
                          : ""}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Payment attempts will appear here after checkout starts.
                </p>
              )}
            </CardContent>
          </Card>

          {subscription.has_pt_snapshot ? (
            <Card>
              <CardHeader className="border-b">
                <CardTitle>PT setup</CardTitle>
                <CardDescription>
                  Member preferences and trainer assignment history.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5">
                {preference ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <DetailRow
                      label="Weekly sessions"
                      value={String(preference.sessions_per_week)}
                    />
                    <DetailRow
                      label="Preferred PT"
                      value={preferredPt?.full_name ?? "No preference"}
                    />
                    <DetailRow
                      label="PT gender"
                      value={formatLabel(preference.preferred_pt_gender)}
                    />
                    <DetailRow
                      label="Experience"
                      value={formatLabel(preference.experience_level)}
                    />
                    <DetailRow
                      label="Goal"
                      value={preference.training_goal ?? "Not recorded"}
                    />
                    <DetailRow
                      label="Notes"
                      value={preference.notes ?? "Not recorded"}
                    />
                    <div className="sm:col-span-2">
                      <p className="mb-2 text-xs font-medium text-muted-foreground">
                        Member availability
                      </p>
                      {preferenceSlots.length ? (
                        <div className="flex flex-wrap gap-2">
                          {preferenceSlots.map((slot) => (
                            <Badge key={formatSlot(slot)} variant="secondary">
                              {formatSlot(slot)}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No availability slots saved.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No PT preferences have been submitted for this subscription.
                  </p>
                )}

                <Separator />

                <div className="grid gap-3">
                  <h3 className="font-medium">Assignment history</h3>
                  {assignments.length ? (
                    assignments.map((assignment) => {
                      const trainer = getSingleRelation(assignment.users)
                      const assignmentSlots = sortSlots(
                        assignment.membership_pt_assignment_schedule_slots
                      )

                      return (
                        <div
                          key={assignment.id}
                          className="rounded-lg border p-3"
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="font-medium">
                                {trainer?.full_name ?? "Trainer"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Assigned {formatDate(assignment.assigned_at)}
                              </p>
                            </div>
                            <StatusBadge status={assignment.status} showDot />
                          </div>
                          {assignment.schedule_note ? (
                            <p className="mt-3 text-sm text-muted-foreground">
                              {assignment.schedule_note}
                            </p>
                          ) : null}
                          {assignment.member_response_note ? (
                            <p className="mt-2 text-sm text-muted-foreground">
                              Member note: {assignment.member_response_note}
                            </p>
                          ) : null}
                          {assignmentSlots.length ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {assignmentSlots.map((slot) => (
                                <Badge key={formatSlot(slot)} variant="outline">
                                  {formatSlot(slot)}
                                </Badge>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      )
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No trainer assignment has been proposed.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="grid content-start gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRound className="size-5 text-muted-foreground" />
                Member
              </CardTitle>
              <CardDescription>Linked member account.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <SummaryRow label="Name" value={memberName} />
              <SummaryRow
                label="Phone"
                value={member?.phone ?? "Not recorded"}
              />
              <Button asChild variant="outline" className="mt-2">
                <Link href={`/members/${subscription.member_id}`}>
                  View member
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Price summary</CardTitle>
              <CardDescription>
                Snapshot captured at subscription time.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <SummaryRow
                label="Base price"
                value={money(subscription.base_price)}
              />
              <SummaryRow
                label="Discount"
                value={money(subscription.discount_amount)}
              />
              <Separator />
              <SummaryRow
                label="Final price"
                value={money(subscription.final_price)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Facility</CardTitle>
              <CardDescription>
                Where this membership is managed.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <SummaryRow
                label="Name"
                value={facility?.name?.trim() || "Facility"}
              />
              <SummaryRow
                label="Phone"
                value={facility?.phone ?? "Not recorded"}
              />
              <SummaryRow
                label="Address"
                value={facility?.address ?? "Not recorded"}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  )
}
