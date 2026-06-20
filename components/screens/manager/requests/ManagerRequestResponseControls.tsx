"use client"

import { useState } from "react"

import { DatePickerInput } from "@/components/DatePickerInput"
import { TimeSelectInput } from "@/components/TimeSelectInput"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type TrainerOption = {
  value: string
  label: string
}

type ManagerTrainerSelectProps = {
  name: string
  trainers: TrainerOption[]
}

type ManagerTimeSelectProps = {
  name: string
  defaultValue?: string
  placeholder: string
}

type ManagerScheduleDatePickerProps = {
  name: string
}

function getTodayInputValue() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date())
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  )

  return `${values.year}-${values.month}-${values.day}`
}

export function ManagerTrainerSelect({
  name,
  trainers,
}: ManagerTrainerSelectProps) {
  const [value, setValue] = useState(trainers[0]?.value ?? "")

  return (
    <>
      <input type="hidden" name={name} value={value} />
      <Select
        value={value}
        onValueChange={setValue}
        disabled={!trainers.length}
      >
        <SelectTrigger id={name} className="w-full">
          <SelectValue placeholder="Select trainer" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {trainers.map((trainer) => (
              <SelectItem key={trainer.value} value={trainer.value}>
                {trainer.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </>
  )
}

export function ManagerScheduleDatePicker({
  name,
}: ManagerScheduleDatePickerProps) {
  const [date, setDate] = useState("")
  const today = getTodayInputValue()

  return (
    <DatePickerInput
      id={name}
      name={name}
      value={date}
      onChange={setDate}
      ariaLabel="Schedule start date"
      min={today}
      required
    />
  )
}

export function ManagerTimeSelect({
  name,
  defaultValue = "",
  placeholder,
}: ManagerTimeSelectProps) {
  return (
    <TimeSelectInput
      name={name}
      defaultValue={defaultValue}
      placeholder={placeholder}
    />
  )
}
