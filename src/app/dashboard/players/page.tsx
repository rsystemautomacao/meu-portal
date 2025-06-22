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
  FunnelIcon
} from '@heroicons/react/24/outline'
import PlayerModal from '@/components/players/PlayerModal'
import PlayerPhotoModal from '@/components/players/PlayerPhotoModal'
import { useRouter } from 'next/navigation'

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
      setError(null)
      const response = await fetch('/api/players')
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erro ao buscar jogadores')
      }
      const data = await response.json()
      console.log('Jogadores carregados:', data)
      setPlayers(data)
    } catch (error) {
      console.error('Erro ao buscar jogadores:', error)
      setError(error instanceof Error ? error.message : 'Erro ao buscar jogadores')
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
      <div className="min-h-screen py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 w-1/4 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 w-1/2 bg-gray-200 rounded mb-8"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Jogadores</h1>
            <p className="mt-2 text-sm text-gray-700">
              Lista de todos os jogadores do time
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              type="button"
              onClick={() => {
                setSelectedPlayer(undefined)
                setShowModal(true)
              }}
              className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-opacity-90"
            >
              <UserPlusIcon className="h-5 w-5 mr-2" />
              Adicionar Jogador
            </button>
          </div>
        </div>

        <div className="mt-8 space-y-2">
          {players.map((player) => (
            <div
              key={player.id}
              className="bg-white rounded-lg shadow overflow-hidden transition-all duration-200"
            >
              <div
                className={`px-4 py-3 cursor-pointer hover:bg-gray-50 ${
                  expandedPlayerId === player.id ? 'bg-gray-50' : ''
                }`}
                onClick={() => setExpandedPlayerId(expandedPlayerId === player.id ? null : player.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <img
                        src={player.photoUrl || '/placeholder-player.png'}
                        alt={player.name}
                        className="h-12 w-12 rounded-full object-cover border-2 border-gray-200 hover:border-primary transition-colors cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedPhoto({
                            url: player.photoUrl || '/placeholder-player.png',
                            playerName: player.name
                          })
                          setShowPhotoModal(true)
                        }}
                      />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-medium text-gray-900">
                          {player.name}
                        </span>
                        <span className="text-sm text-gray-500">
                          #{player.number}
                        </span>
                      </div>
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusColor(player.status)}`}>
                        {getStatusText(player.status)}
                      </span>
                    </div>
                  </div>
                  <ChevronDownIcon
                    className={`h-5 w-5 text-gray-400 transform transition-transform duration-200 ${
                      expandedPlayerId === player.id ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </div>

              {expandedPlayerId === player.id && (
                <div className="px-4 py-4 bg-gray-50 border-t border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <MapPinIcon className="h-5 w-5" />
                        <span className="text-sm">
                          <span className="font-medium">Posição:</span>{' '}
                          {player.position}
                        </span>
                      </div>
                      {player.birthDate && (
                        <div className="flex items-center space-x-2 text-gray-600">
                          <CalendarIcon className="h-5 w-5" />
                          <span className="text-sm">
                            <span className="font-medium">Data de Nascimento:</span>{' '}
                            {new Date(new Date(player.birthDate).getTime() + 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      )}
                      {player.joinDate && (
                        <div className="flex items-center space-x-2 text-gray-600">
                          <UserIcon className="h-5 w-5" />
                          <span className="text-sm">
                            <span className="font-medium">Data de Entrada:</span>{' '}
                            {new Date(new Date(player.joinDate).getTime() + 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2 text-gray-600">
                        <CurrencyDollarIcon className="h-5 w-5" />
                        <span className="text-sm">
                          <span className="font-medium">Mensalidade:</span>{' '}
                          {player.monthlyFeeStatus}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-end items-start space-x-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedPlayer(player)
                          setShowModal(true)
                        }}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        <PencilSquareIcon className="h-4 w-4 mr-1.5" />
                        Editar
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(player.id)
                        }}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <TrashIcon className="h-4 w-4 mr-1.5" />
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
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
          isExempt: selectedPlayer.isExempt || false,
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