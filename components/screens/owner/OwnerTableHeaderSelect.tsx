"use client"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export interface OwnerTableHeaderSelectOption<TValue extends string = string> {
  value: TValue
  label: string
}

interface OwnerTableHeaderSelectProps<TValue extends string = string> {
  label: string
  value: TValue
  options: readonly OwnerTableHeaderSelectOption<TValue>[]
  onValueChange: (value: TValue) => void
  className?: string
}

export function OwnerTableHeaderSelect<TValue extends string = string>({
  label,
  value,
  options,
  onValueChange,
  className,
}: OwnerTableHeaderSelectProps<TValue>) {
  return (
    <Select
      value={value}
      onValueChange={(nextValue) => onValueChange(nextValue as TValue)}
    >
      <SelectTrigger
        aria-label={label}
        className={cn(
          "h-8 border-0 bg-transparent py-0 pr-1 pl-0 shadow-none hover:bg-transparent focus-visible:border-transparent focus-visible:ring-0 data-[state=open]:bg-transparent",
          className
        )}
      >
        <span>{label}</span>
      </SelectTrigger>
      <SelectContent position="popper" align="start">
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
