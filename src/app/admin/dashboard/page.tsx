'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDownIcon, ChevronUpIcon, ClockIcon } from '@heroicons/react/24/outline'
import AdminSendMessageModal from '@/components/admin/AdminSendMessageModal'
import UserLogsModal from '@/components/admin/UserLogsModal'

interface Team {
  id: string
  name: string
  whatsapp?: string
  primaryColor: string
  secondaryColor: string
  logo?: string
  createdAt: string
  lastAccess?: string
  userCount: number
  playerCount: number
  totalRevenue?: number
  status: string
  deletedAt?: string | null
  ownerEmail?: string
  userId?: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [messageModal, setMessageModal] = useState({ open: false, teamId: '', teamName: '' })
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set())
  const [showLogsModal, setShowLogsModal] = useState(false)
  const [selectedTeamForLogs, setSelectedTeamForLogs] = useState<Team | null>(null)

  useEffect(() => {
    fetchTeams()
  }, [])

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/admin/teams')
      if (response.ok) {
        const data = await response.json()
        setTeams(data.teams || [])
      } else {
        console.error('Erro ao buscar times')
      }
    } catch (error) {
      console.error('Erro ao buscar times:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    document.cookie = 'adminSession=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
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

  const formatLastAccess = (dateString?: string) => {
    if (!dateString) return 'Nunca acessou'
    
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    
    // Formatar data e hora
    const formatDateTime = (date: Date) => {
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${day}/${month}/${year} às ${hours}:${minutes}`
    }
    
    if (diffDays === 0) {
      if (diffHours === 0) {
        if (diffMinutes === 0) {
          return 'Agora mesmo'
        } else if (diffMinutes === 1) {
          return 'Há 1 minuto'
        } else {
          return `Há ${diffMinutes} minutos`
        }
      } else if (diffHours === 1) {
        return 'Há 1 hora'
      } else {
        return `Há ${diffHours} horas`
      }
    } else if (diffDays === 1) {
      return `Ontem às ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    } else if (diffDays < 7) {
      return `${diffDays} dias atrás às ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    } else {
      return formatDateTime(date)
    }
  }

  const handleTeamAction = async (teamId: string, action: string, newPassword?: string) => {
    try {
      const body: any = { action }
      if (newPassword) body.newPassword = newPassword

      const response = await fetch(`/api/admin/teams/${teamId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        setTeams(prev => prev.map(team => 
          team.id === teamId 
            ? { ...team, status: action === 'activate' ? 'ACTIVE' : action === 'pause' ? 'PAUSED' : 'BLOCKED' }
            : team
        ))
        console.log(`✅ Ação ${action} executada para ${teamId}`)
      } else {
        console.error('❌ Erro ao executar ação')
      }
    } catch (error) {
      console.error('Erro ao executar ação:', error)
    }
  }

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Tem certeza que deseja excluir este time? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/teams/${teamId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Atualizar lista local removendo o time
        setTeams(prev => prev.filter(team => team.id !== teamId))
        alert('Time excluído com sucesso!')
      } else {
        alert('Erro ao excluir time')
      }
    } catch (error) {
      console.error('Erro ao excluir time:', error)
      alert('Erro ao excluir time')
    }
  }

  const handleSpyTeam = async (teamId: string, teamName: string) => {
    try {
      // Buscar o email do usuário owner do time
      const response = await fetch(`/api/admin/teams/${teamId}/owner-email`)
      if (response.ok) {
        const data = await response.json()
        const { email } = data
        
        // Abrir página de login pré-preenchida
        const loginUrl = `/auth/login?email=${encodeURIComponent(email)}&spy=true`
        window.open(loginUrl, '_blank')
      } else {
        alert('Erro ao buscar email do usuário')
      }
    } catch (error) {
      console.error('Erro ao espiar time:', error)
      alert('Erro ao espiar time')
    }
  }

  const handleOpenMessageModal = (teamId: string, teamName: string) => {
    setMessageModal({ open: true, teamId, teamName })
  }

  const handleViewLogs = async (team: Team) => {
    // Buscar o email do owner do time
    try {
      console.log('🔍 Buscando logs para time:', team.name)
      console.log('🆔 ID do time:', team.id)
      
      const response = await fetch(`/api/admin/teams/${team.id}/owner-email`)
      if (response.ok) {
        const data = await response.json()
        console.log('📧 Email do owner:', data.email)
        
        // Buscar o usuário pelo email para obter o ID
        const userResponse = await fetch(`/api/admin/users?email=${encodeURIComponent(data.email)}`)
        if (userResponse.ok) {
          const users = await userResponse.json()
          console.log('👥 Usuários encontrados:', users)
          console.log('📋 Array completo:', JSON.stringify(users, null, 2))
          
          if (users.length > 0) {
            const user = users[0]
            console.log('✅ Usuário selecionado:', user.id, user.email)
            console.log('🔍 Tipo do ID:', typeof user.id)
            console.log('🔍 ID como string:', String(user.id))
            setSelectedTeamForLogs({ ...team, ownerEmail: data.email, userId: user.id })
            setShowLogsModal(true)
          }
        } else {
          console.error('❌ Erro na resposta da API de usuários:', userResponse.status)
        }
      } else {
        console.error('❌ Erro ao buscar email do owner:', response.status)
      }
    } catch (error) {
      console.error('❌ Erro ao buscar email do owner:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'PAUSED':
        return 'bg-yellow-100 text-yellow-800'
      case 'BLOCKED':
        return 'bg-red-100 text-red-800'
      case 'EXCLUIDO':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
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

  const toggleTeamExpansion = (teamId: string) => {
    setExpandedTeams(prev => {
      const newSet = new Set(prev)
      if (newSet.has(teamId)) {
        newSet.delete(teamId)
      } else {
        newSet.add(teamId)
      }
      return newSet
    })
  }

  const getStatusBadge = (status: string) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
        {getStatusText(status)}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando times...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Painel do Administrador</h1>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Times ({teams.length})</h2>
        </div>

        <div className="grid gap-6">
          {teams.map((team) => (
            <div key={team.id} className={`bg-white rounded-lg shadow-sm border ${team.status === 'EXCLUIDO' ? 'opacity-60' : ''}`}>
              {/* Card Header - Sempre visível */}
              <div 
                className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleTeamExpansion(team.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: team.primaryColor }}
                    >
                      {team.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        <span>📞 {team.whatsapp || 'Não informado'}</span>
                        <span>📅 Criado em {formatDate(team.createdAt)}</span>
                        <span>🕒 Último acesso: {formatLastAccess(team.lastAccess)}</span>
                        {getStatusBadge(team.status)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
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
                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                      {expandedTeams.has(team.id) ? (
                        <ChevronUpIcon className="h-5 w-5" />
                      ) : (
                        <ChevronDownIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Card Content - Expansível */}
              {expandedTeams.has(team.id) && (
                <div className="border-t border-gray-200 p-6 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <button 
                      onClick={() => handleOpenMessageModal(team.id, team.name)}
                      className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                      disabled={team.status === 'EXCLUIDO'}
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span>Enviar Mensagem</span>
                    </button>

                    <button 
                      onClick={() => handleTeamAction(team.id, team.status === 'ACTIVE' ? 'pause' : 'activate')}
                      className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-colors ${
                        team.status === 'ACTIVE' 
                          ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100' 
                          : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                      disabled={team.status === 'EXCLUIDO'}
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{team.status === 'ACTIVE' ? 'Pausar' : 'Ativar'}</span>
                    </button>

                    <button 
                      onClick={() => handleTeamAction(team.id, 'block')}
                      className="flex items-center justify-center space-x-2 px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                      disabled={team.status === 'EXCLUIDO'}
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                      className="flex items-center justify-center space-x-2 px-4 py-3 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                      disabled={team.status === 'EXCLUIDO'}
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      <span>Resetar Senha</span>
                    </button>

                    <button 
                      onClick={() => handleSpyTeam(team.id, team.name)}
                      className="flex items-center justify-center space-x-2 px-4 py-3 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                      disabled={team.status === 'EXCLUIDO'}
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 6v12a3 3 0 103-3H6a3 3 0 10-3 3V6a3 3 0 103-3h12a3 3 0 10-3 3" />
                      </svg>
                      <span>Espiar</span>
                    </button>

                    <button 
                      onClick={() => handleViewLogs(team)}
                      className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                      disabled={team.status === 'EXCLUIDO'}
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Ver Logs</span>
                    </button>

                    <button 
                      onClick={() => handleDeleteTeam(team.id)}
                      className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                      disabled={team.status === 'EXCLUIDO'}
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Excluir</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <AdminSendMessageModal
        isOpen={messageModal.open}
        onClose={() => setMessageModal({ open: false, teamId: '', teamName: '' })}
        teamId={messageModal.teamId}
        teamName={messageModal.teamName}
        onMessageSent={fetchTeams}
      />

      {/* User Logs Modal */}
      {showLogsModal && selectedTeamForLogs && selectedTeamForLogs.userId && (
        <UserLogsModal
          isOpen={showLogsModal}
          onClose={() => setShowLogsModal(false)}
          userId={selectedTeamForLogs.userId}
          userName={selectedTeamForLogs.name}
        />
      )}
    </div>
  )
} 