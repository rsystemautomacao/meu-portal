import { prisma } from './prisma'

export interface LogAction {
  userId: string
  action: string
  type: 'automatic' | 'manual'
  details?: string
}

export async function createUserLog({ userId, action, type, details }: LogAction) {
  try {
    // Buscar o usuário e seu time usando a relação correta
    const teamUser = await prisma.teamUser.findFirst({
      where: { 
        userId,
        role: 'owner'
      },
      include: {
        user: true,
        team: true
      }
    })

    if (!teamUser) {
      console.error('Usuário não possui time para criar log:', userId)
      return null
    }

    // Criar o log
    const log = await prisma.userLog.create({
      data: {
        userId,
        teamId: teamUser.teamId,
        action,
        type,
        details
      }
    })

    console.log(`📝 Log criado: ${action} (${type}) para usuário ${teamUser.user.email}`)
    return log
  } catch (error) {
    console.error('Erro ao criar log de usuário:', error)
    return null
  }
}

// Funções específicas para ações comuns
export async function logPaymentReminder(userId: string, details?: string) {
  return createUserLog({
    userId,
    action: 'payment_reminder_sent',
    type: 'automatic',
    details: details || 'Lembrete de pagamento enviado automaticamente'
  })
}

export async function logAccessBlocked(userId: string, details?: string) {
  return createUserLog({
    userId,
    action: 'access_blocked',
    type: 'automatic',
    details: details || 'Acesso bloqueado por inadimplência'
  })
}

export async function logWelcomeMessage(userId: string, details?: string) {
  return createUserLog({
    userId,
    action: 'welcome_message_sent',
    type: 'automatic',
    details: details || 'Mensagem de boas-vindas enviada'
  })
}

export async function logManualMessage(userId: string, details?: string) {
  return createUserLog({
    userId,
    action: 'manual_message_sent',
    type: 'manual',
    details: details || 'Mensagem manual enviada pelo admin'
  })
}

export async function logPaymentOverdue(userId: string, details?: string) {
  return createUserLog({
    userId,
    action: 'payment_overdue',
    type: 'automatic',
    details: details || 'Pagamento em atraso detectado'
  })
}

export async function logAccessUnblocked(userId: string, details?: string) {
  return createUserLog({
    userId,
    action: 'access_unblocked',
    type: 'manual',
    details: details || 'Acesso desbloqueado manualmente'
  })
}

export async function logPaymentReceived(userId: string, details?: string) {
  return createUserLog({
    userId,
    action: 'payment_received',
    type: 'manual',
    details: details || 'Pagamento registrado'
  })
}

export async function logSystemNotification(userId: string, details?: string) {
  return createUserLog({
    userId,
    action: 'system_notification',
    type: 'automatic',
    details: details || 'Notificação do sistema enviada'
  })
} 