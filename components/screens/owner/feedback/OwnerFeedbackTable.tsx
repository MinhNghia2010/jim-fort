"use client"

import { useState } from "react"
import { MessageSquare, Search, Star } from "lucide-react"

import { OwnerTableHeaderSelect } from "@/components/screens/owner/OwnerTableHeaderSelect"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

export type FacilityFeedbackStatus =
  | "open"
  | "in_review"
  | "responded"
  | "closed"

export interface OwnerFeedbackRow {
  id: string
  subject: string
  message: string
  rating: number | null
  status: FacilityFeedbackStatus
  managerResponse: string | null
  respondedAt: string | null
  createdAt: string
  memberName: string
  memberPhone: string
  responderName: string | null
  responderRole: string | null
}

interface OwnerFeedbackTableProps {
  feedbacks: readonly OwnerFeedbackRow[]
}

const feedbackSortOptions = [
  { value: "feedback_desc", label: "Latest" },
  { value: "feedback_asc", label: "Oldest" },
] as const

const memberSortOptions = [
  { value: "member_asc", label: "A-Z" },
  { value: "member_desc", label: "Z-A" },
] as const

const ratingSortOptions = [
  { value: "rating_desc", label: "High-Low" },
  { value: "rating_asc", label: "Low-High" },
] as const

const statusFilterOptions = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "in_review", label: "In review" },
  { value: "responded", label: "Responded" },
  { value: "closed", label: "Closed" },
] as const

const responseSortOptions = [
  { value: "response_desc", label: "Latest" },
  { value: "response_asc", label: "Oldest" },
] as const

type FeedbackSort =
  | (typeof feedbackSortOptions)[number]["value"]
  | (typeof memberSortOptions)[number]["value"]
  | (typeof ratingSortOptions)[number]["value"]
  | (typeof responseSortOptions)[number]["value"]

type FeedbackStatusFilter = (typeof statusFilterOptions)[number]["value"]

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Ho_Chi_Minh",
})

const statusLabels: Record<FacilityFeedbackStatus, string> = {
  open: "Open",
  in_review: "In review",
  responded: "Responded",
  closed: "Closed",
}

function statusClassName(status: FacilityFeedbackStatus) {
  return cn(
    "border font-medium",
    status === "open" &&
      "border-chart-4/40 bg-chart-4/20 text-chart-5 dark:text-chart-4",
    status === "in_review" &&
      "border-primary/30 bg-primary/10 text-primary",
    status === "responded" &&
      "border-chart-2/30 bg-chart-2/10 text-chart-2",
    status === "closed" &&
      "border-muted-foreground/30 bg-muted text-muted-foreground"
  )
}

function compareText(first: string | null, second: string | null) {
  return (first ?? "").localeCompare(second ?? "", undefined, {
    sensitivity: "base",
  })
}

function getDateValue(value: string | null, nullValue: number) {
  return value ? new Date(value).getTime() : nullValue
}

function sortFeedbacks(feedbacks: OwnerFeedbackRow[], sort: FeedbackSort) {
  return [...feedbacks].sort((first, second) => {
    if (sort === "feedback_asc") {
      return getDateValue(first.createdAt, 0) - getDateValue(second.createdAt, 0)
    }

    if (sort === "member_asc") {
      return compareText(first.memberName, second.memberName)
    }

    if (sort === "member_desc") {
      return compareText(second.memberName, first.memberName)
    }

    if (sort === "rating_desc") {
      return (second.rating ?? -1) - (first.rating ?? -1)
    }

    if (sort === "rating_asc") {
      return (first.rating ?? Number.MAX_SAFE_INTEGER) -
        (second.rating ?? Number.MAX_SAFE_INTEGER)
    }

    if (sort === "response_desc") {
      return getDateValue(second.respondedAt, 0) -
        getDateValue(first.respondedAt, 0)
    }

    if (sort === "response_asc") {
      return getDateValue(first.respondedAt, Number.MAX_SAFE_INTEGER) -
        getDateValue(second.respondedAt, Number.MAX_SAFE_INTEGER)
    }

    return getDateValue(second.createdAt, 0) - getDateValue(first.createdAt, 0)
  })
}

function ratingText(rating: number | null) {
  return rating ? `${rating}/5` : "No rating"
}

