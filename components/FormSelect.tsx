"use client"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface FormSelectOption {
  value: string
  label: string
}

interface FormSelectProps {
  id: string
  name: string
  options: readonly FormSelectOption[]
  defaultValue?: string
  value?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  onValueChange?: (value: string) => void
}

export function FormSelect({
  id,
  name,
  options,
  defaultValue,
  value,
  placeholder = "Select an option",
  required,
  disabled,
  onValueChange,
}: FormSelectProps) {
  return (
    <Select
      name={name}
      value={value}
      defaultValue={defaultValue}
      required={required}
      disabled={disabled}
      onValueChange={onValueChange}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
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
