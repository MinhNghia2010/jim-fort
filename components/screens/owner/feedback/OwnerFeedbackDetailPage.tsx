import {
  Building2,
  CalendarClock,
  CircleDot,
  MessageSquareReply,
  MessageSquareText,
  Phone,
  SearchX,
  ShieldCheck,
  Star,
  UserRound,
} from "lucide-react"
import Link from "next/link"

import { respondFacilityFeedback } from "@/app/(main)/manager-actions"
import { PageShell } from "@/components/PageShell"
import { StatusBadge } from "@/components/StatusBadge"
import { ManagerActionForm } from "@/components/screens/manager/ManagerActionForm"
import { SummaryCard } from "@/components/SummaryCard"
import type { FacilityFeedbackStatus } from "@/components/screens/owner/feedback/OwnerFeedbackTable"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/server"

type UserRelation = {
  full_name: string | null
  phone?: string | null
  role?: string | null
}

type FacilityRelation = {
  name: string | null
  address: string | null
  phone: string | null
}

type FeedbackRecord = {
  id: string
  subject: string
  message: string
  rating: number | null
  status: FacilityFeedbackStatus
  manager_response: string | null
  responded_at: string | null
  created_at: string
  updated_at: string
  facility: FacilityRelation | FacilityRelation[] | null
  member: UserRelation | UserRelation[] | null
  respondent: UserRelation | UserRelation[] | null
}

interface OwnerFeedbackDetailPageProps {
  feedbackId: string
  canRespond?: boolean
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Ho_Chi_Minh",
})

const dateOnlyFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "Asia/Ho_Chi_Minh",
})

const timeOnlyFormatter = new Intl.DateTimeFormat("en-US", {
  timeStyle: "short",
  timeZone: "Asia/Ho_Chi_Minh",
})

const statusLabels: Record<FacilityFeedbackStatus, string> = {
  open: "Open",
  in_review: "In review",
  responded: "Responded",
  closed: "Closed",
}

function getSingleRelation<T>(relation: T | T[] | null | undefined) {
  if (Array.isArray(relation)) {
    return relation[0] ?? null
  }

  return relation ?? null
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Not recorded"
  }

  return dateFormatter.format(new Date(value))
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Not recorded"
  }

  return dateOnlyFormatter.format(new Date(value))
}

function formatTimeDetail(value: string | null | undefined) {
  if (!value) {
    return "Asia/Ho Chi Minh time"
  }

  return `${timeOnlyFormatter.format(new Date(value))}, Asia/Ho Chi Minh`
}

function formatRole(role: string | null | undefined) {
  if (!role) {
    return null
  }

  if (role === "pt") {
    return "PT"
  }

  return role.charAt(0).toUpperCase() + role.slice(1)
}

function ratingLabel(rating: number | null) {
  return rating ? `${rating}/5` : "No rating"
}

function DetailRow({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: typeof UserRound
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon
        aria-hidden="true"
        className="mt-0.5 size-4 text-muted-foreground"
      />
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-sm break-words">{value}</p>
      </div>
    </div>
  )
}

function FeedbackNotFoundContent({ feedbackId }: OwnerFeedbackDetailPageProps) {
  return (
    <PageShell
      backHref="/feedback"
      title="Feedback not found"
      description="This feedback record is not available from the current owner account."
    >
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SearchX className="size-5 text-muted-foreground" />
            No matching feedback
          </CardTitle>
          <CardDescription>
            No accessible feedback record matched{" "}
            <span className="font-mono text-foreground">{feedbackId}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/feedback">Return to feedback list</Link>
          </Button>
        </CardContent>
      </Card>
    </PageShell>
  )
}

