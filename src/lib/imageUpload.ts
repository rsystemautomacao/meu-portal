import { v2 as cloudinary, UploadApiResponse } from 'cloudinary'
import { Readable } from 'stream'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_SIZE = 10 * 1024 * 1024 // 10MB
const UPLOAD_TIMEOUT_MS = 30000

export class ImageUploadError extends Error {
  constructor(message: string, public code: string, public status: number = 400) {
    super(message)
    this.name = 'ImageUploadError'
    // tsconfig usa target es5: sem isto, `instanceof ImageUploadError` falha
    Object.setPrototypeOf(this, ImageUploadError.prototype)
  }
}

/** Valida e envia uma imagem ao Cloudinary. Lança ImageUploadError com mensagem pronta para o usuário. */
export async function uploadImage(file: File, folder: string): Promise<UploadApiResponse> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new ImageUploadError('Tipo de arquivo não suportado. Use apenas JPG, PNG ou WebP.', 'INVALID_FILE_TYPE')
  }
  if (file.size > MAX_SIZE) {
    throw new ImageUploadError('Arquivo muito grande. Tamanho máximo: 10MB.', 'FILE_TOO_LARGE')
  }
  if (file.size === 0) {
    throw new ImageUploadError('Arquivo corrompido ou vazio.', 'CORRUPTED_FILE')
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    return await new Promise<UploadApiResponse>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout no upload'))
      }, UPLOAD_TIMEOUT_MS)

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          transformation: [
            { width: 800, height: 800, crop: 'limit' },
            { quality: 'auto:good' },
          ],
        },
        (error, result) => {
          clearTimeout(timeout)
          if (error || !result) reject(error || new Error('Upload sem resposta'))
          else resolve(result)
        }
      )

      Readable.from(buffer).pipe(uploadStream)
    })
  } catch (error) {
    console.error('Erro no upload para o Cloudinary:', error)
    const message = error instanceof Error ? error.message : String(error)
    if (message.includes('Timeout')) {
      throw new ImageUploadError(
        'Upload cancelado - arquivo muito grande ou conexão lenta. Tente uma imagem menor.',
        'TIMEOUT',
        500
      )
    }
    if (message.includes('format')) {
      throw new ImageUploadError('Formato de imagem não suportado. Use JPG, PNG ou WebP.', 'INVALID_FORMAT')
    }
    throw new ImageUploadError('Erro ao fazer upload do arquivo', 'UPLOAD_ERROR', 500)
  }
}
