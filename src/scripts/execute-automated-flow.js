require('dotenv').config({ path: '.env' }) // Usar banco de produção
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function executeAutomatedFlow() {
  try {
    console.log('🔄 Executando fluxo automático de pagamentos...')
    console.log('🔍 DATABASE_URL:', process.env.DATABASE_URL)
    
    const now = new Date()
    const teams = await prisma.team.findMany({
      where: { 
        status: 'ACTIVE'
        // Removido filtro deletedAt: null
      },
      include: {
        users: {
          where: { role: 'owner' },
          include: { user: true }
        }
      }
    })

    console.log(`📊 Encontrados ${teams.length} times ativos`)

    const systemConfig = await prisma.systemConfig.findFirst()
    if (!systemConfig) {
      console.log('❌ Configuração do sistema não encontrada')
      return
    }

    for (const team of teams) {
      const owner = team.users[0]?.user
      if (!owner) {
        console.log(`⚠️ Time ${team.name} sem owner, pulando...`)
        continue
      }

      const createdAt = new Date(team.createdAt)
      const diffMs = now.getTime() - createdAt.getTime()
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

      console.log(`📊 Time: ${team.name} - Dia ${diffDays} após criação`)

      // Verificar se já existem logs para este time
      const existingLogs = await prisma.userLog.findMany({
        where: { userId: owner.id },
        select: { action: true }
      })

      const existingActions = existingLogs.map(log => log.action)
      console.log(`📋 Logs existentes: ${existingActions.join(', ')}`)

      // 1. Enviar mensagem de cobrança no 5º dia
      if (diffDays === 5 && !existingActions.includes('payment_reminder_sent')) {
        console.log(`💰 Enviando cobrança para ${team.name} (dia 5)`)
        
        const vencimentoDate = new Date(createdAt.getTime() + (7 * 24 * 60 * 60 * 1000))
        const vencimento = `${String(vencimentoDate.getDate()).padStart(2, '0')}/${String(vencimentoDate.getMonth() + 1).padStart(2, '0')}/${vencimentoDate.getFullYear()}`
        
        // Criar log de lembrete de pagamento
        await prisma.userLog.create({
          data: {
            userId: owner.id,
            teamId: team.id,
            action: 'payment_reminder_sent',
            type: 'automatic',
            details: `Lembrete de pagamento enviado automaticamente no 5º dia - Vencimento: ${vencimento}`
          }
        })

        console.log(`✅ Log de cobrança criado para ${team.name}`)
      }

      // 2. Mudar status para EM ATRASO no 8º dia
      if (diffDays === 8 && !existingActions.includes('payment_overdue')) {
        console.log(`⚠️ Mudando status para EM ATRASO: ${team.name} (dia 8)`)
        
        // Criar log de pagamento em atraso
        await prisma.userLog.create({
          data: {
            userId: owner.id,
            teamId: team.id,
            action: 'payment_overdue',
            type: 'automatic',
            details: `Pagamento em atraso - Status alterado para OVERDUE automaticamente no 8º dia`
          }
        })

        console.log(`✅ Log de atraso criado para ${team.name}`)
      }

      // 3. Bloquear acesso após 48h do aviso (10º dia)
      if (diffDays === 10 && !existingActions.includes('access_blocked')) {
        console.log(`🔒 Bloqueando acesso: ${team.name} (dia 10)`)
        
        // Criar log de bloqueio de acesso
        await prisma.userLog.create({
          data: {
            userId: owner.id,
            teamId: team.id,
            action: 'access_blocked',
            type: 'automatic',
            details: `Acesso bloqueado automaticamente no 10º dia por falta de pagamento`
          }
        })

        console.log(`✅ Log de bloqueio criado para ${team.name}`)
      }
    }

    console.log('✅ Fluxo automático concluído')
  } catch (error) {
    console.error('❌ Erro no fluxo automático:', error)
  } finally {
    await prisma.$disconnect()
  }
}

executeAutomatedFlow() 