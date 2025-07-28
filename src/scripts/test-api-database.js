const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testApiDatabase() {
  try {
    console.log('🔍 Testando conexão da API com o banco...')
    
    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: '687e5b9e1be28a4226ceaa7f' }
    })
    
    if (user) {
      console.log(`✅ Usuário encontrado: ${user.email}`)
      
      // Verificar logs
      const logs = await prisma.userLog.findMany({
        where: { userId: user.id },
        take: 3
      })
      
      console.log(`📋 Logs encontrados: ${logs.length}`)
      logs.forEach((log, index) => {
        console.log(`   ${index + 1}. ${log.action} (${log.type})`)
      })
      
    } else {
      console.log('❌ Usuário não encontrado')
      
      // Listar todos os usuários
      const allUsers = await prisma.user.findMany({
        select: { id: true, email: true, name: true }
      })
      
      console.log(`\n👥 Total de usuários no banco: ${allUsers.length}`)
      allUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.name}) - ID: ${user.id}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testApiDatabase() 