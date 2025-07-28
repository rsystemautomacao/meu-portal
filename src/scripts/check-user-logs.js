const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkUserLogs() {
  try {
    console.log('🔍 Verificando logs do usuário unaspdogs@gmail.com...')
    
    const userId = '687e5b9e1be28a4226ceaa7f'
    const userEmail = 'unaspdogs@gmail.com'
    
    // Verificar logs por userId
    const logsByUserId = await prisma.userLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5
    })
    
    console.log(`📋 Logs por userId (${userId}): ${logsByUserId.length}`)
    logsByUserId.forEach((log, index) => {
      console.log(`   ${index + 1}. ${log.action} (${log.type}) - ${log.createdAt}`)
    })
    
    // Verificar logs por email
    const logsByEmail = await prisma.userLog.findMany({
      where: { 
        user: {
          email: userEmail
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })
    
    console.log(`📋 Logs por email (${userEmail}): ${logsByEmail.length}`)
    logsByEmail.forEach((log, index) => {
      console.log(`   ${index + 1}. ${log.action} (${log.type}) - ${log.createdAt}`)
    })
    
    // Verificar todos os logs
    const allLogs = await prisma.userLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: {
          select: { email: true, id: true }
        }
      }
    })
    
    console.log(`\n📋 Todos os logs (últimos 10):`)
    allLogs.forEach((log, index) => {
      console.log(`   ${index + 1}. ${log.action} (${log.type}) - ${log.user?.email} (${log.user?.id}) - ${log.createdAt}`)
    })
    
  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUserLogs() 