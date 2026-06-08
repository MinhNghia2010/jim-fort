"use client"

import { useState } from "react"
import { CalendarDays, Clock3 } from "lucide-react"

import { Button } from "@/components/ui/button"
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
import { ScrollArea } from "@/components/ui/scroll-area"
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

const dateLabelFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
})

const hourOptions = Array.from({ length: 24 }, (_, index) => index)
const minuteOptions = Array.from({ length: 60 }, (_, index) => index)

function dateToInputValue(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-")
}

function formatTime(hour: number, minute: number) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
}

function parseTime(value: string) {
  const match = value.trim().match(/^(\d{1,2}):(\d{1,2})$/)

  if (!match) {
    return null
  }

  const hour = Number(match[1])
  const minute = Number(match[2])

  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null
  }

  return { hour, minute }
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
  const [date, setDate] = useState<Date>()
  const [open, setOpen] = useState(false)

  return (
    <>
      <input
        type="hidden"
        name={name}
        value={date ? dateToInputValue(date) : ""}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={name}
            type="button"
            variant="outline"
            data-empty={!date}
            className="w-full justify-start text-left font-normal data-[empty=true]:text-muted-foreground"
          >
            <CalendarDays data-icon="inline-start" />
            {date ? dateLabelFormatter.format(date) : "Pick a start date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(nextDate) => {
              setDate(nextDate)
              setOpen(false)
            }}
            captionLayout="dropdown"
            timeZone="Asia/Ho_Chi_Minh"
          />
        </PopoverContent>
      </Popover>
    </>
  )
}

export function ManagerTimeSelect({
  name,
  defaultValue = "",
  placeholder,
}: ManagerTimeSelectProps) {
  const initialTime = parseTime(defaultValue.slice(0, 5))
  const [inputValue, setInputValue] = useState(
    initialTime ? formatTime(initialTime.hour, initialTime.minute) : ""
  )
  const [draftHour, setDraftHour] = useState(initialTime?.hour ?? 9)
  const [draftMinute, setDraftMinute] = useState(initialTime?.minute ?? 0)
  const selectedTime = parseTime(inputValue)
  const submittedValue = selectedTime
    ? formatTime(selectedTime.hour, selectedTime.minute)
    : ""

  function updateTime(hour: number, minute: number) {
    setDraftHour(hour)
    setDraftMinute(minute)
    setInputValue(formatTime(hour, minute))
  }

  function handleInputChange(value: string) {
    setInputValue(value)

    const parsedTime = parseTime(value)

    if (parsedTime) {
      setDraftHour(parsedTime.hour)
      setDraftMinute(parsedTime.minute)
    }
  }

  return (
    <>
      <input type="hidden" name={name} value={submittedValue} />
      <InputGroup>
        <InputGroupInput
          aria-label={placeholder}
          inputMode="numeric"
          placeholder={`${placeholder} HH:MM`}
          value={inputValue}
          aria-invalid={Boolean(inputValue && !selectedTime)}
          onChange={(event) => handleInputChange(event.target.value)}
          onBlur={() => {
            if (selectedTime) {
              setInputValue(formatTime(selectedTime.hour, selectedTime.minute))
            }
          }}
        />
        <InputGroupAddon align="inline-end">
          <Popover>
            <PopoverTrigger asChild>
              <InputGroupButton
                aria-label={`Open ${placeholder.toLowerCase()} time picker`}
                size="icon-xs"
              >
                <Clock3 aria-hidden="true" />
              </InputGroupButton>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="start">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Hour
                  </p>
                  <ScrollArea className="h-44 rounded-lg border">
                    <div className="flex flex-col gap-1 p-1">
                      {hourOptions.map((hour) => (
                        <Button
                          key={hour}
                          type="button"
                          variant={draftHour === hour ? "secondary" : "ghost"}
                          size="sm"
                          className="w-full font-mono"
                          onClick={() => updateTime(hour, draftMinute)}
                        >
                          {String(hour).padStart(2, "0")}
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <div className="flex flex-col gap-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Minute
                  </p>
                  <ScrollArea className="h-44 rounded-lg border">
                    <div className="flex flex-col gap-1 p-1">
                      {minuteOptions.map((minute) => (
                        <Button
                          key={minute}
                          type="button"
                          variant={
                            draftMinute === minute ? "secondary" : "ghost"
                          }
                          size="sm"
                          className="w-full font-mono"
                          onClick={() => updateTime(draftHour, minute)}
                        >
                          {String(minute).padStart(2, "0")}
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setInputValue("")}
              >
                Clear time
              </Button>
            </PopoverContent>
          </Popover>
        </InputGroupAddon>
      </InputGroup>
    </>
  )
}
