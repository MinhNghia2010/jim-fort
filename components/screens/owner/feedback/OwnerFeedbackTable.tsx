"use client"

import { useState } from "react"
import { MessageSquare, Search, Star } from "lucide-react"

import { StatusBadge } from "@/components/StatusBadge"
import { OwnerTableHeaderSelect } from "@/components/screens/owner/OwnerTableHeaderSelect"
import {
  TablePagination,
  TABLE_ROWS_PER_PAGE,
} from "@/components/TablePagination"
import {
  ALL_MONTHS_VALUE,
  getTableMonthFilterOptions,
  matchesTableMonthFilter,
  TableMonthFilter,
} from "@/components/TableMonthFilter"
import { TableRowActions } from "@/components/TableRowActions"
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
  managerActions?: boolean
  monthFilter?: string
  onMonthFilterChange?: (value: string) => void
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
const appTimeZone = "Asia/Ho_Chi_Minh"

const statusLabels: Record<FacilityFeedbackStatus, string> = {
  open: "Open",
  in_review: "In review",
  responded: "Responded",
  closed: "Closed",
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
      return (
        getDateValue(first.createdAt, 0) - getDateValue(second.createdAt, 0)
      )
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
      return (
        (first.rating ?? Number.MAX_SAFE_INTEGER) -
        (second.rating ?? Number.MAX_SAFE_INTEGER)
      )
    }

    if (sort === "response_desc") {
      return (
        getDateValue(second.respondedAt, 0) - getDateValue(first.respondedAt, 0)
      )
    }

    if (sort === "response_asc") {
      return (
        getDateValue(first.respondedAt, Number.MAX_SAFE_INTEGER) -
        getDateValue(second.respondedAt, Number.MAX_SAFE_INTEGER)
      )
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

function getManagerAction(feedback: OwnerFeedbackRow) {
  if (feedback.status === "responded") {
    return { label: "Update" }
  }

  if (feedback.status === "closed") {
    return { label: "View" }
  }

  return { label: "Respond" }
}

export function OwnerFeedbackTable({
  feedbacks,
  managerActions = false,
  monthFilter: controlledMonthFilter,
  onMonthFilterChange,
}: OwnerFeedbackTableProps) {
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<FeedbackSort>("feedback_desc")
  const [statusFilter, setStatusFilter] = useState<FeedbackStatusFilter>("all")
  const [internalMonthFilter, setInternalMonthFilter] =
    useState(ALL_MONTHS_VALUE)
  const [currentPage, setCurrentPage] = useState(1)
  const monthFilter = controlledMonthFilter ?? internalMonthFilter
  const normalizedSearch = search.trim().toLowerCase()
  const monthFilterOptions = getTableMonthFilterOptions(
    feedbacks,
    (feedback) => feedback.createdAt,
    appTimeZone
  )
  const filteredFeedbacks = feedbacks.filter((feedback) => {
    return (
      (!normalizedSearch ||
        feedbackSearchText(feedback).includes(normalizedSearch)) &&
      matchesTableMonthFilter(feedback.createdAt, monthFilter, appTimeZone) &&
      (statusFilter === "all" || feedback.status === statusFilter)
    )
  })
  const sortedFeedbacks = sortFeedbacks(filteredFeedbacks, sort)
  const totalPages = Math.max(
    1,
    Math.ceil(sortedFeedbacks.length / TABLE_ROWS_PER_PAGE)
  )
  const activePage = Math.min(currentPage, totalPages)
  const startIndex = (activePage - 1) * TABLE_ROWS_PER_PAGE
  const paginatedFeedbacks = sortedFeedbacks.slice(
    startIndex,
    startIndex + TABLE_ROWS_PER_PAGE
  )
  const visibleStart = paginatedFeedbacks.length ? startIndex + 1 : 0
  const visibleEnd = Math.min(
    startIndex + TABLE_ROWS_PER_PAGE,
    sortedFeedbacks.length
  )
  const feedbackSortValue =
    sort === "feedback_asc" || sort === "feedback_desc" ? sort : "feedback_desc"
  const memberSortValue =
    sort === "member_desc" || sort === "member_asc" ? sort : "member_asc"
  const ratingSortValue =
    sort === "rating_asc" || sort === "rating_desc" ? sort : "rating_desc"
  const responseSortValue =
    sort === "response_asc" || sort === "response_desc" ? sort : "response_desc"

  function handleSearchChange(value: string) {
    setSearch(value)
    setCurrentPage(1)
  }

  function handleSortChange(value: FeedbackSort) {
    setSort(value)
    setCurrentPage(1)
  }

  function handleStatusFilterChange(value: FeedbackStatusFilter) {
    setStatusFilter(value)
    setCurrentPage(1)
  }

  function handleMonthFilterChange(value: string) {
    if (onMonthFilterChange) {
      onMonthFilterChange(value)
    } else {
      setInternalMonthFilter(value)
    }

    setCurrentPage(1)
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="border-b py-4">
          <CardTitle>Feedback table</CardTitle>
          <CardDescription>
            Showing {paginatedFeedbacks.length} of {sortedFeedbacks.length}{" "}
            feedbacks
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <div className="flex flex-col gap-3 border-b px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <InputGroup className="w-full lg:w-96">
              <InputGroupAddon>
                <Search aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput
                value={search}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="Search feedback..."
                aria-label="Search feedback"
              />
            </InputGroup>
            <TableMonthFilter
              value={monthFilter}
              options={monthFilterOptions}
              onValueChange={handleMonthFilterChange}
              label="Filter feedback by created month"
            />
          </div>

          <Table className="table-fixed text-[0.925rem] [&_td]:overflow-hidden [&_td]:whitespace-normal [&_th]:whitespace-normal">
            <colgroup>
              <col className="w-[30%]" />
              <col className="w-[16%]" />
              <col className="w-[10%]" />
              <col className="w-[12%]" />
              <col className="w-[24%]" />
              <col className="w-[8%]" />
            </colgroup>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="h-12 pl-6">
                  <OwnerTableHeaderSelect
                    label="Feedback"
                    value={feedbackSortValue}
                    options={feedbackSortOptions}
                    onValueChange={handleSortChange}
                  />
                </TableHead>
                <TableHead className="h-12">
                  <OwnerTableHeaderSelect
                    label="Member"
                    value={memberSortValue}
                    options={memberSortOptions}
                    onValueChange={handleSortChange}
                  />
                </TableHead>
                <TableHead className="h-12">
                  <OwnerTableHeaderSelect
                    label="Rating"
                    value={ratingSortValue}
                    options={ratingSortOptions}
                    onValueChange={handleSortChange}
                  />
                </TableHead>
                <TableHead className="h-12">
                  <OwnerTableHeaderSelect
                    label="Status"
                    value={statusFilter}
                    options={statusFilterOptions}
                    onValueChange={handleStatusFilterChange}
                  />
                </TableHead>
                <TableHead className="h-12 pr-6">
                  <OwnerTableHeaderSelect
                    label="Manager response"
                    value={responseSortValue}
                    options={responseSortOptions}
                    onValueChange={handleSortChange}
                  />
                </TableHead>
                <TableHead className="h-12 text-center">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedFeedbacks.length ? (
                paginatedFeedbacks.map((feedback) => {
                  const tableAction = managerActions
                    ? getManagerAction(feedback)
                    : { label: "View" }

                  return (
                    <TableRow key={feedback.id} className="h-[4.5rem]">
                      <TableCell className="pl-6">
                        <div className="flex min-w-0 flex-col gap-1">
                          <p
                            title={feedback.subject}
                            className="truncate font-medium text-foreground"
                          >
                            {feedback.subject}
                          </p>
                          <p
                            title={feedback.message}
                            className="line-clamp-2 text-muted-foreground"
                          >
                            {feedback.message}
                          </p>
                          <p className="truncate font-mono text-xs text-muted-foreground">
                            {dateFormatter.format(new Date(feedback.createdAt))}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="min-w-0">
                          <p
                            title={feedback.memberName}
                            className="truncate font-medium"
                          >
                            {feedback.memberName}
                          </p>
                          <p
                            className="truncate text-xs text-muted-foreground"
                            title={feedback.memberPhone}
                          >
                            {feedback.memberPhone}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="max-w-full gap-1 truncate"
                        >
                          <Star aria-hidden="true" />
                          {ratingText(feedback.rating)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="min-w-0">
                          <StatusBadge
                            status={feedback.status}
                            showDot
                            className="max-w-full truncate"
                          >
                            {statusLabels[feedback.status]}
                          </StatusBadge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {feedback.managerResponse ? (
                          <div className="flex min-w-0 flex-col gap-1">
                            <p
                              title={feedback.managerResponse}
                              className="line-clamp-2"
                            >
                              {feedback.managerResponse}
                            </p>
                            <p
                              title={[
                                feedback.responderName ?? "Unknown responder",
                                feedback.responderRole
                                  ? `(${feedback.responderRole})`
                                  : null,
                              ]
                                .filter(Boolean)
                                .join(" ")}
                              className="truncate text-xs text-muted-foreground"
                            >
                              {feedback.responderName ?? "Unknown responder"}
                              {feedback.responderRole
                                ? ` (${feedback.responderRole})`
                                : ""}
                            </p>
                            {feedback.respondedAt ? (
                              <p className="truncate font-mono text-xs text-muted-foreground">
                                {dateFormatter.format(
                                  new Date(feedback.respondedAt)
                                )}
                              </p>
                            ) : null}
                          </div>
                        ) : (
                          <span className="block truncate text-muted-foreground">
                            No response yet
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <TableRowActions
                          label={`${tableAction.label} ${feedback.subject}`}
                          actions={[
                            {
                              href: `/feedback/${feedback.id}`,
                              label: tableAction.label,
                            },
                          ]}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-64">
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
          <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>
              Showing {visibleStart}-{visibleEnd} of {sortedFeedbacks.length}{" "}
              feedbacks
            </span>
            <TablePagination
              activePage={activePage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
