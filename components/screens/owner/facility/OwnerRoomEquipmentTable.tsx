"use client"

import { useState } from "react"
import Link from "next/link"
import { Dumbbell } from "lucide-react"

import { OwnerTableHeaderSelect } from "@/components/screens/owner/OwnerTableHeaderSelect"
import {
  TablePagination,
  TABLE_ROWS_PER_PAGE,
} from "@/components/TablePagination"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { cn } from "@/lib/utils"

export type RoomEquipmentStatus =
  | "active"
  | "maintenance"
  | "broken"
  | "retired"

export interface OwnerRoomEquipmentRow {
  id: string
  name: string
  status: RoomEquipmentStatus
  code: string
  serial: string
  brand: string
  model: string
  purchasedAt: string | null
  purchasedAtLabel: string
  cost: number
  costLabel: string
  note: string | null
}

interface OwnerRoomEquipmentTableProps {
  equipments: readonly OwnerRoomEquipmentRow[]
  facilityName?: string
  roomId?: string
}

const machineSortOptions = [
  { value: "machine_asc", label: "A-Z" },
  { value: "machine_desc", label: "Z-A" },
] as const

const statusFilterOptions = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "maintenance", label: "Maintenance" },
  { value: "broken", label: "Broken" },
  { value: "retired", label: "Retired" },
] as const

const codeSortOptions = [
  { value: "code_asc", label: "A-Z" },
  { value: "code_desc", label: "Z-A" },
] as const

const serialSortOptions = [
  { value: "serial_asc", label: "A-Z" },
  { value: "serial_desc", label: "Z-A" },
] as const

const brandModelSortOptions = [
  { value: "brand_model_asc", label: "A-Z" },
  { value: "brand_model_desc", label: "Z-A" },
] as const

const purchasedSortOptions = [
  { value: "purchased_desc", label: "Latest" },
  { value: "purchased_asc", label: "Oldest" },
] as const

const costSortOptions = [
  { value: "cost_desc", label: "High-Low" },
  { value: "cost_asc", label: "Low-High" },
] as const

const noteSortOptions = [
  { value: "note_asc", label: "A-Z" },
  { value: "note_desc", label: "Z-A" },
] as const

type EquipmentSort =
  | (typeof machineSortOptions)[number]["value"]
  | (typeof codeSortOptions)[number]["value"]
  | (typeof serialSortOptions)[number]["value"]
  | (typeof brandModelSortOptions)[number]["value"]
  | (typeof purchasedSortOptions)[number]["value"]
  | (typeof costSortOptions)[number]["value"]
  | (typeof noteSortOptions)[number]["value"]

type EquipmentStatusFilter = (typeof statusFilterOptions)[number]["value"]

const statusLabels: Record<RoomEquipmentStatus, string> = {
  active: "Active",
  maintenance: "Maintenance",
  broken: "Broken",
  retired: "Retired",
}

function statusClassName(status: RoomEquipmentStatus) {
  return cn(
    "border font-medium",
    status === "active" && "border-chart-2/30 bg-chart-2/10 text-chart-2",
    status === "maintenance" &&
      "border-chart-4/40 bg-chart-4/20 text-chart-5 dark:text-chart-4",
    status === "broken" &&
      "border-destructive/30 bg-destructive/10 text-destructive",
    status === "retired" &&
      "border-muted-foreground/30 bg-muted text-muted-foreground"
  )
}

function compareText(first: string | null, second: string | null) {
  return (first ?? "").localeCompare(second ?? "", undefined, {
    sensitivity: "base",
  })
}

function getDateValue(value: string | null, nullValue: number) {
  return value ? new Date(value).getTime() : nullValue
}

function brandModel(row: OwnerRoomEquipmentRow) {
  return `${row.brand} ${row.model}`.trim()
}

