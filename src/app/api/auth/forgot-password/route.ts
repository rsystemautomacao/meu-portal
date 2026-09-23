import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { getClientIp, rateLimit, tooManyRequestsBody } from '@/lib/rateLimit'
import { hashResetToken } from '@/lib/resetToken'

export async function POST(request: Request) {
  try {
    const limit = rateLimit(`forgot-password:${getClientIp(request.headers)}`, 5, 15 * 60 * 1000)
    if (!limit.ok) {
      return NextResponse.json(tooManyRequestsBody(limit.retryAfterSec), { status: 429 })
    }

    const { email } = await request.json()
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'E-mail obrigatório' }, { status: 400 })
    }
    const user = await prisma.user.findUnique({ where: { email } })
    if (user) {
      // Gerar token único; no banco fica só o hash, para que um vazamento do banco
      // não permita redefinir senhas
      const token = crypto.randomBytes(32).toString('hex')
      const expires = new Date(Date.now() + 1000 * 60 * 60) // 1 hora
      await prisma.verificationToken.deleteMany({ where: { identifier: email } })
      await prisma.verificationToken.create({
        data: {
          identifier: email,
          token: hashResetToken(token),
          expires
        }
      })
      // TODO: enviar por e-mail o link /auth/reset-password/<token> (o token puro, não o hash).
      // Ainda não há provedor de e-mail configurado, então o link não chega ao usuário.
    }
    // Sempre retornar sucesso genérico
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erro ao gerar token de reset:', error)
    return NextResponse.json({ error: 'Erro ao solicitar reset' }, { status: 500 })
  }
}
