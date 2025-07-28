const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkAllLogs() {
  try {
    console.log('Verificando todos os logs no banco...')

    const allLogs = await prisma.userLog.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { email: true }
        },
        team: {
          select: { name: true }
        }
      }
    })

    console.log(`Total de logs: ${allLogs.length}`)
    
    allLogs.forEach((log, index) => {
      console.log(`${index + 1}. ${log.action} (${log.type}) - ${log.user.email} - ${log.team.name} - ${log.createdAt}`)
    })

  } catch (error) {
    console.error('Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAllLogs() 