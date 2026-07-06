import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Segunda camada de proteção além do middleware
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-light px-2">
      {children}
    </div>
  )
}