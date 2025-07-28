const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function populateHistoricalLogs() {
  try {
    console.log('🔍 Iniciando população de logs históricos...')

    // Buscar todos os times
    const teams = await prisma.team.findMany({
      include: {
        users: {
          include: {
            user: true
          }
        }
      }
    })

    console.log(`📊 Encontrados ${teams.length} times`)

    for (const team of teams) {
      const owner = team.users.find(tu => tu.role === 'owner')
      if (!owner) continue

      const userId = owner.userId
      const teamId = team.id

      console.log(`📝 Processando time: ${team.name} (Usuário: ${owner.user.email})`)

      // 1. Log de criação do time
      await createLogIfNotExists({
        userId,
        teamId,
        action: 'team_created',
        type: 'automatic',
        details: `Time "${team.name}" criado`,
        createdAt: team.createdAt
      })

      // 2. Log de último acesso (se existir)
      if (team.lastAccess) {
        await createLogIfNotExists({
          userId,
          teamId,
          action: 'last_access',
          type: 'automatic',
          details: `Último acesso registrado`,
          createdAt: team.lastAccess
        })
      }

      // 3. Logs baseados em status do time
      if (team.status === 'BLOCKED') {
        await createLogIfNotExists({
          userId,
          teamId,
          action: 'access_blocked',
          type: 'automatic',
          details: 'Acesso bloqueado por inadimplência',
          createdAt: team.updatedAt
        })
      }

      // 4. Logs baseados em pagamentos
      const payments = await prisma.payment.findMany({
        where: {
          player: {
            teamId: teamId
          }
        },
        include: {
          player: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      for (const payment of payments) {
        await createLogIfNotExists({
          userId,
          teamId,
          action: 'payment_received',
          type: 'manual',
          details: `Pagamento de R$ ${payment.amount.toFixed(2)} registrado para ${payment.player.name}`,
          createdAt: payment.createdAt
        })
      }

      // 5. Logs baseados em transações
      const transactions = await prisma.transaction.findMany({
        where: { teamId },
        orderBy: { createdAt: 'desc' }
      })

      for (const transaction of transactions) {
        await createLogIfNotExists({
          userId,
          teamId,
          action: 'transaction_created',
          type: 'manual',
          details: `${transaction.type === 'income' ? 'Receita' : 'Despesa'} de R$ ${transaction.amount.toFixed(2)}: ${transaction.description}`,
          createdAt: transaction.createdAt
        })
      }

      // 6. Logs baseados em partidas
      const matches = await prisma.match.findMany({
        where: { teamId },
        orderBy: { createdAt: 'desc' }
      })

      for (const match of matches) {
        await createLogIfNotExists({
          userId,
          teamId,
          action: 'match_created',
          type: 'manual',
          details: `Partida vs ${match.opponent} criada`,
          createdAt: match.createdAt
        })
      }

      console.log(`✅ Time ${team.name} processado`)
    }

    console.log('🎉 População de logs históricos concluída!')
  } catch (error) {
    console.error('❌ Erro ao popular logs históricos:', error)
  } finally {
    await prisma.$disconnect()
  }
}

async function createLogIfNotExists(logData) {
  try {
    // Verificar se já existe um log similar
    const existingLog = await prisma.userLog.findFirst({
      where: {
        userId: logData.userId,
        action: logData.action,
        createdAt: {
          gte: new Date(logData.createdAt.getTime() - 60000), // 1 minuto antes
          lte: new Date(logData.createdAt.getTime() + 60000)  // 1 minuto depois
        }
      }
    })

    if (!existingLog) {
      await prisma.userLog.create({
        data: logData
      })
      console.log(`  📝 Log criado: ${logData.action}`)
    } else {
      console.log(`  ⏭️ Log já existe: ${logData.action}`)
    }
  } catch (error) {
    console.error(`  ❌ Erro ao criar log ${logData.action}:`, error)
  }
}

// Executar o script
populateHistoricalLogs() 