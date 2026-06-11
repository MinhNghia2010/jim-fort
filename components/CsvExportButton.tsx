"use client"

import { Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { buildCsv } from "@/lib/csv"

export type CsvColumn<T> = {
  header: string
  value: (row: T) => string | number | boolean | null | undefined
}

interface CsvExportButtonProps<T> {
  columns: readonly CsvColumn<T>[]
  filename: string
  label?: string
  rows: readonly T[]
}

export function CsvExportButton<T>({
  columns,
  filename,
  label = "Export CSV",
  rows,
}: CsvExportButtonProps<T>) {
  function handleExport() {
    const csv = buildCsv(rows, columns)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")

    anchor.href = url
    anchor.download = filename.endsWith(".csv") ? filename : `${filename}.csv`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={!rows.length}
    >
      <Download data-icon="inline-start" />
      {label}
    </Button>
  )
}
