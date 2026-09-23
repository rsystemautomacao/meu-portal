import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { getClientIp, rateLimit, tooManyRequestsBody } from '@/lib/rateLimit'
import { hashResetToken } from '@/lib/resetToken'

export async function POST(request: Request) {
  try {
    const limit = rateLimit(`reset-password:${getClientIp(request.headers)}`, 10, 15 * 60 * 1000)
    if (!limit.ok) {
      return NextResponse.json(tooManyRequestsBody(limit.retryAfterSec), { status: 429 })
    }

    const { token, password } = await request.json()
    if (!token || !password || typeof token !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'Token e nova senha obrigatórios' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres' }, { status: 400 })
    }
    // Buscar token no banco (armazenado como hash)
    const verification = await prisma.verificationToken.findUnique({ where: { token: hashResetToken(token) } })
    if (!verification || verification.expires < new Date()) {
      return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 400 })
    }
    // Buscar usuário pelo e-mail
    const user = await prisma.user.findUnique({ where: { email: verification.identifier } })
    if (!user) {
      return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 400 })
    }
    // Atualizar senha
    const hashed = await bcrypt.hash(password, 12)
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } })
    // Invalidar todos os tokens deste usuário
    await prisma.verificationToken.deleteMany({ where: { identifier: verification.identifier } })
    return NextResponse.json({ message: 'Senha redefinida com sucesso' })
  } catch (error) {
    console.error('Erro ao redefinir senha:', error)
    return NextResponse.json({ error: 'Erro ao redefinir senha' }, { status: 500 })
  }
}
