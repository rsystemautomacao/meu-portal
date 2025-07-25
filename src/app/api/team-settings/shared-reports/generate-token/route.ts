import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { randomBytes } from 'crypto'

async function getTeamId(userId: string) {
    const teamUser = await prisma.teamUser.findFirst({
        where: { userId, role: 'owner' },
        select: { teamId: true }
    });
    return teamUser?.teamId;
}

// POST: Gerar novo token de compartilhamento
export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user.id) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    try {
        const teamId = await getTeamId(session.user.id);
        if (!teamId) {
            return NextResponse.json({ error: 'Time não encontrado ou você não é o dono' }, { status: 404 });
        }

        // Gerar novo token único
        const newShareToken = randomBytes(16).toString('hex');

        // Verificar se já existe uma configuração para este time
        const existingReport = await prisma.sharedReport.findFirst({
            where: { teamId }
        });

        let sharedReport;
        if (existingReport) {
            // Atualizar token existente
            sharedReport = await prisma.sharedReport.update({
                where: { id: existingReport.id },
                data: {
                    shareToken: newShareToken,
                    updatedAt: new Date()
                }
            });
        } else {
            // Criar nova configuração
            sharedReport = await prisma.sharedReport.create({
                data: {
                    teamId,
                    shareToken: newShareToken,
                    isActive: false,
                    enabledReports: []
                }
            });
        }

        return NextResponse.json({
            shareToken: sharedReport.shareToken
        });
    } catch (error) {
        console.error("Erro ao gerar novo token:", error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
} 