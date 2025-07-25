import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: Buscar partidas para relatório compartilhado
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

    // Buscar partidas do time
    const matches = await prisma.match.findMany({
      where: { teamId: sharedReport.team.id },
      orderBy: { date: 'desc' },
      include: {
        events: true
      }
    })

    return NextResponse.json(matches)
  } catch (error) {
    console.error("Erro ao buscar partidas para relatório compartilhado:", error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 