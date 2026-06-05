"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldContent, FieldLabel } from "@/components/ui/field"
import type { MembershipRoomOption } from "@/components/screens/owner/memberships/form/types"

interface MembershipRoomSelectorProps {
  rooms: readonly MembershipRoomOption[]
  selectedRoomIds: readonly string[]
  onChange: (roomIds: string[]) => void
}

export function MembershipRoomSelector({
  rooms,
  selectedRoomIds,
  onChange,
}: MembershipRoomSelectorProps) {
  function toggleRoom(roomId: string, checked: boolean) {
    if (checked) {
      onChange([...selectedRoomIds, roomId])
      return
    }

    onChange(
      selectedRoomIds.filter((selectedRoomId) => selectedRoomId !== roomId)
    )
  }

  if (!rooms.length) {
    return (
      <p className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
        No rooms are available for the selected facility.
      </p>
    )
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {rooms.map((room) => {
        const checked = selectedRoomIds.includes(room.id)

        return (
          <Field
            key={room.id}
            orientation="horizontal"
            className="items-center rounded-xl border p-3"
          >
            <Checkbox
              id={`room-${room.id}`}
              checked={checked}
              onCheckedChange={(nextChecked) =>
                toggleRoom(room.id, nextChecked === true)
              }
            />
            <FieldContent>
              <FieldLabel
                htmlFor={`room-${room.id}`}
                className="cursor-pointer font-normal"
              >
                {room.name}
              </FieldLabel>
            </FieldContent>
          </Field>
        )
      })}
    </div>
  )
}
