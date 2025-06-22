import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - Listar jogadores do time
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    console.log('Session:', session)

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Buscar o time do usuário com jogadores e suas exceções de mensalidade
    const teamUser = await prisma.teamUser.findFirst({
      where: {
        userId: session.user.id,
      },
      include: {
        team: {
          include: {
            players: {
              include: {
                feeException: true,
              },
              orderBy: {
                name: 'asc',
              },
            },
          },
        },
      },
    })

    console.log('TeamUser:', teamUser)

    if (!teamUser?.team) {
      return NextResponse.json(
        { message: 'Time não encontrado' },
        { status: 404 }
      )
    }

    // Buscar configuração padrão de mensalidade do time
    const monthlyFeeConfig = await prisma.monthlyFeeConfig.findUnique({
      where: { teamId: teamUser.team.id }
    })

    // Formatar os jogadores para incluir informação de isenção e mensalidade
    const players = teamUser.team.players.map(player => {
      const feeException = player.feeException;
      let monthlyFeeStatus = 'Não definido';
      let monthlyFeeValue = null;

      if (feeException) {
        if (feeException.isExempt) {
          monthlyFeeStatus = 'Isento';
          monthlyFeeValue = 0;
        } else if (feeException.amount !== null) {
          monthlyFeeStatus = `R$ ${feeException.amount.toFixed(2)}`;
          monthlyFeeValue = feeException.amount;
        }
      } else if (monthlyFeeConfig) {
        monthlyFeeStatus = `R$ ${monthlyFeeConfig.amount.toFixed(2)}`;
        monthlyFeeValue = monthlyFeeConfig.amount;
      }

      return {
        ...player,
        isExempt: !!feeException?.isExempt,
        monthlyFee: monthlyFeeValue,
        monthlyFeeStatus
      };
    });

    return NextResponse.json(players)
  } catch (error) {
    console.error('Erro ao listar jogadores:', error)
    return NextResponse.json(
      { message: 'Erro ao listar jogadores' },
      { status: 500 }
    )
  }
}

// Função auxiliar para ajustar o timezone
function adjustDateToUTC(dateString: string | null | undefined): Date | null {
  if (!dateString) return null
  const [year, month, day] = dateString.split('-').map(Number)
  // Criando a data e adicionando um dia
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() + 1)
  return date
}

