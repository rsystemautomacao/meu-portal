const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testQuery() {
  try {
    console.log('🔍 Testando queries...')
    
    // Teste 1: Buscar todos os times
    const allTeams = await prisma.team.findMany({
      select: { id: true, name: true, deletedAt: true }
    })
    console.log(`📊 Todos os times: ${allTeams.length}`)
    allTeams.forEach(team => {
      console.log(`   - ${team.name} (${team.id}) - Deletado: ${!!team.deletedAt}`)
    })
    
    // Teste 2: Buscar apenas times não deletados
    const activeTeams = await prisma.team.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, deletedAt: true }
    })
    console.log(`✅ Times ativos: ${activeTeams.length}`)
    activeTeams.forEach(team => {
      console.log(`   - ${team.name} (${team.id})`)
    })
    
    // Teste 3: Buscar apenas times deletados
    const deletedTeams = await prisma.team.findMany({
      where: { deletedAt: { not: null } },
      select: { id: true, name: true, deletedAt: true }
    })
    console.log(`🗑️ Times deletados: ${deletedTeams.length}`)
    deletedTeams.forEach(team => {
      console.log(`   - ${team.name} (${team.id}) - Deletado em: ${team.deletedAt}`)
    })

  } catch (error) {
    console.error('❌ Erro no teste:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testQuery() 