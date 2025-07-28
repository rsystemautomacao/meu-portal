// Serviço de mensagens para envio de notificações
export interface MessageData {
  teamId: string
  teamName: string
  whatsapp?: string
  subject: string
  message: string
  messageType: string
  sentAt: string
}

export class MessagingService {
  // Enviar mensagem via WhatsApp (simulação por enquanto)
  static async sendWhatsAppMessage(data: MessageData): Promise<boolean> {
    try {
      console.log('📱 Enviando mensagem WhatsApp:', {
        para: data.whatsapp,
        time: data.teamName,
        tipo: data.messageType,
        assunto: data.subject,
        mensagem: data.message.substring(0, 100) + '...'
      })

      // Aqui você implementaria a integração real com WhatsApp Business API
      // Por enquanto, vamos simular o envio com mais realismo
      
      // Simular delay de envio
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Simular sucesso baseado no tipo de mensagem
      let success = true
      
      if (data.messageType === 'payment_reminder') {
        success = Math.random() > 0.1 // 90% sucesso
      } else if (data.messageType === 'access_blocked') {
        success = Math.random() > 0.05 // 95% sucesso
      } else {
        success = Math.random() > 0.15 // 85% sucesso
      }
      
      if (success) {
        console.log('✅ Mensagem WhatsApp enviada com sucesso para', data.teamName)
        return true
      } else {
        console.log('❌ Falha no envio da mensagem WhatsApp para', data.teamName)
        return false
      }
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem WhatsApp:', error)
      return false
    }
  }

  // Enviar email (simulação)
  static async sendEmail(data: MessageData): Promise<boolean> {
    try {
      console.log('📧 Enviando email:', {
        para: data.teamName,
        assunto: data.subject,
        tipo: data.messageType,
        mensagem: data.message.substring(0, 100) + '...'
      })

      // Simular delay de envio
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Simular sucesso baseado no tipo de mensagem
      let success = true
      
      if (data.messageType === 'welcome') {
        success = Math.random() > 0.05 // 95% sucesso
      } else if (data.messageType === 'payment_reminder') {
        success = Math.random() > 0.1 // 90% sucesso
      } else {
        success = Math.random() > 0.15 // 85% sucesso
      }
      
      if (success) {
        console.log('✅ Email enviado com sucesso para', data.teamName)
        return true
      } else {
        console.log('❌ Falha no envio do email para', data.teamName)
        return false
      }
    } catch (error) {
      console.error('❌ Erro ao enviar email:', error)
      return false
    }
  }

  // Enviar notificação (múltiplos canais)
  static async sendNotification(data: MessageData): Promise<{
    whatsapp: boolean
    email: boolean
    success: boolean
    details: string
  }> {
    const results = {
      whatsapp: false,
      email: false,
      success: false,
      details: ''
    }

    console.log(`🚀 Iniciando envio de mensagem para ${data.teamName}`)
    console.log(`📋 Tipo: ${data.messageType}`)
    console.log(`📱 WhatsApp: ${data.whatsapp ? 'Sim' : 'Não'}`)

    // Tentar enviar via WhatsApp se tiver número
    if (data.whatsapp) {
      console.log('📱 Tentando enviar via WhatsApp...')
      results.whatsapp = await this.sendWhatsAppMessage(data)
    }

    // Tentar enviar via email
    console.log('📧 Tentando enviar via email...')
    results.email = await this.sendEmail(data)

    // Considerar sucesso se pelo menos um canal funcionou
    results.success = results.whatsapp || results.email

    // Gerar detalhes do resultado
    if (results.success) {
      const channels = []
      if (results.whatsapp) channels.push('WhatsApp')
      if (results.email) channels.push('Email')
      results.details = `Mensagem enviada com sucesso via ${channels.join(' e ')}`
    } else {
      results.details = 'Falha no envio por todos os canais disponíveis'
    }

    console.log(`📊 Resultado final: ${results.success ? '✅ Sucesso' : '❌ Falha'}`)
    console.log(`📝 Detalhes: ${results.details}`)

    return results
  }

  // Gerar link de pagamento (simulação)
  static generatePaymentLink(teamId: string, amount: number = 29.90): string {
    return `https://pay.mercadopago.com.br/${teamId}?amount=${amount}`
  }

  // Verificar status de pagamento (simulação)
  static async checkPaymentStatus(teamId: string): Promise<{
    paid: boolean
    amount: number
    dueDate: string
    daysOverdue: number
  }> {
    try {
      // Simular verificação de pagamento
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Simular resultado (70% de chance de estar pago)
      const isPaid = Math.random() > 0.3
      
      return {
        paid: isPaid,
        amount: 29.90,
        dueDate: new Date().toLocaleDateString('pt-BR'),
        daysOverdue: isPaid ? 0 : Math.floor(Math.random() * 10) + 1
      }
    } catch (error) {
      console.error('❌ Erro ao verificar status de pagamento:', error)
      return {
        paid: false,
        amount: 29.90,
        dueDate: new Date().toLocaleDateString('pt-BR'),
        daysOverdue: 0
      }
    }
  }
} 