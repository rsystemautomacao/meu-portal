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
        paymentMessage: '',
        paymentLink: '',
        welcomeMessage: '',
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