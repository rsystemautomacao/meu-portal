import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { MessagingService } from '@/lib/messaging'

// POST - Enviar mensagem de mensalidade pendente
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { messageType } = await request.json()
    const teamId = params.id

    // Buscar dados do time
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        users: {
          include: {
            user: true
          }
        }
      }
    })

    if (!team) {
      return NextResponse.json(
        { error: 'Time não encontrado' },
        { status: 404 }
      )
    }

    // Gerar mensagem baseada no tipo
    let message = ''
    let subject = ''

    switch (messageType) {
      case 'payment_reminder':
        subject = 'Mensalidade Pendente - Meu Portal'
        message = `Olá ${team.name}!

Este é um lembrete amigável sobre sua mensalidade do Meu Portal que está pendente.

📅 Data de Vencimento: ${new Date().toLocaleDateString('pt-BR')}
💰 Valor: R$ 29,90/mês

Para continuar aproveitando todos os recursos do sistema, por favor, regularize seu pagamento.

📞 Dúvidas? Entre em contato conosco.
📧 Email: rsautomacao2000@gmail.com

Agradecemos sua confiança!

Equipe RSystem`
        break

      case 'payment_overdue':
        subject = 'Mensalidade em Atraso - Meu Portal'
        message = `Olá ${team.name}!

Sua mensalidade do Meu Portal está em atraso há mais de 10 dias.

⚠️ ATENÇÃO: Seu acesso será bloqueado em breve.

📅 Data de Vencimento: ${new Date().toLocaleDateString('pt-BR')}
💰 Valor: R$ 29,90/mês
⏰ Dias em Atraso: 10+ dias

Para evitar o bloqueamento do acesso, regularize seu pagamento imediatamente.

📞 Dúvidas? Entre em contato conosco.
📧 Email: rsautomacao2000@gmail.com

Equipe RSystem`
        break

      case 'access_blocked':
        subject = 'Acesso Bloqueado - Meu Portal'
        message = `Olá ${team.name}!

Devido ao não pagamento da mensalidade, seu acesso ao Meu Portal foi bloqueado.

🔒 Status: ACESSO BLOQUEADO
📅 Data de Vencimento: ${new Date().toLocaleDateString('pt-BR')}
💰 Valor: R$ 29,90/mês

Para reativar seu acesso, efetue o pagamento da mensalidade em atraso.

📞 Dúvidas? Entre em contato conosco.
📧 Email: rsautomacao2000@gmail.com

Equipe RSystem`
        break

      default:
        return NextResponse.json(
          { error: 'Tipo de mensagem inválido' },
          { status: 400 }
        )
    }

    // Preparar dados para envio
    const messageData = {
      teamId: team.id,
      teamName: team.name,
      whatsapp: (team as any).whatsapp,
      subject,
      message,
      messageType,
      sentAt: new Date().toISOString()
    }

    // Enviar mensagem usando o serviço real
    const notificationResult = await MessagingService.sendNotification(messageData)

    // Criar notificação no banco de dados
    try {
      await (prisma as any).notification.create({
        data: {
          teamId: team.id,
          title: subject,
          message: message,
          type: messageType,
          isRead: false
        }
      })
      console.log('✅ Notificação criada no banco de dados')
    } catch (error) {
      console.error('❌ Erro ao criar notificação:', error)
    }

    console.log('📤 Resultado do envio:', notificationResult)

    return NextResponse.json({
      message: notificationResult.success ? 'Mensagem enviada com sucesso' : 'Falha no envio da mensagem',
      data: {
        ...messageData,
        notificationResult
      },
      success: notificationResult.success
    })
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error)
    return NextResponse.json(
      { error: 'Erro ao enviar mensagem' },
      { status: 500 }
    )
  }
} 