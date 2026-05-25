'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function CadastroPage() {
  const router = useRouter()
  const supabase = createClient()

  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)

  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    codigo: '',
    bloco: '',
    unidade: '',
  })

  function atualizar(campo: string, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
    setErro(null)
  }

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault()
    setCarregando(true)
    setErro(null)

    // 1. Validar o código do condomínio
    const { data: condominio, error: erroCond } = await supabase
      .from('condominios')
      .select('id, nome')
      .eq('codigo', form.codigo.toUpperCase().trim())
      .single()

    if (erroCond || !condominio) {
      setErro('Código do condomínio não encontrado. Verifique e tente novamente.')
      setCarregando(false)
      return
    }

    // 2. Criar conta no Supabase Auth
    const { data: authData, error: erroAuth } = await supabase.auth.signUp({
      email: form.email,
      password: form.senha,
      options: {
        data: {
          nome: form.nome,
        },
      },
    })

    // ✅ Tradução dos erros mais comuns do Supabase
    if (erroAuth || !authData.user) {
      // Traduzir erros comuns do Supabase
      const mensagens: Record<string, string> = {
        'User already registered':
          'Este e-mail já está cadastrado. Tente fazer login.',
        'Password should be at least 6 characters':
          'A senha precisa ter pelo menos 8 caracteres.',
        'Unable to validate email address: invalid format':
          'Formato de e-mail inválido.',
      }

      const mensagemTraduzida =
        mensagens[erroAuth?.message ?? ''] ??
        'Erro ao criar conta. Tente novamente.'

      setErro(mensagemTraduzida)
      setCarregando(false)
      return
    }

    // 3. Criar perfil do morador
    // ✅ Mesmo sem sessão ativa (e-mail pendente), o ID já existe
    const { error: erroPerfil } = await supabase.from('perfis').insert({
      id: authData.user.id,
      nome: form.nome,
      condominio_id: condominio.id,
      bloco: form.bloco,
      unidade: form.unidade,
    })

    if (erroPerfil) {
      // Não bloqueia o fluxo — perfil pode ser salvo no primeiro login
      console.error('Erro ao salvar perfil:', erroPerfil.message)
    }

    // 4. Sucesso — pedir para confirmar e-mail
    setSucesso(true)
    setCarregando(false)
  }

  // ─── Tela de sucesso após cadastro ───────────────────────────────
  if (sucesso) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
        <div className="text-5xl mb-4">📬</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Confirme seu e-mail
        </h2>
        <p className="text-gray-600 text-sm leading-relaxed">
          Enviamos um link de confirmação para{' '}
          <span className="font-semibold text-gray-800">{form.email}</span>.
          <br />
          Acesse seu e-mail e clique no link para ativar sua conta.
        </p>
        <p className="text-gray-400 text-xs mt-4">
          Não encontrou? Verifique a caixa de spam.
        </p>
      </div>
    )
  }

  // ─── Classe reutilizável dos inputs ──────────────────────────────
  const inputClass =
    'w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm ' +
    'text-gray-900 placeholder:text-gray-400 ' +
    'focus:outline-none focus:ring-2 focus:ring-blue-500'

  const labelClass = 'block text-sm font-medium text-gray-800 mb-1'

  // ─── Formulário ──────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-2xl shadow-sm p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Criar conta</h2>

      <form onSubmit={handleCadastro} className="space-y-4">

        {/* Nome */}
        <div>
          <label className={labelClass}>Nome completo</label>
          <input
            type="text"
            required
            value={form.nome}
            onChange={(e) => atualizar('nome', e.target.value)}
            placeholder="Maria Silva"
            className={inputClass}
          />
        </div>

        {/* E-mail */}
        <div>
          <label className={labelClass}>E-mail</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => atualizar('email', e.target.value)}
            placeholder="maria@email.com"
            className={inputClass}
          />
        </div>

        {/* Senha */}
        <div>
          <label className={labelClass}>Senha</label>
          <input
            type="password"
            required
            minLength={8}
            value={form.senha}
            onChange={(e) => atualizar('senha', e.target.value)}
            placeholder="Mínimo 8 caracteres"
            className={inputClass}
          />
        </div>

        {/* Código do condomínio */}
        <div>
          <label className={labelClass}>Código do condomínio</label>
          <input
            type="text"
            required
            value={form.codigo}
            onChange={(e) => atualizar('codigo', e.target.value)}
            placeholder="Ex: QUINTAS-0001"
            className={`${inputClass} uppercase`}
          />
          <p className="text-xs text-gray-500 mt-1">
            Solicite o código ao síndico do seu condomínio
          </p>
        </div>

        {/* Bloco e Unidade */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Bloco</label>
            <input
              type="text"
              value={form.bloco}
              onChange={(e) => atualizar('bloco', e.target.value)}
              placeholder="Ex: A"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Unidade</label>
            <input
              type="text"
              value={form.unidade}
              onChange={(e) => atualizar('unidade', e.target.value)}
              placeholder="Ex: 42"
              className={inputClass}
            />
          </div>
        </div>

        {/* Erro */}
        {erro && (
          <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg px-4 py-3">
            {erro}
          </div>
        )}

        {/* Botão */}
        <button
          type="submit"
          disabled={carregando}
          className="w-full bg-blue-600 text-white font-medium rounded-lg py-2.5 text-sm hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {carregando ? 'Criando conta...' : 'Criar conta'}
        </button>

        {/* Link para login */}
        <p className="text-center text-sm text-gray-600">
          Já tem conta?{' '}
          <Link
            href="/login"
            className="text-blue-600 hover:underline font-medium"
          >
            Entrar
          </Link>
        </p>

      </form>
    </div>
  )
}