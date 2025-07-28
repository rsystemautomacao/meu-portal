require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkHomologUsers() {
  try {
    console.log('🔍 Verificando usuários no banco de homologação...')
    console.log('🔍 DATABASE_URL:', process.env.DATABASE_URL)
    
    // Verificar usuários
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true }
    })
    
    console.log(`👥 Total de usuários: ${users.length}`)
    users.forEach(user => {
      console.log(`   - ${user.email} (${user.name}) - ID: ${user.id}`)
    })
    
    // Verificar times
    const teams = await prisma.team.findMany({
      select: { id: true, name: true, status: true }
    })
    
    console.log(`\n🏆 Total de times: ${teams.length}`)
    teams.forEach(team => {
      console.log(`   - ${team.name} (${team.status}) - ID: ${team.id}`)
    })
    
    // Verificar logs
    const logs = await prisma.userLog.count()
    console.log(`\n📋 Total de logs: ${logs}`)
    
  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkHomologUsers() 