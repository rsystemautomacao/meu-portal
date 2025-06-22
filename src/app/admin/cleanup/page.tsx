'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { 
  TrashIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

interface CleanupStats {
  users: number
  teams: number
  players: number
  transactions: number
  payments: number
  monthlyFeeExceptions: number
}

export default function AdminCleanupPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<CleanupStats>({
    users: 0,
    teams: 0,
    players: 0,
    transactions: 0,
    payments: 0,
    monthlyFeeExceptions: 0
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/login')
      return
    }

    // Verificar se o usuário é admin
    if (!session.user.isAdmin) {
      router.push('/dashboard')
      return
    }

    fetchStats()
  }, [session, status, router])

  const fetchStats = async () => {
    try {
      setError(null)
      const response = await fetch('/api/admin/cleanup/stats')
      
      if (response.status === 401) {
        setError('Não autorizado. Faça login novamente.')
        router.push('/auth/login')
        return
      }
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
      setError('Erro ao carregar estatísticas. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleCleanup = async (type: string) => {
    if (!confirm(`Tem certeza que deseja limpar todos os ${type}? Esta ação não pode ser desfeita!`)) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/admin/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      })

      if (response.status === 401) {
        setError('Não autorizado. Faça login novamente.')
        router.push('/auth/login')
        return
      }

      if (!response.ok) {
        throw new Error('Erro ao executar limpeza')
      }

      toast.success(`${type} limpos com sucesso!`)
      await fetchStats()
    } catch (error) {
      console.error('Erro ao executar limpeza:', error)
      toast.error('Erro ao executar limpeza')
    } finally {
      setLoading(false)
    }
  }

  const cleanupOptions = [
    {
      title: 'Limpar Todos os Dados',
      description: 'Remove todos os usuários, times, jogadores e transações',
      type: 'all',
      color: 'bg-red-500',
      icon: ExclamationTriangleIcon,
      warning: 'ATENÇÃO: Esta ação remove TODOS os dados do sistema!'
    },
    {
      title: 'Limpar Usuários de Teste',
      description: 'Remove usuários criados para testes (emails específicos)',
      type: 'test-users',
      color: 'bg-orange-500',
      icon: TrashIcon,
      warning: 'Remove apenas usuários com emails de teste'
    },
    {
      title: 'Limpar Transações',
      description: 'Remove todas as transações financeiras',
      type: 'transactions',
      color: 'bg-yellow-500',
      icon: TrashIcon,
      warning: 'Remove todas as transações do sistema'
    },
    {
      title: 'Limpar Jogadores',
      description: 'Remove todos os jogadores cadastrados',
      type: 'players',
      color: 'bg-purple-500',
      icon: TrashIcon,
      warning: 'Remove todos os jogadores'
    },
    {
      title: 'Limpar Times',
      description: 'Remove todos os times (e seus jogadores)',
      type: 'teams',
      color: 'bg-blue-500',
      icon: TrashIcon,
      warning: 'Remove todos os times e jogadores associados'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Limpeza de Dados</h1>
              <p className="mt-2 text-gray-600">
                Ferramentas para limpeza e manutenção do sistema
              </p>
            </div>
            <button
              onClick={fetchStats}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Atualizar Estatísticas
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Erro
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Warning */}
        <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Aviso Importante
              </h3>
              <p className="text-sm text-red-700 mt-1">
                As ações de limpeza são irreversíveis. Certifique-se de fazer backup dos dados antes de executar qualquer limpeza.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm font-medium text-gray-500">Usuários</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.users}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm font-medium text-gray-500">Times</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.teams}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm font-medium text-gray-500">Jogadores</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.players}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm font-medium text-gray-500">Transações</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.transactions}</p>
          </div>
        </div>

        {/* Cleanup Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cleanupOptions.map((option) => (
            <div key={option.type} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <div className={`p-3 rounded-lg ${option.color}`}>
                  <option.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {option.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {option.description}
                  </p>
                </div>
              </div>
              
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800 font-medium">
                  {option.warning}
                </p>
              </div>

              <button
                onClick={() => handleCleanup(option.type)}
                disabled={loading}
                className={`w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${option.color} hover:opacity-90 disabled:opacity-50`}
              >
                {loading ? (
                  <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <TrashIcon className="h-4 w-4 mr-2" />
                )}
                {loading ? 'Executando...' : 'Executar Limpeza'}
              </button>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Ações Rápidas</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => window.open('/auth/register', '_blank')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              Criar Usuário de Teste
            </button>
            <button
              onClick={() => window.open('/admin', '_blank')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Voltar ao Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 