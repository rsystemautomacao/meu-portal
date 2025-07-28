const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function investigateIdInconsistency() {
  try {
    console.log('=== INVESTIGANDO INCONSISTÊNCIA DE IDs ===')
    
    // 1. Verificar todos os usuários com email unaspdogs@gmail.com
    console.log('\n1. TODOS OS USUÁRIOS COM EMAIL unaspdogs@gmail.com:')
    
    const usersWithEmail = await prisma.user.findMany({
      where: { email: 'unaspdogs@gmail.com' }
    })
    
    console.log(`Encontrados ${usersWithEmail.length} usuários com este email:`)
    usersWithEmail.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id} | Email: ${user.email} | Nome: ${user.name} | Criado em: ${user.createdAt}`)
    })
    
    // 2. Verificar teamUsers para cada usuário
    console.log('\n2. TEAMUSERS PARA CADA USUÁRIO:')
    
    for (const user of usersWithEmail) {
      console.log(`\nUsuário ${user.id}:`)
      
      const teamUsers = await prisma.teamUser.findMany({
        where: { userId: user.id },
        include: { team: true }
      })
      
      console.log(`  TeamUsers: ${teamUsers.length}`)
      teamUsers.forEach((tu, index) => {
        console.log(`    ${index + 1}. Time: ${tu.team.name} (${tu.team.id}) - Role: ${tu.role}`)
      })
    }
    
    // 3. Verificar qual usuário é o owner do time "Unasp Dogs"
    console.log('\n3. OWNER DO TIME "Unasp Dogs":')
    
    const team = await prisma.team.findFirst({
      where: { name: 'Unasp Dogs' },
      include: {
        users: {
          where: { role: 'owner' },
          include: { user: true }
        }
      }
    })
    
    if (team) {
      console.log(`Time encontrado: ${team.name} (${team.id})`)
      console.log(`Owners: ${team.users.length}`)
      team.users.forEach((tu, index) => {
        console.log(`  ${index + 1}. ${tu.user.email} (${tu.user.id})`)
      })
    }
    
    // 4. Verificar logs para cada ID
    console.log('\n4. LOGS PARA CADA ID:')
    
    for (const user of usersWithEmail) {
      console.log(`\nLogs para usuário ${user.id}:`)
      
      const logs = await prisma.userLog.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 3
      })
      
      console.log(`  Logs encontrados: ${logs.length}`)
      logs.forEach((log, index) => {
        console.log(`    ${index + 1}. ${log.action} (${log.type}) - ${log.createdAt}`)
      })
    }
    
    // 5. Verificar se há duplicação na criação de usuários
    console.log('\n5. VERIFICANDO SE HÁ DUPLICAÇÃO:')
    
    const allUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' }
    })
    
    console.log('Todos os usuários por ordem de criação:')
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.id}) - ${user.createdAt}`)
    })
    
  } catch (error) {
    console.error('Erro na investigação:', error)
  } finally {
    await prisma.$disconnect()
  }
}

investigateIdInconsistency() 