import { ShieldAlert } from "lucide-react"

import { HistoryBackButton } from "@/components/HistoryBackButton"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

type UnauthorizedPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function getSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function getSafeInternalHref(value: string | string[] | undefined) {
  const href = getSearchParam(value)

  if (!href || !href.startsWith("/") || href.startsWith("//")) {
    return "/overview"
  }

  return href
}

export default async function UnauthorizedPage({
  searchParams,
}: UnauthorizedPageProps) {
  const params = await searchParams
  const attemptedRoute = getSearchParam(params.from)
  const returnTo = getSafeInternalHref(params.returnTo)

  return (
    <section className="flex min-h-[calc(100svh-3.5rem)] items-center justify-center bg-background p-6">
      <Empty className="max-w-lg border border-dashed bg-card/30">
        <EmptyHeader>
          <EmptyMedia variant="icon" className="text-destructive">
            <ShieldAlert />
          </EmptyMedia>
          <EmptyTitle>Access denied</EmptyTitle>
          <EmptyDescription>
            Your current role does not have permission to open
            {attemptedRoute ? (
              <>
                {" "}
                <span className="font-mono text-foreground">
                  {attemptedRoute}
                </span>
              </>
            ) : (
              " this route"
            )}
            .
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <HistoryBackButton fallbackHref={returnTo} />
        </EmptyContent>
      </Empty>
    </section>
  )
}
