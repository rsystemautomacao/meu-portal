require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createTestLogsHomolog() {
  try {
    console.log('🔍 Criando logs de teste no banco de homologação...')
    
    // Buscar o usuário no banco de homologação
    const user = await prisma.user.findFirst({
      where: { email: 'unaspdogs@gmail.com' }
    })
    
    if (!user) {
      console.log('❌ Usuário não encontrado')
      return
    }
    
    console.log(`✅ Usuário encontrado: ${user.email} (ID: ${user.id})`)
    
    // Buscar o time
    const team = await prisma.team.findFirst({
      where: { name: 'Unasp Dogs' }
    })
    
    if (!team) {
      console.log('❌ Time não encontrado')
      return
    }
    
    console.log(`✅ Time encontrado: ${team.name} (ID: ${team.id})`)
    
    // Criar logs de teste
    const testLogs = [
      { action: 'admin_block', type: 'manual', details: 'Teste de bloqueio' },
      { action: 'admin_activate', type: 'manual', details: 'Teste de ativação' },
      { action: 'manual_message_sent', type: 'manual', details: 'Teste de mensagem' },
      { action: 'payment_reminder_sent', type: 'automatic', details: 'Teste de lembrete' },
      { action: 'access_blocked', type: 'automatic', details: 'Teste de bloqueio automático' }
    ]
    
    for (const logData of testLogs) {
      const log = await prisma.userLog.create({
        data: {
          userId: user.id,
          teamId: team.id,
          action: logData.action,
          type: logData.type,
          details: logData.details
        }
      })
      
      console.log(`✅ Log criado: ${log.action} (${log.type})`)
    }
    
    console.log('🎉 Logs de teste criados com sucesso!')
    
  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestLogsHomolog() 