function sortEquipments(
  equipments: OwnerRoomEquipmentRow[],
  sort: EquipmentSort
) {
  return [...equipments].sort((first, second) => {
    if (sort === "machine_asc") {
      return compareText(first.name, second.name)
    }

    if (sort === "machine_desc") {
      return compareText(second.name, first.name)
    }

    if (sort === "code_asc") {
      return compareText(first.code, second.code)
    }

    if (sort === "code_desc") {
      return compareText(second.code, first.code)
    }

    if (sort === "serial_asc") {
      return compareText(first.serial, second.serial)
    }

    if (sort === "serial_desc") {
      return compareText(second.serial, first.serial)
    }

    if (sort === "brand_model_asc") {
      return compareText(brandModel(first), brandModel(second))
    }

    if (sort === "brand_model_desc") {
      return compareText(brandModel(second), brandModel(first))
    }

    if (sort === "purchased_asc") {
      return (
        getDateValue(first.purchasedAt, Number.MAX_SAFE_INTEGER) -
        getDateValue(second.purchasedAt, Number.MAX_SAFE_INTEGER)
      )
    }

    if (sort === "purchased_desc") {
      return (
        getDateValue(second.purchasedAt, 0) - getDateValue(first.purchasedAt, 0)
      )
    }

    if (sort === "cost_asc") {
      return first.cost - second.cost
    }

    if (sort === "cost_desc") {
      return second.cost - first.cost
    }

    if (sort === "note_desc") {
      return compareText(second.note, first.note)
    }

    return compareText(first.note, second.note)
  })
}

function getEquipmentDetailHref(
  facilityName: string,
  roomId: string,
  equipmentId: string
) {
  return `/facility/${encodeURIComponent(facilityName)}/rooms/${roomId}/equipments/${equipmentId}`
}

