import { createClient } from './client'

export async function testarConexao() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('categorias')
    .select('nome, slug')
    .order('ordem')

  if (error) {
    console.error('❌ Erro na conexão:', error.message)
    return
  }

  console.log('✅ Conexão OK! Categorias encontradas:', data)
}