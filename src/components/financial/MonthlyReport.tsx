'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline'

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
      const response = await fetch(
        `/api/dashboard/financial/monthly-summary?month=${format(selectedMonth, 'yyyy-MM')}`
      )
      const data = await response.json()
      setSummary(data)
    } catch (error) {
      console.error('Erro ao carregar resumo mensal:', error)
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
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <h2 className="text-lg font-medium text-gray-900">Resumo Financeiro</h2>
        <p className="mt-4 text-gray-500">
          Não há dados financeiros para o mês selecionado.
        </p>
        <input
          type="month"
          value={format(selectedMonth, 'yyyy-MM')}
          onChange={(e) => setSelectedMonth(new Date(e.target.value))}
          className="mt-4 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-900">Resumo Financeiro</h2>
        <input
          type="month"
          value={format(selectedMonth, 'yyyy-MM')}
          onChange={(e) => setSelectedMonth(new Date(e.target.value))}
          className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      {/* Cards de resumo com fallback */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Saldo do Mês
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    R$ {(summary.balance || 0).toFixed(2)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowUpIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total de Entradas
                  </dt>
                  <dd className="text-lg font-medium text-green-600">
                    R$ {(summary.totalIncome || 0).toFixed(2)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowDownIcon className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total de Saídas
                  </dt>
                  <dd className="text-lg font-medium text-red-600">
                    R$ {(summary.totalExpense || 0).toFixed(2)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detalhamento por tipo */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Entradas por tipo */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Entradas por Tipo</h3>
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {Object.entries(summary?.incomeByType || {})
                .sort(([a], [b]) => {
                  if (a === 'OTHER') return 1
                  if (b === 'OTHER') return -1
                  return a.localeCompare(b)
                })
                .map(([type, amount]) => (
                  <li key={type} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-gray-900">
                        {getIncomeTypeLabel(type)}
                      </div>
                      <div className="text-sm text-green-600">
                        R$ {amount.toFixed(2)}
                      </div>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        </div>

        {/* Saídas por tipo */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Saídas por Tipo</h3>
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {Object.entries(summary?.expenseByType || {})
                .sort(([a], [b]) => {
                  if (a === 'OTHER') return 1
                  if (b === 'OTHER') return -1
                  return a.localeCompare(b)
                })
                .map(([type, amount]) => (
                  <li key={type} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-gray-900">
                        {getExpenseTypeLabel(type)}
                      </div>
                      <div className="text-sm text-red-600">
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