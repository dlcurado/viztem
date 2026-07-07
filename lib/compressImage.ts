// lib/compressImage.ts
import imageCompression from 'browser-image-compression'

export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 0.8,          // Máximo 800KB
    maxWidthOrHeight: 1200,  // Máximo 1200px (ideal para OG)
    useWebWorker: true,      // Não trava a UI
    fileType: 'image/jpeg',  // Garante JPEG
    initialQuality: 0.85,    // Qualidade inicial
  }

  try {
    const compressedBlob = await imageCompression(file, options)

    // Garante que o arquivo resultante seja .jpg
    const compressedFile = new File(
      [compressedBlob],
      file.name.replace(/\.[^/.]+$/, '.jpg'),
      { type: 'image/jpeg' }
    )

    console.log(`[Compressão] Original: ${(file.size / 1024 / 1024).toFixed(2)}MB → Comprimido: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`)

    return compressedFile
  } catch (error) {
    console.error('[Compressão] Erro ao comprimir imagem:', error)
    // Em caso de erro, retorna o arquivo original para não bloquear o usuário
    return file
  }
}