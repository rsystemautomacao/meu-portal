import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { ADMIN_SESSION_COOKIE, createAdminSessionToken } from '@/lib/adminAuth'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    const adminEmail = process.env.ADMIN_EMAIL
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH

    if (!adminEmail || !adminPasswordHash) {
      console.error('ADMIN_EMAIL ou ADMIN_PASSWORD_HASH não configurados no .env')
      return NextResponse.json({ error: 'Configuração de admin ausente no servidor' }, { status: 500 })
    }

    if (!email || !password || email !== adminEmail) {
      return NextResponse.json({ error: 'Email ou senha inválidos' }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, adminPasswordHash)
    if (!isValid) {
      return NextResponse.json({ error: 'Email ou senha inválidos' }, { status: 401 })
    }

    const token = await createAdminSessionToken(email)
    const response = NextResponse.json({ success: true })
    response.cookies.set(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    })
    return response
  } catch (error) {
    console.error('Erro no login admin:', error)
    return NextResponse.json({ error: 'Erro ao processar login' }, { status: 500 })
  }
}
