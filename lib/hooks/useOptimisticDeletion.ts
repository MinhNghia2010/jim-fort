"use client"

import { useOptimistic, useState } from "react"

function appendUniqueId(ids: readonly string[], id: string) {
  return ids.includes(id) ? ids : [...ids, id]
}

export function useOptimisticDeletion() {
  const [deletedIds, setDeletedIds] = useState<readonly string[]>([])
  const [optimisticDeletedIds, deleteOptimistically] = useOptimistic(
    deletedIds,
    appendUniqueId
  )

  function commitDeletion(id: string) {
    setDeletedIds((currentIds) => appendUniqueId(currentIds, id))
  }

  return {
    commitDeletion,
    deleteOptimistically,
    optimisticDeletedIds,
  }
}
