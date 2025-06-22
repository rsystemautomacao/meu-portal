// Este arquivo foi desabilitado temporariamente
// Há problemas com o Prisma Client não reconhecendo o schema atual
// Será reativado após o deploy funcionar

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

async function getTeamId(userId: string) {
    const teamUser = await prisma.teamUser.findFirst({
        where: { userId, role: 'owner' },
        select: { teamId: true }
    });
    return teamUser?.teamId;
}

// GET: Buscar configurações do time
export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user.id) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    try {
        const teamId = await getTeamId(session.user.id);
        if (!teamId) {
            return NextResponse.json({ error: 'Time não encontrado ou você não é o dono' }, { status: 404 });
        }

        const team = await prisma.team.findUnique({
            where: { id: teamId },
            include: {
                // A relação monthlyFees foi removida e agora é um modelo separado: MonthlyFeeConfig
                monthlyFeeConfig: true,
            },
        });

        if (!team) {
            return NextResponse.json({ error: 'Time não encontrado' }, { status: 404 });
        }

        return NextResponse.json(team);
    } catch (error) {
        console.error("Erro ao buscar configurações do time:", error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

// PATCH: Atualizar configurações do time
export async function PATCH(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user.id) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    try {
        const teamId = await getTeamId(session.user.id);
        if (!teamId) {
            return NextResponse.json({ error: 'Time não encontrado ou você não é o dono' }, { status: 404 });
        }

        const body = await request.json();
        // Renomeado `dueDay` para `day` para corresponder ao schema
        const { name, primaryColor, secondaryColor, logo, day, amount } = body;

        await prisma.$transaction(async (tx) => {
            // Atualizar dados do time
            await tx.team.update({
                where: { id: teamId },
                data: {
                    name,
                    primaryColor,
                    secondaryColor,
                    logo,
                },
            });

            // Atualizar ou criar configuração de mensalidade
            if (day !== undefined && amount !== undefined) {
                await tx.monthlyFeeConfig.upsert({
                    where: { teamId },
                    update: { day, amount },
                    create: {
                        teamId,
                        day,
                        amount,
                    },
                });
            }
        });

        return NextResponse.json({ message: 'Configurações atualizadas com sucesso' });
    } catch (error) {
        console.error("Erro ao atualizar configurações do time:", error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

// DELETE: Excluir o time
export async function DELETE(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user.id) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    try {
        const teamId = await getTeamId(session.user.id);
        if (!teamId) {
            return NextResponse.json({ error: 'Time não encontrado ou você não é o dono' }, { status: 404 });
        }

        // Graças ao onDelete: Cascade, basta deletar o time.
        // O Prisma cuidará de deletar TeamUser, Player, Match, Transaction, etc.
        await prisma.team.delete({
            where: { id: teamId },
        });

        return NextResponse.json({ message: 'Time excluído com sucesso' });
    } catch (error) {
        console.error("Erro ao excluir o time:", error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
} 