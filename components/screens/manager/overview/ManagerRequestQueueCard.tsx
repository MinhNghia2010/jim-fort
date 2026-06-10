import { ClipboardList } from "lucide-react"

import { StatusBadge } from "@/components/StatusBadge"
import { TableRowActions } from "@/components/TableRowActions"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { managerOverviewDateFormatter } from "./manager-overview-constants"
import type { SubscriptionRecord } from "./manager-overview-data"
import { getMemberName, getPackageName } from "./manager-overview-utils"

type ManagerRequestQueueCardProps = {
  requests: SubscriptionRecord[]
}

export function ManagerRequestQueueCard({
  requests,
}: ManagerRequestQueueCardProps) {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardHeader className="border-b py-4">
        <CardTitle>Request queue</CardTitle>
        <CardDescription>
          Latest payment and PT setup requests requiring manager attention.
        </CardDescription>
        <CardAction>
          <Badge variant="secondary">{requests.length} latest</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="px-0">
        {requests.length ? (
          <>
            <div className="flex flex-col md:hidden">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="flex flex-col gap-3 border-b px-4 py-4 last:border-b-0"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium break-words">
                        {getMemberName(request)}
                      </p>
                      <p className="text-sm break-words text-muted-foreground">
                        {getPackageName(request)}
                      </p>
                    </div>
                    <TableRowActions
                      label={`Open actions for ${getMemberName(request)}`}
                      actions={[
                        {
                          href: `/request/${request.id}`,
                          label: "Open",
                        },
                      ]}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={request.status} showDot />
                    <span className="rounded-md bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                      {managerOverviewDateFormatter.format(
                        new Date(request.created_at)
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <Table className="hidden table-auto text-[0.925rem] md:table [&_td]:whitespace-normal [&_th]:whitespace-normal">
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="h-12 pl-6">Member</TableHead>
                  <TableHead className="h-12">Package</TableHead>
                  <TableHead className="h-12">Status</TableHead>
                  <TableHead className="h-12">Created</TableHead>
                  <TableHead className="h-12 pr-6 text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id} className="h-[4.5rem]">
                    <TableCell className="pl-6 font-medium">
                      {getMemberName(request)}
                    </TableCell>
                    <TableCell>{getPackageName(request)}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <StatusBadge status={request.status} showDot />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {managerOverviewDateFormatter.format(
                        new Date(request.created_at)
                      )}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <TableRowActions
                        label={`Open actions for ${getMemberName(request)}`}
                        actions={[
                          {
                            href: `/request/${request.id}`,
                            label: "Open",
                          },
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        ) : (
          <Empty className="min-h-64">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ClipboardList />
              </EmptyMedia>
              <EmptyTitle>No pending requests</EmptyTitle>
              <EmptyDescription>
                New payment and PT setup requests will appear here.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  )
}
