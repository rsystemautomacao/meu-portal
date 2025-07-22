'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  ChartBarIcon, 
  DocumentTextIcon,
  ArrowDownTrayIcon,
  BellIcon,
  PlusIcon, 
  CurrencyDollarIcon, 
  ExclamationTriangleIcon,
  CalendarIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import PlayerPaymentStatus from '@/components/financial/PlayerPaymentStatus'
import TransactionForm from '@/components/financial/TransactionForm'
import TransactionList from '@/components/financial/TransactionList'
import MonthlyReport from '@/components/financial/MonthlyReport'
import DetailedPaymentReport from '@/components/financial/DetailedPaymentReport'
import { toast } from 'react-hot-toast'
import MonthlyFeeConfig from '@/components/financial/MonthlyFeeConfig'
import MonthlyFeeExceptions from '@/components/financial/MonthlyFeeExceptions'
import PaymentAlerts from '@/components/financial/PaymentAlerts'
import { useRouter } from 'next/navigation'
import DetailedMatchStatsReport from '@/components/financial/DetailedMatchStatsReport'

// Desabilitar pré-renderização estática
export const dynamic = 'force-dynamic'

export default function FinancialPage() {
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState('overview')
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<{ id: string; message: string }[]>([])
  const [transactionsRefresh, setTransactionsRefresh] = useState(0)
  const router = useRouter()

  // Função para verificar pagamentos em atraso
  const checkLatePayments = async () => {
    try {
      const response = await fetch('/api/dashboard/financial/check-payments')
      const data = await response.json()
      
      if (data.latePayments?.length > 0) {
        setNotifications(data.latePayments)
        setShowNotifications(true)
      }
    } catch (error) {
      console.error('Erro ao verificar pagamentos:', error)
    }
  }

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/login')
      return
    }

    // Se for admin, redirecionar para o painel admin
    if (session.user.isAdmin) {
      router.push('/admin')
      return
    }

    // Usuários comuns continuam no dashboard
    if (session?.user) {
      checkLatePayments()
      // Verificar pagamentos a cada hora
      const interval = setInterval(checkLatePayments, 3600000)
      return () => clearInterval(interval)
    }
  }, [session, status, router])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cabeçalho */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
          </div>
        </div>
      </div>

      {/* Navegação por abas */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="border-b border-gray-200 bg-white rounded-t-xl shadow-sm">
          <nav className="flex space-x-2 sm:space-x-4 lg:space-x-8 overflow-x-auto px-2 py-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`${
                activeTab === 'overview'
                  ? 'border-b-4 border-blue-600 text-blue-700 font-bold bg-blue-50 shadow'
                  : 'border-b-4 border-transparent text-gray-500 hover:text-blue-600 hover:bg-blue-50'
              } whitespace-nowrap py-3 px-4 rounded-t-lg transition-all duration-150`}
            >
              Visão Geral
            </button>
            <button
              onClick={() => setActiveTab('players')}
              className={`${
                activeTab === 'players'
                  ? 'border-b-4 border-blue-600 text-blue-700 font-bold bg-blue-50 shadow'
                  : 'border-b-4 border-transparent text-gray-500 hover:text-blue-600 hover:bg-blue-50'
              } whitespace-nowrap py-3 px-4 rounded-t-lg transition-all duration-150`}
            >
              Jogadores
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`${
                activeTab === 'transactions'
                  ? 'border-b-4 border-blue-600 text-blue-700 font-bold bg-blue-50 shadow'
                  : 'border-b-4 border-transparent text-gray-500 hover:text-blue-600 hover:bg-blue-50'
              } whitespace-nowrap py-3 px-4 rounded-t-lg transition-all duration-150`}
            >
              Transações
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`${
                activeTab === 'reports'
                  ? 'border-b-4 border-blue-600 text-blue-700 font-bold bg-blue-50 shadow'
                  : 'border-b-4 border-transparent text-gray-500 hover:text-blue-600 hover:bg-blue-50'
              } whitespace-nowrap py-3 px-4 rounded-t-lg transition-all duration-150`}
            >
              Relatórios
            </button>
          </nav>
        </div>

        {/* Conteúdo das abas */}
        <div className="mt-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <MonthlyReport />
              <PlayerPaymentStatus onTransactionsChange={() => setTransactionsRefresh(r => r + 1)} />
            </div>
          )}

          {activeTab === 'players' && (
            <PlayerPaymentStatus onTransactionsChange={() => setTransactionsRefresh(r => r + 1)} />
          )}

          {activeTab === 'transactions' && (
            <div className="flex flex-col items-center w-full space-y-8">
              <Suspense fallback={<div>Carregando alertas...</div>}>
                <PaymentAlerts />
              </Suspense>
              <div className="w-full flex flex-col items-center">
                <div className="w-full max-w-xl">
                  <TransactionForm onTransactionCreated={() => setTransactionsRefresh(r => r + 1)} />
                </div>
              </div>
              <div className="w-full">
                <TransactionList refresh={transactionsRefresh} />
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-6">
              <MonthlyReport />
              <DetailedMatchStatsReport />
              <DetailedPaymentReport />
            </div>
          )}
        </div>
      </div>

      {/* Painel de Notificações */}
      {showNotifications && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Notificações</h3>
              <button
                onClick={() => setShowNotifications(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Fechar</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              {notifications.map((notification, idx) => (
                <div
                  key={notification.id || idx}
                  className="bg-red-50 border-l-4 border-red-400 p-4"
                >
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">
                        {notification.message || 'Notificação'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 