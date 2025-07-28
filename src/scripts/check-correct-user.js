const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkCorrectUser() {
  try {
    console.log('🔍 Verificando usuário correto...')

    // Buscar usuário por email
    const user = await prisma.user.findUnique({
      where: { email: 'unaspdogs@gmail.com' }
    })

    if (!user) {
      console.log('❌ Usuário não encontrado')
      return
    }

    console.log('✅ Usuário encontrado:')
    console.log(`   ID: ${user.id}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Nome: ${user.name}`)

    // Verificar se há logs para este usuário
    const logs = await prisma.userLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    console.log(`\n📊 Logs encontrados para este usuário: ${logs.length}`)
    logs.forEach((log, index) => {
      console.log(`${index + 1}. ${log.action} (${log.type}) - ${log.createdAt}`)
    })

  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkCorrectUser() 