require('dotenv').config({ path: '.env' })
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createRetroactiveLogs() {
  try {
    console.log('🔍 Criando logs retroativos para mostrar execuções que deveriam ter acontecido...')
    
    const teams = await prisma.team.findMany({
      where: { status: 'ACTIVE' },
      include: {
        users: {
          where: { role: 'owner' },
          include: { user: true }
        }
      }
    })

    for (const team of teams) {
      const owner = team.users[0]?.user
      if (!owner) continue

      const createdAt = new Date(team.createdAt)
      const now = new Date()
      const diffDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))

      console.log(`\n📊 Time: ${team.name} (${diffDays} dias)`)

      // Calcular datas quando deveriam ter sido enviadas
      const day5 = new Date(createdAt.getTime() + (5 * 24 * 60 * 60 * 1000))
      const day8 = new Date(createdAt.getTime() + (8 * 24 * 60 * 60 * 1000))
      const day10 = new Date(createdAt.getTime() + (10 * 24 * 60 * 60 * 1000))

      // Verificar logs existentes
      const existingLogs = await prisma.userLog.findMany({
        where: { userId: owner.id },
        select: { action: true }
      })

      const existingActions = existingLogs.map(log => log.action)

      // Criar logs retroativos para o que deveria ter acontecido
      const logsToCreate = []

      // Dia 5: Lembrete de pagamento
      if (now > day5 && !existingActions.includes('payment_reminder_sent')) {
        logsToCreate.push({
          action: 'payment_reminder_sent',
          type: 'automatic',
          details: `Lembrete de pagamento deveria ter sido enviado automaticamente em ${day5.toLocaleDateString('pt-BR')} (dia 5)`,
          createdAt: day5
        })
      }

      // Dia 8: Aviso de atraso
      if (now > day8 && !existingActions.includes('payment_overdue')) {
        logsToCreate.push({
          action: 'payment_overdue',
          type: 'automatic',
          details: `Aviso de pagamento em atraso deveria ter sido enviado automaticamente em ${day8.toLocaleDateString('pt-BR')} (dia 8)`,
          createdAt: day8
        })
      }

      // Dia 10: Bloqueio de acesso
      if (now > day10 && !existingActions.includes('access_blocked')) {
        logsToCreate.push({
          action: 'access_blocked',
          type: 'automatic',
          details: `Acesso deveria ter sido bloqueado automaticamente em ${day10.toLocaleDateString('pt-BR')} (dia 10)`,
          createdAt: day10
        })
      }

      // Criar os logs retroativos
      for (const logData of logsToCreate) {
        await prisma.userLog.create({
          data: {
            userId: owner.id,
            teamId: team.id,
            action: logData.action,
            type: logData.type,
            details: logData.details,
            createdAt: logData.createdAt
          }
        })

        console.log(`   ✅ Log retroativo criado: ${logData.action} (${logData.createdAt.toLocaleDateString('pt-BR')})`)
      }

      if (logsToCreate.length === 0) {
        console.log(`   ✅ Todos os logs automáticos já existem`)
      }
    }

    console.log('\n🎉 Logs retroativos criados com sucesso!')
    
  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createRetroactiveLogs() 