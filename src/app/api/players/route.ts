import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Listar jogadores
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Buscar o time do usuário
    const teamUser = await prisma.teamUser.findFirst({
      where: {
        userId: session.user.id,
      },
      include: {
        team: {
          include: {
            monthlyFees: true,
          },
        },
      },
    })

    if (!teamUser?.team) {
      return NextResponse.json(
        { message: 'Time não encontrado' },
        { status: 404 }
      )
    }

    // Buscar jogadores com exceções de mensalidade
    const players = await prisma.player.findMany({
      where: {
        teamId: teamUser.team.id,
      },
      include: {
        monthlyFeeExceptions: {
          where: {
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
          },
        },
      },
    })

    const monthlyFeeConfig = teamUser.team.monthlyFees[0]

    // Formatar resposta
    const formattedPlayers = players.map((player) => {
      const feeException = player.monthlyFeeExceptions[0]
      let monthlyFeeStatus = 'Não definido'
      let monthlyFeeValue = 0

      if (feeException) {
        if (feeException.isExempt) {
          monthlyFeeStatus = 'Isento';
          monthlyFeeValue = 0;
        } else {
          // Se não é isento, usa o valor padrão do time
          monthlyFeeStatus = `R$ ${monthlyFeeConfig?.amount.toFixed(2) || '0.00'}`;
          monthlyFeeValue = monthlyFeeConfig?.amount || 0;
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

    return NextResponse.json(formattedPlayers)
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
        team: {
          include: {
            monthlyFees: true,
          },
        },
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
          teamId: teamUser.team.id,
          playerId: player.id,
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          isExempt: true,
        },
      })
    }

    const monthlyFeeConfig = teamUser.team.monthlyFees[0]

    // Formatar a resposta com os mesmos campos do GET
    const monthlyFeeStatus = feeException
      ? feeException.isExempt
        ? 'Isento'
        : `R$ ${(monthlyFeeConfig?.amount || 0).toFixed(2)}`
      : 'Não definido';

    const response = {
      ...player,
      feeException,
      isExempt: !!feeException?.isExempt,
      monthlyFee: feeException?.isExempt ? 0 : (monthlyFeeConfig?.amount || null),
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
        team: {
          include: {
            monthlyFees: true,
          },
        },
      }
    })

    if (!teamUser?.team) {
      return NextResponse.json(
        { message: 'Time não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o jogador existe e pertence ao time
    const existingPlayer = await prisma.player.findFirst({
      where: {
        id,
        teamId: teamUser.team.id,
      },
    })

    if (!existingPlayer) {
      return NextResponse.json(
        { message: 'Jogador não encontrado' },
        { status: 404 }
      )
    }

    // Atualizar o jogador
    const updatedPlayer = await prisma.player.update({
      where: { id },
      data: {
        ...playerData,
        birthDate: birthDate ? new Date(birthDate) : null,
        joinDate: joinDate ? new Date(joinDate) : null,
      },
    })

    // Atualizar ou criar exceção de mensalidade
    let feeException = null;

    if (isExempt !== undefined) {
      // Deletar exceção existente se houver
      await prisma.monthlyFeeException.deleteMany({
        where: {
          playerId: id,
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
        },
      })

      // Criar nova exceção se for isento
      if (isExempt) {
        feeException = await prisma.monthlyFeeException.create({
          data: {
            teamId: teamUser.team.id,
            playerId: id,
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            isExempt: true,
          }
        })
      }
    }

    const monthlyFeeConfig = teamUser.team.monthlyFees[0]

    // Formatar a resposta
    const monthlyFeeStatus = feeException
      ? feeException.isExempt
        ? 'Isento'
        : `R$ ${(monthlyFeeConfig?.amount || 0).toFixed(2)}`
      : 'Não definido';

    const response = {
      ...updatedPlayer,
      feeException,
      isExempt: !!feeException?.isExempt,
      monthlyFee: feeException?.isExempt ? 0 : (monthlyFeeConfig?.amount || null),
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

// DELETE - Deletar jogador
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

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

    // Verificar se o jogador existe e pertence ao time
    const existingPlayer = await prisma.player.findFirst({
      where: {
        id,
        teamId: teamUser.team.id,
      },
    })

    if (!existingPlayer) {
      return NextResponse.json(
        { message: 'Jogador não encontrado' },
        { status: 404 }
      )
    }

    // Deletar o jogador (as exceções serão deletadas automaticamente por cascade)
    await prisma.player.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Jogador deletado com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar jogador:', error)
    return NextResponse.json(
      { message: 'Erro ao deletar jogador' },
      { status: 500 }
    )
  }
} 