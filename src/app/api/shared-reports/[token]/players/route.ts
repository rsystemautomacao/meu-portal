import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: Buscar jogadores para relatório compartilhado
export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ token: string }> }
) {
  const params = await paramsPromise
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
      select: {
        id: true,
        name: true,
        position: true,
        isExempt: true,
        monthlyFee: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(players)
  } catch (error) {
    console.error("Erro ao buscar jogadores para relatório compartilhado:", error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 