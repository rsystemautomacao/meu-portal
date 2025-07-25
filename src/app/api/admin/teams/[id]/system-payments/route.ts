import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Listar mensalidades do sistema para o time/ano
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const url = new URL(request.url);
    const year = Number(url.searchParams.get('year')) || new Date().getFullYear();
    const teamId = params.id;
    const payments = await prisma.teamSystemPayment.findMany({
      where: { teamId, year },
      orderBy: { month: 'asc' },
    });
    return NextResponse.json({ payments });
  } catch (error) {
    console.error('Erro ao buscar mensalidades do sistema:', error);
    return NextResponse.json({ error: 'Erro ao buscar mensalidades do sistema' }, { status: 500 });
  }
}

// POST - Gerar mensalidade do sistema para o time/mês/ano atual
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { year, amount, month } = await request.json();
    const teamId = params.id;
    // Se não vier o mês, usar o mês atual
    const now = new Date();
    const currentMonth = month || (now.getMonth() + 1);
    const currentYear = year || now.getFullYear();
    // Verificar se já existe
    const exists = await prisma.teamSystemPayment.findFirst({ where: { teamId, month: currentMonth, year: currentYear } });
    if (!exists) {
      await prisma.teamSystemPayment.create({
        data: {
          teamId,
          month: currentMonth,
          year: currentYear,
          amount,
          status: 'pending',
        }
      });
      return NextResponse.json({ message: 'Mensalidade do sistema gerada', month: currentMonth, year: currentYear });
    } else {
      return NextResponse.json({ message: 'Mensalidade já existe para este mês/ano', month: currentMonth, year: currentYear });
    }
  } catch (error) {
    console.error('Erro ao gerar mensalidade do sistema:', error);
    return NextResponse.json({ error: 'Erro ao gerar mensalidade do sistema' }, { status: 500 });
  }
} 