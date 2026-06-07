"use client"

import { useMemo, useState } from "react"
import { MessageSquareText, Search } from "lucide-react"

import {
  type FeedbackStatus,
  type OwnerFeedbackRow,
} from "@/components/screens/owner/feedback/OwnerFeedbackPage"
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

interface OwnerFeedbackTableProps {
  rows: readonly OwnerFeedbackRow[]
}

const statusLabels: Record<FeedbackStatus, string> = {
  open: "Open",
  in_review: "In review",
  responded: "Responded",
  closed: "Closed",
}

const statusFilters = [
  { value: "all", label: "Status: All" },
  { value: "open", label: "Status: Open" },
  { value: "in_review", label: "Status: In review" },
  { value: "responded", label: "Status: Responded" },
  { value: "closed", label: "Status: Closed" },
] as const

type FeedbackStatusFilter = (typeof statusFilters)[number]["value"]

type SortOption =
  | "feedback_latest"
  | "feedback_oldest"
  | "member_az"
  | "member_za"
  | "rating_high"
  | "rating_low"
  | "response_latest"
  | "response_oldest"

const feedbackSortOptions = [
  { value: "feedback_latest", label: "Feedback: Latest" },
  { value: "feedback_oldest", label: "Feedback: Oldest" },
] as const

const memberSortOptions = [
  { value: "member_az", label: "Member: A-Z" },
  { value: "member_za", label: "Member: Z-A" },
] as const

const ratingSortOptions = [
  { value: "rating_high", label: "Rating: High-Low" },
  { value: "rating_low", label: "Rating: Low-High" },
] as const

const responseSortOptions = [
  { value: "response_latest", label: "Manager response: Latest" },
  { value: "response_oldest", label: "Manager response: Oldest" },
] as const

const sortOptions: readonly SortOption[] = [
  "feedback_latest",
  "feedback_oldest",
  "member_az",
  "member_za",
  "rating_high",
  "rating_low",
  "response_latest",
  "response_oldest",
]

function isSortOption(value: string): value is SortOption {
  return sortOptions.includes(value as SortOption)
}

function feedbackStatusVariant(status: FeedbackStatus) {
  if (status === "open") {
    return "destructive" as const
  }

  if (status === "responded") {
    return "default" as const
  }

  if (status === "closed") {
    return "outline" as const
  }

  return "secondary" as const
}

function ResponseCell({ row }: { row: OwnerFeedbackRow }) {
  if (!row.managerResponse) {
    return (
      <div className="flex min-w-72 flex-col gap-1 text-muted-foreground">
        <p className="text-sm">No manager response yet.</p>
        <p className="text-xs">No response has been recorded</p>
      </div>
    )
  }

  return (
    <div className="flex max-w-xl min-w-80 flex-col gap-2">
      <p className="text-sm whitespace-normal">{row.managerResponse}</p>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>
          {row.respondedByName ?? "Unknown responder"} - {row.respondedByRole}
        </span>
        {row.respondedAtLabel ? (
          <span className="font-mono">{row.respondedAtLabel}</span>
        ) : null}
      </div>
    </div>
  )
}

