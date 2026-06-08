"use client"

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { cn } from "@/lib/utils"

export const TABLE_ROWS_PER_PAGE = 10

type TablePaginationItem = number | "start-ellipsis" | "end-ellipsis"

interface TablePaginationProps {
  activePage: number
  totalPages: number
  onPageChange: (page: number) => void
}

function getPaginationItems(
  currentPage: number,
  totalPages: number
): TablePaginationItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const items: TablePaginationItem[] = [1]
  const startPage = Math.max(2, currentPage - 1)
  const endPage = Math.min(totalPages - 1, currentPage + 1)

  if (startPage > 2) {
    items.push("start-ellipsis")
  }

  for (let page = startPage; page <= endPage; page += 1) {
    items.push(page)
  }

  if (endPage < totalPages - 1) {
    items.push("end-ellipsis")
  }

  items.push(totalPages)

  return items
}

export function TablePagination({
  activePage,
  totalPages,
  onPageChange,
}: TablePaginationProps) {
  if (totalPages <= 1) {
    return null
  }

  const paginationItems = getPaginationItems(activePage, totalPages)

  function goToPage(page: number) {
    onPageChange(Math.min(Math.max(page, 1), totalPages))
  }

  return (
    <Pagination className="mx-0 w-auto justify-end">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            aria-disabled={activePage === 1}
            tabIndex={activePage === 1 ? -1 : undefined}
            className={cn(activePage === 1 && "pointer-events-none opacity-50")}
            onClick={(event) => {
              event.preventDefault()
              goToPage(activePage - 1)
            }}
          />
        </PaginationItem>
        {paginationItems.map((item) => (
          <PaginationItem key={item}>
            {typeof item === "number" ? (
              <PaginationLink
                href="#"
                isActive={item === activePage}
                aria-label={`Go to page ${item}`}
                className={cn(
                  item === activePage &&
                    "border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                )}
                onClick={(event) => {
                  event.preventDefault()
                  goToPage(item)
                }}
              >
                {item}
              </PaginationLink>
            ) : (
              <PaginationEllipsis />
            )}
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            href="#"
            aria-disabled={activePage === totalPages}
            tabIndex={activePage === totalPages ? -1 : undefined}
            className={cn(
              activePage === totalPages && "pointer-events-none opacity-50"
            )}
            onClick={(event) => {
              event.preventDefault()
              goToPage(activePage + 1)
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
