'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { 
  EyeIcon, 
  EyeSlashIcon,
  ChartBarIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'
import MonthlyReport from '@/components/financial/MonthlyReport'
import PlayerPaymentStatus from '@/components/financial/PlayerPaymentStatus'
import TransactionList from '@/components/financial/TransactionList'
import DetailedMatchStatsReport from '@/components/financial/DetailedMatchStatsReport'
import DetailedPaymentReport from '@/components/financial/DetailedPaymentReport'
import SharedMatchesReport from '@/components/matches/SharedMatchesReport'
import SharedMatchStatsReport from '@/components/matches/SharedMatchStatsReport'

interface SharedReportData {
  teamName: string
  isActive: boolean
  enabledReports: string[]
}

const REPORT_COMPONENTS = {
  monthly_summary: { component: MonthlyReport, name: 'Resumo Mensal', icon: ChartBarIcon },
  player_payments: { component: PlayerPaymentStatus, name: 'Pagamentos dos Jogadores', icon: UserGroupIcon },
  transactions: { component: () => <TransactionList showActions={false} />, name: 'Transações', icon: CurrencyDollarIcon },
  match_stats: { component: DetailedMatchStatsReport, name: 'Estatísticas das Partidas', icon: CalendarIcon },
  payment_details: { component: DetailedPaymentReport, name: 'Relatório Detalhado de Pagamentos', icon: DocumentTextIcon },
  matches: { component: SharedMatchesReport, name: 'Histórico de Partidas', icon: CalendarIcon }
}

export default function SharedReportsPage() {
  const params = useParams()
  const token = params?.token as string
  const [reportData, setReportData] = useState<SharedReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchReportData()
  }, [token])

  const fetchReportData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/shared-reports/${token}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Relatório não encontrado ou link inválido')
        } else {
          setError('Erro ao carregar relatório')
        }
        return
      }

      const data = await response.json()
      setReportData(data)
    } catch (error) {
      console.error('Erro ao carregar relatório:', error)
      setError('Erro ao carregar relatório')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando relatórios...</p>
        </div>
      </div>
    )
  }

  if (error || !reportData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <EyeSlashIcon className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h1>
          <p className="text-gray-600 mb-4">{error || 'Relatório não encontrado'}</p>
          <p className="text-sm text-gray-500">
            Verifique se o link está correto ou entre em contato com o administrador.
          </p>
        </div>
      </div>
    )
  }

  if (!reportData.isActive) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-yellow-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <EyeSlashIcon className="h-8 w-8 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Relatório Desativado</h1>
          <p className="text-gray-600 mb-4">
            Este relatório foi temporariamente desativado pelo administrador.
          </p>
          <p className="text-sm text-gray-500">
            Entre em contato com o administrador para mais informações.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cabeçalho */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Relatórios - {reportData.teamName}
              </h1>
              <p className="text-gray-600 mt-1">
                Visualização compartilhada dos relatórios financeiros e de partidas
              </p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <EyeIcon className="h-4 w-4" />
              <span>Modo Visualização</span>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {reportData.enabledReports.map((reportId) => {
            const reportConfig = REPORT_COMPONENTS[reportId as keyof typeof REPORT_COMPONENTS]
            if (!reportConfig) return null

            const ReportComponent = reportConfig.component
            const Icon = reportConfig.icon

            return (
              <div key={reportId} className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="border-b border-gray-200 px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <Icon className="h-5 w-5 text-indigo-600" />
                    <h2 className="text-lg font-semibold text-gray-900">
                      {reportConfig.name}
                    </h2>
                  </div>
                </div>
                <div className="p-6">
                  <ReportComponent />
                </div>
              </div>
            )
          })}
        </div>

        {reportData.enabledReports.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-gray-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <EyeSlashIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum relatório disponível
            </h3>
            <p className="text-gray-600">
              O administrador ainda não habilitou nenhum relatório para visualização.
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 