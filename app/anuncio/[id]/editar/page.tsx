'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import type { AnuncioDetalhado } from '@/app/anuncio/[id]/page'
import { use } from 'react';
import { v4 as uuidv4 } from 'uuid';

type Props = { params: Promise<{ id: string }> }

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

// Para fotos existentes e novas
type FotoUpload = File | { id: string; url: string; ordem: number; is_deleted?: boolean };

// Substitua o tipo FotoUpload e os estados relacionados

type FotoExistente = {
  id: string
  url: string
  ordem: number
}

export default function EditarAnuncioPage({ params }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const inputFotoRef = useRef<HTMLInputElement>(null)

  const { id: anuncioId } = use(params); // Acessando diretamente, esperando que Next.js já tenha resolvido.

  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true) // Começa carregando
  const [salvando, setSalvando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [anuncioOriginal, setAnuncioOriginal] = useState<AnuncioDetalhado | null>(null);

  // Estado para gerenciar fotos (existentes e novas)
  const [fotos, setFotos] = useState<FotoUpload[]>([]);

  // Remove o estado único 'fotos' e substitui por três estados separados:
  const [fotosExistentes, setFotosExistentes] = useState<FotoExistente[]>([]) // Fotos já no banco
  const [fotasNovas, setFotasNovas] = useState<File[]>([])                    // Fotos novas (File[])
  const [pathsParaDeletar, setPathsParaDeletar] = useState<string[]>([])      // Paths no storage

  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    categoria_id: '',
    tipo_preco: 'fixo' as 'fixo' | 'negociavel' | 'gratis',
    preco: '',
    whatsapp: '',
    url: '',
    tipo_anuncio: 'hiperlocal' as 'hiperlocal' | 'regional_banner' | 'regional_card',
  })

  // ─── Carregar dados do anúncio e perfil na montagem ──────────────────────────────
  useEffect(() => {
    async function init() {
      setCarregando(true);
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login');
        return
      }
      setUserId(user.id)

      // 1. Buscar perfil do usuário
      const { data: perfilData } = await supabase
        .from('perfis')
        .select('condominio_id, role')
        .eq('id', user.id)
        .single()
      
      let isAdmin = false;
      if (perfilData) {
        setPerfil(perfilData)
        isAdmin = perfilData.role === 'admin'
      } else {
        setErro('Perfil do usuário não encontrado.')
        setCarregando(false);
        return;
      }

      // 2. Buscar categorias
      const { data: categoriasData } = await supabase
        .from('categorias')
        .select('id, nome, icone, slug')
        .eq('ativo', true)
        .order('ordem')

      if (categoriasData) setCategorias(categoriasData)

      // 3. Buscar dados do anúncio
      let queryAnuncio = supabase
        .from('anuncios')
        .select(`
          id,
          titulo,
          descricao,
          preco,
          tipo_preco,
          status,
          criado_em,
          expira_em,
          bloco,
          unidade,
          categoria_id,
          created_by_user_id,
          owner_user_id,
          contact_whatsapp,
          contact_url,
          categorias (
            nome,
            icone
          ),
          autor:created_by_user_id ( id, nome, telefone, bloco, unidade ),
          owner:owner_user_id ( id, nome, telefone, bloco, unidade ),
          fotos_anuncio (
            id,
            url,
            ordem
          ),
          tipo_anuncio
        `)
        .eq('id', anuncioId) // Usando o anuncioId que vem de params.id
        .eq('condominio_id', perfilData.condominio_id); // RLS já deve cuidar disso, mas é bom garantir
      
      // Se não for admin, garante que só o dono pode acessar
      // Se for admin, ele pode editar qualquer anúncio do condomínio, então não filtramos por owner_user_id
      if(!isAdmin){
        console.log('User is not admin')
        queryAnuncio = queryAnuncio.eq('owner_user_id', user.id) // Garante que só o dono pode editar
      }

      const { data: anuncioRaw, error: anuncioError } = await queryAnuncio.single();

      if (anuncioError || !anuncioRaw) {
        setErro('Anúncio não encontrado ou você não tem permissão para editá-lo.')
        setCarregando(false);
        return;
      }

      // Normaliza o anúncio para o estado
      const anuncio: AnuncioDetalhado = {
        id: anuncioRaw.id,
        titulo: anuncioRaw.titulo,
        descricao: anuncioRaw.descricao,
        preco: anuncioRaw.preco,
        tipo_preco: anuncioRaw.tipo_preco ?? 'fixo',
        status: anuncioRaw.status,
        criado_em: anuncioRaw.criado_em,
        expira_em: anuncioRaw.expira_em,
        bloco: anuncioRaw.bloco,
        unidade: anuncioRaw.unidade,
        categoria: Array.isArray(anuncioRaw.categorias)
          ? anuncioRaw.categorias[0] ?? null
          : anuncioRaw.categorias ?? null,
        created_by_user_id: anuncioRaw.created_by_user_id,
        autor: (() => {
          const p = Array.isArray(anuncioRaw.autor) ? anuncioRaw.autor[0] : anuncioRaw.autor
          return p ? { id: p.id, nome: p.nome, telefone: p.telefone, bloco: p.bloco, unidade: p.unidade } : null
        })(),

        owner_user_id: anuncioRaw.owner_user_id,
        owner: (() => {
          const p = Array.isArray(anuncioRaw.owner) ? anuncioRaw.owner[0] : anuncioRaw.owner
          return p ? { id: p.id, nome: p.nome, telefone: p.telefone, bloco: p.bloco, unidade: p.unidade } : null
        })(),

        contact_whatsapp: anuncioRaw.contact_whatsapp ?? '',
        contact_url: anuncioRaw.contact_url ?? '',
        fotos: (anuncioRaw.fotos_anuncio ?? []).sort((a: any, b: any) => a.ordem - b.ordem),
        tipo_anuncio: anuncioRaw.tipo_anuncio ?? 'hiperlocal',
      }
      setAnuncioOriginal(anuncio);

      // Pré-preencher o formulário
      setForm({
        titulo: anuncio.titulo,
        descricao: anuncio.descricao ?? '',
        categoria_id: anuncioRaw.categoria_id,
        tipo_preco: anuncio.tipo_preco,
        preco: anuncio.preco?.toString() ?? '',
        whatsapp: anuncio.contact_whatsapp ?? '',
        url: anuncio.contact_url ?? '',
        tipo_anuncio: anuncio.tipo_anuncio ?? 'hiperlocal',
      })

      // Pré-preencher as fotos existentes
      setFotosExistentes(
        anuncio.fotos.map(f => ({ id: f.id, url: f.url, ordem: f.ordem }))
      )
      setFotasNovas([])
      setPathsParaDeletar([])

      setCarregando(false);
    }

    init()
  }, [anuncioId, router, supabase]) // anuncioId como dependência do useEffect

  // ─── Atualizar campo do form ─────────────────────────────────
  function atualizar(campo: string, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
    setErro(null)
  }

  // ─── Selecionar novas fotos ────────────────────────────────────────
  function handleInserirFotos(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(e.target.files ?? [])
    if (!arquivos.length) return

    setFotasNovas(prev => {
      const totalAtual = fotosExistentes.length + prev.length
      const slots = 3 - totalAtual              // Quantas vagas ainda temos
      if (slots <= 0) return prev               // Já atingiu o limite, ignora

      const novas = arquivos.slice(0, slots)    // Respeita o limite de 3
      return [...novas, ...prev]                // Novas ficam no início (ordem maior)
    })
    
    e.target.value = '' // Limpar o input
  }

  // index e tipo para saber se é existente ou nova
  function handleRemoverFoto(tipo: 'existente' | 'nova', index: number) {
    if (tipo === 'existente') {
      const foto = fotosExistentes[index]
      if (!foto) return

      // Agenda para deletar do storage quando salvar
      const path = extrairPathDoStorage(foto.url)
      if (path) {
        setPathsParaDeletar(prev => [...prev, path])
      }

      // Remove do estado visual imediatamente
      setFotosExistentes(prev => prev.filter((_, i) => i !== index))

    } else {
      // É uma foto nova (File), remove apenas do estado local
      // Não precisa deletar do storage pois ainda não foi enviada
      setFotasNovas(prev => prev.filter((_, i) => i !== index))
    }
  }

  async function gerenciarFotos(anuncio_id: string): Promise<void> {
    if (!userId) return

    // ── 1. Deletar do storage os paths agendados ──────────────────────
    if (pathsParaDeletar.length > 0) {
      const { error } = await supabase.storage
        .from('anuncios')
        .remove(pathsParaDeletar)

      if (error) {
        console.error('[gerenciarFotos] Erro ao deletar fotos do storage:', error.message)
      } else {
        console.log(`[gerenciarFotos] ${pathsParaDeletar.length} foto(s) deletada(s) do storage`)
      }
    }

    // ── 2. Deletar registros do banco (fotos_anuncio) ─────────────────
    // Pega os IDs das fotos existentes que foram removidas
    // (as que estavam no anuncioOriginal mas não estão mais em fotosExistentes)
    const idsOriginais = anuncioOriginal?.fotos.map(f => f.id) ?? []
    const idsMantidos = fotosExistentes.map(f => f.id)
    const idsParaDeletarDoDB = idsOriginais.filter(id => !idsMantidos.includes(id))

    if (idsParaDeletarDoDB.length > 0) {
      const { error } = await supabase
        .from('fotos_anuncio')
        .delete()
        .in('id', idsParaDeletarDoDB)

      if (error) {
        console.error('[gerenciarFotos] Erro ao deletar fotos do banco:', error.message)
      }
    }

    // ── 3. Atualizar ordem das fotos existentes mantidas ─────────────
    // A ordem final: novas fotos primeiro, existentes depois
    const totalNovas = fotasNovas.length

    for (let i = 0; i < fotosExistentes.length; i++) {
      const foto = fotosExistentes[i]
      const novaOrdem = totalNovas + i + 1 // Novas têm ordens menores (1, 2...), existentes vêm depois

      if (foto.ordem !== novaOrdem) {
        const { error } = await supabase
          .from('fotos_anuncio')
          .update({ ordem: novaOrdem })
          .eq('id', foto.id)

        if (error) {
          console.error('[gerenciarFotos] Erro ao atualizar ordem:', error.message)
        } else {
          console.log(`[gerenciarFotos] Ordem da foto ${foto.id} atualizada para ${novaOrdem}`)
        }
      }
    }

    // ── 4. Upload das novas fotos ─────────────────────────────────────
    for (let i = 0; i < fotasNovas.length; i++) {
      const foto = fotasNovas[i]
      const ordem = i + 1 // Novas ficam no início: ordem 1, 2...

      console.log(`[gerenciarFotos] Enviando foto ${foto.name} na ordem ${ordem}...`)

      const extensao = foto.name.split('.').pop() ?? 'jpg'
      const nome = uuidv4()
      const caminho = `${anuncio_id}/${nome}.${extensao}`

      const { error: uploadError } = await supabase.storage
        .from('anuncios')
        .upload(caminho, foto, { upsert: false })

      if (uploadError) {
        console.error(`[gerenciarFotos] Erro no upload da foto ${ordem}:`, uploadError.message)
        continue
      }

      const { data: urlData } = supabase.storage
        .from('anuncios')
        .getPublicUrl(caminho)

      const { error: insertError } = await supabase
        .from('fotos_anuncio')
        .insert({ anuncio_id, url: urlData.publicUrl, ordem })

      if (insertError) {
        console.error('[gerenciarFotos] Erro ao inserir foto no banco:', insertError.message)
      }
    }
  }


  // ─── Submeter o formulário de edição ───────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setErro(null)

    if (!perfil || !userId || !anuncioOriginal) {
      setErro('Erro ao carregar dados. Tente novamente.')
      setSalvando(false)
      return
    }

    if (!form.categoria_id) {
      setErro('Selecione uma categoria para o anúncio.')
      setSalvando(false)
      return
    }

    // 1. Atualizar o anúncio
    const isAdmin = perfil.role === 'admin'; // Já está sendo verificado

    const updateData: any = {
      titulo: form.titulo,
      descricao: form.descricao,
      categoria_id: form.categoria_id,
      tipo_preco: form.tipo_preco,
      preco: form.tipo_preco !== 'gratis' && form.preco
        ? parseFloat(form.preco.replace(',', '.'))
        : null,
      contact_whatsapp: form.whatsapp,
      contact_url: form.url,
    };

    // Apenas admins podem alterar o tipo_anuncio
    if (isAdmin) {
      updateData.tipo_anuncio = form.tipo_anuncio;
      // Se o tipo_anuncio for regional, o condominio_id deve ser NULL
      if (form.tipo_anuncio === 'regional_banner' || form.tipo_anuncio === 'regional_card') {
        updateData.condominio_id = null; // Ou um ID especial, se preferir
      } else {
        // Se voltar a ser hiperlocal, garante que o condominio_id seja o do perfil
        updateData.condominio_id = perfil.condominio_id;
      }
    }

    let editAnuncioQuery = supabase
      .from('anuncios')
      .update(updateData)
      .eq('id', anuncioId)

    // Se não for admin, garante que só o dono pode atualizar
    if(!isAdmin) {
      editAnuncioQuery = editAnuncioQuery.eq('owner_user_id', userId) // Usar owner_user_id
    }

    const { error: erroAnuncio } = await editAnuncioQuery;

    if (erroAnuncio) {
      setErro('Erro ao atualizar anúncio. Tente novamente.')
      setSalvando(false)
      return
    }

    // 2. Gerenciar fotos (upload, delete, reorder)
    await gerenciarFotos(anuncioId);

    // 3. Sucesso — voltar para a página de detalhes
    router.push(`/anuncio/${anuncioId}`)
    router.refresh()
    setSalvando(false)
  }

  // ─── Excluir anúncio ──────────────────────────────────────────
  async function handleExcluirAnuncio() {
    if (!confirm('Tem certeza que deseja excluir este anúncio? Esta ação é irreversível.')) {
      return;
    }

    setExcluindo(true);
    setErro(null);

    if (!userId || !anuncioOriginal) {
      setErro('Erro ao carregar dados do anúncio para exclusão.');
      setExcluindo(false);
      return;
    }

    // 1. Deletar fotos do Storage
    const fotosNoStorage = anuncioOriginal.fotos.map(f => {
      const pathSegments = f.url.split('/public/anuncios/')[1];
      return pathSegments;
    }).filter(Boolean) as string[]; // Filtra nulos e garante tipo string[]

    if (fotosNoStorage.length > 0) {
      const { error: storageError } = await supabase.storage.from('anuncios').remove(fotosNoStorage);
      if (storageError) console.error('Erro ao deletar fotos do Storage durante exclusão:', storageError.message);
      // Não bloqueia a exclusão do anúncio se o storage falhar
    }

    // 2. Deletar fotos da tabela fotos_anuncio (RLS deve permitir se usuario_id = auth.uid())
    const { error: fotosDbError } = await supabase.from('fotos_anuncio').delete().eq('anuncio_id', anuncioId);
    if (fotosDbError) console.error('Erro ao deletar fotos do DB durante exclusão:', fotosDbError.message);

    // 3. Deletar o anúncio (RLS deve permitir se usuario_id = auth.uid())
    let deleteAnuncioQuery = supabase
      .from('anuncios')
      .delete()
      .eq('id', anuncioId)
    
    const isAdmin = perfil?.role === 'admin';
    if(!isAdmin) {
      deleteAnuncioQuery = deleteAnuncioQuery.eq('usuario_id', userId); // Garante que só o dono pode deletar
    }

    const { error: anuncioDeleteError } = await deleteAnuncioQuery;

    if (anuncioDeleteError) {
      setErro('Erro ao excluir anúncio. Tente novamente.');
      setExcluindo(false);
      return;
    }

    // Sucesso — redirecionar para o feed
    router.push('/feed');
    router.refresh();
    setExcluindo(false);
  }

  // Adicione essa função auxiliar fora do componente
  function extrairPathDoStorage(url: string): string | null {
    // Extrai o path após '/public/anuncios/'
    const match = url.split('/public/anuncios/')
    return match.length > 1 ? match[1] : null
  }


  // ─── Classes reutilizáveis ───────────────────────────────────
  const inputClass =
    'w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm ' +
    'text-gray-900 placeholder:text-gray-400 ' +
    'focus:outline-none focus:ring-2 focus:ring-blue-500'

  const labelClass = 'block text-sm font-medium text-gray-800 mb-1'

  // ─── Render ──────────────────────────────────────────────────
  if (carregando) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-bounce">🔄</div>
          <p className="text-sm text-gray-400">Carregando anúncio...</p>
        </div>
      </div>
    )
  }

  if (erro && !anuncioOriginal) { // Se erro ao carregar o anúncio
    return (
      <div className="text-center py-24">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Erro ao carregar anúncio</h2>
        <p className="text-gray-600">{erro}</p>
        <button onClick={() => router.back()} className="mt-6 text-blue-600 hover:underline">
          ← Voltar
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">

      {/* Cabeçalho */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-gray-600 transition"
        >
          ← Voltar
        </button>
        <h1 className="text-xl font-bold text-gray-900">Editar anúncio</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Fotos ────────────────────────────────────────── */}
        <div>
          <label className={labelClass}>
            Fotos <span className="text-gray-400 font-normal">(até 3)</span>
          </label>

          <div className="flex gap-3 mt-1 flex-wrap">

            {/* Novas fotos primeiro (File[]) */}
            {fotasNovas.map((foto, i) => (
              <div key={`nova-${i}`} className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-blue-300">
                <Image
                  src={URL.createObjectURL(foto)}
                  alt={`Nova foto ${i + 1}`}
                  fill
                  className="object-cover"
                />
                {/* Badge "Nova" */}
                <span className="absolute bottom-1 left-1 bg-blue-600 text-white text-[9px] px-1 rounded">
                  Nova
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoverFoto('nova', i)}
                  className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-black/70"
                >
                  ×
                </button>
              </div>
            ))}

            {/* Fotos existentes depois */}
            {fotosExistentes.map((foto, i) => (
              <div key={`existente-${foto.id}`} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
                <Image
                  src={foto.url}
                  alt={`Foto existente ${i + 1}`}
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemoverFoto('existente', i)}
                  className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-black/70"
                >
                  ×
                </button>
              </div>
            ))}

            {/* Botão adicionar (só aparece se tiver slots) */}
            {fotasNovas.length + fotosExistentes.length < 3 && (
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
            onChange={handleInserirFotos}
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

        {/* ── Botões de Ação ────────────────────────────────── */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={salvando || excluindo}
            className="flex-1 bg-blue-600 text-white font-semibold rounded-lg py-3 text-sm hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {salvando ? 'Salvando...' : 'Salvar alterações'}
          </button>
          <button
            type="button"
            onClick={handleExcluirAnuncio}
            disabled={salvando || excluindo}
            className="flex-1 bg-red-600 text-white font-semibold rounded-lg py-3 text-sm hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {excluindo ? 'Excluindo...' : 'Excluir anúncio'}
          </button>
        </div>

      </form>
    </div>
  )
}