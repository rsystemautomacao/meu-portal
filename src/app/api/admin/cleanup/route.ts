import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    // Verificar se o usuário está autenticado
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se o usuário é admin
    if (!session.user.isAdmin) {
      return NextResponse.json(
        { message: 'Acesso negado. Apenas administradores podem executar limpezas.' },
        { status: 403 }
      )
    }

    const { type } = await req.json()

    switch (type) {
      case 'all':
        // A ordem de exclusão é importante para evitar erros de constraint
        await prisma.matchStats.deleteMany({});
        await prisma.matchSheet.deleteMany({});
        await prisma.match.deleteMany({});
        await prisma.monthlyFeeException.deleteMany({});
        await prisma.payment.deleteMany({});
        await prisma.transaction.deleteMany({});
        await prisma.monthlyFeeConfig.deleteMany({});
        await prisma.player.deleteMany({});
        await prisma.teamUser.deleteMany({});
        await prisma.team.deleteMany({});
        await prisma.user.deleteMany({});
        break

      case 'test-users':
        // Limpar usuários de teste (emails específicos)
        const testEmails = [
          'test@example.com',
          'admin@test.com',
          'user@test.com',
          'richard_espanhol@hotmail.com'
        ]
        
        for (const email of testEmails) {
          const user = await prisma.user.findUnique({
            where: { email },
            include: {
              teams: {
                include: {
                  team: true
                }
              }
            }
          })

          if (user) {
            // Excluir times do usuário
            for (const teamUser of user.teams) {
              if (teamUser.role === 'owner') {
                await prisma.team.delete({
                  where: { id: teamUser.team.id }
                })
              }
            }
            
            // Excluir usuário
            await prisma.user.delete({
              where: { email }
            })
          }
        }
        break

      case 'transactions':
        // Limpar transações
        await prisma.transaction.deleteMany()
        break

      case 'players':
        // Limpar jogadores
        await prisma.player.deleteMany()
        break

      case 'teams':
        // Limpar times e jogadores e tudo relacionado
        await prisma.matchStats.deleteMany({});
        await prisma.matchSheet.deleteMany({});
        await prisma.match.deleteMany({});
        await prisma.monthlyFeeException.deleteMany({});
        await prisma.payment.deleteMany({});
        await prisma.transaction.deleteMany({});
        await prisma.monthlyFeeConfig.deleteMany({});
        await prisma.player.deleteMany({});
        await prisma.teamUser.deleteMany({});
        await prisma.team.deleteMany({});
        break

      default:
        return NextResponse.json(
          { message: 'Tipo de limpeza inválido' },
          { status: 400 }
        )
    }

    return NextResponse.json(
      { message: `Limpeza de ${type} executada com sucesso` },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro ao executar limpeza:', error)
    return NextResponse.json(
      { message: 'Erro ao executar limpeza' },
      { status: 500 }
    )
  }
} 