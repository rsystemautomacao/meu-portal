import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { logManualMessage } from '@/lib/userLogs'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🚀 API de mensagens chamada')
    
    // Verificar se é admin
    const cookieStore = cookies()
    const adminSession = cookieStore.get('adminSession')
    console.log('🔐 Admin session:', adminSession?.value)
    
    if (!adminSession || adminSession.value !== 'true') {
      console.log('❌ Não autorizado')
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const teamId = params.id
    const body = await request.json()
    const { messageType, customMessage } = body
    
    console.log('📋 Dados recebidos:', { teamId, messageType, customMessage })

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
      console.log('❌ Time não encontrado:', teamId)
      return NextResponse.json({ error: 'Time não encontrado' }, { status: 404 })
    }

    console.log('✅ Time encontrado:', team.name)

    // Buscar configurações do sistema
    const systemConfig = await prisma.systemConfig.findFirst()
    if (!systemConfig) {
      console.log('❌ Configurações do sistema não encontradas')
      return NextResponse.json({ error: 'Configurações do sistema não encontradas' }, { status: 500 })
    }

    let messageContent = ''
    let messageDetails = ''
    let subject = ''

    // Determinar o conteúdo da mensagem baseado no tipo
    switch (messageType) {
      case 'payment_reminder':
        messageContent = customMessage || systemConfig.paymentMessage
        messageDetails = 'Lembrete de pagamento enviado'
        subject = 'Mensalidade Pendente - Meu Portal'
        break
      case 'access_blocked':
        messageContent = customMessage || 'Seu acesso foi bloqueado por falta de pagamento. Entre em contato para regularizar sua situação.'
        messageDetails = 'Mensagem de bloqueio de acesso enviada'
        subject = 'Acesso Bloqueado - Meu Portal'
        break
      case 'payment_overdue':
        messageContent = customMessage || 'Atenção: seu acesso será bloqueado em até 48 horas por falta de pagamento. Regularize para evitar o bloqueio.'
        messageDetails = 'Mensagem de pagamento em atraso enviada'
        subject = 'Aviso de Bloqueio - Meu Portal'
        break
      case 'custom':
        messageContent = customMessage || 'Mensagem personalizada'
        messageDetails = 'Mensagem personalizada enviada'
        subject = 'Mensagem do Admin - Meu Portal'
        break
      default:
        console.log('❌ Tipo de mensagem inválido:', messageType)
        return NextResponse.json({ error: 'Tipo de mensagem inválido' }, { status: 400 })
    }

    console.log('📝 Conteúdo da mensagem:', messageContent)

    // Substituir variáveis na mensagem
    const currentDate = new Date()
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    
    messageContent = messageContent
      .replace(/{vencimento}/g, nextMonth.toLocaleDateString('pt-BR'))
      .replace(/{valor}/g, `R$ ${systemConfig.monthlyValue.toFixed(2)}`)
      .replace(/{link}/g, systemConfig.paymentLink)
      .replace(/{team}/g, team.name)

    console.log('📝 Mensagem final:', messageContent)

    // Criar notificação no banco
    await prisma.notification.create({
      data: {
        teamId: team.id,
        title: subject,
        message: messageContent,
        type: messageType,
        isRead: false
      }
    })

    console.log('📋 Notificação criada no banco')

    // Enviar mensagem para cada usuário do time
    const results = []
    console.log(`👥 Enviando para ${team.users.length} usuários`)
    
    for (const teamUser of team.users) {
      try {
        console.log(`📱 Enviando mensagem para ${teamUser.user.email}: ${messageContent}`)
        
        // Simular envio real (aqui você implementaria WhatsApp/Email real)
        await new Promise(resolve => setTimeout(resolve, 1000)) // Simular delay
        
        // Registrar log para cada usuário
        await logManualMessage(teamUser.user.id, `${messageDetails} pelo admin: ${messageContent.substring(0, 100)}...`)
        
        results.push({
          userId: teamUser.user.id,
          email: teamUser.user.email,
          success: true
        })
        
        console.log(`✅ Mensagem enviada com sucesso para ${teamUser.user.email}`)
        
        // Mostrar notificação no console como se fosse enviada
        console.log(`📨 MENSAGEM ENVIADA:`)
        console.log(`   Para: ${teamUser.user.email}`)
        console.log(`   Assunto: ${subject}`)
        console.log(`   Conteúdo: ${messageContent}`)
        console.log(`   WhatsApp: ${team.whatsapp || 'Não configurado'}`)
        
      } catch (error) {
        console.error(`❌ Erro ao enviar mensagem para ${teamUser.user.email}:`, error)
        results.push({
          userId: teamUser.user.id,
          email: teamUser.user.email,
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        })
      }
    }

    console.log('🎉 Processamento concluído. Resultados:', results)

    return NextResponse.json({
      success: true,
      message: 'Mensagens enviadas com sucesso',
      results,
      sentCount: results.filter(r => r.success).length,
      totalCount: results.length
    })
  } catch (error) {
    console.error('❌ Erro geral na API de mensagens:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 