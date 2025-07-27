'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  UserPlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ChevronDownIcon,
  MapPinIcon,
  CalendarIcon,
  UserIcon,
  CurrencyDollarIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import PlayerModal from '@/components/players/PlayerModal'
import PlayerPhotoModal from '@/components/players/PlayerPhotoModal'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

// Desabilitar pré-renderização estática
export const dynamic = 'force-dynamic'

interface Player {
  id: string
  name: string
  number: number
  position: string
  status: 'ACTIVE' | 'INACTIVE'
  photoUrl?: string
  birthDate?: string
  joinDate?: string
  monthlyFeeStatus?: string
  isExempt?: boolean
  monthlyFee?: number
}

export default function PlayersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | undefined>()
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; playerName: string } | null>(null)
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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
    fetchPlayers()
  }, [session, status, router])

  const fetchPlayers = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      console.log('🔄 Buscando jogadores...')
      const response = await fetch('/api/players')
      
      console.log('Response status:', response.status)
      console.log('Response headers:', response.headers)
      
      if (!response.ok) {
        let errorMessage = 'Erro ao buscar jogadores'
        
        // Tentar ler como JSON primeiro
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch (jsonError) {
          // Se não for JSON, ler como texto
          const textError = await response.text()
          console.error('❌ Resposta não-JSON:', textError)
          errorMessage = 'Erro de comunicação com o servidor'
        }
        
        throw new Error(errorMessage)
      }
      
      let data
      try {
        data = await response.json()
        console.log('✅ Jogadores carregados:', data.length)
      } catch (jsonError) {
        console.error('❌ Erro ao parsear resposta JSON:', jsonError)
        const textResponse = await response.text()
        console.log('📄 Resposta (texto):', textResponse)
        throw new Error('Resposta inválida do servidor')
      }
      
      // Garantir que data seja um array
      if (!Array.isArray(data)) {
        console.error('❌ Dados recebidos não são um array:', data)
        throw new Error('Formato de dados inválido')
      }
      
      setPlayers(data)
    } catch (error) {
      console.error('❌ Erro ao buscar jogadores:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      setError(errorMessage)
      toast.error(`Erro ao carregar jogadores: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddEdit = async (playerData: any) => {
    try {
      setError(null)
      const url = playerData.id
        ? `/api/players/${playerData.id}`
        : '/api/players'
      const method = playerData.id ? 'PUT' : 'POST'

      console.log('Enviando requisição:', {
        url,
        method,
        playerData
      })

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(playerData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erro ao salvar jogador')
      }

      setShowModal(false)
      setSelectedPlayer(undefined)
      await fetchPlayers()
    } catch (error) {
      console.error('Erro ao salvar jogador:', error)
      setError(error instanceof Error ? error.message : 'Erro ao salvar jogador')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este jogador?')) {
      return
    }

    try {
      setError(null)
      const response = await fetch(`/api/players/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erro ao excluir jogador')
      }

      await fetchPlayers()
    } catch (error) {
      console.error('Erro ao excluir jogador:', error)
      setError(error instanceof Error ? error.message : 'Erro ao excluir jogador')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'INACTIVE':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Ativo'
      case 'INACTIVE':
        return 'Inativo'
      default:
        return status
    }
  }

  const getPaymentStatusColor = (status?: string) => {
    switch (status) {
      case 'isento':
        return 'bg-gray-100 text-gray-800'
      case 'em_dia':
        return 'bg-green-100 text-green-800'
      case 'atrasado':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusText = (status?: string) => {
    switch (status) {
      case 'isento':
        return 'Isento'
      case 'em_dia':
        return 'Em dia'
      case 'atrasado':
        return 'Em atraso'
      default:
        return 'Não definido'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 w-1/4 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 w-1/2 bg-gray-200 rounded mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-xl shadow-sm p-6">
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="bg-red-100 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold text-red-900 mb-2">Erro ao carregar jogadores</h1>
            <p className="text-red-700">{error}</p>
            <button
              onClick={fetchPlayers}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="w-full p-2 sm:p-4 lg:p-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 flex items-center">
                <UserIcon className="h-6 w-6 sm:h-8 sm:w-8 mr-2 sm:mr-3 text-blue-600" />
                Jogadores
              </h1>
              <p className="text-base sm:text-lg text-gray-600">
                Gerencie o elenco do seu time
              </p>
            </div>
            <div className="mt-3 sm:mt-0">
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 w-full sm:w-auto"
              >
                <UserPlusIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Adicionar Jogador
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 shadow-sm">
            <div className="flex items-center">
              <div className="bg-green-100 rounded-lg p-3 mr-4">
                <UserIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-600">Total de Jogadores</p>
                <p className="text-2xl font-bold text-green-900">{Array.isArray(players) ? players.length : 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 shadow-sm">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-lg p-3 mr-4">
                <CheckCircleIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-600">Jogadores Ativos</p>
                <p className="text-2xl font-bold text-blue-900">
                  {Array.isArray(players) ? players.filter(p => p.status === 'ACTIVE').length : 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200 shadow-sm">
            <div className="flex items-center">
              <div className="bg-orange-100 rounded-lg p-3 mr-4">
                <CurrencyDollarIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-orange-600">Em Atraso</p>
                <p className="text-2xl font-bold text-orange-900">
                  {Array.isArray(players) ? players.filter(p => p.monthlyFeeStatus === 'atrasado').length : 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Jogadores */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.isArray(players) && players.map((player) => {
            console.log('Player:', player.name, 'isExempt:', player.isExempt)
            return (
              <div
                key={player.id}
                className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-xl hover:scale-105"
              >
              {/* Header do Card */}
              <div className="relative p-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <img
                      src={player.photoUrl || '/placeholder-player.png'}
                      alt={player.name}
                      className="h-16 w-16 rounded-full object-cover border-4 border-gray-200 hover:border-blue-300 transition-colors cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedPhoto({
                          url: player.photoUrl || '/placeholder-player.png',
                          playerName: player.name
                        })
                        setShowPhotoModal(true)
                      }}
                    />
                    <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${
                      player.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        player.status === 'ACTIVE' ? 'bg-green-100' : 'bg-red-100'
                      }`}></div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {player.name}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">
                        #{player.number}
                      </span>
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusColor(player.status)}`}>
                        {getStatusText(player.status)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informações do Jogador */}
              <div className="px-6 pb-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <MapPinIcon className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">{player.position}</span>
                  </div>
                  
                  {player.birthDate && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <CalendarIcon className="h-4 w-4 text-green-500" />
                      <span className="text-sm">
                        {new Date(new Date(player.birthDate).getTime() + 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                  
                  {player.joinDate && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <UserIcon className="h-4 w-4 text-purple-500" />
                      <span className="text-sm">
                        Entrou em {new Date(new Date(player.joinDate).getTime() + 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <CurrencyDollarIcon className="h-4 w-4 text-orange-500" />
                    {player.isExempt ? (
                      <span className="inline-flex rounded-full px-2 text-xs font-semibold leading-5 bg-gray-100 text-gray-800">
                        R$ 0,00 (Isento)
                      </span>
                    ) : (
                      typeof player.monthlyFee === 'number' && !isNaN(player.monthlyFee) && player.monthlyFee !== null && player.monthlyFee !== undefined && player.monthlyFee !== 0 ? (
                        <span className="inline-flex rounded-full px-2 text-xs font-semibold leading-5 bg-blue-100 text-blue-800">
                          {`R$ ${Number(player.monthlyFee).toFixed(2)}`}
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full px-2 text-xs font-semibold leading-5 bg-gray-100 text-gray-800">
                          Não definido
                        </span>
                      )
                    )}
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex justify-end items-center space-x-2 mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedPlayer(player)
                      setShowModal(true)
                    }}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <PencilSquareIcon className="h-4 w-4 mr-1" />
                    Editar
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(player.id)
                    }}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <TrashIcon className="h-4 w-4 mr-1" />
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          )})}
        </div>

        {/* Mensagem quando não há jogadores */}
        {Array.isArray(players) && players.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum jogador cadastrado</h3>
            <p className="text-gray-600 mb-6">Comece adicionando o primeiro jogador do seu time.</p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105"
            >
              <UserPlusIcon className="h-5 w-5 mr-2" />
              Adicionar Primeiro Jogador
            </button>
          </div>
        )}
      </div>

      <PlayerModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setSelectedPlayer(undefined)
        }}
        onSave={handleAddEdit}
        player={selectedPlayer ? {
          id: selectedPlayer.id,
          name: selectedPlayer.name,
          number: selectedPlayer.number.toString(),
          position: selectedPlayer.position,
          status: selectedPlayer.status,
          photoUrl: selectedPlayer.photoUrl,
          birthDate: selectedPlayer.birthDate,
          joinDate: selectedPlayer.joinDate,
          isExempt: !!selectedPlayer.isExempt,
          monthlyFee: selectedPlayer.monthlyFee?.toString() || ''
        } : undefined}
      />

      {selectedPhoto && (
        <PlayerPhotoModal
          isOpen={showPhotoModal}
          onClose={() => {
            setShowPhotoModal(false)
            setSelectedPhoto(null)
          }}
          photoUrl={selectedPhoto.url}
          playerName={selectedPhoto.playerName}
        />
      )}
    </div>
  )
} 