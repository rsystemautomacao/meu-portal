const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkDuplicateUsers() {
  try {
    console.log('🔍 Verificando usuários com email unaspdogs@gmail.com...')

    // Buscar todos os usuários com este email
    const users = await prisma.user.findMany({
      where: { email: 'unaspdogs@gmail.com' }
    })

    console.log(`📊 Encontrados ${users.length} usuários com este email:`)
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Nome: ${user.name}`)
      console.log(`   Criado em: ${user.createdAt}`)
      console.log('')
    })

    // Verificar logs para cada usuário
    for (const user of users) {
      console.log(`🔍 Verificando logs para usuário ${user.id}:`)
      
      const logs = await prisma.userLog.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 3
      })

      console.log(`   📊 Logs encontrados: ${logs.length}`)
      logs.forEach((log, index) => {
        console.log(`   ${index + 1}. ${log.action} (${log.type}) - ${log.createdAt}`)
      })
      console.log('')
    }

    // Verificar qual usuário é o owner do time
    const teamUsers = await prisma.teamUser.findMany({
      where: {
        team: {
          name: 'Unasp Dogs'
        },
        role: 'owner'
      },
      include: {
        user: true,
        team: true
      }
    })

    console.log('👑 Owners do time "Unasp Dogs":')
    teamUsers.forEach((tu, index) => {
      console.log(`${index + 1}. ${tu.user.email} (ID: ${tu.user.id})`)
    })

  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDuplicateUsers() 