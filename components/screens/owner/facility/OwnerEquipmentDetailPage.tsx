import { notFound } from "next/navigation"
import {
  ArrowRight,
  BadgeDollarSign,
  Barcode,
  CalendarDays,
  Dumbbell,
  Hash,
  History,
  Send,
} from "lucide-react"

import { reportEquipmentIssue } from "@/app/(main)/manager-actions"
import { getEquipmentDetailPageData } from "@/app/(main)/facility/data"
import { PageShell } from "@/components/PageShell"
import { StatusBadge } from "@/components/StatusBadge"
import { ManagerActionForm } from "@/components/screens/manager/ManagerActionForm"
import { ManagementMetricCard } from "@/components/screens/owner/ManagementMetricCard"
import type { RoomEquipmentStatus } from "@/components/screens/owner/facility/OwnerRoomEquipmentTable"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"

interface OwnerEquipmentDetailPageProps {
  facilityName: string
  roomId: string
  equipmentId: string
  canManageEquipment?: boolean
}

const statusLabels: Record<RoomEquipmentStatus, string> = {
  active: "Active",
  maintenance: "Maintenance",
  broken: "Broken",
  retired: "Retired",
}

export async function OwnerEquipmentDetailPage({
  facilityName,
  roomId,
  equipmentId,
  canManageEquipment = false,
}: OwnerEquipmentDetailPageProps) {
  const data = await getEquipmentDetailPageData(
    facilityName,
    roomId,
    equipmentId
  )

  if (!data.equipment && !data.errorMessage) {
    notFound()
  }

  if (!data.facility || !data.room || !data.equipment) {
    return (
      <PageShell
        eyebrow="Equipment"
        title="Equipment not available"
        description="The requested equipment record could not be loaded."
      >
        <Alert variant="destructive">
          <AlertTitle>Equipment data could not be loaded</AlertTitle>
          <AlertDescription>
            {data.errorMessage ?? "The requested equipment was not found."}
          </AlertDescription>
        </Alert>
      </PageShell>
    )
  }

  const { facility, room, equipment } = data

  return (
    <PageShell
      eyebrow={`${facility.name} / ${room.name}`}
      title={equipment.name}
      description={equipment.description}
    >
      {data.errorMessage ? (
        <Alert variant="destructive">
          <AlertTitle>Equipment data could not be loaded</AlertTitle>
          <AlertDescription>{data.errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ManagementMetricCard
          title="Status"
          value={statusLabels[equipment.status]}
          detail="Current equipment lifecycle"
          icon={Dumbbell}
        />
        <ManagementMetricCard
          title="Purchase cost"
          value={equipment.costLabel}
          detail="Recorded purchase price"
          icon={BadgeDollarSign}
        />
        <ManagementMetricCard
          title="Purchased"
          value={equipment.purchasedAtLabel}
          detail="Purchase date"
          icon={CalendarDays}
        />
        <ManagementMetricCard
          title="Code"
          value={equipment.code}
          detail="Facility equipment identifier"
          icon={Barcode}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Equipment details</CardTitle>
            <CardDescription>
              Identifiers, category, and status.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <StatusBadge status={equipment.status} showDot>
                {statusLabels[equipment.status]}
              </StatusBadge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Category</p>
              <p className="text-sm font-medium">{equipment.category}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Brand</p>
              <p className="text-sm font-medium">{equipment.brand}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Model</p>
              <p className="text-sm font-medium">{equipment.model}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Serial</p>
              <p className="font-mono text-sm font-medium">
                {equipment.serial}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Equipment code</p>
              <p className="font-mono text-sm font-medium">{equipment.code}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash
                aria-hidden="true"
                className="size-4 text-muted-foreground"
              />
              Notes and audit
            </CardTitle>
            <CardDescription>Maintenance note and timestamps.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="rounded-xl bg-muted/40 p-4">
              <p className="text-xs text-muted-foreground">Note</p>
              <p className="text-sm">{equipment.note ?? "No note recorded."}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-muted/40 p-4">
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm font-medium">
                  {equipment.createdAtLabel}
                </p>
              </div>
              <div className="rounded-xl bg-muted/40 p-4">
                <p className="text-xs text-muted-foreground">Updated</p>
                <p className="text-sm font-medium">
                  {equipment.updatedAtLabel}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        {canManageEquipment ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send
                  aria-hidden="true"
                  className="size-4 text-muted-foreground"
                />
                Update status
              </CardTitle>
              <CardDescription>Record the current issue.</CardDescription>
            </CardHeader>
            <CardContent>
              <ManagerActionForm
                action={reportEquipmentIssue}
                submitLabel="Send to owner"
                pendingLabel="Sending"
                successMessage="Equipment issue sent"
              >
                <input type="hidden" name="equipmentId" value={equipment.id} />
                <input type="hidden" name="roomId" value={room.id} />
                <input
                  type="hidden"
                  name="facilityName"
                  value={facility.name}
                />

                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <NativeSelect
                    id="status"
                    name="status"
                    defaultValue={equipment.status}
                    className="w-full"
                    required
                  >
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <NativeSelectOption key={value} value={value}>
                        {label}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="issue">Issue</Label>
                  <Textarea
                    id="issue"
                    name="issue"
                    className="min-h-28"
                    placeholder="What changed with this equipment?"
                    required
                  />
                </div>
              </ManagerActionForm>
            </CardContent>
          </Card>
        ) : null}

        <Card className={canManageEquipment ? undefined : "xl:col-span-2"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History
                aria-hidden="true"
                className="size-4 text-muted-foreground"
              />
              Issue reports
            </CardTitle>
            <CardDescription>Manager status updates for this equipment.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {data.issueReports.length ? (
              data.issueReports.map((report) => (
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
                  <p className="mt-3 whitespace-pre-wrap text-sm">
                    {report.issue}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-xl bg-muted/40 p-4">
                <p className="text-sm text-muted-foreground">
                  No issue reports recorded.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}
