import { NextResponse } from 'next/server'
import { automatedPaymentFlow } from '@/scripts/automated-payment-flow'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    // Verificar se é admin
    const cookieStore = cookies()
    const adminSession = cookieStore.get('adminSession')
    if (!adminSession || adminSession.value !== 'true') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    console.log('🔄 Executando fluxo automático de pagamentos...')
    
    // Executar o fluxo automático
    await automatedPaymentFlow()
    
    return NextResponse.json({ 
      message: 'Fluxo automático executado com sucesso',
      success: true
    })
  } catch (error) {
    console.error('❌ Erro ao executar fluxo automático:', error)
    return NextResponse.json(
      { error: 'Erro ao executar fluxo automático' },
      { status: 500 }
    )
  }
} 