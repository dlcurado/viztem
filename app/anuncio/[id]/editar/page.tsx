'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import type { AnuncioDetalhado } from '@/app/anuncio/[id]/page'
import { use } from 'react';

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
  const [fotosUpload, setFotosUpload] = useState<FotoUpload[]>([]);

  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    categoria_id: '',
    tipo_preco: 'fixo' as 'fixo' | 'negociavel' | 'gratis',
    preco: '',
    whatsapp: '',
    url: '',
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
          )
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
      })

      // Pré-preencher as fotos existentes
      const fotosExistentes: FotoUpload[] = anuncio.fotos.map(f => ({ ...f, is_deleted: false }));
      setFotosUpload(fotosExistentes);

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
  function handleSelecionarFotos(e: React.ChangeEvent<HTMLInputElement>) {
    const novosArquivos = Array.from(e.target.files ?? [])

    // Filtra fotos marcadas para exclusão e adiciona novas
    const fotosAtuais = fotosUpload.filter(f => !(f as { is_deleted?: boolean }).is_deleted);
    const novasFotosUpload: FotoUpload[] = [...fotosAtuais, ...novosArquivos].slice(0, 3);

    setFotosUpload(novasFotosUpload);
    
    e.target.value = '' // Limpar o input
  }

  // ─── Remover foto (marcar para exclusão ou remover da lista de novas) ────────────────────────────────────────────
  function removerFoto(index: number) {
    const fotoParaRemover = fotosUpload[index];
    if (fotoParaRemover && !(fotoParaRemover instanceof File)) {
      // É uma foto existente, marca para exclusão
      setFotosUpload(prev => prev.map((f, i) => i === index ? { ...f as { id: string; url: string; ordem: number }, is_deleted: true } : f));
    } else {
      // É uma foto nova, remove da lista
      setFotosUpload(prev => prev.filter((_, i) => i !== index));
    }
  }

  // ─── Fazer upload das fotos no Storage e atualizar DB ───────────────────────
  async function gerenciarFotos(anuncio_id: string): Promise<void> {
    if (!userId) return;

    const fotosParaManter: { id?: string; url: string; ordem: number }[] = [];
    const fotosParaUpload: File[] = [];
    const fotosParaDeletarDoStorage: string[] = [];
    const fotosParaDeletarDoDB: string[] = [];

    // Separa as fotos
    fotosUpload.forEach((foto, index) => {
      if (foto instanceof File) {
        fotosParaUpload.push(foto);
      } else if (foto.is_deleted) {
        // Extrai o caminho completo da URL para deletar do storage
        const pathSegments = foto.url.split('/public/anuncios/')[1]; // Pega o que vem depois de /public/anuncios/
        if (pathSegments) {
          fotosParaDeletarDoStorage.push(pathSegments);
        }
        fotosParaDeletarDoDB.push(foto.id);
      } else {
        fotosParaManter.push({ id: foto.id, url: foto.url, ordem: index + 1 }); // Reordena
      }
    });

    // 1. Deletar fotos do Storage
    if (fotosParaDeletarDoStorage.length > 0) {
      const { error } = await supabase.storage.from('anuncios').remove(fotosParaDeletarDoStorage);
      if (error) console.error('Erro ao deletar fotos do Storage:', error.message);
    }

    // 2. Deletar fotos do DB
    if (fotosParaDeletarDoDB.length > 0) {
      const { error } = await supabase.from('fotos_anuncio').delete().in('id', fotosParaDeletarDoDB);
      if (error) console.error('Erro ao deletar fotos do DB:', error.message);
    }

    // 3. Upload de novas fotos e atualização de ordem/URL
    const novasFotosDB: { anuncio_id: string; url: string; ordem: number }[] = [];
    let ordemAtual = fotosParaManter.length; // Começa a ordem após as fotos mantidas

    for (const foto of fotosParaUpload) {
      ordemAtual++;
      const extensao = foto.name.split('.').pop();
      const caminho = `${anuncio_id}/${ordemAtual}.${extensao}`;

      const { error: uploadError } = await supabase.storage
        .from('anuncios')
        .upload(caminho, foto, { upsert: true });

      if (uploadError) {
        console.error(`Erro no upload da foto ${ordemAtual}:`, uploadError.message);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from('anuncios')
        .getPublicUrl(caminho);

      novasFotosDB.push({ anuncio_id, url: urlData.publicUrl, ordem: ordemAtual });
    }

    // 4. Inserir novas fotos no DB
    if (novasFotosDB.length > 0) {
      const { error } = await supabase.from('fotos_anuncio').insert(novasFotosDB);
      if (error) console.error('Erro ao inserir novas fotos no DB:', error.message);
    }

    // 5. Atualizar ordem das fotos mantidas (se necessário)
    // Para este MVP, vamos considerar que a ordem é definida pela posição no array fotosUpload
    // e que fotosParaManter já tem a ordem correta para o DB.
    for (let i = 0; i < fotosParaManter.length; i++) {
      const foto = fotosParaManter[i];
      if (foto.id && foto.ordem !== (i + 1)) { // Se a ordem mudou
        const { error } = await supabase.from('fotos_anuncio')
          .update({ ordem: i + 1 })
          .eq('id', foto.id);
        if (error) console.error('Erro ao atualizar ordem da foto:', error.message);
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
    let editAnuncioQuery = supabase
      .from('anuncios')
      .update({
        titulo: form.titulo,
        descricao: form.descricao,
        categoria_id: form.categoria_id,
        tipo_preco: form.tipo_preco,
        preco: form.tipo_preco !== 'gratis' && form.preco
          ? parseFloat(form.preco.replace(',', '.'))
          : null,
        
        // status: 'ativo', // Manter status atual ou permitir edição? Por enquanto, manter
      })
      .eq('id', anuncioId)

    const isAdmin = perfil.role === 'admin';
    // Se o usuário logado for admin, ele pode atualizar qualquer anúncio
    if(!isAdmin) {
      editAnuncioQuery = editAnuncioQuery.eq('usuario_id', userId) // Garante que só o dono pode atualizar
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

          <div className="flex gap-3 mt-1">
            {/* Previews das fotos selecionadas */}
            {fotosUpload.map((foto, i) => {
              if ((foto as { is_deleted?: boolean }).is_deleted) return null; // Não mostra fotos marcadas para exclusão

              const src = foto instanceof File ? URL.createObjectURL(foto) : (foto as { url: string }).url;
              return (
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
              );
            })}

            {/* Botão para adicionar foto */}
            {fotosUpload.filter(f => !(f as { is_deleted?: boolean }).is_deleted).length < 3 && (
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