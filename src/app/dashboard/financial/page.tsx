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
  XCircleIcon,
  BanknotesIcon
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

  const tabs = [
    { id: 'overview', name: 'Visão Geral' },
    { id: 'players', name: 'Jogadores' },
    { id: 'transactions', name: 'Transações' },
    { id: 'reports', name: 'Relatórios' },
  ]

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
    if (session.user.isAdmin && !session.user.isUniversalAdmin) {
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="w-full p-2 sm:p-4 lg:p-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <BanknotesIcon className="h-6 w-6 sm:h-8 sm:w-8 mr-2 sm:mr-3 text-green-600" />
            Financeiro
          </h1>
          <p className="text-base sm:text-lg text-gray-600">
            Gerencie as finanças do seu time
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-4 sm:mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-2 px-1 sm:px-3 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="mt-4 sm:mt-6">
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