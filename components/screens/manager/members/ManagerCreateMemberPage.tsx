import Link from "next/link"
import { ShieldCheck } from "lucide-react"

import { createManagedMember } from "@/app/(main)/manager-actions"
import type { ManagerCreateMemberPlanOption } from "@/app/(main)/members/data"
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
import { NativeSelect } from "@/components/ui/native-select"

interface ManagerCreateMemberPageProps {
  planOptions: readonly ManagerCreateMemberPlanOption[]
}

export function ManagerCreateMemberPage({
  planOptions,
}: ManagerCreateMemberPageProps) {
  return (
    <PageShell
      backHref="/members"
      eyebrow="Manager"
      title="Create Member"
      description="Prepare a new member account for membership assignment."
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>New member profile</CardTitle>
            <CardDescription>
              Create a login account and an initial pending subscription for
              this member.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {planOptions.length ? (
              <ManagerActionForm
                action={createManagedMember}
                submitLabel="Create member"
                pendingLabel="Creating member"
                successMessage="Member created"
                actionsClassName="flex-row-reverse justify-between gap-3"
                secondaryAction={
                  <Button asChild variant="outline">
                    <Link href="/members">Cancel</Link>
                  </Button>
                }
              >
                <FieldGroup>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="fullName">Full name</FieldLabel>
                      <Input
                        id="fullName"
                        name="fullName"
                        placeholder="Member full name"
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="phone">Phone</FieldLabel>
                      <Input
                        id="phone"
                        name="phone"
                        placeholder="Phone number"
                      />
                    </Field>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="email">Email</FieldLabel>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="member@example.com"
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="password">
                        Temporary password
                      </FieldLabel>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        minLength={8}
                        placeholder="At least 8 characters"
                        required
                      />
                    </Field>
                  </div>
                  <Field>
                    <FieldLabel htmlFor="packageId">Initial plan</FieldLabel>
                    <NativeSelect
                      id="packageId"
                      name="packageId"
                      className="w-full"
                      required
                    >
                      {planOptions.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.label}
                        </option>
                      ))}
                    </NativeSelect>
                    <FieldDescription>
                      The selected plan creates the member&apos;s first pending
                      subscription.
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              </ManagerActionForm>
            ) : (
              <Alert>
                <ShieldCheck />
                <AlertTitle>No active plans available</AlertTitle>
                <AlertDescription>
                  Create or activate a membership plan before adding a member.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex-col items-start gap-2 border-t text-sm text-muted-foreground">
            {planOptions.slice(0, 3).map((plan) => (
              <p key={plan.id}>
                <span className="font-medium text-foreground">
                  {plan.label}
                </span>{" "}
                {plan.description}
              </p>
            ))}
          </CardFooter>
        </Card>

        <Alert>
          <ShieldCheck />
          <AlertTitle>Login account included</AlertTitle>
          <AlertDescription>
            The member can sign in with the email and temporary password, then
            update their profile from the profile page.
          </AlertDescription>
        </Alert>
      </div>
    </PageShell>
  )
}
