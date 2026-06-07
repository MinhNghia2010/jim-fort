"use client"

import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"

export interface OwnerTableHeaderSelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface OwnerTableHeaderSelectProps {
  value: string
  label: string
  options: readonly OwnerTableHeaderSelectOption[]
  onValueChange: (value: string) => void
  ariaLabel: string
  className?: string
}

export function OwnerTableHeaderSelect({
  value,
  label,
  options,
  onValueChange,
  ariaLabel,
  className,
}: OwnerTableHeaderSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        size="sm"
        className={cn(
          "border-0 bg-transparent pl-0 shadow-none focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent dark:hover:bg-transparent",
          className
        )}
        aria-label={ariaLabel}
      >
        <span className="truncate">{label}</span>
      </SelectTrigger>
      <SelectContent align="start" position="popper">
        <SelectGroup>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
