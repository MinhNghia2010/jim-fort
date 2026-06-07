"use client"

import { useMemo, useState } from "react"
import { CalendarDays, X } from "lucide-react"

import { Calendar } from "@/components/ui/calendar"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerFieldProps {
  id: string
  name: string
  label: string
  value: string
  onChange: (value: string) => void
  description?: string
  placeholder?: string
  required?: boolean
  minDate?: string
}

function parseDateValue(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)

  if (!match) {
    return undefined
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return undefined
  }

  return date
}

function formatDateValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

export function DatePickerField({
  id,
  name,
  label,
  value,
  onChange,
  description,
  placeholder = "Pick a date",
  required,
  minDate,
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false)
  const selectedDate = useMemo(() => parseDateValue(value), [value])
  const minimumDate = useMemo(
    () => (minDate ? parseDateValue(minDate) : undefined),
    [minDate]
  )

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <InputGroup>
        <InputGroupInput
          id={id}
          name={name}
          type="date"
          value={value}
          min={minDate || undefined}
          title={placeholder}
          required={required}
          aria-required={required}
          onChange={(event) => onChange(event.target.value)}
        />
        <InputGroupAddon align="inline-end">
          {!required && value ? (
            <InputGroupButton
              type="button"
              size="icon-xs"
              aria-label={`Clear ${label.toLowerCase()}`}
              onClick={() => onChange("")}
            >
              <X />
            </InputGroupButton>
          ) : null}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <InputGroupButton
                type="button"
                size="icon-xs"
                aria-label={`Open ${label.toLowerCase()} calendar`}
              >
                <CalendarDays />
              </InputGroupButton>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(nextDate) => {
                  if (!nextDate) {
                    return
                  }

                  onChange(formatDateValue(nextDate))
                  setOpen(false)
                }}
                disabled={
                  minimumDate ? (date) => date < minimumDate : undefined
                }
                captionLayout="dropdown"
              />
            </PopoverContent>
          </Popover>
        </InputGroupAddon>
      </InputGroup>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
    </Field>
  )
}
