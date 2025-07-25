import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const url = new URL(request.url);
    const year = Number(url.searchParams.get('year')) || new Date().getFullYear();
    const teamId = params.id;
    // Buscar todos os pagamentos do time no ano
    const payments = await prisma.payment.findMany({
      where: {
        player: { team: { id: teamId } },
        year,
      },
      select: {
        id: true,
        month: true,
        year: true,
        status: true,
        amount: true,
      },
      orderBy: { month: 'asc' },
    });
    return NextResponse.json({ payments });
  } catch (error) {
    console.error('Erro ao buscar pagamentos:', error);
    return NextResponse.json({ error: 'Erro ao buscar pagamentos' }, { status: 500 });
  }
}

// POST - Gerar mensalidades do ano para todos os jogadores ativos do time
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { year } = await request.json();
    const teamId = params.id;
    // Buscar jogadores ativos do time
    const players = await prisma.player.findMany({ where: { teamId, status: 'ACTIVE' } });
    // Buscar configuração de mensalidade
    const config = await prisma.monthlyFeeConfig.findUnique({ where: { teamId } });
    if (!config) {
      return NextResponse.json({ error: 'Configuração de mensalidade não encontrada' }, { status: 400 });
    }
    const paymentsToCreate = [];
    for (let month = 1; month <= 12; month++) {
      for (const player of players) {
        // Verificar se já existe pagamento
        const exists = await prisma.payment.findFirst({
          where: { playerId: player.id, month, year }
        });
        if (!exists) {
          paymentsToCreate.push({
            playerId: player.id,
            month,
            year,
            amount: config.amount,
            paid: false,
            dueDate: new Date(year, month - 1, config.day),
            status: 'pending',
          });
        }
      }
    }
    // Criar pagamentos em lote
    if (paymentsToCreate.length > 0) {
      await prisma.payment.createMany({ data: paymentsToCreate });
    }
    return NextResponse.json({ message: 'Mensalidades geradas com sucesso', count: paymentsToCreate.length });
  } catch (error) {
    console.error('Erro ao gerar mensalidades:', error);
    return NextResponse.json({ error: 'Erro ao gerar mensalidades' }, { status: 500 });
  }
} 