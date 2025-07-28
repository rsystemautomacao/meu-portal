import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { cookies } from 'next/headers';

const prismaClient = new PrismaClient();

export async function GET(req: Request) {
  const cookieStore = cookies();
  const adminSession = cookieStore.get('adminSession');
  if (!adminSession || adminSession.value !== 'true') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  let config = await prismaClient.systemConfig.findFirst();
  if (!config) {
    config = await prismaClient.systemConfig.create({
      data: {
        paymentMessage: `Olá! Tudo bem? 👋
Estamos passando para avisar que sua assinatura do Meu Portal está prestes a vencer.

Para continuar aproveitando todos os recursos da plataforma, você precisará renovar manualmente sua assinatura até {vencimento}.
O valor da renovação é de {valor}, e o pagamento pode ser feito por Pix ou cartão através do link abaixo:

🔗 {link}

Se tiver qualquer dúvida ou precisar de ajuda com o pagamento, é só chamar a gente no WhatsApp: (11) 94395-0503.

Obrigado por fazer parte do Meu Portal! 💙`,
        paymentLink: 'https://mpago.li/2YzHBRt',
        welcomeMessage: 'Bem-vindo ao Meu Portal! 🎉',
        monthlyValue: 29.90,
      },
    });
  }
  return NextResponse.json(config);
}

export async function POST(req: Request) {
  const cookieStore = cookies();
  const adminSession = cookieStore.get('adminSession');
  if (!adminSession || adminSession.value !== 'true') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  const body = await req.json();
  let config = await prismaClient.systemConfig.findFirst();
  if (!config) {
    config = await prismaClient.systemConfig.create({
      data: body,
    });
  } else {
    const { id, ...dataToUpdate } = body;
    config = await prismaClient.systemConfig.update({
      where: { id: config.id },
      data: dataToUpdate,
    });
  }
  return NextResponse.json(config);
} 