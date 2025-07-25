import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const paymentId = params.id;
    const { status } = await request.json();
    const payment = await prisma.teamSystemPayment.update({
      where: { id: paymentId },
      data: { status },
    });
    return NextResponse.json({ payment });
  } catch (error) {
    console.error('Erro ao atualizar mensalidade do sistema:', error);
    return NextResponse.json({ error: 'Erro ao atualizar mensalidade do sistema' }, { status: 500 });
  }
} 