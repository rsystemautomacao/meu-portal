import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: Buscar jogadores para relatório compartilhado
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params

    // Validar token de compartilhamento
    const sharedReport = await prisma.sharedReport.findUnique({
      where: { shareToken: token },
      include: {
        team: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!sharedReport || !sharedReport.isActive) {
      return NextResponse.json({ error: 'Relatório não encontrado ou inativo' }, { status: 404 })
    }

    // Buscar jogadores do time
    const players = await prisma.player.findMany({
      where: { teamId: sharedReport.team.id },
      include: {
        monthlyFeeExceptions: true,
        payments: true
      },
      orderBy: { name: 'asc' }
    })

    // Adicionar isExempt ao retorno
    const playersWithIsExempt = players.map(player => ({
      ...player,
      isExempt: !!player.isExempt
    }))

    return NextResponse.json(playersWithIsExempt)
  } catch (error) {
    console.error("Erro ao buscar jogadores para relatório compartilhado:", error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 