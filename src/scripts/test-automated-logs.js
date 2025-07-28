require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testAutomatedLogs() {
  try {
    console.log('🔍 Testando logs automáticos no banco de homologação...')
    console.log('🔍 DATABASE_URL:', process.env.DATABASE_URL)
    
    // Buscar usuário unaspdogs@gmail.com
    const user = await prisma.user.findFirst({
      where: { email: 'unaspdogs@gmail.com' }
    })
    
    if (!user) {
      console.log('❌ Usuário não encontrado')
      return
    }
    
    console.log(`✅ Usuário encontrado: ${user.email} (ID: ${user.id})`)
    
    // Buscar logs automáticos deste usuário
    const automaticLogs = await prisma.userLog.findMany({
      where: { 
        userId: user.id,
        type: 'automatic'
      },
      orderBy: { createdAt: 'desc' }
    })
    
    console.log(`📋 Logs automáticos encontrados: ${automaticLogs.length}`)
    automaticLogs.forEach((log, index) => {
      console.log(`   ${index + 1}. ${log.action} - ${log.details} - ${log.createdAt}`)
    })
    
    // Buscar logs manuais
    const manualLogs = await prisma.userLog.findMany({
      where: { 
        userId: user.id,
        type: 'manual'
      },
      orderBy: { createdAt: 'desc' }
    })
    
    console.log(`\n📋 Logs manuais encontrados: ${manualLogs.length}`)
    manualLogs.forEach((log, index) => {
      console.log(`   ${index + 1}. ${log.action} - ${log.details} - ${log.createdAt}`)
    })
    
    // Verificar se há logs específicos que deveriam existir
    const expectedLogs = [
      'welcome_message_sent',
      'payment_reminder_sent', 
      'payment_overdue',
      'access_blocked'
    ]
    
    console.log('\n🔍 Verificando logs esperados:')
    for (const expectedLog of expectedLogs) {
      const found = await prisma.userLog.findFirst({
        where: {
          userId: user.id,
          action: expectedLog
        }
      })
      
      if (found) {
        console.log(`   ✅ ${expectedLog}: ENCONTRADO`)
      } else {
        console.log(`   ❌ ${expectedLog}: NÃO ENCONTRADO`)
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAutomatedLogs() 