import { ShieldCheck } from "lucide-react"

import {
  getAddStaffPageData,
  type StaffFacilityOption,
} from "@/app/(main)/staffs/data"
import { PageShell } from "@/components/PageShell"
import { StaffCreateForm } from "@/components/screens/owner/staffs/StaffCreateForm"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface OwnerAddStaffPageProps {
  canCreateLoginUsers?: boolean
}

export async function OwnerAddStaffPage({
  canCreateLoginUsers = true,
}: OwnerAddStaffPageProps) {
  let facilities: StaffFacilityOption[] = []
  let loadError: string | null = null

  try {
    facilities = await getAddStaffPageData()
  } catch (error) {
    loadError =
      error instanceof Error ? error.message : "Unable to load facilities"
  }

  return (
    <PageShell
      backHref="/staffs"
      eyebrow="Staff directory"
      title="Add Staff"
      description={
        canCreateLoginUsers
          ? "Create a directory staff row, manager login account, or PT login account."
          : "Add a staff record to the staffs table for your managed facility."
      }
    >
      {loadError ? (
        <Alert variant="destructive">
          <AlertTitle>Staff form data could not be loaded</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>New staff profile</CardTitle>
            <CardDescription>
              {canCreateLoginUsers
                ? "Choose Manager or PT when the staff member needs a login account."
                : "Managers can add regular staff records only. Owner creates manager and PT login accounts."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {facilities.length ? (
              <StaffCreateForm
                facilities={facilities}
                canCreateLoginUsers={canCreateLoginUsers}
              />
            ) : (
              <Alert>
                <ShieldCheck />
                <AlertTitle>No facility available</AlertTitle>
                <AlertDescription>
                  You need access to a facility before adding staff.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Alert>
          <ShieldCheck />
          <AlertTitle>
            {canCreateLoginUsers ? "Owner account creation" : "Directory staff"}
          </AlertTitle>
          <AlertDescription>
            {canCreateLoginUsers
              ? "Manager and PT choices create Supabase Auth users and assign them to the selected facility."
              : "This form inserts into the staffs table only. It does not create an Auth user, account, manager, or PT assignment."}
          </AlertDescription>
        </Alert>
      </div>
    </PageShell>
  )
}
