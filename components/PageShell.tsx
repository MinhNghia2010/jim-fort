import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"

interface PageShellProps {
  title: string
  description: string
  eyebrow?: string
  backHref?: string
  backLabel?: string
  children: ReactNode
}

export function PageShell({
  title,
  description,
  eyebrow,
  backHref,
  backLabel = "Back",
  children,
}: PageShellProps) {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-2">
        {backHref ? (
          <Button variant="ghost" asChild className="w-fit px-0">
            <Link href={backHref}>
              <ArrowLeft data-icon="inline-start" />
              {backLabel}
            </Link>
          </Button>
        ) : null}

        <div className="flex flex-col gap-1">
          {eyebrow ? (
            <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      {children}
    </main>
  )
}
