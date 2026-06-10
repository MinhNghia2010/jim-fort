"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

export const NAVIGATION_HISTORY_CHANGE_EVENT =
  "jim-fort:navigation-history-change"

const CURRENT_PATH_KEY = "jim-fort:navigation-current-path"
const PREVIOUS_PATH_KEY = "jim-fort:navigation-previous-path"

function getBrowserPath() {
  return `${window.location.pathname}${window.location.search}`
}

export function getPreviousAppPath(currentPath = getBrowserPath()) {
  const currentTrackedPath = window.sessionStorage.getItem(CURRENT_PATH_KEY)

  if (currentTrackedPath && currentTrackedPath !== currentPath) {
    return currentTrackedPath
  }

  const previousPath = window.sessionStorage.getItem(PREVIOUS_PATH_KEY)

  if (!previousPath || previousPath === currentPath) {
    return null
  }

  return previousPath
}

export function NavigationHistoryTracker() {
  const pathname = usePathname()

  useEffect(() => {
    const currentPath = getBrowserPath()
    const storedCurrentPath = window.sessionStorage.getItem(CURRENT_PATH_KEY)

    if (storedCurrentPath && storedCurrentPath !== currentPath) {
      window.sessionStorage.setItem(PREVIOUS_PATH_KEY, storedCurrentPath)
    }

    window.sessionStorage.setItem(CURRENT_PATH_KEY, currentPath)
    window.dispatchEvent(new Event(NAVIGATION_HISTORY_CHANGE_EVENT))
  }, [pathname])

  return null
}
