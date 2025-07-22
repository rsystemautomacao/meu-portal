'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import PaymentModal from './PaymentModal'
import { toast } from 'react-hot-toast'
import { UserGroupIcon } from '@heroicons/react/24/outline'

interface Player {
  id: string
  name: string
  monthlyFee: number
  dueDay: number
  lastPaymentDate: string | null
  status: 'paid' | 'late' | 'veryLate' | 'pending' | 'exempt'
  isExempt: boolean
}

interface PlayerPaymentStatusProps {
  onPlayerSelect?: (playerId: string) => void
  onTransactionsChange?: () => void
}

interface Payment {
  id: string
  playerId: string
  amount: number
  dueDate: string
  paymentDate?: string
  status: 'pending' | 'paid' | 'late' | 'exempt'
  month: number
  year: number
}

export default function PlayerPaymentStatus({ onPlayerSelect, onTransactionsChange }: PlayerPaymentStatusProps) {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all', 'paid', 'late', 'veryLate', 'pending', 'exempt'
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [currentPayment, setCurrentPayment] = useState<Payment | null>(null)

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
      // Garantir que data.players é um array
      if (data && data.players && Array.isArray(data.players)) {
        setPlayers(data.players)
      } else {
        setPlayers([])
      }
    } catch (error) {
      console.error('Erro ao carregar jogadores:', error)
      setPlayers([])
    } finally {
      setLoading(false)
    }
  }

  const handleOpenPaymentModal = async (player: Player) => {
    // Buscar pagamento do mês vigente
    try {
      const now = new Date()
      const month = now.getMonth() + 1
      const year = now.getFullYear()
      const res = await fetch(`/api/players/${player.id}`)
      const playerData = await res.json()
      // Procurar pagamento do mês vigente
      const payment = playerData.payments?.find((p: any) => p.month === month && p.year === year)
      if (payment) {
        setCurrentPayment(payment)
      } else {
        setCurrentPayment(null)
      }
    } catch {
      setCurrentPayment(null)
    }
    setSelectedPlayer(player)
    setShowPaymentModal(true)
  }

  // Função para registrar pagamento
  const handleRegisterPayment = async (player: Player, paymentData: any) => {
    try {
      const now = new Date()
      const month = now.getMonth() + 1
      const year = now.getFullYear()
      
      // Buscar se já existe pagamento do mês vigente
      let paymentId = currentPayment?.id
      let response
      if (paymentId) {
        // Atualizar pagamento existente
        response = await fetch(`/api/financial/payments/${paymentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: paymentData.status,
            paymentDate: paymentData.paymentDate
          })
        })
      } else {
        // Validação extra: garantir que o valor da mensalidade está definido e é maior que zero
        if (typeof player.monthlyFee !== 'number' || isNaN(player.monthlyFee) || player.monthlyFee <= 0) {
          toast.error('Defina o valor da mensalidade do jogador antes de registrar o pagamento.')
          return
        }
        // Criar novo pagamento
        const isIsento = paymentData.status === 'isento' || paymentData.status === 'exempt'
        response = await fetch('/api/financial/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerIds: [player.id],
            month,
            year,
            amount: isIsento ? 0 : player.monthlyFee,
            status: isIsento ? 'exempt' : paymentData.status
          })
        })
      }
      
      if (!response.ok) {
        if (response.status === 404) {
          // Pagamento não encontrado, recarregar lista e avisar
          fetchPlayers()
          setShowPaymentModal(false)
          setSelectedPlayer(null)
          setCurrentPayment(null)
          toast.error('O pagamento selecionado não existe mais. A lista foi atualizada.')
          // Forçar atualização do dashboard para atualizar saldo
          setTimeout(() => {
            window.location.reload()
          }, 500)
          return
        }
        const error = await response.json()
        throw new Error(error.error || 'Erro ao registrar pagamento')
      }
      
      toast.success('Pagamento registrado com sucesso!')
      
      setShowPaymentModal(false)
      setSelectedPlayer(null)
      setCurrentPayment(null)
      fetchPlayers() // Atualiza a lista
      onTransactionsChange?.() // Atualiza transações
      
      // Forçar atualização do dashboard para atualizar saldo
      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao registrar pagamento')
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
      <div className="flex items-center gap-3 mb-6">
        <span className="bg-blue-100 p-2 rounded-full"><UserGroupIcon className="h-7 w-7 text-blue-500" /></span>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Status dos Pagamentos</h2>
          <p className="text-gray-600 text-sm">Acompanhe a situação de pagamento dos jogadores</p>
        </div>
      </div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
        <h2 className="text-lg font-medium text-gray-900">Status dos Pagamentos</h2>
        <div className="flex gap-2 bg-gray-100 rounded-lg p-1 overflow-x-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-md text-sm font-semibold transition-colors duration-150 ${
              filter === 'all'
                ? 'bg-primary text-white shadow'
                : 'text-gray-700 hover:bg-primary/10'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter('paid')}
            className={`px-3 py-1 rounded-md text-sm font-semibold transition-colors duration-150 ${
              filter === 'paid'
                ? 'bg-green-500 text-white shadow'
                : 'text-gray-700 hover:bg-green-100'
            }`}
          >
            Em dia
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1 rounded-md text-sm font-semibold transition-colors duration-150 ${
              filter === 'pending'
                ? 'bg-blue-500 text-white shadow'
                : 'text-gray-700 hover:bg-blue-100'
            }`}
          >
            Pendentes
          </button>
          <button
            onClick={() => setFilter('late')}
            className={`px-3 py-1 rounded-md text-sm font-semibold transition-colors duration-150 ${
              filter === 'late'
                ? 'bg-yellow-400 text-white shadow'
                : 'text-gray-700 hover:bg-yellow-100'
            }`}
          >
            Atrasados
          </button>
          <button
            onClick={() => setFilter('veryLate')}
            className={`px-3 py-1 rounded-md text-sm font-semibold transition-colors duration-150 ${
              filter === 'veryLate'
                ? 'bg-red-500 text-white shadow'
                : 'text-gray-700 hover:bg-red-100'
            }`}
          >
            Muito Atrasados
          </button>
        </div>
      </div>

      <div className="overflow-x-auto w-full max-h-[420px] md:max-h-[520px] overflow-y-auto rounded-xl border border-gray-100 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
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
                    onClick={() => handleOpenPaymentModal(player)}
                    className={`hover:bg-gray-50 cursor-pointer${player.isExempt ? ' opacity-60' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{player.name}</div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {player.isExempt ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Isento
                        </span>
                      ) : (
                        typeof player.monthlyFee === 'number' && !isNaN(player.monthlyFee)
                          ? `R$ ${player.monthlyFee.toFixed(2)}`
                          : <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">Não definido</span>
                      )}
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
                        {player.isExempt ? 'Isento' : getStatusText(player.status)}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      {/* Modal de Pagamento */}
      <PaymentModal
        key={selectedPlayer ? selectedPlayer.id : 'none'}
        isOpen={showPaymentModal}
        onClose={() => { setShowPaymentModal(false); setSelectedPlayer(null); setCurrentPayment(null) }}
        onSave={(data) => selectedPlayer && handleRegisterPayment(selectedPlayer, data)}
        payment={currentPayment ? {
          ...currentPayment,
          playerName: selectedPlayer?.name || '',
        } : (selectedPlayer ? {
          id: selectedPlayer.id,
          playerId: selectedPlayer.id,
          playerName: selectedPlayer.name,
          amount: selectedPlayer.monthlyFee,
          dueDate: `Dia ${selectedPlayer.dueDay}`,
          status: selectedPlayer.status === 'veryLate' ? 'late' : selectedPlayer.status,
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
        } : undefined)}
      />
    </div>
  )
} 