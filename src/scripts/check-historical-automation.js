require('dotenv').config({ path: '.env' })
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkHistoricalAutomation() {
  try {
    console.log('🔍 Verificando execuções automáticas históricas...')
    
    const teams = await prisma.team.findMany({
      where: { status: 'ACTIVE' },
      include: {
        users: {
          where: { role: 'owner' },
          include: { user: true }
        }
      }
    })

    console.log(`📊 Analisando ${teams.length} times...`)

    for (const team of teams) {
      const owner = team.users[0]?.user
      if (!owner) continue

      const createdAt = new Date(team.createdAt)
      const now = new Date()
      const diffDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))

      console.log(`\n📊 Time: ${team.name}`)
      console.log(`   - Criado em: ${createdAt.toLocaleDateString('pt-BR')}`)
      console.log(`   - Dias desde criação: ${diffDays}`)

      // Verificar logs existentes
      const existingLogs = await prisma.userLog.findMany({
        where: { userId: owner.id },
        orderBy: { createdAt: 'asc' }
      })

      console.log(`   - Logs existentes: ${existingLogs.length}`)
      existingLogs.forEach(log => {
        console.log(`     * ${log.action} (${log.type}) - ${log.createdAt.toLocaleDateString('pt-BR')}`)
      })

      // Calcular quando deveriam ter sido enviadas as mensagens automáticas
      const day5 = new Date(createdAt.getTime() + (5 * 24 * 60 * 60 * 1000))
      const day8 = new Date(createdAt.getTime() + (8 * 24 * 60 * 60 * 1000))
      const day10 = new Date(createdAt.getTime() + (10 * 24 * 60 * 60 * 1000))

      console.log(`   - Dia 5 deveria ser: ${day5.toLocaleDateString('pt-BR')}`)
      console.log(`   - Dia 8 deveria ser: ${day8.toLocaleDateString('pt-BR')}`)
      console.log(`   - Dia 10 deveria ser: ${day10.toLocaleDateString('pt-BR')}`)

      // Verificar se já passou dos prazos
      const shouldHavePaymentReminder = now > day5
      const shouldHavePaymentOverdue = now > day8
      const shouldHaveAccessBlocked = now > day10

      console.log(`   - Deveria ter lembrete: ${shouldHavePaymentReminder ? 'SIM' : 'NÃO'}`)
      console.log(`   - Deveria ter atraso: ${shouldHavePaymentOverdue ? 'SIM' : 'NÃO'}`)
      console.log(`   - Deveria ter bloqueio: ${shouldHaveAccessBlocked ? 'SIM' : 'NÃO'}`)

      // Verificar se há logs automáticos
      const automaticLogs = existingLogs.filter(log => log.type === 'automatic')
      const hasPaymentReminder = automaticLogs.some(log => log.action === 'payment_reminder_sent')
      const hasPaymentOverdue = automaticLogs.some(log => log.action === 'payment_overdue')
      const hasAccessBlocked = automaticLogs.some(log => log.action === 'access_blocked')

      console.log(`   - Tem log de lembrete: ${hasPaymentReminder ? 'SIM' : 'NÃO'}`)
      console.log(`   - Tem log de atraso: ${hasPaymentOverdue ? 'SIM' : 'NÃO'}`)
      console.log(`   - Tem log de bloqueio: ${hasAccessBlocked ? 'SIM' : 'NÃO'}`)

      // Determinar se o script estava funcionando
      if (shouldHavePaymentReminder && !hasPaymentReminder) {
        console.log(`   ❌ PROBLEMA: Deveria ter lembrete mas não tem log!`)
      }
      if (shouldHavePaymentOverdue && !hasPaymentOverdue) {
        console.log(`   ❌ PROBLEMA: Deveria ter atraso mas não tem log!`)
      }
      if (shouldHaveAccessBlocked && !hasAccessBlocked) {
        console.log(`   ❌ PROBLEMA: Deveria ter bloqueio mas não tem log!`)
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkHistoricalAutomation() 