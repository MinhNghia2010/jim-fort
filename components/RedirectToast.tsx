"use client"

import { useEffect, useRef } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

import {
  redirectToastMessageParam,
  redirectToastTypeParam,
  type RedirectToastType,
} from "@/lib/redirect-toast"

const toastByType: Record<
  RedirectToastType,
  (message: string) => string | number
> = {
  success: toast.success,
  error: toast.error,
  info: toast.info,
  warning: toast.warning,
}

function isRedirectToastType(value: string | null): value is RedirectToastType {
  return (
    value === "success" ||
    value === "error" ||
    value === "info" ||
    value === "warning"
  )
}

export function RedirectToast() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const displayedToast = useRef<string | null>(null)
  const message = searchParams.get(redirectToastMessageParam)
  const rawType = searchParams.get(redirectToastTypeParam)

  useEffect(() => {
    if (!message) {
      displayedToast.current = null
      return
    }

    const toastKey = `${pathname}:${rawType}:${message}`

    if (displayedToast.current === toastKey) {
      return
    }

    displayedToast.current = toastKey
    const type = isRedirectToastType(rawType) ? rawType : "success"
    toastByType[type](message)

    const nextSearchParams = new URLSearchParams(searchParams.toString())
    nextSearchParams.delete(redirectToastMessageParam)
    nextSearchParams.delete(redirectToastTypeParam)
    const query = nextSearchParams.toString()

    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    })
  }, [message, pathname, rawType, router, searchParams])

  return null
}
