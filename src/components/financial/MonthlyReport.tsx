'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

interface MonthlySummary {
  totalIncome: number
  totalExpense: number
  balance: number
  incomeByType: {
    [key: string]: number
  }
  expenseByType: {
    [key: string]: number
  }
}

export default function MonthlyReport() {
  const [summary, setSummary] = useState<MonthlySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date())

  useEffect(() => {
    fetchMonthlySummary()
  }, [selectedMonth])

  const fetchMonthlySummary = async () => {
    try {
      setLoading(true)
      // Verificar se estamos em um relatório compartilhado
      const isSharedReport = window.location.pathname.includes('/shared-reports/')
      const token = window.location.pathname.split('/shared-reports/')[1]?.split('/')[0]
      
      // Formatar a data corretamente como YYYY-MM
      const monthParam = format(selectedMonth, 'yyyy-MM')
      
      let url = `/api/dashboard/financial/monthly-summary?month=${monthParam}`
      if (isSharedReport && token) {
        url = `/api/shared-reports/${token}/financial/monthly-summary?month=${monthParam}`
      }
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Erro ao carregar dados')
      }
      const data = await response.json()

      setSummary(data)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const getIncomeTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      DONATION: 'Doações',
      FESTIVAL: 'Festivais',
      MONTHLY_FEE: 'Mensalidades',
      RAFFLE: 'Rifas',
      OTHER: 'Outros',
    }
    return labels[type] || type
  }

  const getExpenseTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      CHAMPIONSHIP: 'Campeonatos',
      CLEANING: 'Itens de limpeza',
      GAME_MATERIALS: 'Materiais de jogo',
      LEAGUE_MONTHLY: 'Mensal Liga',
      COURT_MONTHLY: 'Mensal Quadra',
      UNIFORMS: 'Uniformes',
      OTHER: 'Outros',
    }
    return labels[type] || type
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-white to-gray-50 shadow-xl rounded-2xl p-8 w-full border border-gray-100">
        <div className="animate-pulse">
          <div className="flex justify-between items-center mb-8">
            <div>
              <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-64"></div>
            </div>
            <div className="h-10 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-200 rounded-xl h-32"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-4">
                <div className="h-6 bg-gray-200 rounded w-32"></div>
                <div className="bg-gray-200 rounded-xl h-48"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="bg-gradient-to-br from-white to-gray-50 shadow-xl rounded-2xl p-8 w-full border border-gray-100 text-center">
        <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
          <ChartBarIcon className="h-8 w-8 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Resumo Financeiro</h2>
        <p className="text-gray-600 mb-6">
          Não há dados financeiros para o mês selecionado.
        </p>
        <div className="flex justify-center">
          <input
            type="month"
            value={format(selectedMonth, 'yyyy-MM')}
            onChange={(e) => {
              const [year, month] = e.target.value.split('-').map(Number)
              setSelectedMonth(new Date(year, month - 1, 1)) // Forçar primeiro dia do mês
            }}
            className="rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm font-medium"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 shadow-xl rounded-2xl p-8 w-full border border-gray-100">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <span className="bg-indigo-100 p-2 rounded-full"><ChartBarIcon className="h-7 w-7 text-indigo-500" /></span>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Resumo Financeiro</h2>
            <p className="text-gray-600 text-sm">Análise detalhada das finanças do time</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <input
            type="month"
            value={format(selectedMonth, 'yyyy-MM')}
            onChange={(e) => {
              const [year, month] = e.target.value.split('-').map(Number)
              setSelectedMonth(new Date(year, month - 1, 1)) // Forçar primeiro dia do mês
            }}
            className="rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm font-medium"
          />
        </div>
      </div>

      {/* Cards de resumo com fallback */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8 w-full">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 overflow-hidden shadow-lg rounded-xl hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center">
              <div className="bg-blue-600 p-3 rounded-full shadow-lg">
                <ChartBarIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-semibold text-blue-700 truncate">
                    Saldo do Mês
                  </dt>
                  <dd className="text-2xl font-bold text-blue-900">
                    R$ {(summary.balance || 0).toFixed(2)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 overflow-hidden shadow-lg rounded-xl hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center">
              <div className="bg-green-600 p-3 rounded-full shadow-lg">
                <ArrowUpIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-semibold text-green-700 truncate">
                    Total de Entradas
                  </dt>
                  <dd className="text-2xl font-bold text-green-900">
                    R$ {(summary.totalIncome || 0).toFixed(2)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 overflow-hidden shadow-lg rounded-xl hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center">
              <div className="bg-red-600 p-3 rounded-full shadow-lg">
                <ArrowDownIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-semibold text-red-700 truncate">
                    Total de Saídas
                  </dt>
                  <dd className="text-2xl font-bold text-red-900">
                    R$ {(summary.totalExpense || 0).toFixed(2)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detalhamento por tipo */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 w-full">
        {/* Entradas por tipo */}
        <div className="w-full">
          <div className="flex items-center mb-6">
            <div className="bg-green-100 p-2 rounded-full mr-3">
              <ArrowUpIcon className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Entradas por Tipo</h3>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-white border border-green-200 shadow-lg overflow-hidden rounded-xl">
            <ul className="divide-y divide-green-100">
              {Object.entries(summary?.incomeByType || {})
                .sort(([a], [b]) => {
                  if (a === 'OTHER') return 1
                  if (b === 'OTHER') return -1
                  return a.localeCompare(b)
                })
                .map(([type, amount]) => (
                  <li key={type} className="px-6 py-5 hover:bg-green-50 transition-colors duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                        <div className="text-sm font-semibold text-gray-900">
                          {getIncomeTypeLabel(type)}
                        </div>
                      </div>
                      <div className="text-lg font-bold text-green-700">
                        R$ {amount.toFixed(2)}
                      </div>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        </div>

        {/* Saídas por tipo */}
        <div className="w-full">
          <div className="flex items-center mb-6">
            <div className="bg-red-100 p-2 rounded-full mr-3">
              <ArrowDownIcon className="h-5 w-5 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Saídas por Tipo</h3>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-white border border-red-200 shadow-lg overflow-hidden rounded-xl">
            <ul className="divide-y divide-red-100">
              {Object.entries(summary?.expenseByType || {})
                .sort(([a], [b]) => {
                  if (a === 'OTHER') return 1
                  if (b === 'OTHER') return -1
                  return a.localeCompare(b)
                })
                .map(([type, amount]) => (
                  <li key={type} className="px-6 py-5 hover:bg-red-50 transition-colors duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                        <div className="text-sm font-semibold text-gray-900">
                          {getExpenseTypeLabel(type)}
                        </div>
                      </div>
                      <div className="text-lg font-bold text-red-700">
                        R$ {amount.toFixed(2)}
                      </div>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 