function feedbackSearchText(feedback: OwnerFeedbackRow) {
  return [
    feedback.subject,
    feedback.message,
    feedback.memberName,
    feedback.memberPhone,
    feedback.rating?.toString(),
    ratingText(feedback.rating),
    feedback.status,
    statusLabels[feedback.status],
    feedback.managerResponse,
    feedback.responderName,
    feedback.responderRole,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
}

export function OwnerFeedbackTable({ feedbacks }: OwnerFeedbackTableProps) {
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<FeedbackSort>("feedback_desc")
  const [statusFilter, setStatusFilter] =
    useState<FeedbackStatusFilter>("all")
  const normalizedSearch = search.trim().toLowerCase()
  const filteredFeedbacks = feedbacks.filter((feedback) => {
    return (
      (!normalizedSearch ||
        feedbackSearchText(feedback).includes(normalizedSearch)) &&
      (statusFilter === "all" || feedback.status === statusFilter)
    )
  })
  const sortedFeedbacks = sortFeedbacks(filteredFeedbacks, sort)
  const feedbackSortValue =
    sort === "feedback_asc" || sort === "feedback_desc"
      ? sort
      : "feedback_desc"
  const memberSortValue =
    sort === "member_desc" || sort === "member_asc" ? sort : "member_asc"
  const ratingSortValue =
    sort === "rating_asc" || sort === "rating_desc" ? sort : "rating_desc"
  const responseSortValue =
    sort === "response_asc" || sort === "response_desc"
      ? sort
      : "response_desc"

  return (
    <div className="flex flex-col gap-4">
      <InputGroup className="w-full lg:w-80">
        <InputGroupAddon>
          <Search aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search feedback..."
          aria-label="Search feedback"
        />
      </InputGroup>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b py-4">
          <CardTitle>Feedback table</CardTitle>
          <CardDescription>
            Showing {sortedFeedbacks.length} of {feedbacks.length} feedbacks
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">
                  <OwnerTableHeaderSelect
                    label="Feedback"
                    value={feedbackSortValue}
                    options={feedbackSortOptions}
                    onValueChange={setSort}
                  />
                </TableHead>
                <TableHead>
                  <OwnerTableHeaderSelect
                    label="Member"
                    value={memberSortValue}
                    options={memberSortOptions}
                    onValueChange={setSort}
                  />
                </TableHead>
                <TableHead>
                  <OwnerTableHeaderSelect
                    label="Rating"
                    value={ratingSortValue}
                    options={ratingSortOptions}
                    onValueChange={setSort}
                  />
                </TableHead>
                <TableHead>
                  <OwnerTableHeaderSelect
                    label="Status"
                    value={statusFilter}
                    options={statusFilterOptions}
                    onValueChange={setStatusFilter}
                  />
                </TableHead>
                <TableHead className="pr-4">
                  <OwnerTableHeaderSelect
                    label="Manager response"
                    value={responseSortValue}
                    options={responseSortOptions}
                    onValueChange={setSort}
                  />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedFeedbacks.length ? (
                sortedFeedbacks.map((feedback) => (
                  <TableRow key={feedback.id}>
                    <TableCell className="max-w-80 pl-4">
                      <div className="space-y-1">
                        <p className="font-medium">{feedback.subject}</p>
                        <p className="line-clamp-2 text-muted-foreground">
                          {feedback.message}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {dateFormatter.format(new Date(feedback.createdAt))}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="min-w-40">
                        <p className="font-medium">{feedback.memberName}</p>
                        <p className="text-xs text-muted-foreground">
                          {feedback.memberPhone}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="gap-1">
                        <Star className="size-3" />
                        {ratingText(feedback.rating)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusClassName(feedback.status)}
                      >
                        {statusLabels[feedback.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-96 pr-4">
                      {feedback.managerResponse ? (
                        <div className="space-y-1">
                          <p className="line-clamp-2">
                            {feedback.managerResponse}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {feedback.responderName ?? "Unknown responder"}
                            {feedback.responderRole
                              ? ` (${feedback.responderRole})`
                              : ""}
                          </p>
                          {feedback.respondedAt ? (
                            <p className="font-mono text-xs text-muted-foreground">
                              {dateFormatter.format(
                                new Date(feedback.respondedAt)
                              )}
                            </p>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">
                          No response yet
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-64">
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <MessageSquare />
                        </EmptyMedia>
                        <EmptyTitle>No feedback found</EmptyTitle>
                        <EmptyDescription>
                          Try a different search term or status filter.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
