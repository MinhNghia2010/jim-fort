import type { CSSProperties } from "react"
import { Check, CreditCard, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { MembershipStatus } from "@/components/screens/owner/memberships/form/types"

type PreviewAccentStyle = CSSProperties & {
  [key: `--${string}`]: string | number | undefined
}

interface MembershipPlanPreviewProps {
  name: string
  description: string
  priceLabel: string
  termLabel: string
  status: MembershipStatus
  color: string
  features: readonly string[]
  activeMembers?: number
  revenueLabel?: string
}

function getPreviewAccentStyle(color: string): PreviewAccentStyle {
  return {
    "--plan-color": color,
  }
}

function statusVariant(status: MembershipStatus) {
  if (status === "active") {
    return "default" as const
  }

  if (status === "archived") {
    return "outline" as const
  }

  return "secondary" as const
}

export function MembershipPlanPreview({
  name,
  description,
  priceLabel,
  termLabel,
  status,
  color,
  features,
  activeMembers = 0,
  revenueLabel = "$0",
}: MembershipPlanPreviewProps) {
  return (
    <Card
      style={getPreviewAccentStyle(color)}
      className="relative border-0 bg-card/95 shadow-sm ring-1 ring-foreground/10"
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,var(--plan-color),transparent)]"
      />
      <div
        aria-hidden="true"
        className="absolute -top-12 -right-10 size-36 rounded-full bg-[var(--plan-color)] opacity-10"
      />
      <div
        aria-hidden="true"
        className="absolute right-12 bottom-20 size-24 rounded-full bg-[var(--plan-color)] opacity-5"
      />

      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="size-2.5 shrink-0 rounded-full bg-[var(--plan-color)] shadow-[0_0_0_4px_color-mix(in_srgb,var(--plan-color)_14%,transparent)]"
          />
          {name || "New membership plan"}
        </CardTitle>
        <CardDescription>
          {description || "Describe what members get from this plan."}
        </CardDescription>
        <CardAction>
          <Badge
            variant={statusVariant(status)}
            className="border-[color:var(--plan-color)] bg-[color-mix(in_srgb,var(--plan-color)_12%,transparent)] text-[color:var(--plan-color)] capitalize"
          >
            {status}
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="relative flex flex-col gap-5">
        <div className="rounded-2xl bg-[color-mix(in_srgb,var(--plan-color)_9%,transparent)] p-4 ring-1 ring-[color-mix(in_srgb,var(--plan-color)_18%,transparent)]">
          <div className="flex items-end gap-2">
            <p className="font-heading text-3xl font-semibold tracking-tight tabular-nums">
              {priceLabel}
            </p>
            <p className="pb-1 text-sm text-muted-foreground">/ {termLabel}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {features.map((feature) => (
            <div key={feature} className="flex items-start gap-2">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--plan-color)_14%,transparent)]">
                <Check
                  aria-hidden="true"
                  className="size-3.5 text-[color:var(--plan-color)]"
                />
              </span>
              <span className="text-sm text-muted-foreground">{feature}</span>
            </div>
          ))}
        </div>
      </CardContent>

      <CardFooter className="relative grid grid-cols-1 gap-3 bg-[color-mix(in_srgb,var(--plan-color)_7%,var(--muted))] sm:grid-cols-2">
        <div className="flex items-center gap-2 rounded-xl bg-background/80 p-3 ring-1 ring-foreground/10">
          <Users className="size-4 text-[color:var(--plan-color)]" />
          <div>
            <p className="text-xs text-muted-foreground">Members</p>
            <p className="font-mono text-sm font-medium tabular-nums">
              {activeMembers}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-background/80 p-3 ring-1 ring-foreground/10">
          <CreditCard className="size-4 text-[color:var(--plan-color)]" />
          <div>
            <p className="text-xs text-muted-foreground">Revenue</p>
            <p className="font-mono text-sm font-medium tabular-nums">
              {revenueLabel}
            </p>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
