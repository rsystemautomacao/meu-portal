'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  UserGroupIcon, 
  CurrencyDollarIcon, 
  ExclamationTriangleIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

interface Payment {
  id: string
  month: number
  year: number
  amount: number
  status: string
  dueDate: string
  paymentDate?: string
  isLate: boolean
  daysLate: number
}

interface Player {
  id: string
  name: string
  monthlyFee: number
  totalOutstanding: number
  monthsOutstanding: number
  payments: Payment[]
  hasOutstandingPayments: boolean
}

interface PaymentHistory {
  players: Player[]
  summary: {
    totalOutstanding: number
    playersWithDebt: number
    totalPlayers: number
    period: {
      startDate: string
      endDate: string
      monthsBack: number
    }
  }
}

export default function DetailedPaymentReport() {
  const [data, setData] = useState<PaymentHistory | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<'all' | 'individual'>('all')
  const [selectedPlayer, setSelectedPlayer] = useState<string>('')
  const [monthsBack, setMonthsBack] = useState(12)
  const [statusFilter, setStatusFilter] = useState<'all' | 'outstanding' | 'paid'>('all')
  const [expandedPlayers, setExpandedPlayers] = useState<Set<string>>(new Set())
  const [showFilterMenu, setShowFilterMenu] = useState(false)

  useEffect(() => {
    fetchPaymentHistory()
  }, [monthsBack, statusFilter, selectedPlayer])

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true)
      // Verificar se estamos em um relatório compartilhado
      const isSharedReport = window.location.pathname.includes('/shared-reports/')
      const token = window.location.pathname.split('/shared-reports/')[1]?.split('/')[0]
      
      let url = `/api/dashboard/financial/payment-history?monthsBack=${monthsBack}&status=${statusFilter}`
      if (isSharedReport && token) {
        url = `/api/shared-reports/${token}/financial/payment-history?monthsBack=${monthsBack}&status=${statusFilter}`
      }
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Falha ao buscar dados')
      }
      const data = await response.json()
      setData(data)
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
      toast.error('Erro ao carregar histórico')
    } finally {
      setLoading(false)
    }
  }

  const togglePlayerExpansion = (playerId: string) => {
    const newExpanded = new Set(expandedPlayers)
    if (newExpanded.has(playerId)) {
      newExpanded.delete(playerId)
    } else {
      newExpanded.add(playerId)
    }
    setExpandedPlayers(newExpanded)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-blue-100 text-blue-800'
      case 'LATE':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'Pago'
      case 'PENDING':
        return 'Pendente'
      case 'LATE':
        return 'Atrasado'
      default:
        return 'Desconhecido'
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatMonthYear = (month: number, year: number) => {
    const date = new Date(year, month - 1, 1)
    return format(date, 'MMMM/yyyy', { locale: ptBR })
  }

  const generateWhatsAppMessage = (type: 'general' | 'individual', playerId?: string) => {
    if (!data) return ''

    if (type === 'general') {
      // Mensagem consolidada
      let message = `🏈 RELATÓRIO DE MENSALIDADES - ${format(new Date(), 'MMMM/yyyy', { locale: ptBR }).toUpperCase()}\n\n`
      message += `💰 TOTAL EM ABERTO: ${formatCurrency(data.summary.totalOutstanding)}\n`
      message += `👥 JOGADORES COM DÉBITO: ${data.summary.playersWithDebt}\n\n`
      
      if (data.players.length > 0) {
        message += `📋 DETALHAMENTO:\n`
        data.players.forEach(player => {
          if (player.hasOutstandingPayments) {
            message += `• ${player.name}: ${formatCurrency(player.totalOutstanding)} (${player.monthsOutstanding} meses)\n`
          }
        })
      }
      
      return message
    } else {
      // Mensagem individual
      const targetPlayerId = playerId || selectedPlayer
      const player = data.players.find(p => p.id === targetPlayerId)
      if (!player) return ''

      let message = `💰 MENSALIDADE - ${player.name.toUpperCase()}\n\n`
      message += `💸 VALOR EM ABERTO: ${formatCurrency(player.totalOutstanding)}\n`
      message += `📅 MESES PENDENTES: ${player.monthsOutstanding}\n\n`
      
      if (player.payments.length > 0) {
        message += `📋 DETALHAMENTO:\n`
        player.payments.forEach(payment => {
          const monthYear = formatMonthYear(payment.month, payment.year)
          const status = payment.isLate ? 'Vencido' : 'Pendente'
          message += `• ${monthYear}: ${formatCurrency(payment.amount)} (${status})\n`
        })
      }
      
      message += `\n📞 Entre em contato para regularizar sua situação.`
      
      return message
    }
  }

  const copyToWhatsApp = async (type: 'general' | 'individual', playerId?: string) => {
    const message = generateWhatsAppMessage(type, playerId)
    if (!message) {
      toast.error('Nenhuma mensagem para copiar')
      return
    }

    try {
      await navigator.clipboard.writeText(message)
      if (type === 'general') {
        toast.success('Relatório copiado!')
      } else if (playerId) {
        const player = data?.players.find(p => p.id === playerId)
        toast.success(`Mensagem de ${player?.name} copiada!`)
      } else {
        toast.success('Mensagem personalizada copiada!')
      }
    } catch (error) {
      toast.error('Erro ao copiar para área de transferência')
    }
  }

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

  if (!data) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Relatório de Mensalidades</h3>
        <p className="text-gray-500">Nenhum dado disponível.</p>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <span className="bg-blue-100 p-2 rounded-full"><DocumentTextIcon className="h-7 w-7 text-blue-500" /></span>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Relatório de Mensalidades</h3>
            <p className="text-gray-600 text-sm">Acompanhe os débitos e pagamentos dos jogadores</p>
          </div>
        </div>
        {/* Filtros */}
        <div className="relative">
          <button
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition"
            onClick={() => setShowFilterMenu(v => !v)}
          >
            <FunnelIcon className="h-5 w-5" />
            Filtros
            <ChevronDownIcon className="h-4 w-4" />
          </button>
          {showFilterMenu && (
            <div className="absolute z-10 mt-2 bg-white border border-blue-200 rounded-lg shadow-lg p-2 flex flex-col gap-2 min-w-[220px]">
              <label className="font-semibold text-blue-700 text-sm">Tipo</label>
              <select
                value={filterType}
                onChange={e => { setFilterType(e.target.value as 'all' | 'individual'); if (e.target.value === 'all') setSelectedPlayer(''); }}
                className="rounded-md border-gray-300 text-sm mb-2"
              >
                <option value="all">Todos os Jogadores</option>
                <option value="individual">Jogador Específico</option>
              </select>
              {filterType === 'individual' && (
                <select
                  value={selectedPlayer}
                  onChange={e => setSelectedPlayer(e.target.value)}
                  className="rounded-md border-gray-300 text-sm mb-2"
                >
                  <option value="">Selecione o jogador</option>
                  {data.players.map(player => (
                    <option key={player.id} value={player.id}>
                      {player.name} - {formatCurrency(player.totalOutstanding)}
                    </option>
                  ))}
                </select>
              )}
              <label className="font-semibold text-blue-700 text-sm">Período</label>
              <select
                value={monthsBack}
                onChange={e => setMonthsBack(parseInt(e.target.value))}
                className="rounded-md border-gray-300 text-sm mb-2"
              >
                <option value={3}>Últimos 3 meses</option>
                <option value={6}>Últimos 6 meses</option>
                <option value={12}>Últimos 12 meses</option>
              </select>
              <label className="font-semibold text-blue-700 text-sm">Status</label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as 'all' | 'outstanding' | 'paid')}
                className="rounded-md border-gray-300 text-sm"
              >
                <option value="all">Todos</option>
                <option value="outstanding">Apenas em aberto</option>
                <option value="paid">Apenas pagos</option>
              </select>
              <button className="mt-2 px-3 py-1 bg-blue-600 text-white rounded" onClick={() => setShowFilterMenu(false)}>OK</button>
            </div>
          )}
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-5 w-5 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-600">Total em Aberto</p>
              <p className="text-lg font-semibold text-blue-900">
                {formatCurrency(data.summary.totalOutstanding)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="flex items-center">
            <UserGroupIcon className="h-5 w-5 text-orange-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-orange-600">Jogadores com Débito</p>
              <p className="text-lg font-semibold text-orange-900">
                {data.summary.playersWithDebt}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-600">Total de Jogadores</p>
              <p className="text-lg font-semibold text-green-900">
                {data.summary.totalPlayers}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Jogadores */}
      <div className="space-y-4">
        {Array.isArray(data.players) && data.players.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhum jogador encontrado para os filtros selecionados.
          </div>
        ) : (
          Array.isArray(data.players) && data.players.map(player => (
            <div key={player.id} className="border rounded-lg overflow-hidden">
              {/* Cabeçalho do jogador */}
              <div 
                className="bg-gray-50 px-4 py-3 cursor-pointer hover:bg-gray-100"
                onClick={() => togglePlayerExpansion(player.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{player.name}</h4>
                      <p className="text-sm text-gray-500">
                        {player.monthsOutstanding} meses em aberto
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(player.totalOutstanding)}
                      </p>
                      <p className="text-sm text-gray-500">Total em aberto</p>
                    </div>
                    
                    {/* Botão de copiar mensagem individual */}
                    {player.hasOutstandingPayments && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          copyToWhatsApp('individual', player.id)
                        }}
                        className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                        title="Copiar mensagem individual"
                      >
                        <ChatBubbleLeftRightIcon className="h-3 w-3" />
                        Copiar
                      </button>
                    )}
                    
                    {expandedPlayers.has(player.id) ? (
                      <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Detalhes expandidos */}
              {expandedPlayers.has(player.id) && (
                <div className="px-4 py-3 bg-white">
                  <div className="space-y-2">
                    {Array.isArray(player.payments) && player.payments.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        Nenhum pagamento registrado
                      </div>
                    ) : (
                      Array.isArray(player.payments) && player.payments.map(payment => (
                        <div key={payment.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                          <div>
                            <p className="font-medium text-gray-900">
                              {formatMonthYear(payment.month, payment.year)}
                            </p>
                            <p className="text-sm text-gray-500">
                              Vencimento: {format(new Date(payment.dueDate), 'dd/MM/yyyy')}
                              {payment.isLate && (
                                <span className="ml-2 text-red-600">
                                  ({payment.daysLate} dias atrasado)
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-right">
                              <span className="font-medium text-gray-900">
                                {formatCurrency(payment.amount)}
                              </span>
                              <div className="text-xs text-gray-500 mt-1">
                                1 mês em aberto
                              </div>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                              {getStatusText(payment.status)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Botões de Exportação */}
      <div className="flex gap-2 mt-6 pt-6 border-t border-gray-200">
        <button
          onClick={() => copyToWhatsApp('general')}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          <ChatBubbleLeftRightIcon className="h-4 w-4" />
          Copiar Relatório Geral
        </button>

        {filterType === 'individual' && selectedPlayer && (
          <button
            onClick={() => copyToWhatsApp('individual')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <ChatBubbleLeftRightIcon className="h-4 w-4" />
            Copiar Mensagem Personalizada
          </button>
        )}
      </div>
    </div>
  )
} 