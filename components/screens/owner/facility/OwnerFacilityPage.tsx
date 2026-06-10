import { Building2, Dumbbell, MapPin, Users } from "lucide-react"

import { getFacilityPageData } from "@/app/(main)/facility/data"
import { PageShell } from "@/components/PageShell"
import { ManagementMetricCard } from "@/components/screens/owner/ManagementMetricCard"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export async function OwnerFacilityPage() {
  const data = await getFacilityPageData()

  return (
    <PageShell
      eyebrow="Facility"
      title="Facility"
      description="Review gym locations, rooms, equipment coverage, and active facility usage."
    >
      {data.errorMessage ? (
        <Alert variant="destructive">
          <AlertTitle>Facility data could not be loaded</AlertTitle>
          <AlertDescription>{data.errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ManagementMetricCard
          title="Facilities"
          value={data.facilities.length}
          detail="Accessible gym locations"
          icon={Building2}
        />
        <ManagementMetricCard
          title="Rooms"
          value={data.totalRooms}
          detail="Facility rooms configured"
          icon={MapPin}
        />
        <ManagementMetricCard
          title="Equipment"
          value={data.totalEquipment}
          detail={`${data.activeEquipment} active equipment records`}
          icon={Dumbbell}
        />
        <ManagementMetricCard
          title="Active members"
          value={data.activeMembers}
          detail="Members with active subscriptions"
          icon={Users}
        />
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="border-b py-4">
          <CardTitle>Facility directory</CardTitle>
          <CardDescription>
            Showing {data.facilities.length} accessible facilities.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table className="table-auto text-[0.925rem] [&_td]:whitespace-normal [&_th]:whitespace-normal">
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="h-12 pl-6">Facility</TableHead>
                <TableHead className="h-12">Address</TableHead>
                <TableHead className="h-12">Rooms</TableHead>
                <TableHead className="h-12">Equipment</TableHead>
                <TableHead className="h-12">Staff</TableHead>
                <TableHead className="h-12">Members</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.facilities.length ? (
                data.facilities.map((facility) => (
                  <TableRow key={facility.id} className="h-[4.5rem]">
                    <TableCell className="pl-6">
                      <div className="min-w-0">
                        <p className="leading-5 font-semibold break-words">
                          {facility.name}
                        </p>
                        <p className="text-sm break-words text-muted-foreground">
                          {facility.phone}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {facility.address}
                    </TableCell>
                    <TableCell className="font-mono font-medium whitespace-nowrap tabular-nums">
                      {facility.roomCount}
                    </TableCell>
                    <TableCell className="font-mono font-medium whitespace-nowrap tabular-nums">
                      {facility.equipmentCount}
                    </TableCell>
                    <TableCell className="font-mono font-medium whitespace-nowrap tabular-nums">
                      {facility.activeStaffCount}
                    </TableCell>
                    <TableCell className="font-mono font-medium whitespace-nowrap tabular-nums">
                      {facility.activeMemberCount}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-64">
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <Building2 />
                        </EmptyMedia>
                        <EmptyTitle>No facilities found</EmptyTitle>
                        <EmptyDescription>
                          Facility records from the live gym_facilities table
                          will appear here.
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
    </PageShell>
  )
}
