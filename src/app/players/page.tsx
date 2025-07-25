'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import PlayerModal from '@/components/players/PlayerModal'

interface BasePlayer {
  name: string
  number: number
  position: string
  birthDate?: string
  joinDate?: string
  monthlyFee: number
  isExempt: boolean
  status: 'ACTIVE' | 'INACTIVE'
  photoUrl?: string
}

interface Player extends BasePlayer {
  id: string
}

interface PlayerModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (player: BasePlayer & { id?: string }) => void
  player?: Player
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | undefined>(undefined)

  useEffect(() => {
    fetchPlayers()
  }, [])

  const fetchPlayers = async () => {
    try {
      const response = await fetch('/api/players')
      const data = await response.json()
      setPlayers(data)
    } catch (error) {
      console.error('Erro ao carregar jogadores:', error)
      toast.error('Erro ao carregar jogadores')
    }
  }

  const handleAddEdit = async (playerData: BasePlayer & { id?: string }) => {
    setLoading(true)
    const isEditing = !!playerData.id

    try {
      const response = await fetch(`/api/players${isEditing ? `/${playerData.id}` : ''}`, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(playerData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || `Erro ao ${isEditing ? 'atualizar' : 'cadastrar'} jogador`)
      }

      toast.success(`Jogador ${isEditing ? 'atualizado' : 'cadastrado'} com sucesso!`)
      setIsModalOpen(false)
      setSelectedPlayer(undefined)
      fetchPlayers()
    } catch (error) {
      console.error(`Erro ao ${isEditing ? 'atualizar' : 'cadastrar'} jogador:`, error)
      toast.error(error instanceof Error ? error.message : `Erro ao ${isEditing ? 'atualizar' : 'cadastrar'} jogador`)
    } finally {
      setLoading(false)
    }
  }

  const handleFormSubmit = (formData: any) => {
    const playerData: BasePlayer & { id?: string } = {
      id: formData.id,
      name: formData.name,
      number: parseInt(formData.number),
      position: formData.position,
      status: formData.status,
      photoUrl: formData.photoUrl,
      birthDate: formData.birthDate,
      joinDate: formData.joinDate,
      isExempt: formData.isExempt,
      monthlyFee: parseFloat(formData.monthlyFee || '0')
    }
    handleAddEdit(playerData)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este jogador?')) {
      return
    }

    try {
      const response = await fetch(`/api/players/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao excluir jogador')
      }

      toast.success(data.message || 'Jogador excluído com sucesso!')
      fetchPlayers()
    } catch (error) {
      console.error('Erro ao excluir jogador:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir jogador')
    }
  }

  const handleEdit = (player: Player) => {
    setSelectedPlayer(player)
    setIsModalOpen(true)
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jogadores</h1>
          <p className="text-gray-600">Lista de todos os jogadores do time</p>
        </div>
        <button
          onClick={() => {
            setSelectedPlayer(undefined)
            setIsModalOpen(true)
          }}
          className="bg-black text-white px-4 py-2 rounded-md flex items-center space-x-2"
        >
          <span className="text-xl">+</span>
          <span>Adicionar Jogador</span>
        </button>
      </div>

      <PlayerModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedPlayer(undefined)
        }}
        onSave={handleFormSubmit}
        player={selectedPlayer ? {
          id: selectedPlayer.id,
          name: selectedPlayer.name,
          number: selectedPlayer.number.toString(),
          position: selectedPlayer.position,
          status: selectedPlayer.status,
          photoUrl: selectedPlayer.photoUrl,
          birthDate: selectedPlayer.birthDate,
          joinDate: selectedPlayer.joinDate,
          isExempt: selectedPlayer.isExempt,
          monthlyFee: selectedPlayer.monthlyFee.toString()
        } : undefined}
      />

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8 w-full">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300 text-xs sm:text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Nome
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Posição
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Data de Nascimento
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Data de Entrada
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Mensalidade
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {Array.isArray(players) && players.map((player) => (
                    <tr key={player.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {player.name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{player.position}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {player.birthDate ? format(new Date(player.birthDate), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {player.joinDate ? format(new Date(player.joinDate), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {player.isExempt ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Isento
                          </span>
                        ) : (
                          !isNaN(Number(player.monthlyFee)) && String(player.monthlyFee) !== '' && player.monthlyFee !== null && player.monthlyFee !== undefined
                            ? `R$ ${Number(player.monthlyFee).toFixed(2)}`
                            : <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">Não definido</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            player.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {player.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={() => handleEdit(player)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(player.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 