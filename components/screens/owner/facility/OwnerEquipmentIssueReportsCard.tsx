"use client"

import { useState } from "react"
import { ArrowRight, History } from "lucide-react"

import type { EquipmentIssueReportView } from "@/app/(main)/facility/data"
import { StatusBadge } from "@/components/StatusBadge"
import { TablePagination } from "@/components/TablePagination"
import type { RoomEquipmentStatus } from "@/components/screens/owner/facility/OwnerRoomEquipmentTable"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const ISSUE_REPORTS_PER_PAGE = 2

interface OwnerEquipmentIssueReportsCardProps {
  className?: string
  issueReports: EquipmentIssueReportView[]
  statusLabels: Record<RoomEquipmentStatus, string>
}

export function OwnerEquipmentIssueReportsCard({
  className,
  issueReports,
  statusLabels,
}: OwnerEquipmentIssueReportsCardProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.max(
    1,
    Math.ceil(issueReports.length / ISSUE_REPORTS_PER_PAGE)
  )
  const activePage = Math.min(currentPage, totalPages)
  const startIndex = (activePage - 1) * ISSUE_REPORTS_PER_PAGE
  const visibleReports = issueReports.slice(
    startIndex,
    startIndex + ISSUE_REPORTS_PER_PAGE
  )
  const visibleStart = visibleReports.length ? startIndex + 1 : 0
  const visibleEnd = Math.min(
    startIndex + ISSUE_REPORTS_PER_PAGE,
    issueReports.length
  )

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History
            aria-hidden="true"
            className="size-4 text-muted-foreground"
          />
          Issue reports
        </CardTitle>
        <CardDescription>
          Latest manager status updates, shown {ISSUE_REPORTS_PER_PAGE} per
          page.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {issueReports.length ? (
          <>
            <div className="grid gap-3">
              {visibleReports.map((report) => (
                <div key={report.id} className="rounded-xl border p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {report.reporterName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {report.createdAtLabel}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={report.previousStatus} showDot>
                        {statusLabels[report.previousStatus]}
                      </StatusBadge>
                      <ArrowRight
                        aria-hidden="true"
                        className="size-4 text-muted-foreground"
                      />
                      <StatusBadge status={report.newStatus} showDot>
                        {statusLabels[report.newStatus]}
                      </StatusBadge>
                    </div>
                  </div>
                  <p className="mt-3 text-sm whitespace-pre-wrap">
                    {report.issue}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-3 border-t pt-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span>
                Showing {visibleStart}-{visibleEnd} of {issueReports.length}{" "}
                reports
              </span>
              <TablePagination
                activePage={activePage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        ) : (
          <div className="rounded-xl bg-muted/40 p-4">
            <p className="text-sm text-muted-foreground">
              No issue reports recorded.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
