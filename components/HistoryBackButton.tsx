"use client"

import type { ComponentProps } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"

interface HistoryBackButtonProps
  extends Pick<ComponentProps<typeof Button>, "className" | "variant"> {
  fallbackHref: string
  label: string
}

export function HistoryBackButton({
  fallbackHref,
  label,
  className,
  variant,
}: HistoryBackButtonProps) {
  const router = useRouter()

  function handleBack() {
    if (window.history.length > 1) {
      router.back()
      return
    }

    router.push(fallbackHref)
  }

  return (
    <Button
      type="button"
      variant={variant}
      className={className}
      onClick={handleBack}
    >
      <ArrowLeft data-icon="inline-start" />
      <span>{label}</span>
    </Button>
  )
}
