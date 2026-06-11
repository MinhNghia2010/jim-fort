import { Dumbbell } from "lucide-react"

import { Spinner } from "@/components/ui/spinner"

export function WorkspaceLoadingScreen() {
  return (
    <main
      role="status"
      aria-label="Loading workspace"
      className="grid min-h-[calc(100svh-3.5rem)] place-items-center p-6"
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Dumbbell className="size-6" aria-hidden="true" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <Spinner className="size-5 text-primary" />
          <span className="text-sm font-medium text-foreground">
            Loading workspace
          </span>
        </div>
      </div>
    </main>
  )
}
