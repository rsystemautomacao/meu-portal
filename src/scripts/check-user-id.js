const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkUserId() {
  try {
    console.log('🔍 Verificando ID do usuário unaspdogs@gmail.com...')

    // Buscar o usuário
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

    // Buscar logs para este usuário
    const logs = await prisma.userLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    console.log(`\n📊 Logs encontrados para este usuário: ${logs.length}`)
    logs.forEach((log, index) => {
      console.log(`${index + 1}. ${log.action} (${log.type}) - ${log.createdAt}`)
    })

    // Verificar se há logs com outros IDs
    const allLogs = await prisma.userLog.findMany({
      where: {
        team: {
          name: 'Unasp Dogs'
        }
      },
      include: {
        user: {
          select: { email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    console.log(`\n📋 Todos os logs para time "Unasp Dogs":`)
    allLogs.forEach((log, index) => {
      console.log(`${index + 1}. ${log.action} (${log.type}) - Usuário: ${log.user.email} - ${log.createdAt}`)
    })

  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUserId() 