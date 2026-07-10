// hooks/useLoading.ts
'use client'

import { useCallback, useState } from 'react'

export function useLoading() {
  const [loading, setLoading] = useState(false)
  
  const withLoading = useCallback(async (fn: () => Promise<void> | void) => {
    setLoading(true)
    try {
      await fn()
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, withLoading }
}