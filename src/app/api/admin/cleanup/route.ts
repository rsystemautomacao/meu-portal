import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { scope } = await request.json()
    let message = ''

    switch (scope) {
      case 'all':
        await prisma.matchEvent.deleteMany({});
        await prisma.payment.deleteMany({});
        await prisma.transaction.deleteMany({});
        await prisma.match.deleteMany({});
        await prisma.monthlyFeeException.deleteMany({});
        await prisma.monthlyFeeConfig.deleteMany({});
        await prisma.player.deleteMany({});
        await prisma.teamUser.deleteMany({});
        await prisma.team.deleteMany({});
        await prisma.user.deleteMany({});
        message = 'Todos os dados foram excluídos com sucesso.';
        break;

      case 'matches':
        await prisma.matchEvent.deleteMany({});
        await prisma.match.deleteMany({});
        message = 'Todos os dados de partidas foram excluídos.';
        break;

      case 'transactions':
        await prisma.payment.deleteMany({});
        await prisma.transaction.deleteMany({});
        message = 'Todos os dados de transações e pagamentos foram excluídos.';
        break;

      default:
        return NextResponse.json({ error: 'Escopo de limpeza inválido' }, { status: 400 });
    }

    return NextResponse.json({ message });
    
  } catch (error) {
    console.error('Erro ao limpar o banco de dados:', error)
    return NextResponse.json(
      { error: 'Ocorreu um erro ao limpar o banco de dados' },
      { status: 500 }
    )
  }
} 