const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkProductionLogs() {
  try {
    console.log('🔍 Verificando logs históricos no banco de produção...')
    
    // Buscar usuário unaspdogs@gmail.com no banco de produção
    const user = await prisma.user.findFirst({
      where: { email: 'unaspdogs@gmail.com' }
    })
    
    if (!user) {
      console.log('❌ Usuário não encontrado')
      return
    }
    
    console.log(`✅ Usuário encontrado: ${user.email} (ID: ${user.id})`)
    
    // Buscar todos os logs deste usuário
    const logs = await prisma.userLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        team: {
          select: { name: true }
        }
      }
    })
    
    console.log(`📋 Total de logs: ${logs.length}`)
    
    // Agrupar por tipo de ação
    const actionCounts = {}
    logs.forEach(log => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1
    })
    
    console.log('\n📊 Resumo por tipo de ação:')
    Object.entries(actionCounts).forEach(([action, count]) => {
      console.log(`   - ${action}: ${count} logs`)
    })
    
    // Mostrar logs mais recentes
    console.log('\n📋 Logs mais recentes:')
    logs.slice(0, 10).forEach((log, index) => {
      console.log(`   ${index + 1}. ${log.action} (${log.type}) - ${log.createdAt}`)
    })
    
  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkProductionLogs() 