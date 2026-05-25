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
    <div className="min-h-screen bg-gray-50">
      {/* Navbar — vamos expandir depois */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-blue-600">Viztem</h1>
        <span className="text-sm text-gray-500">{user.email}</span>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}