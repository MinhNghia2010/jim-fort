import Link from "next/link"
import { SearchX } from "lucide-react"

import { PageShell } from "@/components/PageShell"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type ManagerSubscriptionNotFoundProps = {
  errorMessage?: string
  subscriptionId: string
}

export function ManagerSubscriptionNotFound({
  errorMessage,
  subscriptionId,
}: ManagerSubscriptionNotFoundProps) {
  return (
    <PageShell
      backHref="/subscriptions"
      eyebrow="Manager"
      title="Subscription not found"
      description="No accessible membership subscription matched this record."
    >
      {errorMessage ? (
        <Alert variant="destructive">
          <AlertTitle>Subscription could not be loaded</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SearchX className="size-5 text-muted-foreground" />
            No matching subscription
          </CardTitle>
          <CardDescription>
            No accessible subscription matched{" "}
            <span className="font-mono text-foreground">{subscriptionId}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/subscriptions">Return to subscriptions</Link>
          </Button>
        </CardContent>
      </Card>
    </PageShell>
  )
}