function rowMatchesSearch(row: OwnerFeedbackRow, search: string) {
  if (!search) {
    return true
  }

  const searchableText = [
    row.subject,
    row.message,
    row.memberName,
    row.memberPhone,
    row.ratingLabel,
    statusLabels[row.status],
    row.managerResponse,
    row.respondedByName,
    row.respondedByRole,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  return searchableText.includes(search)
}

function getTime(value: string | null) {
  if (!value) {
    return null
  }

  const time = Date.parse(value)

  return Number.isFinite(time) ? time : null
}

function compareNullableTime(
  first: string | null,
  second: string | null,
  direction: "ascending" | "descending"
) {
  const firstTime = getTime(first)
  const secondTime = getTime(second)

  if (firstTime === null && secondTime === null) {
    return 0
  }

  if (firstTime === null) {
    return 1
  }

  if (secondTime === null) {
    return -1
  }

  return direction === "descending"
    ? secondTime - firstTime
    : firstTime - secondTime
}

function compareNullableNumber(
  first: number | null,
  second: number | null,
  direction: "ascending" | "descending"
) {
  if (first === null && second === null) {
    return 0
  }

  if (first === null) {
    return 1
  }

  if (second === null) {
    return -1
  }

  return direction === "descending" ? second - first : first - second
}

function sortFeedbackRows(
  rows: readonly OwnerFeedbackRow[],
  sortOption: SortOption
) {
  return [...rows].sort((first, second) => {
    if (sortOption === "feedback_latest") {
      return compareNullableTime(
        first.createdAt,
        second.createdAt,
        "descending"
      )
    }

    if (sortOption === "feedback_oldest") {
      return compareNullableTime(first.createdAt, second.createdAt, "ascending")
    }

    if (sortOption === "member_az") {
      return first.memberName.localeCompare(second.memberName)
    }

    if (sortOption === "member_za") {
      return second.memberName.localeCompare(first.memberName)
    }

    if (sortOption === "rating_high") {
      return compareNullableNumber(first.rating, second.rating, "descending")
    }

    if (sortOption === "rating_low") {
      return compareNullableNumber(first.rating, second.rating, "ascending")
    }

    if (sortOption === "response_latest") {
      return compareNullableTime(
        first.respondedAt,
        second.respondedAt,
        "descending"
      )
    }

    return compareNullableTime(
      first.respondedAt,
      second.respondedAt,
      "ascending"
    )
  })
}

function getHeaderSortValue(
  sortOption: SortOption,
  values: readonly SortOption[],
  fallback: string
) {
  return values.includes(sortOption) ? sortOption : fallback
}

function getSortLabel(
  sortOption: SortOption,
  options: readonly { value: SortOption; label: string }[],
  fallback: string
) {
  return (
    options.find((option) => option.value === sortOption)?.label ?? fallback
  )
}

function getStatusFilterLabel(statusFilter: FeedbackStatusFilter) {
  return (
    statusFilters.find((filter) => filter.value === statusFilter)?.label ??
    "Status"
  )
}

export function OwnerFeedbackTable({ rows }: OwnerFeedbackTableProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<FeedbackStatusFilter>("all")
  const [sortOption, setSortOption] = useState<SortOption>("feedback_latest")
  const updateSortOption = (value: string) => {
    if (isSortOption(value)) {
      setSortOption(value)
    }
  }

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    const matchingRows = rows.filter(
      (row) =>
        rowMatchesSearch(row, normalizedSearch) &&
        (statusFilter === "all" || row.status === statusFilter)
    )

    return sortFeedbackRows(matchingRows, sortOption)
  }, [rows, search, statusFilter, sortOption])

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Member feedback and responses</CardTitle>
        <CardDescription>
          Showing {filteredRows.length} of {rows.length} feedback records.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-0">
        <div className="px-4">
          <InputGroup className="w-full lg:w-96">
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
        </div>

        {rows.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">
                  <OwnerTableHeaderSelect
                    value={getHeaderSortValue(
                      sortOption,
                      ["feedback_latest", "feedback_oldest"],
                      "feedback"
                    )}
                    label={getSortLabel(
                      sortOption,
                      feedbackSortOptions,
                      "Feedback"
                    )}
                    options={[
                      { value: "feedback", label: "Feedback", disabled: true },
                      ...feedbackSortOptions,
                    ]}
                    onValueChange={updateSortOption}
                    ariaLabel="Sort feedback"
                    className="w-44"
                  />
                </TableHead>
                <TableHead>
                  <OwnerTableHeaderSelect
                    value={getHeaderSortValue(
                      sortOption,
                      ["member_az", "member_za"],
                      "member"
                    )}
                    label={getSortLabel(
                      sortOption,
                      memberSortOptions,
                      "Member"
                    )}
                    options={[
                      { value: "member", label: "Member", disabled: true },
                      ...memberSortOptions,
                    ]}
                    onValueChange={updateSortOption}
                    ariaLabel="Sort members"
                    className="w-40"
                  />
                </TableHead>
                <TableHead>
                  <OwnerTableHeaderSelect
                    value={getHeaderSortValue(
                      sortOption,
                      ["rating_high", "rating_low"],
                      "rating"
                    )}
                    label={getSortLabel(
                      sortOption,
                      ratingSortOptions,
                      "Rating"
                    )}
                    options={[
                      { value: "rating", label: "Rating", disabled: true },
                      ...ratingSortOptions,
                    ]}
                    onValueChange={updateSortOption}
                    ariaLabel="Sort ratings"
                    className="w-40"
                  />
                </TableHead>
                <TableHead>
                  <OwnerTableHeaderSelect
                    value={statusFilter}
                    label={getStatusFilterLabel(statusFilter)}
                    options={statusFilters}
                    onValueChange={(value) =>
                      setStatusFilter(value as FeedbackStatusFilter)
                    }
                    ariaLabel="Filter feedback by status"
                    className="w-40"
                  />
                </TableHead>
                <TableHead className="pr-4">
                  <OwnerTableHeaderSelect
                    value={getHeaderSortValue(
                      sortOption,
                      ["response_latest", "response_oldest"],
                      "response"
                    )}
                    label={getSortLabel(
                      sortOption,
                      responseSortOptions,
                      "Manager response"
                    )}
                    options={[
                      {
                        value: "response",
                        label: "Manager response",
                        disabled: true,
                      },
                      ...responseSortOptions,
                    ]}
                    onValueChange={updateSortOption}
                    ariaLabel="Sort manager responses"
                    className="w-56"
                  />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.length ? (
                filteredRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="pl-4 align-top">
                      <div className="flex max-w-xl min-w-80 flex-col gap-2">
                        <div className="flex flex-col gap-1">
                          <p className="font-medium whitespace-normal">
                            {row.subject}
                          </p>
                          <p className="font-mono text-xs text-muted-foreground">
                            {row.createdAtLabel}
                          </p>
                        </div>
                        <p className="text-sm whitespace-normal text-muted-foreground">
                          {row.message}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex min-w-40 flex-col gap-1">
                        <p className="font-medium">{row.memberName}</p>
                        <p className="text-xs text-muted-foreground">
                          {row.memberPhone}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="align-top font-medium tabular-nums">
                      {row.ratingLabel}
                    </TableCell>
                    <TableCell className="align-top">
                      <Badge
                        variant={feedbackStatusVariant(row.status)}
                        className="whitespace-nowrap"
                      >
                        {statusLabels[row.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-4 align-top">
                      <ResponseCell row={row} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-64">
                    <Empty className="border-0">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <Search />
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
        ) : (
          <Empty className="min-h-64 rounded-none border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MessageSquareText />
              </EmptyMedia>
              <EmptyTitle>No member feedback yet</EmptyTitle>
              <EmptyDescription>
                Member facility feedback and manager responses will appear here
                once they are submitted.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  )
}
