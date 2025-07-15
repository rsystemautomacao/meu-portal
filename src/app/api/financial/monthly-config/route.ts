import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Buscar configuração de mensalidade
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar o time do usuário
    const teamUser = await prisma.teamUser.findFirst({
      where: { userId: session.user.id },
      select: { teamId: true }
    })
    if (!teamUser) {
      return NextResponse.json({ error: 'Time não encontrado' }, { status: 404 })
    }

    // Buscar configuração existente
    const config = await prisma.monthlyFeeConfig.findUnique({
      where: { teamId: teamUser.teamId }
    })

    if (!config) {
      return NextResponse.json(null)
    }

    return NextResponse.json({
      amount: config.amount,
      dueDay: config.day,
      isActive: true // Por enquanto sempre ativo
    })
  } catch (error) {
    console.error('Erro ao buscar configuração:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar configuração' },
      { status: 500 }
    )
  }
}

// POST - Criar/Atualizar configuração de mensalidade
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar o time do usuário
    const teamUser = await prisma.teamUser.findFirst({
      where: { userId: session.user.id },
      select: { teamId: true }
    })
    if (!teamUser) {
      return NextResponse.json({ error: 'Time não encontrado' }, { status: 404 })
    }

    const data = await req.json()
    const { amount, dueDay, isActive } = data

    // Validar dados
    if (!amount || !dueDay) {
      return NextResponse.json(
        { error: 'Valor e dia de vencimento são obrigatórios' },
        { status: 400 }
      )
    }

    if (dueDay < 1 || dueDay > 31) {
      return NextResponse.json(
        { error: 'Dia de vencimento deve estar entre 1 e 31' },
        { status: 400 }
      )
    }

    // Criar ou atualizar configuração
    const config = await prisma.monthlyFeeConfig.upsert({
      where: { teamId: teamUser.teamId },
      update: {
        amount: parseFloat(amount),
        day: parseInt(dueDay)
      },
      create: {
        teamId: teamUser.teamId,
        amount: parseFloat(amount),
        day: parseInt(dueDay)
      }
    })

    return NextResponse.json({
      amount: config.amount,
      dueDay: config.day,
      isActive: true
    })
  } catch (error) {
    console.error('Erro ao salvar configuração:', error)
    return NextResponse.json(
      { error: 'Erro ao salvar configuração' },
      { status: 500 }
    )
  }
} 