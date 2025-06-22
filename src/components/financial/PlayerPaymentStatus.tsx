'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Player {
  id: string
  name: string
  monthlyFee: number
  dueDay: number
  lastPaymentDate: string | null
  status: 'paid' | 'late' | 'veryLate' | 'pending' | 'exempt'
}

interface PlayerPaymentStatusProps {
  onPlayerSelect?: (playerId: string) => void
}

export default function PlayerPaymentStatus({ onPlayerSelect }: PlayerPaymentStatusProps) {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all', 'paid', 'late', 'veryLate', 'pending', 'exempt'

  useEffect(() => {
    fetchPlayers()
  }, [])

  const fetchPlayers = async () => {
    try {
      const response = await fetch('/api/dashboard/financial/players-status')
      if (!response.ok) {
        throw new Error('Falha ao buscar dados dos jogadores')
      }
      const data = await response.json()
      setPlayers(data)
    } catch (error) {
      console.error('Erro ao carregar jogadores:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-blue-100 text-blue-800'
      case 'late':
        return 'bg-yellow-100 text-yellow-800'
      case 'veryLate':
        return 'bg-red-100 text-red-800'
      case 'exempt':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Em dia'
      case 'pending':
        return 'Pendente'
      case 'late':
        return 'Atrasado'
      case 'veryLate':
        return 'Muito Atrasado'
      case 'exempt':
        return 'Isento'
      default:
        return 'Desconhecido'
    }
  }

  const filteredPlayers = players.filter(player => {
    if (filter === 'all') return true
    return player.status === filter
  })

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

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-900">Status dos Pagamentos</h2>
        <div className="flex space-x-2 flex-wrap justify-end gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-sm ${
              filter === 'all'
                ? 'bg-indigo-100 text-indigo-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter('paid')}
            className={`px-3 py-1 rounded-full text-sm ${
              filter === 'paid'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            Em dia
          </button>
           <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1 rounded-full text-sm ${
              filter === 'pending'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            Pendentes
          </button>
          <button
            onClick={() => setFilter('late')}
            className={`px-3 py-1 rounded-full text-sm ${
              filter === 'late'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            Atrasados
          </button>
          <button
            onClick={() => setFilter('veryLate')}
            className={`px-3 py-1 rounded-full text-sm ${
              filter === 'veryLate'
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            Muito Atrasados
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Jogador
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mensalidade
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vencimento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Último Pagamento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPlayers.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-gray-500">
                  Nenhum jogador encontrado para este filtro.
                </td>
              </tr>
            ) : (
              filteredPlayers.map((player) => {
                return (
                  <tr
                    key={player.id}
                    onClick={() => onPlayerSelect?.(player.id)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{player.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {player.monthlyFee > 0 ? `R$ ${player.monthlyFee.toFixed(2)}` : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">Dia {player.dueDay}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {player.lastPaymentDate
                          ? format(new Date(player.lastPaymentDate), "dd 'de' MMMM", {
                              locale: ptBR,
                            })
                          : 'Nunca'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          player.status
                        )}`}
                      >
                        {getStatusText(player.status)}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
} 