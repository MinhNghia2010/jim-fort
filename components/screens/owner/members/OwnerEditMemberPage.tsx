import Link from "next/link"
import { ShieldCheck } from "lucide-react"

import { updateMember } from "@/app/(main)/members/actions"
import { getOwnerMemberEditData } from "@/app/(main)/members/data"
import { PageShell } from "@/components/PageShell"
import { ManagerActionForm } from "@/components/screens/manager/ManagerActionForm"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

interface OwnerEditMemberPageProps {
  memberId: string
}

export async function OwnerEditMemberPage({
  memberId,
}: OwnerEditMemberPageProps) {
  const member = await getOwnerMemberEditData(memberId)

  return (
    <PageShell
      backHref={`/members/${memberId}`}
      eyebrow="Member directory"
      title="Edit Member"
      description="Update the member profile and login metadata."
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>{member?.name ?? "Member not found"}</CardTitle>
            <CardDescription>
              Update the member&apos;s contact details without changing
              membership history.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {member ? (
              <ManagerActionForm
                action={updateMember}
                submitLabel="Save"
                pendingLabel="Saving"
                successMessage="Member updated"
                actionsClassName="sm:flex-row"
                secondaryAction={
                  <Button asChild variant="outline">
                    <Link href={`/members/${member.id}`}>Cancel</Link>
                  </Button>
                }
              >
                <input type="hidden" name="memberId" value={member.id} />
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="fullName">Full name</FieldLabel>
                    <Input
                      id="fullName"
                      name="fullName"
                      defaultValue={member.name}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="phone">Phone</FieldLabel>
                    <Input
                      id="phone"
                      name="phone"
                      defaultValue={member.phone ?? ""}
                      placeholder="Phone number"
                    />
                  </Field>
                </FieldGroup>
              </ManagerActionForm>
            ) : (
              <Alert variant="destructive">
                <AlertTitle>Member not available</AlertTitle>
                <AlertDescription>
                  This member cannot be edited from your workspace.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Alert>
          <ShieldCheck />
          <AlertTitle>Owner access</AlertTitle>
          <AlertDescription>
            Changes synchronize the member profile and login metadata.
            Subscriptions, payments, and sessions remain unchanged.
          </AlertDescription>
        </Alert>
      </div>
    </PageShell>
  )
}
