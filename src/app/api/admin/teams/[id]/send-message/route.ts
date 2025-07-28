import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { logManualMessage } from '@/lib/userLogs'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar se é admin
    const cookieStore = cookies()
    const adminSession = cookieStore.get('adminSession')
    if (!adminSession || adminSession.value !== 'true') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const teamId = params.id
    const { messageType, customMessage } = await request.json()

    // Buscar o time e seus usuários
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
      return NextResponse.json({ error: 'Time não encontrado' }, { status: 404 })
    }

    // Buscar configurações do sistema
    const systemConfig = await prisma.systemConfig.findFirst()
    if (!systemConfig) {
      return NextResponse.json({ error: 'Configurações do sistema não encontradas' }, { status: 500 })
    }

    let messageContent = ''
    let messageDetails = ''

    // Determinar o conteúdo da mensagem baseado no tipo
    switch (messageType) {
      case 'payment_reminder':
        messageContent = customMessage || systemConfig.paymentMessage
        messageDetails = 'Lembrete de pagamento enviado'
        break
      case 'access_blocked':
        messageContent = customMessage || systemConfig.welcomeMessage
        messageDetails = 'Mensagem de bloqueio de acesso enviada'
        break
      case 'payment_overdue':
        messageContent = customMessage || systemConfig.paymentMessage
        messageDetails = 'Mensagem de pagamento em atraso enviada'
        break
      case 'custom':
        messageContent = customMessage || 'Mensagem personalizada'
        messageDetails = 'Mensagem personalizada enviada'
        break
      default:
        return NextResponse.json({ error: 'Tipo de mensagem inválido' }, { status: 400 })
    }

    // Substituir variáveis na mensagem
    const currentDate = new Date()
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    
    messageContent = messageContent
      .replace(/{vencimento}/g, nextMonth.toLocaleDateString('pt-BR'))
      .replace(/{valor}/g, `R$ ${systemConfig.monthlyValue.toFixed(2)}`)
      .replace(/{link}/g, systemConfig.paymentLink)
      .replace(/{team}/g, team.name)

    // Enviar mensagem para cada usuário do time
    const results = []
    for (const teamUser of team.users) {
      try {
        // Aqui você implementaria a lógica de envio real da mensagem
        // Por exemplo, WhatsApp, email, SMS, etc.
        console.log(`📱 Mensagem enviada para ${teamUser.user.email}: ${messageContent}`)
        
        // Registrar log para cada usuário
        await logManualMessage(teamUser.user.id, `${messageDetails} pelo admin: ${messageContent.substring(0, 100)}...`)
        
        results.push({
          userId: teamUser.user.id,
          email: teamUser.user.email,
          success: true
        })
      } catch (error) {
        console.error(`Erro ao enviar mensagem para ${teamUser.user.email}:`, error)
        results.push({
          userId: teamUser.user.id,
          email: teamUser.user.email,
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Mensagens enviadas com sucesso',
      results
    })
  } catch (error) {
    console.error('Erro ao enviar mensagens:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 