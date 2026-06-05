import type { ReactNode } from "react"
import { ShieldCheck } from "lucide-react"

import { AppBrand } from "@/components/brand/AppBrand"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface AuthShellProps {
  children: ReactNode
  description: string
  eyebrow?: string
  title: string
}

export function AuthShell({
  children,
  description,
  eyebrow = "Secure access",
  title,
}: AuthShellProps) {
  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="grid min-h-svh lg:grid-cols-[minmax(0,1fr)_minmax(24rem,32rem)]">
        <section className="hidden min-h-svh border-r bg-muted/30 p-8 lg:flex">
          <Card className="min-h-full w-full justify-between border-0 bg-card/80 shadow-none ring-1 ring-border">
            <CardHeader className="gap-6">
              <AppBrand size="lg" />
              <Separator />
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-end gap-5">
              <Badge variant="secondary" className="rounded-full">
                <ShieldCheck data-icon="inline-start" />
                {eyebrow}
              </Badge>
              <div className="flex max-w-lg flex-col gap-3">
                <CardTitle className="text-4xl leading-tight font-semibold">
                  {title}
                </CardTitle>
                <CardDescription className="text-base leading-7">
                  {description}
                </CardDescription>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="flex min-h-svh items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="flex w-full max-w-md flex-col gap-6">
            <AppBrand className="lg:hidden" />
            {children}
          </div>
        </section>
      </div>
    </main>
  )
}
