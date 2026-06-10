"use client"

import type { ComponentProps } from "react"
import { useCallback, useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import {
  getPreviousAppPath,
  NAVIGATION_HISTORY_CHANGE_EVENT,
} from "@/components/NavigationHistoryTracker"
import { Button } from "@/components/ui/button"

interface HistoryBackButtonProps extends Pick<
  ComponentProps<typeof Button>,
  "className" | "variant"
> {
  fallbackHref: string
  label?: string
}

export function HistoryBackButton({
  fallbackHref,
  label = "Back",
  className,
  variant,
}: HistoryBackButtonProps) {
  const router = useRouter()
  const pathname = usePathname()

  const resolvePreviousPath = useCallback(() => {
    if (typeof window === "undefined") {
      return null
    }

    const currentPath = `${window.location.pathname}${window.location.search}`
    const trackedPreviousPath = getPreviousAppPath(currentPath)

    if (trackedPreviousPath) {
      return trackedPreviousPath
    }

    if (!document.referrer) {
      return null
    }

    try {
      const referrer = new URL(document.referrer)
      const referrerPath = `${referrer.pathname}${referrer.search}`

      if (
        referrer.origin === window.location.origin &&
        referrerPath !== currentPath
      ) {
        return referrerPath
      }
    } catch {
      return null
    }

    return null
  }, [])
  const [previousPath, setPreviousPath] = useState<string | null>(() =>
    resolvePreviousPath()
  )

  useEffect(() => {
    function handleHistoryChange() {
      setPreviousPath(resolvePreviousPath())
    }

    window.addEventListener(
      NAVIGATION_HISTORY_CHANGE_EVENT,
      handleHistoryChange
    )

    return () => {
      window.removeEventListener(
        NAVIGATION_HISTORY_CHANGE_EVENT,
        handleHistoryChange
      )
    }
  }, [pathname, resolvePreviousPath])

  function handleBack() {
    if (window.history.length > 1) {
      router.back()
      return
    }

    router.push(previousPath ?? fallbackHref)
  }

  if (!previousPath) {
    return null
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
