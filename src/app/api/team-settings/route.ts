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
        });

        if (!team) {
            return NextResponse.json({ error: 'Time não encontrado' }, { status: 404 });
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
    const session = await getServerSession(authOptions);
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
            if (logoFile) {
                // Upload da imagem para o backend (API /api/upload)
                const uploadFormData = new FormData();
                uploadFormData.append('file', logoFile);

                const uploadResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/upload`, {
                    method: 'POST',
                    body: uploadFormData,
                });

                if (!uploadResponse.ok) {
                    const errorData = await uploadResponse.json();
                    throw new Error(errorData.message || 'Falha no upload da imagem.');
                }

                const uploadData = await uploadResponse.json();
                logoUrl = uploadData.secure_url;
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

// DELETE: Soft delete do time
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

        // Soft delete: marcar deletedAt
        await (prisma.team as any).update({
            where: { id: teamId },
            data: { deletedAt: new Date() },
        });

        return NextResponse.json({ message: 'Time marcado como excluído (soft delete)' });
    } catch (error) {
        console.error("Erro ao marcar time como excluído:", error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
} 