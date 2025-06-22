'use client'

import { useSession } from 'next-auth/react'
import {
  TrophyIcon,
  BanknotesIcon,
  ExclamationCircleIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ScaleIcon,
} from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

// Desabilitar pré-renderização estática
export const dynamic = 'force-dynamic'

interface Match {
  id: string;
  opponent: string;
  date: string;
  score: string;
  result: 'victory' | 'draw' | 'defeat';
  stats: {
    goals: number;
    yellowCards: number;
    redCards: number;
  };
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
}

interface DashboardData {
  lastMatchResult: 'victory' | 'draw' | 'defeat' | null;
  balance: number;
  pendingPayments: number;
  activePlayers: number;
  totalPlayers: number;
  recentMatches: Match[];
  recentTransactions: Transaction[];
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/login')
      return
    }

    if (session.user.isAdmin) {
      router.push('/admin')
      return
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/dashboard/summary')
        if (res.ok) {
          const data = await res.json()
          setDashboardData(data)
        } else {
          setDashboardData(null)
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data', error)
        setDashboardData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [session, status, router])

  if (loading || !session) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  const getResultText = (result: 'victory' | 'draw' | 'defeat' | null) => {
    if (!result) return 'N/A';
    switch (result) {
      case 'victory': return 'Vitória';
      case 'draw': return 'Empate';
      case 'defeat': return 'Derrota';
      default: return 'N/A';
    }
  }

  const getResultColor = (result: 'victory' | 'draw' | 'defeat') => {
    switch (result) {
      case 'victory': return 'bg-green-100 text-green-800';
      case 'draw': return 'bg-yellow-100 text-yellow-800';
      case 'defeat': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Bem-vindo, {session.user?.name}!
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Aqui está um resumo do seu time
        </p>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrophyIcon className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Último Jogo
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {getResultText(dashboardData?.lastMatchResult ?? null)}
                    </div>
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
                <BanknotesIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Saldo em Caixa
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      R$ {(dashboardData?.balance ?? 0).toFixed(2)}
                    </div>
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
                <ExclamationCircleIcon className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pendências Financeiras
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {dashboardData?.pendingPayments ?? 0} jogadores
                    </div>
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
                <UserGroupIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Jogadores Ativos
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {dashboardData?.activePlayers ?? 0} / {dashboardData?.totalPlayers ?? 0}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seção de últimas partidas */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Últimas Partidas</h2>
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {dashboardData && dashboardData.recentMatches.length > 0 ? (
            <ul role="list" className="divide-y divide-gray-200">
              {dashboardData.recentMatches.map((match) => (
                <li key={match.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900">
                          vs {match.opponent}
                        </p>
                        <p className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getResultColor(match.result)}`}>
                          {match.score}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>⚽ {match.stats.goals}</span>
                        <span>🟨 {match.stats.yellowCards}</span>
                        <span>🟥 {match.stats.redCards}</span>
                        <span>{new Date(match.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Nenhuma partida registrada ainda.
            </div>
          )}
        </div>
      </div>

      {/* Seção financeira */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Últimas Movimentações</h2>
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {dashboardData && dashboardData.recentTransactions.length > 0 ? (
            <ul role="list" className="divide-y divide-gray-200">
              {dashboardData.recentTransactions.map((transaction) => (
                <li key={transaction.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-900">{transaction.description}</div>
                      <div className={`text-sm font-medium ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? <ArrowTrendingUpIcon className="h-5 w-5 inline mr-1" /> : <ArrowTrendingDownIcon className="h-5 w-5 inline mr-1" />}
                        R$ {Math.abs(transaction.amount).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Nenhuma movimentação financeira registrada.
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 