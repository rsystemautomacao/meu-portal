import { NextResponse } from 'next/server'
import { automatedPaymentFlow } from '@/scripts/automated-payment-flow'
import { getAdminSession } from '@/lib/adminAuth'

export async function POST(request: Request) {
  try {
    // Verificar se é admin OU se é uma execução automática (cron da Vercel)
    // A Vercel injeta automaticamente "Authorization: Bearer <CRON_SECRET>" quando
    // a env var CRON_SECRET está configurada no projeto.
    const authHeader = request.headers.get('authorization')
    const isCronJob = Boolean(process.env.CRON_SECRET) && authHeader === `Bearer ${process.env.CRON_SECRET}`
    const adminSession = await getAdminSession()
    const isAdmin = Boolean(adminSession)

    if (!isCronJob && !isAdmin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    console.log('🔄 Executando fluxo automático de pagamentos...')
    console.log('📊 Origem:', isCronJob ? 'Cron Job' : 'Admin Manual')
    
    // Executar o fluxo automático
    await automatedPaymentFlow()
    
    return NextResponse.json({ 
      message: 'Fluxo automático executado com sucesso',
      success: true,
      executedBy: isCronJob ? 'cron' : 'admin'
    })
  } catch (error) {
    console.error('❌ Erro ao executar fluxo automático:', error)
    return NextResponse.json(
      { error: 'Erro ao executar fluxo automático' },
      { status: 500 }
    )
  }
} 