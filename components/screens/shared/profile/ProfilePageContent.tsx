import Link from "next/link"
import type { ReactNode } from "react"
import {
  CalendarClock,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react"

import { getCurrentProfileData } from "@/app/(main)/profile/[username]/data"
import { PageShell } from "@/components/PageShell"
import { StatusBadge } from "@/components/StatusBadge"
import { SummaryCard } from "@/components/SummaryCard"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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

interface ProfilePageContentProps {
  roleLabel: string
  children?: ReactNode
}

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
      .toUpperCase() || "U"
  )
}

function DetailRow({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: typeof UserRound
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon
        aria-hidden="true"
        className="mt-0.5 size-4 text-muted-foreground"
      />
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-sm break-words">{value}</p>
      </div>
    </div>
  )
}

export async function ProfilePageContent({
  children,
  roleLabel,
}: ProfilePageContentProps) {
  const profile = await getCurrentProfileData()

  return (
    <PageShell
      eyebrow={roleLabel}
      title="Profile"
      description="View your account identity and contact details."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Role"
          value={roleLabel}
          description="Current workspace access"
          icon={ShieldCheck}
        />
        <SummaryCard
          title="Email"
          value={profile.email}
          description="Sign-in address"
          icon={Mail}
        />
        <SummaryCard
          title="Phone"
          value={profile.phone ?? "Not recorded"}
          description="Profile contact number"
          icon={Phone}
        />
        <SummaryCard
          title="Updated"
          value={formatDate(profile.updatedAt)}
          description="Latest profile change"
          icon={CalendarClock}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center gap-4">
              <Avatar className="size-16">
                {profile.avatarUrl ? (
                  <AvatarImage src={profile.avatarUrl} alt={profile.name} />
                ) : null}
                <AvatarFallback>{getInitials(profile.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <CardTitle className="break-words">{profile.name}</CardTitle>
                <CardDescription className="break-words">
                  @{profile.username}
                </CardDescription>
              </div>
            </div>
            <CardAction>
              <Button asChild size="sm">
                <Link href={`/profile/${profile.username}/edit`}>
                  Edit Profile
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailRow
                icon={UserRound}
                label="Full name"
                value={profile.name}
              />
              <DetailRow icon={Mail} label="Email" value={profile.email} />
              <DetailRow
                icon={Phone}
                label="Phone"
                value={profile.phone ?? "Not recorded"}
              />
              <DetailRow icon={ShieldCheck} label="Role" value={roleLabel} />
            </div>
            <Separator />
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailRow
                icon={CalendarClock}
                label="Profile created"
                value={formatDate(profile.createdAt)}
              />
              <DetailRow
                icon={CalendarClock}
                label="Last updated"
                value={formatDate(profile.updatedAt)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account status</CardTitle>
            <CardDescription>
              Basic authentication and authorization context.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Authentication</span>
              <StatusBadge status="active" showDot />
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Workspace role</span>
              <Badge variant="secondary">{roleLabel}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {children}
    </PageShell>
  )
}
