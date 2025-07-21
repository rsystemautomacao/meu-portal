import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    if (!email) {
      return NextResponse.json({ error: 'E-mail obrigatório' }, { status: 400 })
    }
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }
    // Gerar token único
    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 1000 * 60 * 60) // 1 hora
    // Salvar token no banco
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires
      }
    })
    // Montar link de reset
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const resetLink = `${baseUrl}/auth/reset-password/${token}`
    return NextResponse.json({ resetLink })
  } catch (error) {
    console.error('Erro ao gerar token de reset:', error)
    return NextResponse.json({ error: 'Erro ao solicitar reset' }, { status: 500 })
  }
} 