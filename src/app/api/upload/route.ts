import { NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { message: 'Nenhum arquivo enviado' },
        { status: 400 }
      )
    }

    // Validações de arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const maxSize = 10 * 1024 * 1024 // 10MB

    // Validar tipo de arquivo
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { 
          message: 'Tipo de arquivo não suportado. Use apenas JPG, PNG ou WebP.',
          error: 'INVALID_FILE_TYPE'
        },
        { status: 400 }
      )
    }

    // Validar tamanho do arquivo
    if (file.size > maxSize) {
      return NextResponse.json(
        { 
          message: 'Arquivo muito grande. Tamanho máximo: 10MB.',
          error: 'FILE_TOO_LARGE'
        },
        { status: 400 }
      )
    }

    // Validar se o arquivo não está corrompido
    if (file.size === 0) {
      return NextResponse.json(
        { 
          message: 'Arquivo corrompido ou vazio.',
          error: 'CORRUPTED_FILE'
        },
        { status: 400 }
      )
    }

    console.log('📤 Iniciando upload:', {
      fileName: file.name,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      fileType: file.type
    })

    // Converter o arquivo para um buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload para o Cloudinary com timeout e retry
    const result = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout no upload - arquivo muito grande ou conexão lenta'))
      }, 30000) // 30 segundos timeout

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'player_photos',
          resource_type: 'image',
          transformation: [
            { width: 800, height: 800, crop: 'limit' }, // Redimensionar se muito grande
            { quality: 'auto:good' } // Otimizar qualidade
          ]
        },
        (error, result) => {
          clearTimeout(timeout)
          if (error) {
            console.error('❌ Erro no Cloudinary:', error)
            reject(error)
          } else {
            console.log('✅ Upload concluído:', result?.secure_url)
            resolve(result)
          }
        }
      )

      // Escrever o buffer no stream de upload
      const bufferStream = require('stream').Readable.from(buffer)
      bufferStream.pipe(uploadStream)
    })

    return NextResponse.json({
      ...(result as any),
      message: 'Upload realizado com sucesso'
    })
  } catch (error) {
    console.error('❌ Erro no upload:', error)
    
    // Tratamento específico de erros
    let errorMessage = 'Erro ao fazer upload do arquivo'
    let errorCode = 'UPLOAD_ERROR'
    
    if (error instanceof Error) {
      if (error.message.includes('Timeout')) {
        errorMessage = 'Upload cancelado - arquivo muito grande ou conexão lenta. Tente uma imagem menor.'
        errorCode = 'TIMEOUT'
      } else if (error.message.includes('network')) {
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.'
        errorCode = 'NETWORK_ERROR'
      } else if (error.message.includes('format')) {
        errorMessage = 'Formato de imagem não suportado. Use JPG, PNG ou WebP.'
        errorCode = 'INVALID_FORMAT'
      }
    }

    return NextResponse.json(
      { 
        message: errorMessage,
        error: errorCode,
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
} 