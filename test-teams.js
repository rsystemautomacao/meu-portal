const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testTeams() {
  try {
    console.log('🔍 Verificando times no banco...')
    
    // Buscar todos os times
    const teams = await prisma.team.findMany({
      include: {
        users: {
          include: {
            user: true
          }
        },
        players: true,
        transactions: {
          where: {
            type: 'income'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`📊 Total de times encontrados: ${teams.length}`)
    
    teams.forEach((team, index) => {
      console.log(`\n${index + 1}. Time: ${team.name}`)
      console.log(`   ID: ${team.id}`)
      console.log(`   Status: ${team.status}`)
      console.log(`   Criado em: ${team.createdAt}`)
      console.log(`   Usuários: ${team.users.length}`)
      console.log(`   Jogadores: ${team.players.length}`)
      console.log(`   WhatsApp: ${team.whatsapp || 'Não informado'}`)
      console.log(`   Deletado: ${team.deletedAt ? 'Sim' : 'Não'}`)
    })

    // Verificar se há times recentes (últimas 24h)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    const recentTeams = teams.filter(team => team.createdAt > yesterday)
    console.log(`\n🕐 Times criados nas últimas 24h: ${recentTeams.length}`)
    
    recentTeams.forEach(team => {
      console.log(`   - ${team.name} (${team.createdAt})`)
    })

  } catch (error) {
    console.error('❌ Erro ao testar times:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testTeams() 