import { Dumbbell } from "lucide-react"

import { PageShell } from "@/components/PageShell"
import {
  OwnerRoomEquipmentTable,
  type OwnerRoomEquipmentRow,
  type RoomEquipmentStatus,
} from "@/components/screens/owner/facility/OwnerRoomEquipmentTable"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

interface OwnerRoomEquipmentPageProps {
  facilityName: string
  roomId: string
}

type RoomRecord = {
  id: string
  name: string
}

type EquipmentRecord = {
  id: string
  name: string
  status: RoomEquipmentStatus
  equipment_code: string | null
  serial_number: string | null
  brand: string | null
  model: string | null
  purchase_date: string | null
  purchase_price: string | number | null
  note: string | null
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC",
})

function toNumber(value: string | number | null | undefined) {
  const number = Number(value ?? 0)
  return Number.isFinite(number) ? number : 0
}

function formatDate(value: string | null) {
  return value ? dateFormatter.format(new Date(value)) : "Not recorded"
}

function decodeRouteSegment(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function mapEquipment(equipment: EquipmentRecord): OwnerRoomEquipmentRow {
  const cost = toNumber(equipment.purchase_price)

  return {
    id: equipment.id,
    name: equipment.name,
    status: equipment.status,
    code: equipment.equipment_code ?? "No code",
    serial: equipment.serial_number ?? "No serial",
    brand: equipment.brand ?? "Unknown brand",
    model: equipment.model ?? "Unknown model",
    purchasedAt: equipment.purchase_date,
    purchasedAtLabel: formatDate(equipment.purchase_date),
    cost,
    costLabel: currencyFormatter.format(cost),
    note: equipment.note,
  }
}

export async function OwnerRoomEquipmentPage({
  facilityName,
  roomId,
}: OwnerRoomEquipmentPageProps) {
  const supabase = await createClient()
  const [roomResult, equipmentResult] = await Promise.all([
    supabase.from("rooms").select("id, name").eq("id", roomId).maybeSingle(),
    supabase
      .from("gym_equipments")
      .select(
        "id, name, status, equipment_code, serial_number, brand, model, purchase_date, purchase_price, note"
      )
      .eq("room_id", roomId)
      .order("name", { ascending: true }),
  ])
  const room = roomResult.data as RoomRecord | null
  const equipments = ((equipmentResult.data ?? []) as unknown as EquipmentRecord[])
    .map(mapEquipment)
  const error = roomResult.error ?? equipmentResult.error
  const roomName = room?.name ?? "Room"

  return (
    <PageShell
      eyebrow={decodeRouteSegment(facilityName)}
      title={`${roomName} equipment`}
      description="Review room machines, status, identifiers, purchase details, and notes."
    >
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Equipment could not be loaded</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="size-5 text-muted-foreground" />
            Room equipment
          </CardTitle>
          <CardDescription>
            Showing {equipments.length} equipment records for {roomName}.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <OwnerRoomEquipmentTable equipments={equipments} />
        </CardContent>
      </Card>
    </PageShell>
  )
}
