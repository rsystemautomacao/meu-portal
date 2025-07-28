const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function debugUserIssue() {
  try {
    console.log('🔍 Debugando problema do usuário...')

    // Verificar todos os usuários
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    })

    console.log(`📊 Total de usuários no banco: ${allUsers.length}`)
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id} | Email: ${user.email} | Nome: ${user.name}`)
    })

    // Verificar se há usuários com email unaspdogs@gmail.com
    const usersWithEmail = await prisma.user.findMany({
      where: { email: 'unaspdogs@gmail.com' },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    })

    console.log(`\n📧 Usuários com email unaspdogs@gmail.com: ${usersWithEmail.length}`)
    usersWithEmail.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id} | Email: ${user.email} | Nome: ${user.name}`)
    })

    // Verificar teamUsers
    const teamUsers = await prisma.teamUser.findMany({
      where: {
        team: {
          name: 'Unasp Dogs'
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        team: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    console.log(`\n👥 TeamUsers para "Unasp Dogs": ${teamUsers.length}`)
    teamUsers.forEach((tu, index) => {
      console.log(`${index + 1}. Role: ${tu.role} | User: ${tu.user.email} (${tu.user.id}) | Team: ${tu.team.name} (${tu.team.id})`)
    })

    // Verificar se o ID problemático existe
    const problematicId = '6880f4eeac3451d18d8284fb'
    const userWithProblematicId = await prisma.user.findUnique({
      where: { id: problematicId }
    })

    console.log(`\n🔍 Usuário com ID problemático (${problematicId}):`, userWithProblematicId ? 'EXISTE' : 'NÃO EXISTE')

  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugUserIssue() 