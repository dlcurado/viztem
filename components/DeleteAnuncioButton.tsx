"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  anuncioId: string
}

export default function DeleteAnuncioButton({ anuncioId }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    const ok = window.confirm('Tem certeza que deseja excluir este anúncio?')
    if (!ok) return

    try {
      setLoading(true)
      const res = await fetch(`/api/anuncios/${anuncioId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Erro ao excluir anúncio')
      }

      router.push('/feed')
    } catch (err) {
      setLoading(false)
      console.error('[DeleteAnuncioButton] delete error', err)
      alert('Não foi possível excluir o anúncio. Tente novamente.')
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors disabled:opacity-50"
    >
      {loading ? 'Excluindo...' : 'Excluir'}
    </button>
  )
}
