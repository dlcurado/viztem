'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { logEvent } from '@/lib/analytics';

export default function CadastroPage() {
  const router = useRouter()
  const supabase = createClient()

  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    telefone: '',
    codigo: '',
    bloco: '',
    unidade: '',
  })

  function atualizar(campo: string, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
    setErro(null)
  }

  const mensagensErro: Record<string, string> = {
    'User already registered':
      'Este e-mail já está cadastrado. Tente fazer login.',
    'Password should be at least 6 characters':
      'A senha precisa ter pelo menos 8 caracteres.',
    'Unable to validate email address: invalid format':
      'Formato de e-mail inválido.',
    'Email rate limit exceeded':
      'Muitos cadastros em pouco tempo. Aguarde alguns minutos.',
    'signup_disabled':
      'Cadastros temporariamente desativados. Tente mais tarde.',
  }

  function traduzirErro(mensagem: string): string {
    return mensagensErro[mensagem] ?? 'Erro ao criar conta. Tente novamente.'
  }

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault()
    setCarregando(true)
    setErro(null)

    // ── 1. Validar código do condomínio ───────────────────────
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

    // ── 2. Criar conta com todos os dados em metadata ─────────
    // O trigger on_auth_user_created lê raw_user_meta_data
    // e insere o perfil completo em public.perfis automaticamente
    const { error: erroAuth } = await supabase.auth.signUp({
      email: form.email,
      password: form.senha,
      options: {
        data: {
          nome: form.nome,
          telefone: form.telefone || null,
          condominio_id: condominio.id,
          bloco: form.bloco || null,
          unidade: form.unidade || null,
        },
      },
    })

    if (erroAuth) {
      setErro(traduzirErro(erroAuth.message))
      setCarregando(false)
      return
    } else {
      // Sucesso no cadastro
      // Você precisará obter o condominio_id aqui, talvez do perfil do usuário recém-criado
      // ou de um campo no formulário de cadastro.
      
      logEvent('signup_completed', { condominio_id: condominio.id });
    }

    // ── 3. Trigger cuidou do perfil — redireciona pro feed ────
    router.push('/feed')
  }

  // ─── Classes reutilizáveis ────────────────────────────────
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

        {/* WhatsApp */}
        <div>
          <label className={labelClass}>
            WhatsApp <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            required
            value={form.telefone}
            onChange={(e) => atualizar('telefone', e.target.value)}
            placeholder="(11) 99999-9999"
            className={inputClass}
          />
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
            📱 Seu número será compartilhado apenas com pessoas interessadas
            nos seus anúncios. Não usamos para spam ou marketing.
            Conforme a LGPD, você pode solicitar a remoção a qualquer momento.
          </p>
        </div>

        {/* Código do condomínio */}
        <div>
          <label className={labelClass}>Código do condomínio</label>
          <input
            type="text"
            required
            value={form.codigo}
            onChange={(e) => atualizar('codigo', e.target.value)}
            placeholder="Ex: CONDOMINIO-1234"
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
          <div className="bg-red-50 border border-red-100 text-red-700
                          text-sm rounded-lg px-4 py-3">
            {erro}
          </div>
        )}

        {/* Botão */}
        <button
          type="submit"
          disabled={carregando}
          className="{buttonClass}"
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