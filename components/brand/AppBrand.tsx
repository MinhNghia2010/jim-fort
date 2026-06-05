import type { ComponentProps } from "react"
import { Dumbbell } from "lucide-react"

import { cn } from "@/lib/utils"

interface AppBrandProps extends ComponentProps<"div"> {
  showSubtitle?: boolean
  size?: "default" | "lg"
}

export function AppBrand({
  className,
  showSubtitle = true,
  size = "default",
  ...props
}: AppBrandProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-3",
        size === "lg" && "gap-4",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground",
          size === "lg" && "size-12 rounded-xl"
        )}
      >
        <Dumbbell aria-hidden="true" />
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <span
          className={cn(
            "truncate text-base leading-none font-semibold",
            size === "lg" && "text-lg"
          )}
        >
          Jim Fort
        </span>
        {showSubtitle ? (
          <span className="truncate text-xs text-muted-foreground">
            Gym management
          </span>
        ) : null}
      </div>
    </div>
  )
}
