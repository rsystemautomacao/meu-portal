'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  UsersIcon, 
  UserGroupIcon, 
  CurrencyDollarIcon, 
  ChartBarIcon,
  TrashIcon,
  PlusIcon
} from '@heroicons/react/24/outline'

interface DashboardStats {
  totalUsers: number
  totalTeams: number
  totalPlayers: number
  totalTransactions: number
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalTeams: 0,
    totalPlayers: 0,
    totalTransactions: 0
  })
  const [loading, setLoading] = useState(true)
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
      const response = await fetch('/api/admin/stats')
      
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

  const adminSections = [
    {
      title: 'Gerenciar Usuários',
      description: 'Visualizar, editar e excluir usuários do sistema',
      icon: UsersIcon,
      href: '/admin/users',
      color: 'bg-blue-500'
    },
    {
      title: 'Gerenciar Times',
      description: 'Visualizar e gerenciar todos os times cadastrados',
      icon: UserGroupIcon,
      href: '/admin/teams',
      color: 'bg-green-500'
    },
    {
      title: 'Gerenciar Jogadores',
      description: 'Visualizar e gerenciar todos os jogadores',
      icon: UserGroupIcon,
      href: '/admin/players',
      color: 'bg-purple-500'
    },
    {
      title: 'Transações Financeiras',
      description: 'Visualizar todas as transações do sistema',
      icon: CurrencyDollarIcon,
      href: '/admin/transactions',
      color: 'bg-yellow-500'
    },
    {
      title: 'Relatórios',
      description: 'Relatórios e estatísticas do sistema',
      icon: ChartBarIcon,
      href: '/admin/reports',
      color: 'bg-red-500'
    },
    {
      title: 'Limpeza de Dados',
      description: 'Ferramentas para limpeza e manutenção',
      icon: TrashIcon,
      href: '/admin/cleanup',
      color: 'bg-gray-500'
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 lg:py-8">
      <div className="w-full p-2 sm:p-4 lg:p-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Painel Administrativo</h1>
          <p className="mt-2 text-gray-600">
            Gerencie todos os aspectos do sistema
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 sm:mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UsersIcon className="h-8 w-8 text-blue-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total de Usuários</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-8 w-8 text-green-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total de Times</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalTeams}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-8 w-8 text-purple-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total de Jogadores</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalPlayers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-8 w-8 text-yellow-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Transações</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalTransactions}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminSections.map((section) => (
            <Link
              key={section.title}
              href={section.href}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200 p-6"
            >
              <div className="flex items-center mb-4">
                <div className={`p-3 rounded-lg ${section.color}`}>
                  <section.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="ml-3 text-lg font-medium text-gray-900">
                  {section.title}
                </h3>
              </div>
              <p className="text-gray-600 text-sm">
                {section.description}
              </p>
            </Link>
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
              <PlusIcon className="h-4 w-4 mr-2" />
              Criar Novo Usuário
            </button>
            <button
              onClick={() => window.open('/dashboard', '_blank')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Acessar Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 