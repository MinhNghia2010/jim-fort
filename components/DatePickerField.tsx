"use client"

import { useState } from "react"

import { DatePickerInput } from "@/components/DatePickerInput"

interface DatePickerFieldProps {
  id: string
  name: string
  defaultValue?: string | null
  ariaLabel?: string
  disabled?: boolean
  min?: string
  required?: boolean
}

export function DatePickerField({
  id,
  name,
  defaultValue,
  ariaLabel,
  disabled,
  min,
  required,
}: DatePickerFieldProps) {
  const [value, setValue] = useState(defaultValue ?? "")

  return (
    <DatePickerInput
      id={id}
      name={name}
      value={value}
      onChange={setValue}
      ariaLabel={ariaLabel}
      disabled={disabled}
      min={min}
      required={required}
    />
  )
}
