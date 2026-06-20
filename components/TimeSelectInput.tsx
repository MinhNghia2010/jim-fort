"use client"

import { useId, useState } from "react"
import { Clock3 } from "lucide-react"

import { Button } from "@/components/ui/button"
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

type TimeSelectInputProps = {
  name: string
  defaultValue?: string
  placeholder: string
}

const hourOptions = Array.from({ length: 24 }, (_, index) => index)
const minuteOptions = Array.from({ length: 60 }, (_, index) => index)

function formatTime(hour: number, minute: number) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
}

function parseTime(value: string) {
  const match = value.trim().match(/^([01]\d|2[0-3]):([0-5]\d)$/)

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

export function TimeSelectInput({
  name,
  defaultValue = "",
  placeholder,
}: TimeSelectInputProps) {
  const initialTime = parseTime(defaultValue.slice(0, 5))
  const errorId = useId()
  const [inputValue, setInputValue] = useState(
    initialTime ? formatTime(initialTime.hour, initialTime.minute) : ""
  )
  const [draftHour, setDraftHour] = useState(initialTime?.hour ?? 9)
  const [draftMinute, setDraftMinute] = useState(initialTime?.minute ?? 0)
  const selectedTime = parseTime(inputValue)
  const submittedValue = selectedTime
    ? formatTime(selectedTime.hour, selectedTime.minute)
    : ""
  const isInvalid = Boolean(inputValue && !selectedTime)

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
      <div className="flex flex-col gap-1">
        <InputGroup>
          <InputGroupInput
            aria-describedby={isInvalid ? errorId : undefined}
            aria-invalid={isInvalid}
            aria-label={placeholder}
            inputMode="numeric"
            maxLength={5}
            pattern="([01][0-9]|2[0-3]):[0-5][0-9]"
            placeholder={`${placeholder} HH:MM`}
            title="Use HH:MM in 24-hour time."
            value={inputValue}
            onChange={(event) => handleInputChange(event.target.value)}
            onBlur={() => {
              if (selectedTime) {
                setInputValue(
                  formatTime(selectedTime.hour, selectedTime.minute)
                )
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
        {isInvalid ? (
          <p id={errorId} className="text-xs text-destructive">
            Use HH:MM in 24-hour time.
          </p>
        ) : null}
      </div>
    </>
  )
}
