const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkLogs() {
  try {
    console.log('🔍 Verificando logs no banco de dados...')

    // Verificar total de logs
    const totalLogs = await prisma.userLog.count()
    console.log(`📊 Total de logs no banco: ${totalLogs}`)

    if (totalLogs > 0) {
      // Buscar alguns logs de exemplo
      const logs = await prisma.userLog.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              email: true
            }
          },
          team: {
            select: {
              name: true
            }
          }
        }
      })

      console.log('📋 Últimos 5 logs:')
      logs.forEach((log, index) => {
        console.log(`${index + 1}. ${log.action} (${log.type}) - ${log.user.email} - ${log.team.name} - ${log.createdAt}`)
      })
    }

    // Verificar usuários
    const users = await prisma.user.findMany({
      take: 3,
      select: {
        id: true,
        email: true
      }
    })

    console.log('\n👥 Usuários encontrados:')
    users.forEach(user => {
      console.log(`- ${user.email} (ID: ${user.id})`)
    })

  } catch (error) {
    console.error('❌ Erro ao verificar logs:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkLogs() 