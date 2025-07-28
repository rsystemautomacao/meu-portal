const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createUserLog({ userId, teamId, action, type, details }) {
  try {
    const log = await prisma.userLog.create({
      data: {
        userId,
        teamId,
        action,
        type,
        details
      }
    })
    console.log(`📝 Log criado: ${action}`)
    return log
  } catch (error) {
    console.error(`❌ Erro ao criar log ${action}:`, error)
    return null
  }
}

async function testAutomatedFlow() {
  try {
    console.log('🧪 Testando fluxo automatizado...')

    // Verificar se há times
    const allTeams = await prisma.team.findMany()
    console.log(`📊 Total de times no banco: ${allTeams.length}`)

    const activeTeams = await prisma.team.findMany({
      where: { deletedAt: null }
    })
    console.log(`📊 Times não deletados: ${activeTeams.length}`)

    // Buscar um time para testar
    const team = await prisma.team.findFirst({
      include: {
        users: {
          where: { role: 'owner' },
          include: { user: true }
        }
      }
    })

    if (!team) {
      console.log('❌ Nenhum time encontrado para teste')
      return
    }

    const owner = team.users[0]?.user
    if (!owner) {
      console.log('❌ Time sem owner encontrado')
      return
    }

    console.log(`📝 Testando com time: ${team.name} (Usuário: ${owner.email})`)

    // Simular diferentes cenários
    const testScenarios = [
      {
        name: 'Lembrete de Pagamento',
        action: () => createUserLog({
          userId: owner.id,
          teamId: team.id,
          action: 'payment_reminder_sent',
          type: 'automatic',
          details: `Teste: Lembrete de pagamento enviado para ${team.name}`
        })
      },
      {
        name: 'Pagamento em Atraso',
        action: () => createUserLog({
          userId: owner.id,
          teamId: team.id,
          action: 'payment_overdue',
          type: 'automatic',
          details: `Teste: Pagamento em atraso detectado para ${team.name}`
        })
      },
      {
        name: 'Acesso Bloqueado',
        action: () => createUserLog({
          userId: owner.id,
          teamId: team.id,
          action: 'access_blocked',
          type: 'automatic',
          details: `Teste: Acesso bloqueado por inadimplência - ${team.name}`
        })
      }
    ]

    for (const scenario of testScenarios) {
      console.log(`🔄 Executando: ${scenario.name}`)
      await scenario.action()
      console.log(`✅ ${scenario.name} executado`)
    }

    console.log('🎉 Teste do fluxo automatizado concluído!')
    console.log('📊 Verifique os logs na interface do admin')

  } catch (error) {
    console.error('❌ Erro no teste:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Executar o teste
testAutomatedFlow() 