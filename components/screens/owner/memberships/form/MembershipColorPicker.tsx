"use client"

import { Check } from "lucide-react"

import { membershipColorOptions } from "@/lib/features/owner/memberships/form/constants"
import { cn } from "@/lib/utils"

interface MembershipColorPickerProps {
  value: string
  onChange: (value: string) => void
}

export function MembershipColorPicker({
  value,
  onChange,
}: MembershipColorPickerProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {membershipColorOptions.map((color) => {
        const selected = value === color.value

        return (
          <button
            key={color.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(color.value)}
            className={cn(
              "flex items-center gap-2 rounded-xl border p-2 text-left text-sm transition-colors hover:bg-muted",
              selected && "border-foreground bg-muted"
            )}
          >
            <span
              aria-hidden="true"
              className="flex size-7 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: color.value }}
            >
              {selected ? <Check className="size-4 text-white" /> : null}
            </span>
            <span className="font-medium">{color.name}</span>
          </button>
        )
      })}
    </div>
  )
}
