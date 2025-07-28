require('dotenv').config({ path: '.env' })
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkTeamStatus() {
  try {
    console.log('🔍 Verificando status detalhado dos times...')
    
    // Buscar todos os times com detalhes
    const teams = await prisma.team.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true
      }
    })
    
    console.log(`📊 Total de times: ${teams.length}`)
    
    teams.forEach((team, index) => {
      console.log(`   ${index + 1}. ${team.name}`)
      console.log(`      - Status: ${team.status}`)
      console.log(`      - DeletedAt: ${team.deletedAt || 'null'}`)
      console.log(`      - Criado: ${team.createdAt}`)
      console.log(`      - Atualizado: ${team.updatedAt}`)
      console.log('')
    })
    
    // Verificar times sem deletedAt
    const nonDeletedTeams = await prisma.team.findMany({
      where: { deletedAt: null }
    })
    
    console.log(`📊 Times não deletados: ${nonDeletedTeams.length}`)
    nonDeletedTeams.forEach((team, index) => {
      console.log(`   ${index + 1}. ${team.name} (${team.status})`)
    })
    
  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkTeamStatus() 