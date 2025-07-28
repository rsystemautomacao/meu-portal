import { NextResponse } from 'next/server'
import { automatedPaymentFlow } from '@/scripts/automated-payment-flow'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    // Verificar se é admin OU se é uma execução automática (cron)
    const cookieStore = cookies()
    const adminSession = cookieStore.get('adminSession')
    const userAgent = request.headers.get('user-agent') || ''
    
    // Permitir execução automática (cron job) ou admin
    const isCronJob = userAgent.includes('Vercel') || userAgent.includes('cron')
    const isAdmin = adminSession?.value === 'true'
    
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