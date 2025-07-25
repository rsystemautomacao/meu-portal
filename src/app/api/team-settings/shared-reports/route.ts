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

// GET: Buscar configuração de relatórios compartilháveis
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

        const sharedReport = await prisma.sharedReport.findFirst({
            where: { teamId }
        });

        if (!sharedReport) {
            return NextResponse.json({ error: 'Configuração não encontrada' }, { status: 404 });
        }

        return NextResponse.json({
            id: sharedReport.id,
            shareToken: sharedReport.shareToken,
            isActive: sharedReport.isActive,
            enabledReports: sharedReport.enabledReports
        });
    } catch (error) {
        console.error("Erro ao buscar configuração de relatórios compartilháveis:", error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

// POST: Criar ou atualizar configuração de relatórios compartilháveis
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

        const body = await request.json();
        const { isActive, enabledReports } = body;

        // Gerar token único se não existir
        let shareToken = body.shareToken;
        if (!shareToken) {
            shareToken = randomBytes(16).toString('hex');
        }

        // Verificar se já existe uma configuração para este time
        const existingReport = await prisma.sharedReport.findFirst({
            where: { teamId }
        });

        let sharedReport;
        if (existingReport) {
            // Atualizar configuração existente
            sharedReport = await prisma.sharedReport.update({
                where: { id: existingReport.id },
                data: {
                    isActive,
                    enabledReports,
                    shareToken,
                    updatedAt: new Date()
                }
            });
        } else {
            // Criar nova configuração
            sharedReport = await prisma.sharedReport.create({
                data: {
                    teamId,
                    shareToken,
                    isActive,
                    enabledReports
                }
            });
        }

        return NextResponse.json({
            id: sharedReport.id,
            shareToken: sharedReport.shareToken,
            isActive: sharedReport.isActive,
            enabledReports: sharedReport.enabledReports
        });
    } catch (error) {
        console.error("Erro ao salvar configuração de relatórios compartilháveis:", error);
        return NextResponse.json({ 
            error: 'Erro interno do servidor',
            details: error instanceof Error ? error.message : 'Erro desconhecido'
        }, { status: 500 });
    }
} 