// POST - Criar novo jogador
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    const data = await req.json()
    const { name, position, birthDate, joinDate, monthlyFee, isExempt, number, status, photoUrl } = data

    // Validações básicas
    if (!name || !position || !number) {
      return NextResponse.json(
        { message: 'Dados incompletos' },
        { status: 400 }
      )
    }

    // Se não for isento, mensalidade é obrigatória
    if (!isExempt && (monthlyFee === undefined || monthlyFee === null || monthlyFee === '')) {
      return NextResponse.json(
        { message: 'Valor da mensalidade é obrigatório quando o jogador não é isento' },
        { status: 400 }
      )
    }

    // Buscar o time do usuário
    const teamUser = await prisma.teamUser.findFirst({
      where: {
        userId: session.user.id,
      },
      include: {
        team: true,
      },
    })

    if (!teamUser?.team) {
      return NextResponse.json(
        { message: 'Time não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o número já está em uso
    const existingPlayer = await prisma.player.findFirst({
      where: {
        teamId: teamUser.team.id,
        number: parseInt(number.toString()),
      },
    })

    if (existingPlayer) {
      return NextResponse.json(
        { message: 'Já existe um jogador com este número' },
        { status: 400 }
      )
    }

    // Criar o jogador
    const player = await prisma.player.create({
      data: {
        name,
        number: parseInt(number.toString()),
        position,
        status: status || 'active',
        photoUrl: photoUrl || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        joinDate: joinDate ? new Date(joinDate) : new Date(),
        teamId: teamUser.team.id,
      },
    })

    let feeException = null;

    // Se o jogador for isento, criar a exceção
    if (isExempt) {
      feeException = await prisma.monthlyFeeException.create({
        data: {
          playerId: player.id,
          isExempt: true,
          amount: 0,
        },
      })
    } else if (monthlyFee) {
      feeException = await prisma.monthlyFeeException.create({
        data: {
          playerId: player.id,
          isExempt: false,
          amount: Number(monthlyFee),
        },
      })
    }

    // Formatar a resposta com os mesmos campos do GET
    const monthlyFeeStatus = feeException
      ? feeException.isExempt
        ? 'Isento'
        : `R$ ${(feeException.amount || 0).toFixed(2)}`
      : 'Não definido';

    const response = {
      ...player,
      feeException,
      isExempt: !!feeException?.isExempt,
      monthlyFee: feeException?.amount || null,
      monthlyFeeStatus
    };

    return NextResponse.json(response)
  } catch (error) {
    console.error('Erro ao criar jogador:', error)
    return NextResponse.json(
      { message: 'Erro ao criar jogador' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar jogador
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    const data = await req.json()
    const { id, birthDate, joinDate, monthlyFee, isExempt, ...playerData } = data

    if (!id) {
      return NextResponse.json(
        { message: 'ID do jogador não fornecido' },
        { status: 400 }
      )
    }

    // Verificar se o jogador pertence ao time do usuário
    const teamUser = await prisma.teamUser.findFirst({
      where: {
        userId: session.user.id,
        role: 'owner'
      },
      include: {
        team: true
      }
    })

    if (!teamUser?.team) {
      return NextResponse.json(
        { message: 'Time não encontrado' },
        { status: 404 }
      )
    }

    const player = await prisma.player.findFirst({
      where: {
        id,
        teamId: teamUser.team.id
      }
    })

    if (!player) {
      return NextResponse.json(
        { message: 'Jogador não encontrado' },
        { status: 404 }
      )
    }

    // Atualizar jogador
    const updatedPlayer = await prisma.player.update({
      where: { id },
      data: {
        ...playerData,
        birthDate: birthDate ? new Date(birthDate) : null,
        joinDate: joinDate ? new Date(joinDate) : null,
      },
      include: {
        feeException: true
      }
    })

    // Atualizar exceção de mensalidade
    let feeException = updatedPlayer.feeException;
    if (isExempt !== undefined || monthlyFee !== undefined) {
      // Deletar exceção existente
      if (feeException) {
        await prisma.monthlyFeeException.delete({
          where: { playerId: id }
        })
      }

      // Criar nova exceção se necessário
      if (isExempt) {
        feeException = await prisma.monthlyFeeException.create({
          data: {
            playerId: id,
            isExempt: true,
            amount: 0
          }
        })
      } else if (monthlyFee !== undefined && monthlyFee !== null) {
        feeException = await prisma.monthlyFeeException.create({
          data: {
            playerId: id,
            isExempt: false,
            amount: Number(monthlyFee)
          }
        })
      }
    }

    // Formatar a resposta
    const monthlyFeeStatus = feeException
      ? feeException.isExempt
        ? 'Isento'
        : `R$ ${(feeException.amount || 0).toFixed(2)}`
      : 'Não definido';

    const response = {
      ...updatedPlayer,
      feeException,
      isExempt: !!feeException?.isExempt,
      monthlyFee: feeException?.amount || null,
      monthlyFeeStatus
    };

    return NextResponse.json(response)
  } catch (error) {
    console.error('Erro ao atualizar jogador:', error)
    return NextResponse.json(
      { message: 'Erro ao atualizar jogador' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir jogador
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const userId = searchParams.get('userId')

    if (!id || !userId) {
      return NextResponse.json(
        { message: 'ID do jogador ou do usuário não fornecido' },
        { status: 400 }
      )
    }

    // Verificar se o jogador pertence ao time do usuário
    const team = await prisma.team.findFirst({
      where: {
        users: {
          some: {
            userId: userId,
            role: 'owner'
          }
        }
      }
    })

    if (!team) {
      return NextResponse.json(
        { message: 'Time não encontrado' },
        { status: 404 }
      )
    }

    const player = await prisma.player.findFirst({
      where: {
        id,
        teamId: team.id
      }
    })

    if (!player) {
      return NextResponse.json(
        { message: 'Jogador não encontrado' },
        { status: 404 }
      )
    }

    // Excluir jogador
    await prisma.player.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Jogador excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir jogador:', error)
    return NextResponse.json(
      { message: 'Erro ao excluir jogador' },
      { status: 500 }
    )
  }
} 