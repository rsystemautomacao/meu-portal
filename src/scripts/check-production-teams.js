require('dotenv').config({ path: '.env' })
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkProductionTeams() {
  try {
    console.log('🔍 Verificando times no banco de produção...')
    console.log('🔍 DATABASE_URL:', process.env.DATABASE_URL)
    
    // Buscar todos os times
    const allTeams = await prisma.team.findMany({
      include: {
        users: {
          where: { role: 'owner' },
          include: { user: true }
        }
      }
    })
    
    console.log(`📊 Total de times: ${allTeams.length}`)
    
    allTeams.forEach((team, index) => {
      const owner = team.users[0]?.user
      console.log(`   ${index + 1}. ${team.name} (${team.status}) - Owner: ${owner?.email || 'N/A'} - Criado: ${team.createdAt}`)
    })
    
    // Verificar times ativos
    const activeTeams = await prisma.team.findMany({
      where: { 
        status: 'ACTIVE',
        deletedAt: null
      }
    })
    
    console.log(`\n📊 Times ativos: ${activeTeams.length}`)
    activeTeams.forEach((team, index) => {
      console.log(`   ${index + 1}. ${team.name} - Criado: ${team.createdAt}`)
    })
    
  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkProductionTeams() 