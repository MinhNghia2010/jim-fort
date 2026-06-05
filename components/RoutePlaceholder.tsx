import { PageShell } from "@/components/PageShell"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface RoutePlaceholderProps {
  title: string
  description?: string
}

export function RoutePlaceholder({
  title,
  description = "This screen will be implemented next.",
}: RoutePlaceholderProps) {
  return (
    <PageShell title={title} description={description}>
      <Card className="w-full max-w-lg rounded-lg shadow-none">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Screen status</CardTitle>
            <Badge variant="secondary">Coming soon</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The route is active so the app can compile while the screen
            components are built one by one.
          </p>
        </CardContent>
      </Card>
    </PageShell>
  )
}
