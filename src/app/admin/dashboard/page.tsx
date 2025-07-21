'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRightOnRectangleIcon, TrashIcon, ShieldCheckIcon, UsersIcon, UserIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline'
import AdminSendMessageModal from '@/components/admin/AdminSendMessageModal'

interface Team {
  id: string
  name: string
  whatsapp?: string
  primaryColor: string
  secondaryColor: string
  logo?: string
  createdAt: string
  userCount: number
  playerCount: number
  totalRevenue?: number
  status: string
  deletedAt?: string | null
}

export default function AdminDashboard() {
  const router = useRouter()
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [showDeleted, setShowDeleted] = useState(false)
  const [stats, setStats] = useState({
    totalTeams: 0,
    totalUsers: 0,
    totalPlayers: 0,
    totalRevenue: 0
  })
  const [messageModal, setMessageModal] = useState<{ open: boolean; teamId: string; teamName: string }>({ open: false, teamId: '', teamName: '' })

  useEffect(() => {
    // Verificar se está logado como admin
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=')
      acc[key] = value
      return acc
    }, {} as Record<string, string>)
    
    if (!cookies.adminSession) {
      router.push('/admin/login')
      return
    }

    fetchTeams()
  }, [router, showDeleted])

  const fetchTeams = async () => {
    try {
      setLoading(true)
      
      const response = await fetch(`/api/admin/teams${showDeleted ? '?showDeleted=true' : ''}`)
      if (!response.ok) {
        throw new Error('Erro ao buscar times')
      }
      
      const data = await response.json()
      setTeams(data.teams)
      
      // Calcular estatísticas
      const totalUsers = data.teams.reduce((sum: number, team: Team) => sum + team.userCount, 0)
      const totalPlayers = data.teams.reduce((sum: number, team: Team) => sum + team.playerCount, 0)
      const totalRevenue = data.teams.reduce((sum: number, team: Team) => sum + (team.totalRevenue || 0), 0)

      setStats({
        totalTeams: data.teams.length,
        totalUsers,
        totalPlayers,
        totalRevenue
      })
    } catch (error) {
      console.error('Erro ao carregar times:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    // Remover cookies de admin
    document.cookie = 'adminSession=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    document.cookie = 'adminEmail=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    router.push('/admin/login')
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  // Funções de gestão de times
  const handleTeamAction = async (teamId: string, action: string, newPassword?: string) => {
    try {
      console.log('Executando ação:', { teamId, action, hasPassword: !!newPassword })
      
      const response = await fetch(`/api/admin/teams/${teamId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, newPassword })
      })

      console.log('Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Erro na resposta:', errorData)
        throw new Error(`Erro ao executar ação: ${errorData.error || response.statusText}`)
      }

      const result = await response.json()
      console.log('Ação executada com sucesso:', result)
      
      // Recarregar times após ação
      fetchTeams()
      alert('Ação executada com sucesso!')
    } catch (error) {
      console.error('Erro ao executar ação:', error)
      alert(`Erro ao executar ação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Tem certeza que deseja excluir este time? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      console.log('Excluindo time:', teamId)
      
      const response = await fetch(`/api/admin/teams/${teamId}`, {
        method: 'DELETE'
      })

      console.log('Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Erro na resposta:', errorData)
        throw new Error(`Erro ao excluir time: ${errorData.error || response.statusText}`)
      }

      const result = await response.json()
      console.log('Time excluído com sucesso:', result)
      
      // Recarregar times após exclusão
      fetchTeams()
      alert('Time excluído com sucesso!')
    } catch (error) {
      console.error('Erro ao excluir time:', error)
      alert(`Erro ao excluir time: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  // Substituir handleSendMessage para abrir o modal
  const handleOpenMessageModal = (teamId: string, teamName: string) => {
    setMessageModal({ open: true, teamId, teamName })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-green-600 bg-green-100'
      case 'PAUSED':
        return 'text-yellow-600 bg-yellow-100'
      case 'BLOCKED':
        return 'text-red-600 bg-red-100'
      case 'EXCLUIDO':
        return 'text-gray-400 bg-gray-200 border border-gray-400'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusText = (status: string, deletedAt?: string | null) => {
    if (status === 'EXCLUIDO') {
      return deletedAt ? `Excluído em ${formatDate(deletedAt)}` : 'Excluído'
    }
    switch (status) {
      case 'ACTIVE':
        return 'Ativo'
      case 'PAUSED':
        return 'Pausado'
      case 'BLOCKED':
        return 'Bloqueado'
      default:
        return 'Desconhecido'
    }
  }

  // Verificar status de pagamento e bloquear automaticamente
  const checkPaymentStatus = async (teamId: string) => {
    try {
      const response = await fetch(`/api/admin/teams/${teamId}/payment-status`)
      if (!response.ok) {
        throw new Error('Erro ao verificar status de pagamento')
      }

      const data = await response.json()
      
      // Se está em atraso há mais de 30 dias, bloquear automaticamente
      if (data.shouldBlock && data.paymentStatus.daysOverdue > 30) {
        console.log(`🔒 Bloqueando time ${data.teamName} por atraso de ${data.paymentStatus.daysOverdue} dias`)
        
        // Bloquear o time
        await handleTeamAction(teamId, 'block')
        
        // Enviar mensagem de bloqueio
        await handleSendMessage(teamId, 'access_blocked')
        
        alert(`🔒 Time ${data.teamName} foi bloqueado automaticamente por atraso de ${data.paymentStatus.daysOverdue} dias`)
      }
      // Se está em atraso há mais de 10 dias, enviar aviso
      else if (data.isOverdue && data.paymentStatus.daysOverdue > 10) {
        console.log(`⚠️ Time ${data.teamName} em atraso há ${data.paymentStatus.daysOverdue} dias`)
        
        // Enviar mensagem de atraso
        await handleSendMessage(teamId, 'payment_overdue')
        
        alert(`⚠️ Aviso enviado para ${data.teamName} - ${data.paymentStatus.daysOverdue} dias em atraso`)
      }
      
      return data
    } catch (error) {
      console.error('Erro ao verificar status de pagamento:', error)
      return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-red-600 to-blue-600 p-2 rounded-full">
                <ShieldCheckIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard Administrativo</h1>
                <p className="text-sm text-gray-600">Gerencie todos os times do sistema</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 sm:p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-xs sm:text-sm font-medium">Total de Times</p>
                <p className="text-2xl sm:text-3xl font-bold">{stats.totalTeams}</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-full p-2 sm:p-3">
                <UsersIcon className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 sm:p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs sm:text-sm font-medium">Total de Usuários</p>
                <p className="text-2xl sm:text-3xl font-bold">{stats.totalUsers}</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-full p-2 sm:p-3">
                <UserIcon className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 sm:p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-xs sm:text-sm font-medium">Total de Jogadores</p>
                <p className="text-2xl sm:text-3xl font-bold">{stats.totalPlayers}</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-full p-2 sm:p-3">
                <svg className="h-6 w-6 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 sm:p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-xs sm:text-sm font-medium">Receita Total</p>
                <p className="text-2xl sm:text-3xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-full p-2 sm:p-3">
                <CurrencyDollarIcon className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtro de times excluídos */}
        <div className="flex items-center gap-4 mb-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={e => setShowDeleted(e.target.checked)}
              className="form-checkbox h-4 w-4 text-indigo-600"
            />
            Mostrar times excluídos
          </label>
        </div>

        {/* Teams List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Times Cadastrados</h2>
                <p className="text-gray-600 text-xs sm:text-sm">Gerencie todos os times do sistema</p>
              </div>
              <button
                onClick={async () => {
                  if (confirm('Verificar status de pagamento de todos os times e bloquear automaticamente os em atraso?')) {
                    for (const team of teams) {
                      await checkPaymentStatus(team.id)
                    }
                    alert('Verificação de pagamentos concluída!')
                  }
                }}
                className="flex items-center space-x-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Verificar Pagamentos</span>
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {teams.map((team) => (
              <div key={team.id} className={`px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors ${team.status === 'EXCLUIDO' ? 'opacity-60' : ''}`}>
                {/* Desktop Layout */}
                <div className="hidden lg:flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: team.primaryColor }}
                    >
                      {team.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>📞 {team.whatsapp || 'Não informado'}</span>
                        <span>📅 {formatDate(team.createdAt)}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(team.status)}`}>
                          {getStatusText(team.status, team.deletedAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Usuários</div>
                      <div className="text-lg font-semibold text-gray-900">{team.userCount}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Jogadores</div>
                      <div className="text-lg font-semibold text-gray-900">{team.playerCount}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Receita</div>
                      <div className="text-lg font-semibold text-green-600">{formatCurrency(team.totalRevenue || 0)}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleOpenMessageModal(team.id, team.name)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Enviar mensagem"
                        disabled={team.status === 'EXCLUIDO'}
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleTeamAction(team.id, team.status === 'ACTIVE' ? 'pause' : 'activate')}
                        className={`p-2 rounded-lg transition-colors ${
                          team.status === 'ACTIVE' 
                            ? 'text-yellow-600 hover:bg-yellow-50' 
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={team.status === 'ACTIVE' ? 'Pausar acesso' : 'Ativar acesso'}
                        disabled={team.status === 'EXCLUIDO'}
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleTeamAction(team.id, 'block')}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Bloquear acesso"
                        disabled={team.status === 'EXCLUIDO'}
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => {
                          const newPassword = prompt('Digite a nova senha:')
                          if (newPassword) {
                            handleTeamAction(team.id, 'reset_password', newPassword)
                          }
                        }}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Resetar senha"
                        disabled={team.status === 'EXCLUIDO'}
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleDeleteTeam(team.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir time"
                        disabled={team.status === 'EXCLUIDO'}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mobile Layout */}
                <div className="lg:hidden">
                  <div className="flex items-start space-x-3 mb-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={{ backgroundColor: team.primaryColor }}
                    >
                      {team.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 truncate">{team.name}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-1">
                        <span>📞 {team.whatsapp || 'Não informado'}</span>
                        <span>📅 {formatDate(team.createdAt)}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(team.status)}`}>
                          {getStatusText(team.status, team.deletedAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Usuários</div>
                      <div className="text-sm font-semibold text-gray-900">{team.userCount}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Jogadores</div>
                      <div className="text-sm font-semibold text-gray-900">{team.playerCount}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Receita</div>
                      <div className="text-sm font-semibold text-green-600">{formatCurrency(team.totalRevenue || 0)}</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <button 
                      onClick={() => handleOpenMessageModal(team.id, team.name)}
                      className="flex items-center justify-center space-x-1 px-3 py-2 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                      title="Enviar mensagem"
                      disabled={team.status === 'EXCLUIDO'}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span>Mensagem</span>
                    </button>
                    <button 
                      onClick={() => handleTeamAction(team.id, team.status === 'ACTIVE' ? 'pause' : 'activate')}
                      className={`flex items-center justify-center space-x-1 px-3 py-2 text-xs rounded-lg transition-colors ${
                        team.status === 'ACTIVE' 
                          ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100' 
                          : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                      title={team.status === 'ACTIVE' ? 'Pausar acesso' : 'Ativar acesso'}
                      disabled={team.status === 'EXCLUIDO'}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{team.status === 'ACTIVE' ? 'Pausar' : 'Ativar'}</span>
                    </button>
                    <button 
                      onClick={() => handleTeamAction(team.id, 'block')}
                      className="flex items-center justify-center space-x-1 px-3 py-2 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                      title="Bloquear acesso"
                      disabled={team.status === 'EXCLUIDO'}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span>Bloquear</span>
                    </button>
                    <button 
                      onClick={() => {
                        const newPassword = prompt('Digite a nova senha:')
                        if (newPassword) {
                          handleTeamAction(team.id, 'reset_password', newPassword)
                        }
                      }}
                      className="flex items-center justify-center space-x-1 px-3 py-2 text-xs bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                      title="Resetar senha"
                      disabled={team.status === 'EXCLUIDO'}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Reset</span>
                    </button>
                    <button 
                      onClick={() => handleDeleteTeam(team.id)}
                      className="flex items-center justify-center space-x-1 px-3 py-2 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                      title="Excluir time"
                      disabled={team.status === 'EXCLUIDO'}
                    >
                      <TrashIcon className="h-4 w-4" />
                      <span>Excluir</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <AdminSendMessageModal
        isOpen={messageModal.open}
        onClose={() => setMessageModal({ open: false, teamId: '', teamName: '' })}
        teamId={messageModal.teamId}
        teamName={messageModal.teamName}
        onMessageSent={fetchTeams}
      />
    </div>
  )
} 