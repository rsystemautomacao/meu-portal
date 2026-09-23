import { NextResponse } from 'next/server'
import { getActiveSession } from '@/lib/session'
import { ImageUploadError, uploadImage } from '@/lib/imageUpload'
import { rateLimit, tooManyRequestsBody } from '@/lib/rateLimit'

export async function POST(req: Request) {
  const session = await getActiveSession()
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
  }

  const limit = rateLimit(`upload:${session.user.id}`, 30, 10 * 60 * 1000)
  if (!limit.ok) {
    return NextResponse.json(tooManyRequestsBody(limit.retryAfterSec), { status: 429 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { message: 'Nenhum arquivo enviado' },
        { status: 400 }
      )
    }

    const result = await uploadImage(file, 'player_photos')

    return NextResponse.json({
      ...result,
      message: 'Upload realizado com sucesso'
    })
  } catch (error) {
    if (error instanceof ImageUploadError) {
      return NextResponse.json(
        { message: error.message, error: error.code },
        { status: error.status }
      )
    }
    console.error('❌ Erro no upload:', error)
    return NextResponse.json(
      { message: 'Erro ao fazer upload do arquivo', error: 'UPLOAD_ERROR' },
      { status: 500 }
    )
  }
}
