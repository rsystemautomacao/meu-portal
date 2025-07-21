import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'

// PUT - Atualizar status do time
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { action, newPassword } = await request.json()
    const teamId = params.id

    switch (action) {
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

    // Excluir time e todos os dados relacionados (cascade)
    await prisma.team.delete({
      where: { id: teamId }
    })

    return NextResponse.json({ 
      message: 'Time excluído com sucesso' 
    })
  } catch (error) {
    console.error('Erro ao excluir time:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir time' },
      { status: 500 }
    )
  }
} 