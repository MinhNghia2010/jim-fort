import Link from "next/link"
import {
  BriefcaseBusiness,
  CalendarClock,
  CircleDot,
  Pencil,
  Phone,
  SearchX,
  UserCog,
} from "lucide-react"

import { deleteStaff } from "@/app/(main)/staffs/actions"
import { getStaffDetailData } from "@/app/(main)/staffs/data"
import { DeleteConfirmationButton } from "@/components/DeleteConfirmationButton"
import { PageShell } from "@/components/PageShell"
import { StatusBadge } from "@/components/StatusBadge"
import { ManagementMetricCard } from "@/components/screens/owner/ManagementMetricCard"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface OwnerStaffDetailPageProps {
  staffId: string
  canDelete?: boolean
}

const statusLabels = {
  active: "Active",
  inactive: "Inactive",
  on_leave: "On leave",
  terminated: "Terminated",
} as const

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Ho_Chi_Minh",
})

function formatDate(value: string | null) {
  return value ? dateFormatter.format(new Date(value)) : "Not recorded"
}

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "S"
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm break-words">{value}</p>
    </div>
  )
}

function StaffNotFound() {
  return (
    <PageShell
      backHref="/staffs"
      title="Staff not found"
      description="This staff record is not available from your workspace."
    >
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SearchX className="size-5 text-muted-foreground" />
            No matching staff
          </CardTitle>
          <CardDescription>
            No accessible staff record matched this request.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/staffs">Return to staff directory</Link>
          </Button>
        </CardContent>
      </Card>
    </PageShell>
  )
}

export async function OwnerStaffDetailPage({
  staffId,
  canDelete = true,
}: OwnerStaffDetailPageProps) {
  let staff = null
  let loadError: string | null = null

  try {
    staff = await getStaffDetailData(staffId)
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Unable to load staff"
  }

  if (!staff && !loadError) {
    return <StaffNotFound />
  }

  return (
    <PageShell
      backHref="/staffs"
      eyebrow="Staff directory"
      title={staff?.name ?? "Staff detail"}
      description="Review staff contact, role, facility assignment, and notes."
    >
      {loadError ? (
        <Alert variant="destructive">
          <AlertTitle>Staff could not be loaded</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      ) : null}

      {staff ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <ManagementMetricCard
              title="Status"
              value={statusLabels[staff.status]}
              detail="Current staff state"
              icon={CircleDot}
            />
            <ManagementMetricCard
              title="Role"
              value={staff.role ?? "Staff"}
              detail={
                staff.kind === "login_user"
                  ? "Login account role"
                  : "Directory staff role"
              }
              icon={BriefcaseBusiness}
            />
            <ManagementMetricCard
              title="Phone"
              value={staff.phone ?? "Not recorded"}
              detail="Contact number"
              icon={Phone}
            />
            <ManagementMetricCard
              title="Hired"
              value={staff.hiredAt ? formatDate(staff.hiredAt) : "N/A"}
              detail="Employment start date"
              icon={CalendarClock}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center gap-4">
                  <Avatar className="size-16">
                    {staff.avatarUrl ? (
                      <AvatarImage src={staff.avatarUrl} alt={staff.name} />
                    ) : null}
                    <AvatarFallback>{getInitials(staff.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <CardTitle className="break-words">{staff.name}</CardTitle>
                    <CardDescription className="break-words">
                      {staff.role ?? "Staff member"}
                    </CardDescription>
                  </div>
                </div>
                <CardAction className="flex items-center gap-2">
                  <Button asChild size="sm">
                    <Link href={`/staffs/${staff.id}/edit`}>
                      <Pencil data-icon="inline-start" />
                      Edit
                    </Link>
                  </Button>
                  {canDelete ? (
                    <DeleteConfirmationButton
                      action={deleteStaff}
                      description={`Delete ${staff.name}? Directory records are removed permanently. Login accounts are deleted only when they have no protected operational history.`}
                      inputName="staffId"
                      inputValue={staff.id}
                      label="Delete"
                      successMessage="Staff deleted"
                      title="Delete staff record?"
                    />
                  ) : null}
                </CardAction>
              </CardHeader>
              <CardContent className="grid gap-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailRow label="Full name" value={staff.name} />
                  <DetailRow
                    label="Phone"
                    value={staff.phone ?? "Not recorded"}
                  />
                  <DetailRow label="Role" value={staff.role ?? "No role"} />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Status
                    </p>
                    <StatusBadge status={staff.status} showDot>
                      {statusLabels[staff.status]}
                    </StatusBadge>
                  </div>
                </div>
                <Separator />
                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailRow label="Hired" value={formatDate(staff.hiredAt)} />
                  <DetailRow
                    label="Created"
                    value={formatDate(staff.createdAt)}
                  />
                  <DetailRow
                    label="Updated"
                    value={formatDate(staff.updatedAt)}
                  />
                  <DetailRow
                    label="Record type"
                    value={
                      staff.kind === "login_user"
                        ? "Manager/PT login user"
                        : "Staff directory row"
                    }
                  />
                </div>
                <Separator />
                <div className="grid gap-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Notes
                  </p>
                  <p className="text-sm leading-6 whitespace-pre-wrap text-muted-foreground">
                    {staff.note ?? "No notes recorded."}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCog className="size-5 text-muted-foreground" />
                  Facility assignment
                </CardTitle>
                <CardDescription>
                  Facilities connected to this staff record.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {staff.facilities.length ? (
                  staff.facilities.map((facility) => (
                    <div key={facility.id} className="rounded-lg border p-3">
                      <p className="font-medium">{facility.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {facility.address ?? "No address recorded"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {facility.phone ?? "No phone recorded"}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No facility assignment was found.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </PageShell>
  )
}
