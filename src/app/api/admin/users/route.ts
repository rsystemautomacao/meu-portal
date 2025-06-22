import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { User, Team } from '@prisma/client'

interface TeamUser {
  id: string
  teamId: string
  userId: string
  role: string
  team: Team
  createdAt: Date
  updatedAt: Date
}

interface UserWithTeams extends User {
  teams: TeamUser[]
}

export async function GET() {
  try {
    // Verificar se o usuário está autenticado
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    const users = await prisma.user.findMany({
      include: {
        teams: {
          include: {
            team: true
          }
        }
      }
    }) as UserWithTeams[]

    // Transformar os dados para o formato esperado pelo frontend
    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name || '',
      email: user.email || '',
      createdAt: user.createdAt?.toISOString(),
      ownedTeams: user.teams
        .filter(teamUser => teamUser.role === 'owner')
        .map(teamUser => ({
          id: teamUser.team.id,
          name: teamUser.team.name
        }))
    }))

    return NextResponse.json(formattedUsers)
  } catch (error) {
    console.error('Erro ao listar usuários:', error)
    return NextResponse.json([], { status: 200 }) // Retorna array vazio em caso de erro
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { email } = await req.json()

    // Primeiro, encontrar o usuário
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        teams: {
          include: {
            team: true
          }
        }
      }
    }) as UserWithTeams | null

    if (!user) {
      return NextResponse.json(
        { message: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Excluir os times que o usuário é dono
    for (const teamUser of user.teams) {
      if (teamUser.role === 'owner') {
        // Deletar dados relacionados ao time antes de deletar o time
        await prisma.$transaction([
          // Deleta MatchStats e MatchSheet que dependem de Match
          prisma.matchStats.deleteMany({ where: { match: { teamId: teamUser.team.id } } }),
          prisma.matchSheet.deleteMany({ where: { match: { teamId: teamUser.team.id } } }),
          // Agora deleta Match
          prisma.match.deleteMany({ where: { teamId: teamUser.team.id } }),
          // Deleta dados restantes
          prisma.transaction.deleteMany({ where: { teamId: teamUser.team.id } }),
          prisma.monthlyFeeConfig.deleteMany({ where: { teamId: teamUser.team.id } }),
          prisma.player.deleteMany({ where: { teamId: teamUser.team.id } }),
          prisma.teamUser.deleteMany({ where: { teamId: teamUser.team.id } }),
          prisma.team.delete({ where: { id: teamUser.team.id } })
        ]);
      }
    }

    // Finalmente, excluir as associações restantes do usuário e o próprio usuário
    await prisma.teamUser.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({
      where: { email }
    });

    return NextResponse.json(
      { message: 'Usuário e times excluídos com sucesso' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro ao excluir usuário:', error)
    return NextResponse.json(
      { message: 'Erro ao excluir usuário' },
      { status: 500 }
    )
  }
} 