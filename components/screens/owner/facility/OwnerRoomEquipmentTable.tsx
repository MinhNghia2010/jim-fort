"use client"

import { useMemo, useState } from "react"
import { ListChecks } from "lucide-react"

import type { EquipmentMachineRow } from "@/app/(main)/facility/data"
import { OwnerTableHeaderSelect } from "@/components/screens/owner/OwnerTableHeaderSelect"
import { Badge } from "@/components/ui/badge"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { EquipmentStatus } from "@/lib/owner-overview"
import { cn } from "@/lib/utils"

interface OwnerRoomEquipmentTableProps {
  machines: readonly EquipmentMachineRow[]
}

type EquipmentSortOption =
  | "machine_az"
  | "machine_za"
  | "code_az"
  | "code_za"
  | "serial_az"
  | "serial_za"
  | "brand_az"
  | "brand_za"
  | "purchased_latest"
  | "purchased_oldest"
  | "cost_high"
  | "cost_low"
  | "note_az"
  | "note_za"

type EquipmentStatusFilter = "all" | EquipmentStatus

const equipmentStatusClassNames: Record<EquipmentStatus, string> = {
  active:
    "border-chart-2/30 bg-chart-2/10 text-chart-2 dark:border-chart-2/40 dark:bg-chart-2/20",
  maintenance:
    "border-chart-4/40 bg-chart-4/20 text-chart-5 dark:border-chart-4/40 dark:bg-chart-4/20 dark:text-chart-4",
  broken:
    "border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/40 dark:bg-destructive/20",
  retired: "border-muted-foreground/30 bg-muted text-muted-foreground",
}

const machineSortOptions = [
  { value: "machine_az", label: "Machine: A-Z" },
  { value: "machine_za", label: "Machine: Z-A" },
] as const

const codeSortOptions = [
  { value: "code_az", label: "Code: A-Z" },
  { value: "code_za", label: "Code: Z-A" },
] as const

const serialSortOptions = [
  { value: "serial_az", label: "Serial: A-Z" },
  { value: "serial_za", label: "Serial: Z-A" },
] as const

const brandSortOptions = [
  { value: "brand_az", label: "Brand / Model: A-Z" },
  { value: "brand_za", label: "Brand / Model: Z-A" },
] as const

const purchasedSortOptions = [
  { value: "purchased_latest", label: "Purchased: Latest" },
  { value: "purchased_oldest", label: "Purchased: Oldest" },
] as const

const costSortOptions = [
  { value: "cost_high", label: "Cost: High-Low" },
  { value: "cost_low", label: "Cost: Low-High" },
] as const

const noteSortOptions = [
  { value: "note_az", label: "Note: A-Z" },
  { value: "note_za", label: "Note: Z-A" },
] as const

const statusFilterOptions = [
  { value: "all", label: "Status: All" },
  { value: "active", label: "Status: Active" },
  { value: "maintenance", label: "Status: Maintenance" },
  { value: "broken", label: "Status: Broken" },
  { value: "retired", label: "Status: Retired" },
] as const

const equipmentSortValues: readonly EquipmentSortOption[] = [
  "machine_az",
  "machine_za",
  "code_az",
  "code_za",
  "serial_az",
  "serial_za",
  "brand_az",
  "brand_za",
  "purchased_latest",
  "purchased_oldest",
  "cost_high",
  "cost_low",
  "note_az",
  "note_za",
]

function StatusBadge({
  status,
  label,
}: {
  status: EquipmentStatus
  label: string
}) {
  return (
    <Badge
      variant="outline"
      className={cn("border font-medium", equipmentStatusClassNames[status])}
    >
      {label}
    </Badge>
  )
}

function isEquipmentSortOption(value: string): value is EquipmentSortOption {
  return equipmentSortValues.includes(value as EquipmentSortOption)
}

function getHeaderSortValue(
  sortOption: EquipmentSortOption,
  values: readonly EquipmentSortOption[],
  fallback: string
) {
  return values.includes(sortOption) ? sortOption : fallback
}

