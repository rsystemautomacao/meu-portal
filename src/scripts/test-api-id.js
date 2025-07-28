const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testApiId() {
  try {
    console.log('🔍 Testando qual ID a API retorna...')
    
    // Buscar o time "Unasp Dogs"
    const team = await prisma.team.findFirst({
      where: { name: 'Unasp Dogs' },
      include: {
        users: {
          where: { role: 'owner' },
          include: {
            user: {
              select: { id: true, email: true, name: true }
            }
          }
        }
      }
    })
    
    if (!team) {
      console.log('❌ Time não encontrado')
      return
    }
    
    console.log(`🏆 Time encontrado: ${team.name} (ID: ${team.id})`)
    
    const owner = team.users[0]?.user
    if (owner) {
      console.log(`👤 Owner: ${owner.email} (ID: ${owner.id})`)
      
      // Simular a consulta da API
      const allUsersWithEmail = await prisma.user.findMany({
        where: { email: owner.email }
      })
      
      console.log(`📊 Usuários encontrados com email ${owner.email}: ${allUsersWithEmail.length}`)
      allUsersWithEmail.forEach((user, index) => {
        console.log(`   ${index + 1}. ID: ${user.id} | Email: ${user.email} | Nome: ${user.name}`)
      })
      
      // Verificar logs para este usuário
      const logs = await prisma.userLog.findMany({
        where: { 
          user: {
            email: owner.email
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 3
      })
      
      console.log(`📋 Logs encontrados: ${logs.length}`)
      logs.forEach((log, index) => {
        console.log(`   ${index + 1}. ${log.action} (${log.type}) - ${log.createdAt}`)
      })
      
    } else {
      console.log('❌ Owner não encontrado')
    }
    
  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testApiId() 