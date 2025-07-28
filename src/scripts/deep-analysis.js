const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function deepAnalysis() {
  try {
    console.log('=== ANÁLISE PROFUNDA DO PROBLEMA DOS LOGS ===')
    
    // 1. Verificar estrutura do banco
    console.log('\n1. VERIFICANDO ESTRUTURA DO BANCO:')
    
    const userCount = await prisma.user.count()
    const teamCount = await prisma.team.count()
    const logCount = await prisma.userLog.count()
    const teamUserCount = await prisma.teamUser.count()
    
    console.log(`- Usuários: ${userCount}`)
    console.log(`- Times: ${teamCount}`)
    console.log(`- Logs: ${logCount}`)
    console.log(`- TeamUsers: ${teamUserCount}`)
    
    // 2. Verificar usuário específico
    console.log('\n2. VERIFICANDO USUÁRIO unaspdogs@gmail.com:')
    
    const user = await prisma.user.findUnique({
      where: { email: 'unaspdogs@gmail.com' }
    })
    
    if (user) {
      console.log(`- ID: ${user.id}`)
      console.log(`- Email: ${user.email}`)
      console.log(`- Nome: ${user.name}`)
      
      // Verificar teamUsers
      const teamUsers = await prisma.teamUser.findMany({
        where: { userId: user.id },
        include: { team: true }
      })
      
      console.log(`- TeamUsers: ${teamUsers.length}`)
      teamUsers.forEach((tu, index) => {
        console.log(`  ${index + 1}. Time: ${tu.team.name} (${tu.team.id}) - Role: ${tu.role}`)
      })
      
      // Verificar logs para este usuário
      const userLogs = await prisma.userLog.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
      
      console.log(`- Logs para este usuário: ${userLogs.length}`)
      userLogs.forEach((log, index) => {
        console.log(`  ${index + 1}. ${log.action} (${log.type}) - ${log.createdAt}`)
      })
    } else {
      console.log('- Usuário não encontrado!')
    }
    
    // 3. Verificar todos os logs
    console.log('\n3. VERIFICANDO TODOS OS LOGS:')
    
    const allLogs = await prisma.userLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: {
          select: { email: true }
        },
        team: {
          select: { name: true }
        }
      }
    })
    
    console.log(`- Últimos 10 logs:`)
    allLogs.forEach((log, index) => {
      console.log(`  ${index + 1}. ${log.action} (${log.type}) - ${log.user.email} - ${log.team.name} - ${log.createdAt}`)
    })
    
    // 4. Verificar se há logs órfãos (sem usuário)
    console.log('\n4. VERIFICANDO LOGS ÓRFÃOS:')
    
    const orphanLogs = await prisma.userLog.findMany({
      where: {
        user: null
      }
    })
    
    console.log(`- Logs sem usuário: ${orphanLogs.length}`)
    
    // 5. Verificar se há logs com userId inválido
    console.log('\n5. VERIFICANDO LOGS COM USERID INVÁLIDO:')
    
    const invalidUserLogs = await prisma.userLog.findMany({
      where: {
        userId: {
          notIn: (await prisma.user.findMany({ select: { id: true } })).map(u => u.id)
        }
      }
    })
    
    console.log(`- Logs com userId inválido: ${invalidUserLogs.length}`)
    if (invalidUserLogs.length > 0) {
      invalidUserLogs.forEach((log, index) => {
        console.log(`  ${index + 1}. ID: ${log.id} - userId: ${log.userId} - action: ${log.action}`)
      })
    }
    
  } catch (error) {
    console.error('Erro na análise:', error)
  } finally {
    await prisma.$disconnect()
  }
}

deepAnalysis() 