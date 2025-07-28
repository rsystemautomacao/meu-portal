const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createLogsForRealUser() {
  try {
    console.log('🧪 Criando logs para o usuário real...')

    const realUserId = '687e5b9e1be28a4226ceaa7f'
    
    // Verificar se este usuário existe
    const user = await prisma.user.findUnique({
      where: { id: realUserId }
    })

    if (!user) {
      console.log('❌ Usuário real não existe')
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
        details: 'Lembrete de pagamento enviado automaticamente'
      },
      {
        action: 'payment_overdue',
        type: 'automatic',
        details: 'Pagamento em atraso detectado'
      },
      {
        action: 'access_blocked',
        type: 'automatic',
        details: 'Acesso bloqueado por inadimplência'
      },
      {
        action: 'manual_message_sent',
        type: 'manual',
        details: 'Mensagem manual enviada pelo admin'
      },
      {
        action: 'admin_block',
        type: 'manual',
        details: 'Bloqueio manual realizado pelo admin'
      },
      {
        action: 'admin_unblock',
        type: 'manual',
        details: 'Desbloqueio manual realizado pelo admin'
      },
      {
        action: 'admin_pause',
        type: 'manual',
        details: 'Pausa manual realizada pelo admin'
      },
      {
        action: 'admin_activate',
        type: 'manual',
        details: 'Ativação manual realizada pelo admin'
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

    console.log('🎉 Logs de teste criados para o usuário real!')

  } catch (error) {
    console.error('❌ Erro ao criar logs de teste:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createLogsForRealUser() 