import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: Buscar dados do relatório compartilhado
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params

    const sharedReport = await prisma.sharedReport.findUnique({
      where: { shareToken: token },
      include: {
        team: {
          select: {
            name: true
          }
        }
      }
    })

    if (!sharedReport) {
      return NextResponse.json({ error: 'Relatório não encontrado' }, { status: 404 })
    }

    if (!sharedReport.isActive) {
      return NextResponse.json({ 
        error: 'Relatório desativado',
        isActive: false 
      }, { status: 403 })
    }

    return NextResponse.json({
      teamName: sharedReport.team.name,
      isActive: sharedReport.isActive,
      enabledReports: sharedReport.enabledReports
    })
  } catch (error) {
    console.error("Erro ao buscar relatório compartilhado:", error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 