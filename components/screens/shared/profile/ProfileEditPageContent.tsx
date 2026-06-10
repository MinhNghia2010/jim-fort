import Link from "next/link"
import { ShieldCheck } from "lucide-react"

import { getCurrentProfileData } from "@/app/(main)/profile/[username]/data"
import { updateCurrentProfile } from "@/app/(main)/profile/actions"
import { PageShell } from "@/components/PageShell"
import { MemberActionForm } from "@/components/screens/member/MemberActionForm"
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

interface ProfileEditPageContentProps {
  roleLabel: string
}

export async function ProfileEditPageContent({
  roleLabel,
}: ProfileEditPageContentProps) {
  const profile = await getCurrentProfileData()

  return (
    <PageShell
      eyebrow={roleLabel}
      title="Edit Profile"
      description="Review your stored profile fields and account identity."
      backHref={`/profile/${profile.username}`}
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Profile fields</CardTitle>
            <CardDescription>
              These values come from your authenticated account and public user
              profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MemberActionForm
              action={updateCurrentProfile}
              submitLabel="Save changes"
              pendingLabel="Saving profile"
              successMessage="Profile updated"
              actionsClassName="flex-row-reverse justify-between gap-3"
              secondaryAction={
                <Button asChild variant="outline">
                  <Link href={`/profile/${profile.username}`}>Cancel</Link>
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
                      defaultValue={profile.name}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="username">Username</FieldLabel>
                    <Input id="username" value={profile.username} readOnly />
                  </Field>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input id="email" value={profile.email} readOnly />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="phone">Phone</FieldLabel>
                    <Input
                      id="phone"
                      name="phone"
                      defaultValue={profile.phone ?? ""}
                      placeholder="Not recorded"
                    />
                  </Field>
                </div>
                <Field>
                  <FieldLabel htmlFor="role">Role</FieldLabel>
                  <Input id="role" value={roleLabel} readOnly />
                  <FieldDescription>
                    Role and email changes are controlled by workspace account
                    assignment.
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </MemberActionForm>
          </CardContent>
          <CardFooter className="flex-wrap justify-between gap-3 border-t text-sm text-muted-foreground">
            Changes update your public user profile and synced auth metadata.
          </CardFooter>
        </Card>

        <Alert>
          <ShieldCheck />
          <AlertTitle>Profile editing enabled</AlertTitle>
          <AlertDescription>
            You can update your display name and phone number. Login email and
            role stay locked to the workspace account.
          </AlertDescription>
        </Alert>
      </div>
    </PageShell>
  )
}
