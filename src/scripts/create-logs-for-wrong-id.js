const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createLogsForWrongId() {
  try {
    console.log('🧪 Criando logs para o ID incorreto...')

    const wrongUserId = '6880f4eeac3451d18d8284fb'
    
    // Verificar se este usuário existe
    const user = await prisma.user.findUnique({
      where: { id: wrongUserId }
    })

    if (!user) {
      console.log('❌ Usuário com ID incorreto não existe')
      return
    }

    console.log('✅ Usuário encontrado:', user.email, 'ID:', user.id)

    // Buscar o time do usuário
    const teamUser = await prisma.teamUser.findFirst({
      where: { 
        userId: user.id,
        role: 'owner'
      },
      include: { team: true }
    })

    if (!teamUser) {
      console.log('❌ Time não encontrado para o usuário')
      return
    }

    console.log('✅ Time encontrado:', teamUser.team.name)

    // Criar logs de teste
    const testLogs = [
      {
        action: 'payment_reminder_sent',
        type: 'automatic',
        details: 'Teste: Lembrete de pagamento enviado automaticamente (ID incorreto)'
      },
      {
        action: 'payment_overdue',
        type: 'automatic',
        details: 'Teste: Pagamento em atraso detectado (ID incorreto)'
      },
      {
        action: 'access_blocked',
        type: 'automatic',
        details: 'Teste: Acesso bloqueado por inadimplência (ID incorreto)'
      },
      {
        action: 'manual_message_sent',
        type: 'manual',
        details: 'Teste: Mensagem manual enviada pelo admin (ID incorreto)'
      },
      {
        action: 'admin_block',
        type: 'manual',
        details: 'Teste: Bloqueio manual realizado pelo admin (ID incorreto)'
      }
    ]

    for (const logData of testLogs) {
      try {
        await prisma.userLog.create({
          data: {
            userId: user.id,
            teamId: teamUser.teamId,
            action: logData.action,
            type: logData.type,
            details: logData.details
          }
        })
        console.log(`✅ Log criado: ${logData.action}`)
      } catch (error) {
        console.error(`❌ Erro ao criar log ${logData.action}:`, error)
      }
    }

    console.log('🎉 Logs de teste criados para o ID incorreto!')

  } catch (error) {
    console.error('❌ Erro ao criar logs de teste:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createLogsForWrongId() 