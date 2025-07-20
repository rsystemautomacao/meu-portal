import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE - Excluir débito histórico
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    // Verificar se o débito existe e pertence ao time
    const historicalDebt = await prisma.historicalDebt.findFirst({
      where: {
        id: params.id,
        teamId: teamUser.teamId
      }
    })

    if (!historicalDebt) {
      return NextResponse.json(
        { error: 'Débito histórico não encontrado' },
        { status: 404 }
      )
    }

    // Excluir débito histórico
    await prisma.historicalDebt.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Débito histórico excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir débito histórico:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir débito histórico' },
      { status: 500 }
    )
  }
} 