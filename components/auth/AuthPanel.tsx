import type { ReactNode } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface AuthPanelProps {
  children: ReactNode
  description?: string
  title: string
}

export function AuthPanel({ children, description, title }: AuthPanelProps) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-2xl">{title}</CardTitle>
        {description ? (
          <CardDescription>{description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
