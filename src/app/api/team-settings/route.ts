import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getActiveSession } from '@/lib/session'
import { ImageUploadError, uploadImage } from '@/lib/imageUpload'

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
        });

        if (!team) {
            return NextResponse.json({ error: 'Time não encontrado' }, { status: 404 });
        }

        // Time bloqueado: devolve só o status, para o cliente redirecionar sem receber os dados
        if (team.status === 'BLOCKED') {
            return NextResponse.json({ status: 'BLOCKED' });
        }

        // Buscar configuração de mensalidade separadamente
        const monthlyFeeConfig = await prisma.monthlyFeeConfig.findFirst({
            where: { teamId }
        });

        return NextResponse.json({
            ...team,
            monthlyFees: monthlyFeeConfig ? [monthlyFeeConfig] : []
        });
    } catch (error) {
        console.error("Erro ao buscar configurações do time:", error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

// PATCH: Atualizar configurações do time
export async function PATCH(request: NextRequest) {
    const session = await getActiveSession();
    if (!session?.user.id) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    try {
        const teamId = await getTeamId(session.user.id);
        if (!teamId) {
            return NextResponse.json({ error: 'Time não encontrado ou você não é o dono' }, { status: 404 });
        }

        const body = await request.json();
        const { name, primaryColor, secondaryColor, logo, dueDay, whatsapp } = body;

        await prisma.$transaction(async (tx) => {
            await tx.team.update({
                where: { id: teamId },
                data: {
                    name,
                    primaryColor,
                    secondaryColor,
                    logo,
                    whatsapp,
                },
            });

            if (dueDay !== undefined) {
                await tx.monthlyFeeConfig.upsert({
                    where: { teamId },
                    update: { day: dueDay },
                    create: {
                        teamId,
                        day: dueDay,
                        amount: 0, // valor padrão
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

// PUT: Atualizar configurações do time (suporte a FormData)
export async function PUT(request: NextRequest) {
    const session = await getActiveSession();
    if (!session?.user.id) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    try {
        const teamId = await getTeamId(session.user.id);
        if (!teamId) {
            return NextResponse.json({ error: 'Time não encontrado ou você não é o dono' }, { status: 404 });
        }

        const contentType = request.headers.get('content-type');
        
        if (contentType?.includes('multipart/form-data')) {
            // Processar FormData (para upload de logo)
            const formData = await request.formData();
            const name = formData.get('name') as string;
            const whatsapp = formData.get('whatsapp') as string;
            const logoFile = formData.get('logo') as File | null;

            let logoUrl = undefined;
            if (logoFile && logoFile.size > 0) {
                try {
                    logoUrl = (await uploadImage(logoFile, 'team_logos')).secure_url;
                } catch (uploadError) {
                    const message = uploadError instanceof ImageUploadError ? uploadError.message : 'Falha no upload da imagem.';
                    return NextResponse.json({ error: message }, { status: 400 });
                }
            }

            await prisma.team.update({
                where: { id: teamId },
                data: {
                    name,
                    whatsapp,
                    ...(logoUrl && { logo: logoUrl }),
                },
            });
        } else {
            // Processar JSON
            const body = await request.json();
            const { name, primaryColor, secondaryColor, logo, dueDay, whatsapp } = body;

            await prisma.$transaction(async (tx) => {
                await tx.team.update({
                    where: { id: teamId },
                    data: {
                        name,
                        primaryColor,
                        secondaryColor,
                        logo,
                        whatsapp,
                    },
                });

                if (dueDay !== undefined) {
                    await tx.monthlyFeeConfig.upsert({
                        where: { teamId },
                        update: { day: dueDay },
                        create: {
                            teamId,
                            day: dueDay,
                            amount: 0, // valor padrão
                        },
                    });
                }
            });
        }

        return NextResponse.json({ message: 'Configurações atualizadas com sucesso' });
    } catch (error) {
        console.error("Erro ao atualizar configurações do time:", error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

// DELETE: Exclusão permanente mas preserva dados para análise
export async function DELETE(request: NextRequest) {
    const session = await getActiveSession();
    if (!session?.user.id) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    try {
        const teamId = await getTeamId(session.user.id);
        if (!teamId) {
            return NextResponse.json({ error: 'Time não encontrado ou você não é o dono' }, { status: 404 });
        }

        // Buscar dados do time antes de excluir
        const teamData = await prisma.team.findUnique({
            where: { id: teamId },
            select: {
                name: true,
                whatsapp: true,
                createdAt: true,
                primaryColor: true,
                secondaryColor: true
            }
        });

        if (!teamData) {
            return NextResponse.json({ error: 'Time não encontrado' }, { status: 404 });
        }

        // Exclusão permanente em transação
        await prisma.$transaction(async (tx) => {
            // 1. Excluir eventos de partidas
            await tx.matchEvent.deleteMany({
                where: { match: { teamId } }
            });

            // 2. Excluir partidas
            await tx.match.deleteMany({
                where: { teamId }
            });

            // 3. Excluir pagamentos dos jogadores
            const players = await tx.player.findMany({
                where: { teamId },
                select: { id: true }
            });
            
            for (const player of players) {
                await tx.payment.deleteMany({
                    where: { playerId: player.id }
                });
            }

            // 4. Excluir jogadores
            await tx.player.deleteMany({
                where: { teamId }
            });

            // 5. Excluir transações
            await tx.transaction.deleteMany({
                where: { teamId }
            });

            // 6. Excluir configurações de mensalidade
            await tx.monthlyFeeConfig.deleteMany({
                where: { teamId }
            });

            // 7. Excluir exceções de mensalidade
            await tx.monthlyFeeException.deleteMany({
                where: { teamId }
            });

            // 8. Excluir débitos históricos
            await tx.historicalDebt.deleteMany({
                where: { teamId }
            });

            // 9. Excluir notificações
            await tx.notification.deleteMany({
                where: { teamId }
            });

            // 10. Excluir relatórios compartilhados
            await tx.sharedReport.deleteMany({
                where: { teamId }
            });

            // 11. Excluir pagamentos do sistema
            await tx.teamSystemPayment.deleteMany({
                where: { teamId }
            });

            // 12. Excluir relações usuário-time
            await tx.teamUser.deleteMany({
                where: { teamId }
            });

            // 13. Excluir o time
            await tx.team.delete({
                where: { id: teamId }
            });

            // 14. Excluir o usuário (se não estiver em outros times)
            const otherTeams = await tx.teamUser.findMany({
                where: { userId: session.user.id }
            });

            if (otherTeams.length === 0) {
                await tx.user.delete({
                    where: { id: session.user.id }
                });
            }

            // 15. Criar registro de exclusão para análise (temporariamente comentado)
            // await tx.deletedTeamAnalytics.create({
            //     data: {
            //         originalTeamId: teamId,
            //         teamName: teamData.name,
            //         whatsapp: teamData.whatsapp,
            //         primaryColor: teamData.primaryColor,
            //         secondaryColor: teamData.secondaryColor,
            //         teamCreatedAt: teamData.createdAt,
            //         deletedAt: new Date(),
            //         deletedBy: 'CLIENT',
            //         userEmail: session.user.email || 'unknown'
            //     }
            // });
            
            console.log('📊 Dados preservados para análise:', {
                teamName: teamData.name,
                whatsapp: teamData.whatsapp,
                createdAt: teamData.createdAt,
                deletedAt: new Date(),
                userEmail: session.user.email
            });
        });

        return NextResponse.json({ 
            message: 'Conta excluída permanentemente. Email liberado para novo registro.' 
        });
    } catch (error) {
        console.error("Erro ao excluir conta:", error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
} 