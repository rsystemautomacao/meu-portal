import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json()
    if (!token || !password) {
      return NextResponse.json({ error: 'Token e nova senha obrigatórios' }, { status: 400 })
    }
    // Buscar token no banco
    const verification = await prisma.verificationToken.findUnique({ where: { token } })
    if (!verification || verification.expires < new Date()) {
      return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 400 })
    }
    // Buscar usuário pelo e-mail
    const user = await prisma.user.findUnique({ where: { email: verification.identifier } })
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }
    // Atualizar senha
    const hashed = await bcrypt.hash(password, 10)
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } })
    // Invalidar token
    await prisma.verificationToken.delete({ where: { token } })
    return NextResponse.json({ message: 'Senha redefinida com sucesso' })
  } catch (error) {
    console.error('Erro ao redefinir senha:', error)
    return NextResponse.json({ error: 'Erro ao redefinir senha' }, { status: 500 })
  }
} 