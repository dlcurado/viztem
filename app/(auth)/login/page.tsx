'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { logEvent } from '@/lib/analytics';

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/feed'
  const supabase = createClient()

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

    const { data: data, error: error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.senha,
    })

    if (error) {
      setErro('E-mail ou senha incorretos. Tente novamente.')
      setCarregando(false)
      return
    }

    // Sucesso no login
    // Para obter o condominio_id, você pode precisar buscar o perfil do usuário
    // ou armazená-lo na sessão/cookies após o login.
    let condominio_id = 'desconhecido';
    if (data.user) {
      // Exemplo: buscar o perfil para obter o condominio_id
      const { data: perfilData } = await supabase.from('perfis').select('condominio_id').eq('id', data.user.id).single();
      if (perfilData) {
        condominio_id = perfilData.condominio_id;
      }
    }
    logEvent('login_completed', { condominio_id });
    router.push(callbackUrl)
    router.refresh()
  }

  const inputClass =
    'w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm ' +
    'text-gray-900 placeholder:text-gray-400 ' +
    'focus:outline-none focus:ring-2 focus:ring-blue-500'

  const labelClass = 'block text-sm font-medium text-gray-800 mb-1'

  const buttonClass = 'w-full bg-blue-600 text-white font-medium rounded-lg ' +
                     'py-2.5 text-sm hover:bg-blue-700 transition ' +
                     'disabled:opacity-50 disabled:cursor-not-allowed'

  return (
    <div className="bg-white rounded-2xl shadow-sm p-8">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Entrar</h2>

      <form onSubmit={handleLogin} className="space-y-4">
        {/* E-mail */}
        <div>
          <label className="{labelClass}">
            E-mail
          </label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => atualizar('email', e.target.value)}
            placeholder="maria@email.com"
            className="{inputClass}"
          />
        </div>

        {/* Senha */}
        <div>
          <label className="{labelClass}">
            Senha
          </label>
          <input
            type="password"
            required
            value={form.senha}
            onChange={(e) => atualizar('senha', e.target.value)}
            placeholder="Sua senha"
            className="{inputClass}"
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
          className="{buttonClass}"
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <LoginForm />
    </Suspense>
  )
}