export async function OwnerFeedbackDetailPage({
  feedbackId,
  canRespond = false,
}: OwnerFeedbackDetailPageProps) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("facility_feedbacks")
    .select(
      `
        id,
        subject,
        message,
        rating,
        status,
        manager_response,
        responded_at,
        created_at,
        updated_at,
        facility:gym_facilities!facility_feedbacks_facility_id_fkey(
          name,
          address,
          phone
        ),
        member:users!facility_feedbacks_member_id_fkey(
          full_name,
          phone
        ),
        respondent:users!facility_feedbacks_responded_by_manager_id_fkey(
          full_name,
          phone,
          role
        )
      `
    )
    .eq("id", feedbackId)
    .maybeSingle()

  if (!data && !error) {
    return <FeedbackNotFoundContent feedbackId={feedbackId} />
  }

  const feedback = data as unknown as FeedbackRecord | null
  const facility = getSingleRelation(feedback?.facility)
  const member = getSingleRelation(feedback?.member)
  const respondent = getSingleRelation(feedback?.respondent)
  const facilityName = facility?.name?.trim() || "Facility"
  const memberName = member?.full_name?.trim() || "Unknown member"
  const memberPhone = member?.phone?.trim() || "No phone number"
  const responderName = respondent?.full_name?.trim() || "Unknown responder"
  const responderRole = formatRole(respondent?.role)
  const responseState = feedback?.manager_response ? "Responded" : "No response"

  return (
    <PageShell
      backHref="/feedback"
      eyebrow={facilityName}
      title={feedback?.subject ?? "Feedback detail"}
      description="Review the member feedback, facility context, and manager response."
    >
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Feedback could not be loaded</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}

      {feedback ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title="Status"
              value={statusLabels[feedback.status]}
              description="Current feedback state"
              icon={CircleDot}
            />
            <SummaryCard
              title="Rating"
              value={ratingLabel(feedback.rating)}
              description="Member facility rating"
              icon={Star}
            />
            <SummaryCard
              title="Submitted"
              value={formatDate(feedback.created_at)}
              description={formatTimeDetail(feedback.created_at)}
              icon={CalendarClock}
            />
            <SummaryCard
              title="Response"
              value={responseState}
              description="Manager or owner reply"
              icon={MessageSquareReply}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="grid gap-4">
              <Card>
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquareText className="size-5 text-muted-foreground" />
                    Member feedback
                  </CardTitle>
                  <CardDescription>
                    Submitted {formatDateTime(feedback.created_at)}
                  </CardDescription>
                  <CardAction>
                    <StatusBadge status={feedback.status} showDot>
                      {statusLabels[feedback.status]}
                    </StatusBadge>
                  </CardAction>
                </CardHeader>
                <CardContent className="grid gap-5">
                  <div className="grid gap-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Subject
                    </p>
                    <p className="text-base font-medium">{feedback.subject}</p>
                  </div>
                  <Separator />
                  <div className="grid gap-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Message
                    </p>
                    <p className="text-sm leading-6 whitespace-pre-wrap text-muted-foreground">
                      {feedback.message}
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex-wrap justify-between gap-3 text-xs text-muted-foreground">
                  <span className="font-mono break-all">ID {feedback.id}</span>
                  <span>Updated {formatDateTime(feedback.updated_at)}</span>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquareReply className="size-5 text-muted-foreground" />
                    Manager response
                  </CardTitle>
                  <CardDescription>
                    Response visible to the feedback member.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-5">
                  {feedback.manager_response ? (
                    <div className="grid gap-4">
                      <p className="text-sm leading-6 whitespace-pre-wrap text-muted-foreground">
                        {feedback.manager_response}
                      </p>
                      <Separator />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <DetailRow
                          icon={ShieldCheck}
                          label="Responder"
                          value={
                            responderRole
                              ? `${responderName} (${responderRole})`
                              : responderName
                          }
                        />
                        <DetailRow
                          icon={CalendarClock}
                          label="Responded"
                          value={formatDateTime(feedback.responded_at)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border bg-muted/30 p-4">
                      <Badge variant="secondary">No response yet</Badge>
                      <p className="mt-3 text-sm text-muted-foreground">
                        This feedback is still waiting for a manager or owner
                        response.
                      </p>
                    </div>
                  )}
                  {canRespond ? (
                    <>
                      <Separator />
                      <ManagerActionForm
                        action={respondFacilityFeedback}
                        submitLabel={
                          feedback.manager_response
                            ? "Update response"
                            : "Send response"
                        }
                        pendingLabel="Sending"
                        successMessage="Feedback response saved"
                        actionsClassName="items-start"
                      >
                        <input
                          type="hidden"
                          name="feedbackId"
                          value={feedback.id}
                        />
                        <div className="grid gap-2">
                          <Label htmlFor="managerResponse">Response</Label>
                          <Textarea
                            id="managerResponse"
                            name="managerResponse"
                            className="min-h-32"
                            defaultValue={feedback.manager_response ?? ""}
                            required
                          />
                        </div>
                      </ManagerActionForm>
                    </>
                  ) : null}
                </CardContent>
              </Card>
            </div>

            <div className="grid content-start gap-4">
              <Card>
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center gap-2">
                    <UserRound className="size-5 text-muted-foreground" />
                    Member
                  </CardTitle>
                  <CardDescription>Feedback author</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <DetailRow icon={UserRound} label="Name" value={memberName} />
                  <DetailRow icon={Phone} label="Phone" value={memberPhone} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="size-5 text-muted-foreground" />
                    Facility
                  </CardTitle>
                  <CardDescription>Related gym location</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <DetailRow
                    icon={Building2}
                    label="Name"
                    value={facilityName}
                  />
                  <DetailRow
                    icon={Phone}
                    label="Phone"
                    value={facility?.phone?.trim() || "No phone number"}
                  />
                  <DetailRow
                    icon={Building2}
                    label="Address"
                    value={facility?.address?.trim() || "No address saved"}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      ) : null}
    </PageShell>
  )
}
