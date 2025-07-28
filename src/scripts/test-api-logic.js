require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testApiLogic() {
  try {
    console.log('🔍 Testando lógica da API...')
    console.log('🔍 DATABASE_URL:', process.env.DATABASE_URL)
    
    const userId = '687e5b9e1be28a4226ceaa7f'
    
    // Simular exatamente o que a API faz
    console.log('1. Buscando usuário por ID:', userId)
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })
    
    if (!user) {
      console.log('❌ Usuário não encontrado para ID:', userId)
      return
    }
    
    console.log('✅ Usuário encontrado:', user.email)
    
    // Buscar logs por userId
    console.log('2. Buscando logs por userId:', user.id)
    const logs = await prisma.userLog.findMany({
      where: { 
        userId: user.id
      },
      orderBy: { createdAt: 'desc' },
      include: {
        team: {
          select: {
            name: true
          }
        }
      }
    })
    
    console.log(`✅ Encontrados ${logs.length} logs para usuário ${user.email}`)
    logs.forEach((log, index) => {
      console.log(`   ${index + 1}. ${log.action} (${log.type}) - ${log.createdAt}`)
    })
    
  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testApiLogic() 