function getSortLabel(
  sortOption: EquipmentSortOption,
  options: readonly { value: EquipmentSortOption; label: string }[],
  fallback: string
) {
  return (
    options.find((option) => option.value === sortOption)?.label ?? fallback
  )
}

function getStatusFilterLabel(statusFilter: EquipmentStatusFilter) {
  return (
    statusFilterOptions.find((option) => option.value === statusFilter)
      ?.label ?? "Status"
  )
}

function compareNullableDate(first: string | null, second: string | null) {
  if (!first && !second) {
    return 0
  }

  if (!first) {
    return 1
  }

  if (!second) {
    return -1
  }

  return first.localeCompare(second)
}

function sortMachines(
  machines: readonly EquipmentMachineRow[],
  sortOption: EquipmentSortOption
) {
  return [...machines].sort((first, second) => {
    if (sortOption === "machine_az") {
      return first.name.localeCompare(second.name)
    }

    if (sortOption === "machine_za") {
      return second.name.localeCompare(first.name)
    }

    if (sortOption === "code_az") {
      return first.code.localeCompare(second.code)
    }

    if (sortOption === "code_za") {
      return second.code.localeCompare(first.code)
    }

    if (sortOption === "serial_az") {
      return first.serialNumber.localeCompare(second.serialNumber)
    }

    if (sortOption === "serial_za") {
      return second.serialNumber.localeCompare(first.serialNumber)
    }

    if (sortOption === "brand_az") {
      return `${first.brandLabel} ${first.modelLabel}`.localeCompare(
        `${second.brandLabel} ${second.modelLabel}`
      )
    }

    if (sortOption === "brand_za") {
      return `${second.brandLabel} ${second.modelLabel}`.localeCompare(
        `${first.brandLabel} ${first.modelLabel}`
      )
    }

    if (sortOption === "purchased_latest") {
      return compareNullableDate(second.purchaseDate, first.purchaseDate)
    }

    if (sortOption === "purchased_oldest") {
      return compareNullableDate(first.purchaseDate, second.purchaseDate)
    }

    if (sortOption === "cost_high") {
      return second.purchasePrice - first.purchasePrice
    }

    if (sortOption === "cost_low") {
      return first.purchasePrice - second.purchasePrice
    }

    if (sortOption === "note_az") {
      return first.note.localeCompare(second.note)
    }

    return second.note.localeCompare(first.note)
  })
}

