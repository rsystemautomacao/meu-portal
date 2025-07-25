import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'

// PUT - Atualizar status do time
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { action, newPassword, status } = await request.json()
    const teamId = params.id

    const team = await prisma.team.findUnique({ where: { id: teamId } })
    if (!team || (team as any).deletedAt) {
      return NextResponse.json({ error: 'Time não encontrado ou já foi excluído' }, { status: 404 })
    }

    switch (action) {
      case 'toggle-payment':
        // Alternar status de pagamento
        await prisma.team.update({
          where: { id: teamId },
          data: { 
            status: status,
            updatedAt: new Date()
          }
        })
        break

      case 'block':
        // Bloquear time (marcar como bloqueado)
        await prisma.team.update({
          where: { id: teamId },
          data: { 
            status: 'BLOCKED',
            updatedAt: new Date()
          }
        })
        break

      case 'pause':
        // Pausar time (marcar como pausado)
        await prisma.team.update({
          where: { id: teamId },
          data: { 
            status: 'PAUSED',
            updatedAt: new Date()
          }
        })
        break

      case 'activate':
        // Ativar time (marcar como ativo)
        await prisma.team.update({
          where: { id: teamId },
          data: { 
            status: 'ACTIVE',
            updatedAt: new Date()
          }
        })
        break

      case 'reset_password':
        // Resetar senha do usuário principal do time
        if (!newPassword) {
          return NextResponse.json(
            { error: 'Nova senha é obrigatória' },
            { status: 400 }
          )
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10)
        
        // Buscar o usuário principal do time (owner)
        const teamUser = await prisma.teamUser.findFirst({
          where: { 
            teamId,
            role: 'owner'
          },
          include: { user: true }
        })

        if (teamUser) {
          await prisma.user.update({
            where: { id: teamUser.user.id },
            data: { password: hashedPassword }
          })
        }
        break

      default:
        return NextResponse.json(
          { error: 'Ação inválida' },
          { status: 400 }
        )
    }

    return NextResponse.json({ 
      message: 'Time atualizado com sucesso' 
    })
  } catch (error) {
    console.error('Erro ao atualizar time:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar time' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir time
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const teamId = params.id

    const team = await prisma.team.findUnique({ where: { id: teamId } })
    if (!team || (team as any).deletedAt) {
      return NextResponse.json({ error: 'Time não encontrado ou já foi excluído' }, { status: 404 })
    }

    // Excluir todos os dados relacionados ao time
    // Excluir jogadores e pagamentos
    const players = await prisma.player.findMany({ where: { teamId } })
    for (const player of players) {
      await prisma.payment.deleteMany({ where: { playerId: player.id } })
    }
    await prisma.player.deleteMany({ where: { teamId } })
    await prisma.transaction.deleteMany({ where: { teamId } })
    await prisma.matchEvent.deleteMany({ where: { match: { teamId } } })
    await prisma.match.deleteMany({ where: { teamId } })
    await prisma.monthlyFeeException.deleteMany({ where: { teamId } })
    await prisma.monthlyFeeConfig.deleteMany({ where: { teamId } })
    await prisma.historicalDebt.deleteMany({ where: { teamId } })
    await prisma.notification.deleteMany({ where: { teamId } })
    await prisma.teamUser.deleteMany({ where: { teamId } })

    // Excluir o time
    await prisma.team.delete({ where: { id: teamId } })

    // Excluir usuário dono se não estiver em outros times
    const owners = await prisma.teamUser.findMany({ where: { teamId, role: 'owner' }, include: { user: true } })
    for (const owner of owners) {
      const otherTeams = await prisma.teamUser.findMany({ where: { userId: owner.userId, teamId: { not: teamId } } })
      if (otherTeams.length === 0) {
        await prisma.user.delete({ where: { id: owner.userId } })
      }
    }

    return NextResponse.json({ 
      message: 'Time e dados relacionados excluídos com sucesso' 
    })
  } catch (error) {
    console.error('Erro ao excluir time:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir time' },
      { status: 500 }
    )
  }
} 