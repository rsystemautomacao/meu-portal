require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createAutomatedLogs() {
  try {
    console.log('🔍 Criando logs automáticos simulados...')
    
    // Buscar usuário e time
    const user = await prisma.user.findFirst({
      where: { email: 'unaspdogs@gmail.com' }
    })
    
    if (!user) {
      console.log('❌ Usuário não encontrado')
      return
    }
    
    const team = await prisma.team.findFirst({
      where: { name: 'Unasp Dogs' }
    })
    
    if (!team) {
      console.log('❌ Time não encontrado')
      return
    }
    
    console.log(`✅ Usuário: ${user.email} (ID: ${user.id})`)
    console.log(`✅ Time: ${team.name} (ID: ${team.id})`)
    
    // Criar logs automáticos que deveriam existir
    const automatedLogs = [
      {
        action: 'welcome_message_sent',
        type: 'automatic',
        details: 'Mensagem de boas-vindas enviada automaticamente após criação do time'
      },
      {
        action: 'payment_reminder_sent',
        type: 'automatic', 
        details: 'Lembrete de pagamento enviado automaticamente no 5º dia após criação'
      },
      {
        action: 'payment_overdue',
        type: 'automatic',
        details: 'Aviso de pagamento em atraso enviado automaticamente no 8º dia'
      },
      {
        action: 'access_blocked',
        type: 'automatic',
        details: 'Acesso bloqueado automaticamente no 10º dia por falta de pagamento'
      }
    ]
    
    for (const logData of automatedLogs) {
      // Verificar se já existe
      const existingLog = await prisma.userLog.findFirst({
        where: {
          userId: user.id,
          action: logData.action
        }
      })
      
      if (existingLog) {
        console.log(`⚠️ Log ${logData.action} já existe, pulando...`)
        continue
      }
      
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
    
    console.log('🎉 Logs automáticos criados com sucesso!')
    
  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAutomatedLogs() 