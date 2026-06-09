import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { FacilityDistributionItem } from "@/lib/owner-overview"

import { SegmentedProgressBar } from "./SegmentedProgressBar"

interface FacilityDistributionCardProps {
  title: string
  description: string
  items: readonly FacilityDistributionItem[]
  detailsHref: string
}

export function FacilityDistributionCard({
  title,
  description,
  items,
  detailsHref,
}: FacilityDistributionCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm" asChild>
            <Link href={detailsHref}>
              Details
              <ArrowUpRight data-icon="inline-end" />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <SegmentedProgressBar items={items} />
      </CardContent>
    </Card>
  )
}