export function OwnerRoomEquipmentTable({
  machines,
}: OwnerRoomEquipmentTableProps) {
  const [sortOption, setSortOption] = useState<EquipmentSortOption>("code_az")
  const [statusFilter, setStatusFilter] = useState<EquipmentStatusFilter>("all")
  const updateSortOption = (value: string) => {
    if (isEquipmentSortOption(value)) {
      setSortOption(value)
    }
  }
  const filteredMachines = useMemo(() => {
    const matchingMachines = machines.filter(
      (machine) => statusFilter === "all" || machine.status === statusFilter
    )

    return sortMachines(matchingMachines, sortOption)
  }, [machines, statusFilter, sortOption])

  if (!machines.length) {
    return (
      <Empty className="min-h-64 rounded-none border-0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ListChecks />
          </EmptyMedia>
          <EmptyTitle>No machines in this group</EmptyTitle>
          <EmptyDescription>
            This room is available, but the selected equipment category has no
            machine records yet.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="pl-4">
            <OwnerTableHeaderSelect
              value={getHeaderSortValue(
                sortOption,
                ["machine_az", "machine_za"],
                "machine"
              )}
              label={getSortLabel(sortOption, machineSortOptions, "Machine")}
              options={[
                { value: "machine", label: "Machine", disabled: true },
                ...machineSortOptions,
              ]}
              onValueChange={updateSortOption}
              ariaLabel="Sort machines"
              className="w-40"
            />
          </TableHead>
          <TableHead>
            <OwnerTableHeaderSelect
              value={statusFilter}
              label={getStatusFilterLabel(statusFilter)}
              options={statusFilterOptions}
              onValueChange={(value) =>
                setStatusFilter(value as EquipmentStatusFilter)
              }
              ariaLabel="Filter machines by status"
              className="w-44"
            />
          </TableHead>
          <TableHead>
            <OwnerTableHeaderSelect
              value={getHeaderSortValue(
                sortOption,
                ["code_az", "code_za"],
                "code"
              )}
              label={getSortLabel(sortOption, codeSortOptions, "Code")}
              options={[
                { value: "code", label: "Code", disabled: true },
                ...codeSortOptions,
              ]}
              onValueChange={updateSortOption}
              ariaLabel="Sort machine codes"
              className="w-32"
            />
          </TableHead>
          <TableHead>
            <OwnerTableHeaderSelect
              value={getHeaderSortValue(
                sortOption,
                ["serial_az", "serial_za"],
                "serial"
              )}
              label={getSortLabel(sortOption, serialSortOptions, "Serial")}
              options={[
                { value: "serial", label: "Serial", disabled: true },
                ...serialSortOptions,
              ]}
              onValueChange={updateSortOption}
              ariaLabel="Sort serial numbers"
              className="w-36"
            />
          </TableHead>
          <TableHead>
            <OwnerTableHeaderSelect
              value={getHeaderSortValue(
                sortOption,
                ["brand_az", "brand_za"],
                "brand"
              )}
              label={getSortLabel(
                sortOption,
                brandSortOptions,
                "Brand / Model"
              )}
              options={[
                { value: "brand", label: "Brand / Model", disabled: true },
                ...brandSortOptions,
              ]}
              onValueChange={updateSortOption}
              ariaLabel="Sort brands and models"
              className="w-56"
            />
          </TableHead>
          <TableHead>
            <OwnerTableHeaderSelect
              value={getHeaderSortValue(
                sortOption,
                ["purchased_latest", "purchased_oldest"],
                "purchased"
              )}
              label={getSortLabel(
                sortOption,
                purchasedSortOptions,
                "Purchased"
              )}
              options={[
                { value: "purchased", label: "Purchased", disabled: true },
                ...purchasedSortOptions,
              ]}
              onValueChange={updateSortOption}
              ariaLabel="Sort purchase dates"
              className="w-44"
            />
          </TableHead>
          <TableHead>
            <OwnerTableHeaderSelect
              value={getHeaderSortValue(
                sortOption,
                ["cost_high", "cost_low"],
                "cost"
              )}
              label={getSortLabel(sortOption, costSortOptions, "Cost")}
              options={[
                { value: "cost", label: "Cost", disabled: true },
                ...costSortOptions,
              ]}
              onValueChange={updateSortOption}
              ariaLabel="Sort purchase costs"
              className="w-36"
            />
          </TableHead>
          <TableHead className="pr-4">
            <OwnerTableHeaderSelect
              value={getHeaderSortValue(
                sortOption,
                ["note_az", "note_za"],
                "note"
              )}
              label={getSortLabel(sortOption, noteSortOptions, "Note")}
              options={[
                { value: "note", label: "Note", disabled: true },
                ...noteSortOptions,
              ]}
              onValueChange={updateSortOption}
              ariaLabel="Sort notes"
              className="w-36"
            />
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredMachines.length ? (
          filteredMachines.map((machine) => (
            <TableRow key={machine.id}>
              <TableCell className="pl-4 font-medium">{machine.name}</TableCell>
              <TableCell>
                <StatusBadge
                  status={machine.status}
                  label={machine.statusLabel}
                />
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {machine.code}
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {machine.serialNumber}
              </TableCell>
              <TableCell>
                <div className="flex min-w-40 flex-col gap-1">
                  <span className="font-medium">{machine.brandLabel}</span>
                  <span className="text-xs text-muted-foreground">
                    {machine.modelLabel}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {machine.purchaseDateLabel}
              </TableCell>
              <TableCell className="font-mono text-sm tabular-nums">
                {machine.purchasePriceLabel}
              </TableCell>
              <TableCell className="max-w-80 pr-4 whitespace-normal text-muted-foreground">
                {machine.note}
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={8} className="h-64">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <ListChecks />
                  </EmptyMedia>
                  <EmptyTitle>No machines found</EmptyTitle>
                  <EmptyDescription>
                    Try a different status filter.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
