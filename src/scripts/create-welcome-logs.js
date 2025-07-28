require('dotenv').config({ path: '.env' })
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createWelcomeLogs() {
  try {
    console.log('🔍 Criando logs de mensagem de boas-vindas para times existentes...')
    
    const teams = await prisma.team.findMany({
      where: { status: 'ACTIVE' },
      include: {
        users: {
          where: { role: 'owner' },
          include: { user: true }
        }
      }
    })

    console.log(`📊 Encontrados ${teams.length} times ativos`)

    for (const team of teams) {
      const owner = team.users[0]?.user
      if (!owner) {
        console.log(`⚠️ Time ${team.name} sem owner, pulando...`)
        continue
      }

      // Verificar se já existe log de boas-vindas
      const existingWelcomeLog = await prisma.userLog.findFirst({
        where: {
          userId: owner.id,
          action: 'welcome_message_sent'
        }
      })

      if (existingWelcomeLog) {
        console.log(`⚠️ Log de boas-vindas já existe para ${team.name}, pulando...`)
        continue
      }

      // Criar log de mensagem de boas-vindas
      await prisma.userLog.create({
        data: {
          userId: owner.id,
          teamId: team.id,
          action: 'welcome_message_sent',
          type: 'automatic',
          details: `Mensagem de boas-vindas enviada automaticamente após criação do time "${team.name}"`
        }
      })

      console.log(`✅ Log de boas-vindas criado para ${team.name}`)
    }

    console.log('🎉 Logs de boas-vindas criados com sucesso!')
    
  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createWelcomeLogs() 