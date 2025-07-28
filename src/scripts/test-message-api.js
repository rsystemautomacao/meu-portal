require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testMessageAPI() {
  try {
    console.log('🧪 Testando API de mensagens...')
    
    // Buscar um time para teste
    const team = await prisma.team.findFirst({
      where: { status: 'ACTIVE' },
      include: {
        users: {
          include: { user: true }
        }
      }
    })

    if (!team) {
      console.log('❌ Nenhum time encontrado para teste')
      return
    }

    console.log(`✅ Time encontrado: ${team.name} (ID: ${team.id})`)
    console.log(`👥 Usuários: ${team.users.length}`)

    // Simular dados da requisição
    const requestData = {
      messageType: 'custom',
      customMessage: 'Mensagem de teste - ' + new Date().toLocaleString()
    }

    console.log('📋 Dados da requisição:', requestData)

    // Buscar configurações do sistema
    const systemConfig = await prisma.systemConfig.findFirst()
    if (!systemConfig) {
      console.log('❌ Configurações do sistema não encontradas')
      return
    }

    console.log('✅ Configurações encontradas')

    // Simular o processamento da API
    let messageContent = requestData.customMessage
    let messageDetails = 'Mensagem personalizada enviada'

    // Substituir variáveis
    const currentDate = new Date()
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    
    messageContent = messageContent
      .replace(/{vencimento}/g, nextMonth.toLocaleDateString('pt-BR'))
      .replace(/{valor}/g, `R$ ${systemConfig.monthlyValue.toFixed(2)}`)
      .replace(/{link}/g, systemConfig.paymentLink)
      .replace(/{team}/g, team.name)

    console.log('📝 Mensagem processada:', messageContent)

    // Simular envio para cada usuário
    const results = []
    for (const teamUser of team.users) {
      console.log(`📱 Simulando envio para ${teamUser.user.email}`)
      
      // Criar log manual
      await prisma.userLog.create({
        data: {
          userId: teamUser.user.id,
          teamId: team.id,
          action: 'manual_message_sent',
          type: 'manual',
          details: `${messageDetails} pelo admin: ${messageContent.substring(0, 100)}...`
        }
      })

      results.push({
        userId: teamUser.user.id,
        email: teamUser.user.email,
        success: true
      })

      console.log(`✅ Log criado para ${teamUser.user.email}`)
    }

    console.log('🎉 Teste concluído!')
    console.log('📊 Resultados:', results)

  } catch (error) {
    console.error('❌ Erro no teste:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testMessageAPI() 