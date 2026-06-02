'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [callbackUrl, setCallbackUrl] = useState('/feed')
  const supabase = createClient()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setCallbackUrl(params.get('callbackUrl') ?? '/feed')
  }, [])

  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const [form, setForm] = useState({
    email: '',
    senha: '',
  })

  function atualizar(campo: string, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
    setErro(null)
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setCarregando(true)
    setErro(null)

    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.senha,
    })

    if (error) {
      setErro('E-mail ou senha incorretos. Tente novamente.')
      setCarregando(false)
      return
    }

    router.push(callbackUrl)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-8">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Entrar</h2>

      <form onSubmit={handleLogin} className="space-y-4">
        {/* E-mail */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            E-mail
          </label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => atualizar('email', e.target.value)}
            placeholder="maria@email.com"
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Senha */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Senha
          </label>
          <input
            type="password"
            required
            value={form.senha}
            onChange={(e) => atualizar('senha', e.target.value)}
            placeholder="Sua senha"
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="text-right mt-1">
            <Link
              href="/recuperar-senha"
              className="text-xs text-blue-600 hover:underline"
            >
              Esqueceu a senha?
            </Link>
          </div>
        </div>

        {/* Erro */}
        {erro && (
          <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3">
            {erro}
          </div>
        )}

        {/* Botão */}
        <button
          type="submit"
          disabled={carregando}
          className="w-full bg-blue-600 text-white font-medium rounded-lg py-2.5 text-sm hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>

        {/* Link para cadastro */}
        <p className="text-center text-sm text-gray-500">
          Não tem conta?{' '}
          <Link href="/cadastro" className="text-blue-600 hover:underline font-medium">
            Criar conta
          </Link>
        </p>
      </form>
    </div>
  )
}