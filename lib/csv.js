export function escapeCsvCell(value) {
  const text = String(value ?? "")

  if (!/[",\n\r]/.test(text)) {
    return text
  }

  return `"${text.replaceAll('"', '""')}"`
}

export function buildCsv(rows, columns) {
  return [
    columns.map((column) => escapeCsvCell(column.header)).join(","),
    ...rows.map((row) =>
      columns.map((column) => escapeCsvCell(column.value(row))).join(",")
    ),
  ].join("\n")
}
