import { NextResponse } from 'next/server'
import cloudinary from '@/lib/cloudinary'

export async function GET() {
  try {
    // Verificar se o Cloudinary está configurado
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json({
        success: false,
        error: 'Cloudinary não configurado - variáveis de ambiente ausentes',
        config: {
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key_prefix: process.env.CLOUDINARY_API_KEY?.substring(0, 4),
          has_secret: !!process.env.CLOUDINARY_API_SECRET
        }
      }, { status: 500 })
    }

    // Imagem de teste em base64 (1x1 pixel transparente)
    const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        testImage,
        {
          folder: 'test',
          public_id: 'test-connection'
        },
        (error, result) => {
          if (error) {
            console.error('Erro no teste:', error)
            reject(error)
          } else {
            console.log('Teste bem sucedido:', result)
            resolve(result)
          }
        }
      )
    })

    return NextResponse.json({
      success: true,
      result,
      config: {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key_prefix: process.env.CLOUDINARY_API_KEY?.substring(0, 4),
        has_secret: !!process.env.CLOUDINARY_API_SECRET
      }
    })
  } catch (error) {
    console.error('Erro no teste:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      config: {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key_prefix: process.env.CLOUDINARY_API_KEY?.substring(0, 4),
        has_secret: !!process.env.CLOUDINARY_API_SECRET
      }
    }, { status: 500 })
  }
} 