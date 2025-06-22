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

    // Converter o arquivo para um buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload para o Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'player_photos',
        },
        (error, result) => {
          if (error) reject(error)
          resolve(result)
        }
      )

      // Escrever o buffer no stream de upload
      const bufferStream = require('stream').Readable.from(buffer)
      bufferStream.pipe(uploadStream)
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Erro no upload:', error)
    return NextResponse.json(
      { message: 'Erro ao fazer upload do arquivo' },
      { status: 500 }
    )
  }
} 