import Link from "next/link"
import { Save, ShieldCheck } from "lucide-react"

import { updateStaff } from "@/app/(main)/staffs/actions"
import { getStaffDetailData } from "@/app/(main)/staffs/data"
import { DatePickerField } from "@/components/DatePickerField"
import { FormSelect } from "@/components/FormSelect"
import { PageShell } from "@/components/PageShell"
import { ManagerActionForm } from "@/components/screens/manager/ManagerActionForm"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface OwnerEditStaffPageProps {
  staffId: string
  canEditLoginUsers?: boolean
}

const staffStatusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "on_leave", label: "On leave" },
  { value: "terminated", label: "Terminated" },
] as const

export async function OwnerEditStaffPage({
  staffId,
  canEditLoginUsers = true,
}: OwnerEditStaffPageProps) {
  let staff = null
  let loadError: string | null = null

  try {
    staff = await getStaffDetailData(staffId)
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Unable to load staff"
  }

  return (
    <PageShell
      backHref={`/staffs/${staffId}`}
      eyebrow="Staff directory"
      title="Edit Staff"
      description="Review the selected staff profile in an edit-ready layout."
    >
      {loadError ? (
        <Alert variant="destructive">
          <AlertTitle>Staff could not be loaded</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>{staff?.name ?? "Staff profile"}</CardTitle>
            <CardDescription>
              {staff?.kind === "staff_row"
                ? "Update staff profile details and employment status."
                : canEditLoginUsers
                  ? "Update manager or PT login profile details."
                  : "Manager and PT login accounts are shown read-only here."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {staff?.kind === "staff_row" ? (
              <ManagerActionForm
                action={updateStaff}
                submitLabel="Save staff"
                pendingLabel="Saving"
                successMessage="Staff updated"
                secondaryAction={
                  <Button asChild variant="outline">
                    <Link href={`/staffs/${staff.id}`}>Cancel</Link>
                  </Button>
                }
                actionsClassName="sm:flex-row"
              >
                <input type="hidden" name="staffKind" value="staff_row" />
                <input type="hidden" name="staffId" value={staff.id} />
                <FieldGroup>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="fullName">Full name</FieldLabel>
                      <Input
                        id="fullName"
                        name="fullName"
                        defaultValue={staff.name}
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="phone">Phone</FieldLabel>
                      <Input
                        id="phone"
                        name="phone"
                        defaultValue={staff.phone ?? ""}
                        placeholder="Phone number"
                      />
                    </Field>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Field>
                      <FieldLabel htmlFor="role">Role</FieldLabel>
                      <Input
                        id="role"
                        name="role"
                        defaultValue={staff.role ?? ""}
                        placeholder="front desk, cleaner..."
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="status">Status</FieldLabel>
                      <FormSelect
                        id="status"
                        name="status"
                        defaultValue={staff.status}
                        options={staffStatusOptions}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="hiredAt">Hired date</FieldLabel>
                      <DatePickerField
                        id="hiredAt"
                        name="hiredAt"
                        defaultValue={staff.hiredAt ?? ""}
                        ariaLabel="Staff hired date"
                      />
                    </Field>
                  </div>
                  <Field>
                    <FieldLabel htmlFor="note">Notes</FieldLabel>
                    <Textarea
                      id="note"
                      name="note"
                      defaultValue={staff.note ?? ""}
                      placeholder="Optional internal staff note"
                    />
                    <FieldDescription>
                      Notes are visible in the staff directory and detail page.
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              </ManagerActionForm>
            ) : staff?.kind === "login_user" && canEditLoginUsers ? (
              <ManagerActionForm
                action={updateStaff}
                submitLabel="Save staff"
                pendingLabel="Saving"
                successMessage="Staff updated"
                secondaryAction={
                  <Button asChild variant="outline">
                    <Link href={`/staffs/${staff.id}`}>Cancel</Link>
                  </Button>
                }
                actionsClassName="sm:flex-row"
              >
                <input type="hidden" name="staffKind" value="login_user" />
                <input type="hidden" name="staffId" value={staff.id} />
                <FieldGroup>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="fullName">Full name</FieldLabel>
                      <Input
                        id="fullName"
                        name="fullName"
                        defaultValue={staff.name}
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="phone">Phone</FieldLabel>
                      <Input
                        id="phone"
                        name="phone"
                        defaultValue={staff.phone ?? ""}
                        placeholder="Phone number"
                      />
                    </Field>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="role">Role</FieldLabel>
                      <Input
                        id="role"
                        value={staff.role ?? "No role"}
                        readOnly
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="status">Status</FieldLabel>
                      <Input
                        id="status"
                        value={staff.status.replaceAll("_", " ")}
                        readOnly
                      />
                    </Field>
                  </div>
                  <Field>
                    <FieldLabel htmlFor="note">Notes</FieldLabel>
                    <Textarea
                      id="note"
                      value={staff.note ?? "No notes recorded."}
                      readOnly
                    />
                    <FieldDescription>
                      Owner edits update the login profile name and phone.
                      Facility assignment and account role stay unchanged.
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              </ManagerActionForm>
            ) : (
              <FieldGroup>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="fullName">Full name</FieldLabel>
                    <Input
                      id="fullName"
                      value={staff?.name ?? "Not found"}
                      readOnly
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="phone">Phone</FieldLabel>
                    <Input
                      id="phone"
                      value={staff?.phone ?? "Not recorded"}
                      readOnly
                    />
                  </Field>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="role">Role</FieldLabel>
                    <Input
                      id="role"
                      value={staff?.role ?? "No role"}
                      readOnly
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="status">Status</FieldLabel>
                    <Input
                      id="status"
                      value={staff?.status.replaceAll("_", " ") ?? "Unknown"}
                      readOnly
                    />
                  </Field>
                </div>
                <Field>
                  <FieldLabel htmlFor="note">Notes</FieldLabel>
                  <Textarea
                    id="note"
                    value={staff?.note ?? "No notes recorded."}
                    readOnly
                  />
                  <FieldDescription>
                    Login account staff are not edited from the directory row
                    form.
                  </FieldDescription>
                </Field>
              </FieldGroup>
            )}
          </CardContent>
          {staff?.kind === "staff_row" ||
          (staff?.kind === "login_user" && canEditLoginUsers) ? null : (
            <CardFooter className="flex-wrap justify-between gap-3 border-t">
              {canEditLoginUsers ? null : (
                <>
                  <Button asChild variant="outline">
                    <Link href={staff ? `/staffs/${staff.id}` : "/staffs"}>
                      Cancel
                    </Link>
                  </Button>
                  <Button disabled>
                    <Save data-icon="inline-start" />
                    Save staff
                  </Button>
                </>
              )}
            </CardFooter>
          )}
        </Card>

        <Alert>
          <ShieldCheck />
          <AlertTitle>
            {staff?.kind === "staff_row"
              ? "Staff edits are enabled"
              : canEditLoginUsers
                ? "Login profile edits are enabled"
                : "Read-only account record"}
          </AlertTitle>
          <AlertDescription>
            {staff?.kind === "staff_row"
              ? "Saving updates the directory staff row only. Facility assignment is unchanged."
              : canEditLoginUsers
                ? "Saving updates the login user profile only. Facility assignment and account role are unchanged."
                : "Manager and PT login accounts should be edited through the account/profile flow."}
          </AlertDescription>
        </Alert>
      </div>
    </PageShell>
  )
}
