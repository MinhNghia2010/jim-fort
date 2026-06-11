"use client"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export const ALL_MONTHS_VALUE = "all"

export interface TableMonthFilterOption {
  value: string
  label: string
}

const tableMonthLabelFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  timeZone: "UTC",
  year: "numeric",
})

interface TableMonthFilterProps {
  value: string
  options: readonly TableMonthFilterOption[]
  onValueChange: (value: string) => void
  label?: string
  className?: string
}

function getDate(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? null : date
}

export function getTableMonthKey(
  value: string | null | undefined,
  timeZone = "UTC"
) {
  const date = getDate(value)

  if (!date) {
    return null
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(date)
  const year = parts.find((part) => part.type === "year")?.value
  const month = parts.find((part) => part.type === "month")?.value

  return year && month ? `${year}-${month}` : null
}

export function getTableMonthFilterOptions<TRow>(
  rows: readonly TRow[],
  getDateValue: (row: TRow) => string | null | undefined,
  timeZone = "UTC"
): TableMonthFilterOption[] {
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "long",
    timeZone,
    year: "numeric",
  })
  const monthLabels = new Map<string, string>()

  rows.forEach((row) => {
    const value = getDateValue(row)
    const key = getTableMonthKey(value, timeZone)
    const date = getDate(value)

    if (key && date) {
      monthLabels.set(key, formatter.format(date))
    }
  })

  return [
    { value: ALL_MONTHS_VALUE, label: "All months" },
    ...Array.from(monthLabels.entries())
      .sort(([firstKey], [secondKey]) => secondKey.localeCompare(firstKey))
      .map(([value, label]) => ({ value, label })),
  ]
}

export function matchesTableMonthFilter(
  value: string | null | undefined,
  monthFilter: string,
  timeZone = "UTC"
) {
  return (
    monthFilter === ALL_MONTHS_VALUE ||
    getTableMonthKey(value, timeZone) === monthFilter
  )
}

export function getTableMonthFilterLabel(
  monthFilter: string,
  fallback = "All months"
) {
  if (monthFilter === ALL_MONTHS_VALUE) {
    return fallback
  }

  const match = /^(\d{4})-(\d{2})$/.exec(monthFilter)

  if (!match) {
    return fallback
  }

  const year = Number(match[1])
  const month = Number(match[2])

  if (month < 1 || month > 12) {
    return fallback
  }

  return tableMonthLabelFormatter.format(new Date(Date.UTC(year, month - 1, 1)))
}

export function TableMonthFilter({
  value,
  options,
  onValueChange,
  label = "Filter by month",
  className,
}: TableMonthFilterProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        aria-label={label}
        className={cn("h-9 w-full sm:w-44", className)}
      >
        <SelectValue placeholder="All months" />
      </SelectTrigger>
      <SelectContent align="end">
        <SelectGroup>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
