import Link from "next/link"
import { Save, ShieldCheck } from "lucide-react"

import { PageShell } from "@/components/PageShell"
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

export function OwnerAddStaffPage() {
  return (
    <PageShell
      backHref="/staffs"
      eyebrow="Staff directory"
      title="Add Staff"
      description="Prepare a new staff profile for the facility directory."
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>New staff profile</CardTitle>
            <CardDescription>
              The form layout is ready; staff creation needs a server action
              before saving can be enabled.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="fullName">Full name</FieldLabel>
                  <Input id="fullName" placeholder="Staff full name" disabled />
                </Field>
                <Field>
                  <FieldLabel htmlFor="phone">Phone</FieldLabel>
                  <Input id="phone" placeholder="Phone number" disabled />
                </Field>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="role">Role</FieldLabel>
                  <Input
                    id="role"
                    placeholder="front desk, cleaner..."
                    disabled
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="status">Status</FieldLabel>
                  <Input id="status" value="active" disabled />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="note">Notes</FieldLabel>
                <Textarea
                  id="note"
                  placeholder="Optional internal staff note"
                  disabled
                />
                <FieldDescription>
                  This field maps to the staff directory notes column.
                </FieldDescription>
              </Field>
            </FieldGroup>
          </CardContent>
          <CardFooter className="flex-wrap justify-between gap-3 border-t">
            <Button asChild variant="outline">
              <Link href="/staffs">Cancel</Link>
            </Button>
            <Button disabled>
              <Save data-icon="inline-start" />
              Create staff
            </Button>
          </CardFooter>
        </Card>

        <Alert>
          <ShieldCheck />
          <AlertTitle>Creation is not enabled yet</AlertTitle>
          <AlertDescription>
            Staff reads are implemented. A create action and write policy are
            needed before this page can save new staff rows.
          </AlertDescription>
        </Alert>
      </div>
    </PageShell>
  )
}
