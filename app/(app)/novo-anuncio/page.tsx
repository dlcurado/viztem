'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { logEvent } from '@/lib/analytics';
import { v4 as uuidv4 } from 'uuid';
import Link from 'next/link'
import { compressImage } from '@/lib/compressImage'

type Categoria = {
  id: string
  nome: string
  icone: string
  slug: string
}

type Perfil = {
  condominio_id: string
  role: string
}

export default function NovoAnuncioPage() {
  const router = useRouter()
  const supabase = createClient()
  const inputFotoRef = useRef<HTMLInputElement>(null)

  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  // Previews locais das fotos selecionadas
  const [fotos, setFotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])

  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    categoria_id: '',
    tipo_preco: 'fixo' as 'fixo' | 'negociavel' | 'gratis',
    preco: '',
    whatsapp: '',
    url: '',
  })

  // ─── Buscar perfil e categorias ──────────────────────────────
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // ✅ Guardamos o userId para usar no caminho do upload
      setUserId(user.id)

      const { data: perfilData } = await supabase
        .from('perfis')
        .select('condominio_id, role')
        .eq('id', user.id)
        .single()

      if (perfilData) {
        setPerfil(perfilData)
      }

      const { data: categoriasData } = await supabase
        .from('categorias')
        .select('id, nome, icone, slug')
        .eq('ativo', true)
        .order('ordem')

      if (categoriasData) setCategorias(categoriasData)
    }

    init()
  }, [])

  // ─── Atualizar campo do form ─────────────────────────────────
  function atualizar(campo: string, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
    setErro(null)
  }

  // ─── Selecionar fotos ────────────────────────────────────────
  function handleSelecionarFotos(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(e.target.files ?? [])

    // Máximo 3 fotos no total
    const novasFotos = [...arquivos, ...fotos].slice(0, 3)
    setFotos(novasFotos)
    setPreviews(novasFotos.map((f) => URL.createObjectURL(f)))

    // Limpar o input para permitir selecionar o mesmo arquivo novamente
    e.target.value = ''
  }

  // ─── Remover foto ────────────────────────────────────────────
  function removerFoto(index: number) {
    setFotos(fotos.filter((_, i) => i !== index))
    setPreviews(previews.filter((_, i) => i !== index))
  }

  // ─── Fazer upload das fotos no Storage ───────────────────────
  async function uploadFotos(anuncioId: string): Promise<string[]> {
    if (!userId) return []
    const urls: string[] = []

    for (let i = 0; i < fotos.length; i++) {
      const foto = await compressImage(fotos[i]);
      const nome = uuidv4(); // Gera um nome único para evitar conflitos
      const extensao = foto.name.split('.').pop()
      const caminho = `${anuncioId}/${nome}.${extensao}`

      const { error } = await supabase.storage
        .from('anuncios')
        .upload(caminho, foto, { upsert: true })

      if (error) {
        console.error(`Erro no upload da foto ${i + 1}:`, error.message)
        continue
      }

      const { data: urlData } = supabase.storage
        .from('anuncios')
        .getPublicUrl(caminho)

      urls.push(urlData.publicUrl)
    }

    return urls
  }

  // ─── Submeter o formulário ───────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setCarregando(true)
    setErro(null)

    if (!perfil || !userId) {
      setErro('Erro ao carregar perfil. Tente novamente.')
      setCarregando(false)
      return
    }

    if (!form.categoria_id) {
      setErro('Selecione uma categoria para o anúncio.')
      setCarregando(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setErro('Sessão expirada. Faça login novamente.')
      setCarregando(false)
      return
    }

    // 1. Inserir o anúncio
    const { data: anuncio, error: erroAnuncio } = await supabase
      .from('anuncios')
      .insert({
        titulo: form.titulo,
        descricao: form.descricao,
        categoria_id: form.categoria_id,
        tipo_preco: form.tipo_preco,
        preco: form.tipo_preco !== 'gratis' && form.preco
          ? parseFloat(form.preco.replace(',', '.'))
          : null,
        condominio_id: perfil.condominio_id,
        created_by_user_id: userId,
        owner_user_id: userId,
        created_by_type: perfil.role,
        contact_whatsapp: form.whatsapp, // Pode ser adicionado depois na edição
        contact_url: form.url, // Pode ser adicionado depois na edição
        status: 'ativo',
      })
      .select('id')
      .single()

    if (erroAnuncio || !anuncio) {
      setErro('Erro ao publicar anúncio. Tente novamente.')
      setCarregando(false)
      return
    }

    // 2. Upload das fotos
    if (fotos.length > 0) {
      const urls = await uploadFotos(anuncio.id)

      // 3. Salvar URLs na tabela fotos_anuncio
      if (urls.length > 0) {
        await supabase.from('fotos_anuncio').insert(
          urls.map((url, i) => ({
            anuncio_id: anuncio.id,
            url,
            ordem: i + 1,
          }))
        )
      }
    }

    // Sucesso na criação
    logEvent('ad_created', {
      categoria: form.categoria_id,
      num_fotos: fotos.length,
      condominio_id: perfil.condominio_id,
      user_id: userId
    });

    // 4. Sucesso — voltar para o feed
    router.push('/feed')
    router.refresh()
  }

  // ─── Classes reutilizáveis ───────────────────────────────────
  const inputClass =
    'w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm ' +
    'text-gray-900 placeholder:text-gray-400 ' +
    'focus:outline-none focus:ring-2 focus:ring-blue-500'

  const labelClass = 'block text-sm font-medium text-gray-800 mb-1'

  // ─── Render ──────────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto">

      {/* Cabeçalho */}
      <div className="max-w-5xl mx-auto flex items-center py-4">
        <Link
          href="#"
          onClick={() => router.back()}
          className="text-gray-400 hover:text-emerald-800 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mr-1"
            viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0
                  01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd" />
          </svg>
          Voltar
        </Link>
      </div>
      
      <div className="max-w-5xl mx-auto flex items-center">
        <h1 className="text-xl font-bold text-gray-900">Novo anúncio</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 py-4">
        {/* ── Fotos ────────────────────────────────────────── */}
        <div>
          <label className={labelClass}>
            Fotos <span className="text-gray-400 font-normal">(até 3)</span>
          </label>

          <div className="flex gap-3 mt-1">
            {/* Previews das fotos selecionadas */}
            {previews.map((src, i) => (
              <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
                <Image
                  src={src}
                  alt={`Foto ${i + 1}`}
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => removerFoto(i)}
                  className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-black/70"
                >
                  ×
                </button>
              </div>
            ))}

            {/* Botão para adicionar foto */}
            {fotos.length < 3 && (
              <button
                type="button"
                onClick={() => inputFotoRef.current?.click()}
                className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-400 transition"
              >
                <span className="text-2xl">📷</span>
                <span className="text-xs mt-1">Adicionar</span>
              </button>
            )}
          </div>

          <input
            ref={inputFotoRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleSelecionarFotos}
          />
        </div>

        {/* ── Título ───────────────────────────────────────── */}
        <div>
          <label className={labelClass}>Título</label>
          <input
            type="text"
            required
            maxLength={80}
            value={form.titulo}
            onChange={(e) => atualizar('titulo', e.target.value)}
            placeholder="Ex: Sofá 3 lugares seminovo"
            className={inputClass}
          />
        </div>

        {/* ── Descrição ────────────────────────────────────── */}
        <div>
          <label className={labelClass}>Descrição</label>
          <textarea
            required
            rows={4}
            maxLength={500}
            value={form.descricao}
            onChange={(e) => atualizar('descricao', e.target.value)}
            placeholder="Descreva o item, estado de conservação, motivo da venda..."
            className={`${inputClass} resize-none`}
          />
          <p className="text-xs text-gray-400 text-right mt-0.5">
            {form.descricao.length}/500
          </p>
        </div>

        {/* ── Categoria ────────────────────────────────────── */}
        <div>
          <label className={labelClass}>Categoria</label>
          <select
            required
            value={form.categoria_id}
            onChange={(e) => atualizar('categoria_id', e.target.value)}
            className={inputClass}
          >
            <option value="">Selecione uma categoria</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icone} {cat.nome}
              </option>
            ))}
          </select>
        </div>

        {/* ── Whatsapp ───────────────────────────────────── */}
        <div>
          <label className={labelClass}>Whatsapp</label>
          <input
            type="text"
            value={form.whatsapp}
            onChange={(e) => atualizar('whatsapp', e.target.value)}
            placeholder="Ex: (11) 99999-9999"
            className={inputClass}
          />
        </div>

        {/* ── URL ────────────────────────────────────── */}
        <div>
          <label className={labelClass}>Site</label>
          <input
            type="text"
            value={form.url}
            onChange={(e) => atualizar('url', e.target.value)}
            placeholder="Ex: https://exemplo.com"

            className={inputClass}
          />
        </div>

        {/* ── Tipo de preço ─────────────────────────────────── */}
        <div>
          <label className={labelClass}>Tipo de preço</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { valor: 'fixo', label: '💰 Fixo' },
              { valor: 'negociavel', label: '🤝 Negociável' },
              { valor: 'gratis', label: '🎁 Grátis' },
            ].map((opcao) => (
              <button
                key={opcao.valor}
                type="button"
                onClick={() => atualizar('tipo_preco', opcao.valor)}
                className={`py-2 px-3 rounded-lg text-xs font-medium border transition
                  ${form.tipo_preco === opcao.valor
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                  }`}
              >
                {opcao.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Valor (só aparece se não for grátis) ─────────── */}
        {form.tipo_preco !== 'gratis' && (
          <div>
            <label className={labelClass}>Valor (R$)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.preco}
              onChange={(e) => atualizar('preco', e.target.value)}
              placeholder="Ex: 150,00"
              className={inputClass}
            />
          </div>
        )}

        {/* ── Erro ─────────────────────────────────────────── */}
        {erro && (
          <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg px-4 py-3">
            {erro}
          </div>
        )}

        {/* ── Botão publicar ────────────────────────────────── */}
        <button
          type="submit"
          disabled={carregando}
          className="w-full bg-blue-600 text-white font-semibold rounded-lg py-3 text-sm hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {carregando ? 'Publicando...' : '🚀 Publicar anúncio'}
        </button>

      </form>
    </div>
  )
}