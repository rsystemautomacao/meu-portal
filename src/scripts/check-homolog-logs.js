const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkHomologLogs() {
  try {
    console.log('🔍 Verificando logs no banco de homologação...')
    
    // Verificar se há logs
    const totalLogs = await prisma.userLog.count()
    console.log(`📊 Total de logs: ${totalLogs}`)
    
    if (totalLogs > 0) {
      const recentLogs = await prisma.userLog.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { email: true }
          },
          team: {
            select: { name: true }
          }
        }
      })
      
      console.log('\n📋 Logs mais recentes:')
      recentLogs.forEach((log, index) => {
        console.log(`${index + 1}. ${log.action} (${log.type}) - ${log.user?.email} - ${log.team?.name} - ${log.createdAt}`)
      })
    }
    
    // Verificar usuários
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true }
    })
    
    console.log(`\n👥 Total de usuários: ${users.length}`)
    users.forEach(user => {
      console.log(`   - ${user.email} (${user.name}) - ID: ${user.id}`)
    })
    
    // Verificar times
    const teams = await prisma.team.findMany({
      select: { id: true, name: true, status: true }
    })
    
    console.log(`\n🏆 Total de times: ${teams.length}`)
    teams.forEach(team => {
      console.log(`   - ${team.name} (${team.status}) - ID: ${team.id}`)
    })
    
  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkHomologLogs() 