export function OwnerRoomEquipmentTable({
  equipments,
  facilityName,
  roomId,
}: OwnerRoomEquipmentTableProps) {
  const [sort, setSort] = useState<EquipmentSort>("machine_asc")
  const [statusFilter, setStatusFilter] = useState<EquipmentStatusFilter>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const filteredEquipments = equipments.filter(
    (equipment) => statusFilter === "all" || equipment.status === statusFilter
  )
  const sortedEquipments = sortEquipments(filteredEquipments, sort)
  const totalPages = Math.max(
    1,
    Math.ceil(sortedEquipments.length / TABLE_ROWS_PER_PAGE)
  )
  const activePage = Math.min(currentPage, totalPages)
  const startIndex = (activePage - 1) * TABLE_ROWS_PER_PAGE
  const paginatedEquipments = sortedEquipments.slice(
    startIndex,
    startIndex + TABLE_ROWS_PER_PAGE
  )
  const visibleStart = paginatedEquipments.length ? startIndex + 1 : 0
  const visibleEnd = Math.min(
    startIndex + TABLE_ROWS_PER_PAGE,
    sortedEquipments.length
  )
  const machineSortValue =
    sort === "machine_desc" || sort === "machine_asc" ? sort : "machine_asc"
  const codeSortValue =
    sort === "code_desc" || sort === "code_asc" ? sort : "code_asc"
  const serialSortValue =
    sort === "serial_desc" || sort === "serial_asc" ? sort : "serial_asc"
  const brandModelSortValue =
    sort === "brand_model_desc" || sort === "brand_model_asc"
      ? sort
      : "brand_model_asc"
  const purchasedSortValue =
    sort === "purchased_asc" || sort === "purchased_desc"
      ? sort
      : "purchased_desc"
  const costSortValue =
    sort === "cost_asc" || sort === "cost_desc" ? sort : "cost_desc"
  const noteSortValue =
    sort === "note_desc" || sort === "note_asc" ? sort : "note_asc"
  const canShowAction = Boolean(facilityName && roomId)

  function handleSortChange(value: EquipmentSort) {
    setSort(value)
    setCurrentPage(1)
  }

  function handleStatusFilterChange(value: EquipmentStatusFilter) {
    setStatusFilter(value)
    setCurrentPage(1)
  }

  return (
    <>
      <Table className="min-w-[1560px] table-fixed text-[0.925rem] [&_td]:whitespace-normal [&_th]:whitespace-normal">
        <colgroup>
          <col className="w-[14rem]" />
          <col className="w-[12rem]" />
          <col className="w-[10rem]" />
          <col className="w-[12rem]" />
          <col className="w-[14rem]" />
          <col className="w-[11rem]" />
          <col className="w-[10rem]" />
          <col className="w-[18rem]" />
          {canShowAction ? <col className="w-[6rem]" /> : null}
        </colgroup>
        <TableHeader className="bg-muted/40">
          <TableRow>
            <TableHead className="h-12 pl-6">
              <OwnerTableHeaderSelect
                label="Machine"
                value={machineSortValue}
                options={machineSortOptions}
                onValueChange={handleSortChange}
              />
            </TableHead>
            <TableHead className="h-12">
              <OwnerTableHeaderSelect
                label="Status"
                value={statusFilter}
                options={statusFilterOptions}
                onValueChange={handleStatusFilterChange}
              />
            </TableHead>
            <TableHead className="h-12">
              <OwnerTableHeaderSelect
                label="Code"
                value={codeSortValue}
                options={codeSortOptions}
                onValueChange={handleSortChange}
              />
            </TableHead>
            <TableHead className="h-12">
              <OwnerTableHeaderSelect
                label="Serial"
                value={serialSortValue}
                options={serialSortOptions}
                onValueChange={handleSortChange}
              />
            </TableHead>
            <TableHead className="h-12">
              <OwnerTableHeaderSelect
                label="Brand / Model"
                value={brandModelSortValue}
                options={brandModelSortOptions}
                onValueChange={handleSortChange}
              />
            </TableHead>
            <TableHead className="h-12">
              <OwnerTableHeaderSelect
                label="Purchased"
                value={purchasedSortValue}
                options={purchasedSortOptions}
                onValueChange={handleSortChange}
              />
            </TableHead>
            <TableHead className="h-12">
              <OwnerTableHeaderSelect
                label="Cost"
                value={costSortValue}
                options={costSortOptions}
                onValueChange={handleSortChange}
              />
            </TableHead>
            <TableHead className="h-12 pr-6">
              <OwnerTableHeaderSelect
                label="Note"
                value={noteSortValue}
                options={noteSortOptions}
                onValueChange={handleSortChange}
              />
            </TableHead>
            {canShowAction ? (
              <TableHead className="h-12 pr-6 text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            ) : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedEquipments.length ? (
            paginatedEquipments.map((equipment) => (
              <TableRow key={equipment.id} className="h-[4.5rem]">
                <TableCell className="pl-6 font-medium">
                  {equipment.name}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={statusClassName(equipment.status)}
                  >
                    {statusLabels[equipment.status]}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {equipment.code}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {equipment.serial}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium break-words">{equipment.brand}</p>
                    <p className="text-xs break-words text-muted-foreground">
                      {equipment.model}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {equipment.purchasedAtLabel}
                </TableCell>
                <TableCell className="font-mono font-medium tabular-nums">
                  {equipment.costLabel}
                </TableCell>
                <TableCell className="overflow-hidden pr-6">
                  <p className="truncate text-muted-foreground">
                    {equipment.note ?? "No note"}
                  </p>
                </TableCell>
                {canShowAction ? (
                  <TableCell className="pr-6 text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link
                        href={getEquipmentDetailHref(
                          facilityName!,
                          roomId!,
                          equipment.id
                        )}
                      >
                        Details
                      </Link>
                    </Button>
                  </TableCell>
                ) : null}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={canShowAction ? 9 : 8} className="h-64">
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Dumbbell />
                    </EmptyMedia>
                    <EmptyTitle>No equipment found</EmptyTitle>
                    <EmptyDescription>
                      Choose a different status filter or add equipment to this
                      room.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>
          Showing {visibleStart}-{visibleEnd} of {sortedEquipments.length}{" "}
          equipment records
        </span>
        <TablePagination
          activePage={activePage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </>
  )
}
