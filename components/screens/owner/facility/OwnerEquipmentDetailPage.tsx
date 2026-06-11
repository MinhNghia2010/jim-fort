import { notFound } from "next/navigation"
import {
  BadgeDollarSign,
  Barcode,
  CalendarDays,
  Dumbbell,
  Hash,
  Send,
} from "lucide-react"

import { reportEquipmentIssue } from "@/app/(main)/manager-actions"
import {
  getEquipmentDetailPageData,
  getRoomEquipmentHref,
} from "@/app/(main)/facility/data"
import { FormSelect } from "@/components/FormSelect"
import { PageShell } from "@/components/PageShell"
import { StatusBadge } from "@/components/StatusBadge"
import { ManagerActionForm } from "@/components/screens/manager/ManagerActionForm"
import { OwnerEquipmentIssueReportsCard } from "@/components/screens/owner/facility/OwnerEquipmentIssueReportsCard"
import { SummaryCard } from "@/components/SummaryCard"
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
  const equipmentListBackHref = getRoomEquipmentHref(
    data.facility?.name ?? facilityName,
    data.room?.id ?? roomId
  )

  if (!data.equipment && !data.errorMessage) {
    notFound()
  }

  if (!data.facility || !data.room || !data.equipment) {
    return (
      <PageShell
        backHref={equipmentListBackHref}
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
      backHref={equipmentListBackHref}
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
        <SummaryCard
          title="Status"
          value={statusLabels[equipment.status]}
          description="Current equipment lifecycle"
          icon={Dumbbell}
        />
        <SummaryCard
          title="Purchase cost"
          value={equipment.costLabel}
          description="Recorded purchase price"
          icon={BadgeDollarSign}
        />
        <SummaryCard
          title="Purchased"
          value={equipment.purchasedAtLabel}
          description="Purchase date"
          icon={CalendarDays}
        />
        <SummaryCard
          title="Code"
          value={equipment.code}
          description="Facility equipment identifier"
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
                  <FormSelect
                    id="status"
                    name="status"
                    defaultValue={equipment.status}
                    options={Object.entries(statusLabels).map(
                      ([value, label]) => ({
                        value,
                        label,
                      })
                    )}
                    required
                  />
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

        <OwnerEquipmentIssueReportsCard
          className={canManageEquipment ? undefined : "xl:col-span-2"}
          issueReports={data.issueReports}
          statusLabels={statusLabels}
        />
      </div>
    </PageShell>
  )
}
