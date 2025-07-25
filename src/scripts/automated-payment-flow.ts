import { PrismaClient } from '@prisma/client'
import { MessagingService } from '../lib/messaging'

const prisma = new PrismaClient()

async function automatedPaymentFlow() {
  try {
    console.log('🔄 Iniciando fluxo automático de pagamentos...')
    
    const now = new Date()
    const teams = await prisma.team.findMany({
      where: { 
        status: 'ACTIVE',
        deletedAt: null
      }
    })

    const systemConfig = await prisma.systemConfig.findFirst()
    if (!systemConfig) {
      console.log('❌ Configuração do sistema não encontrada')
      return
    }

    for (const team of teams) {
      const createdAt = new Date(team.createdAt)
      const diffMs = now.getTime() - createdAt.getTime()
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

      console.log(`📊 Time: ${team.name} - Dia ${diffDays} após criação`)

      // 1. Enviar mensagem de cobrança no 5º dia
      if (diffDays === 5) {
        console.log(`💰 Enviando cobrança para ${team.name} (dia 5)`)
        
        const vencimentoDate = new Date(createdAt.getTime() + (7 * 24 * 60 * 60 * 1000))
        const vencimento = `${String(vencimentoDate.getDate()).padStart(2, '0')}/${String(vencimentoDate.getMonth() + 1).padStart(2, '0')}/${vencimentoDate.getFullYear()}`
        
        const paymentMessage = systemConfig.paymentMessage
          .replace(/{team}/g, team.name)
          .replace(/{vencimento}/g, vencimento)
          .replace(/{valor}/g, `R$ ${systemConfig.monthlyValue.toFixed(2)}/mês`)
          .replace(/{link}/g, systemConfig.paymentLink)

        const messageData = {
          teamId: team.id,
          teamName: team.name,
          whatsapp: team.whatsapp,
          subject: 'Mensalidade Pendente - Meu Portal',
          message: paymentMessage,
          messageType: 'payment_reminder',
          sentAt: new Date().toISOString()
        }

        await MessagingService.sendNotification(messageData)

        // Criar notificação
        await prisma.notification.create({
          data: {
            teamId: team.id,
            title: 'Mensalidade Pendente - Meu Portal',
            message: paymentMessage,
            type: 'payment_reminder',
            isRead: false
          }
        })

        console.log(`✅ Cobrança enviada para ${team.name}`)
      }

      // 2. Mudar status para EM ATRASO no 8º dia
      if (diffDays === 8) {
        console.log(`⚠️ Mudando status para EM ATRASO: ${team.name} (dia 8)`)
        
        await prisma.team.update({
          where: { id: team.id },
          data: { status: 'OVERDUE' }
        })

        // Enviar mensagem de aviso de bloqueio
        const blockMessage = `Atenção: seu acesso será bloqueado em até 48 horas por falta de pagamento. Regularize para evitar o bloqueio.`
        
        const messageData = {
          teamId: team.id,
          teamName: team.name,
          whatsapp: team.whatsapp,
          subject: 'Aviso de Bloqueio - Meu Portal',
          message: blockMessage,
          messageType: 'payment_overdue',
          sentAt: new Date().toISOString()
        }

        await MessagingService.sendNotification(messageData)

        // Criar notificação
        await prisma.notification.create({
          data: {
            teamId: team.id,
            title: 'Aviso de Bloqueio - Meu Portal',
            message: blockMessage,
            type: 'payment_overdue',
            isRead: false
          }
        })

        console.log(`✅ Status alterado e aviso enviado para ${team.name}`)
      }

      // 3. Bloquear acesso após 48h do aviso (10º dia)
      if (diffDays === 10) {
        console.log(`🔒 Bloqueando acesso: ${team.name} (dia 10)`)
        
        await prisma.team.update({
          where: { id: team.id },
          data: { status: 'BLOCKED' }
        })

        const blockMessage = `Seu acesso foi bloqueado por falta de pagamento. Entre em contato para regularizar sua situação.`
        
        const messageData = {
          teamId: team.id,
          teamName: team.name,
          whatsapp: team.whatsapp,
          subject: 'Acesso Bloqueado - Meu Portal',
          message: blockMessage,
          messageType: 'access_blocked',
          sentAt: new Date().toISOString()
        }

        await MessagingService.sendNotification(messageData)

        // Criar notificação
        await prisma.notification.create({
          data: {
            teamId: team.id,
            title: 'Acesso Bloqueado - Meu Portal',
            message: blockMessage,
            type: 'access_blocked',
            isRead: false
          }
        })

        console.log(`✅ Acesso bloqueado para ${team.name}`)
      }
    }

    console.log('✅ Fluxo automático concluído')
  } catch (error) {
    console.error('❌ Erro no fluxo automático:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  automatedPaymentFlow()
}

export { automatedPaymentFlow } 