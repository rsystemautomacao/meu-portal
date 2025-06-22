// Este arquivo foi desabilitado temporariamente
// Há problemas com o Prisma Client não reconhecendo o schema atual
// Será reativado após o deploy funcionar

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// GET - Buscar configuração de mensalidade
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    const teamUser = await prisma.teamUser.findFirst({
      where: { userId: session.user.id },
      select: { teamId: true }
    })

    if (!teamUser) {
      return NextResponse.json(
        { message: 'Time não encontrado' },
        { status: 404 }
      )
    }

    const config = await prisma.monthlyFeeConfig.findUnique({
      where: { teamId: teamUser.teamId }
    })

    return NextResponse.json(config)
  } catch (error) {
    console.error('Erro ao buscar configuração:', error)
    return NextResponse.json(
      { message: 'Erro ao buscar configuração' },
      { status: 500 }
    )
  }
}

// POST - Criar/Atualizar configuração de mensalidade
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { amount, day } = await req.json()

    const teamUser = await prisma.teamUser.findFirst({
      where: { 
        userId: session.user.id,
        role: 'owner'
      },
      select: { teamId: true }
    })

    if (!teamUser) {
      return NextResponse.json(
        { message: 'Time não encontrado ou usuário não é proprietário' },
        { status: 404 }
      )
    }

    // Criar ou atualizar configuração
    const config = await prisma.monthlyFeeConfig.upsert({
      where: { teamId: teamUser.teamId },
      update: { amount, day },
      create: {
        amount,
        day,
        teamId: teamUser.teamId
      }
    })

    return NextResponse.json(config)
  } catch (error) {
    console.error('Erro ao salvar configuração:', error)
    return NextResponse.json(
      { message: 'Erro ao salvar configuração' },
      { status: 500 }
    )
  }
} 