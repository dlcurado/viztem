'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LogoutPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function fazerLogout() {
      await supabase.auth.signOut()
      router.replace('/login')
    }
    fazerLogout()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500 text-sm">Encerrando sessão...</p>
    </div>
  )
}