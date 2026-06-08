"use client"

import { useMemo, useState } from "react"
import { CalendarDays } from "lucide-react"

import { Calendar } from "@/components/ui/calendar"
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

interface DatePickerInputProps {
  id: string
  name: string
  value: string
  onChange: (value: string) => void
  ariaLabel?: string
  disabled?: boolean
  min?: string
  required?: boolean
}

function dateToInputValue(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-")
}

function inputValueToDate(value?: string) {
  const match = value?.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/)

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

export function DatePickerInput({
  id,
  name,
  value,
  onChange,
  ariaLabel,
  disabled,
  min,
  required,
}: DatePickerInputProps) {
  const [open, setOpen] = useState(false)
  const selectedDate = useMemo(() => inputValueToDate(value), [value])
  const minDate = useMemo(() => inputValueToDate(min), [min])
  const calendarLabel = ariaLabel ?? "date"

  return (
    <InputGroup data-disabled={disabled}>
      <InputGroupInput
        id={id}
        name={name}
        aria-label={ariaLabel}
        autoComplete="off"
        className="[&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
        disabled={disabled}
        min={min}
        required={required}
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <InputGroupAddon align="inline-end">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <InputGroupButton
              aria-label={`Open ${calendarLabel} calendar`}
              className="items-center justify-center"
              disabled={disabled}
              size="icon-xs"
            >
              <CalendarDays aria-hidden="true" />
            </InputGroupButton>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              disabled={
                minDate ? (date) => date.getTime() < minDate.getTime() : false
              }
              captionLayout="dropdown"
              timeZone="Asia/Ho_Chi_Minh"
              onSelect={(date) => {
                if (date) {
                  onChange(dateToInputValue(date))
                }

                setOpen(false)
              }}
            />
          </PopoverContent>
        </Popover>
      </InputGroupAddon>
    </InputGroup>
  )
}
