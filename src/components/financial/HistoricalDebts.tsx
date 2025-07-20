'use client'

import { useState, useEffect } from 'react'
import { 
  ChevronDownIcon, 
  ChevronUpIcon, 
  PlusIcon, 
  TrashIcon,
  UserGroupIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

interface Player {
  id: string
  name: string
  monthlyFee: number
}

interface HistoricalDebt {
  id: string
  playerId: string
  playerName: string
  amount: number
  month: number
  year: number
  description: string
  createdAt: string
}

interface HistoricalDebtsProps {
  onDebtsChange?: () => void
}

export default function HistoricalDebts({ onDebtsChange }: HistoricalDebtsProps) {
  const [players, setPlayers] = useState<Player[]>([])
  const [historicalDebts, setHistoricalDebts] = useState<HistoricalDebt[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['add-debt']))
  
  // Form state
  const [selectedPlayer, setSelectedPlayer] = useState('')
  const [amount, setAmount] = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Buscar jogadores
      const playersResponse = await fetch('/api/players')
      if (playersResponse.ok) {
        const playersData = await playersResponse.json()
        setPlayers(playersData)
      }

      // Buscar débitos históricos
      const debtsResponse = await fetch('/api/dashboard/financial/historical-debts')
      if (debtsResponse.ok) {
        const debtsData = await debtsResponse.json()
        setHistoricalDebts(debtsData)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedPlayer || !amount || !month || !year) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/dashboard/financial/historical-debts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: selectedPlayer,
          amount: parseFloat(amount),
          month: parseInt(month),
          year: parseInt(year),
          description: description || `Débito histórico - ${month}/${year}`
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao salvar débito histórico')
      }

      toast.success('Débito histórico registrado com sucesso!')
      
      // Limpar formulário
      setSelectedPlayer('')
      setAmount('')
      setMonth('')
      setYear('')
      setDescription('')
      
      // Recarregar dados
      fetchData()
      onDebtsChange?.()
    } catch (error) {
      toast.error('Erro ao salvar débito histórico')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteDebt = async (debtId: string) => {
    if (!confirm('Tem certeza que deseja excluir este débito histórico?')) {
      return
    }

    try {
      const response = await fetch(`/api/dashboard/financial/historical-debts/${debtId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Erro ao excluir débito histórico')
      }

      toast.success('Débito histórico excluído com sucesso!')
      fetchData()
      onDebtsChange?.()
    } catch (error) {
      toast.error('Erro ao excluir débito histórico')
      console.error(error)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatMonthYear = (month: number, year: number) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]
    return `${months[month - 1]}/${year}`
  }

  const totalHistoricalDebt = historicalDebts.reduce((sum, debt) => sum + debt.amount, 0)

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
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
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="border-b border-gray-900/10 pb-6">
        <h2 className="text-base font-semibold leading-7 text-gray-900 flex items-center">
          <UserGroupIcon className="h-5 w-5 mr-2 text-indigo-600"/>
          Débitos Históricos
        </h2>
        <p className="mt-1 text-sm leading-6 text-gray-600">
          Registre débitos antigos de jogadores que já existiam antes do uso do sistema.
        </p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-5 w-5 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-600">Total em Débitos Históricos</p>
              <p className="text-lg font-semibold text-blue-900">
                {formatCurrency(totalHistoricalDebt)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="flex items-center">
            <UserGroupIcon className="h-5 w-5 text-orange-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-orange-600">Registros Históricos</p>
              <p className="text-lg font-semibold text-orange-900">
                {historicalDebts.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Seção: Adicionar Débito Histórico */}
      <div className="border border-gray-200 rounded-lg mb-6">
        <div 
          className="bg-gray-50 px-4 py-3 cursor-pointer hover:bg-gray-100"
          onClick={() => toggleSection('add-debt')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <PlusIcon className="h-5 w-5 text-indigo-600 mr-2" />
              <h3 className="font-medium text-gray-900">Adicionar Débito Histórico</h3>
            </div>
            {expandedSections.has('add-debt') ? (
              <ChevronUpIcon className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDownIcon className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>

        {expandedSections.has('add-debt') && (
          <div className="p-4 border-t border-gray-200">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jogador *
                  </label>
                  <select
                    value={selectedPlayer}
                    onChange={(e) => setSelectedPlayer(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Selecione o jogador</option>
                    {players.map(player => (
                      <option key={player.id} value={player.id}>
                        {player.name} - {formatCurrency(player.monthlyFee)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="0,00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mês *
                  </label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Selecione o mês</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>
                        {new Date(2024, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ano *
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Selecione o ano</option>
                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(y => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição (opcional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Ex: Mensalidade atrasada, Taxa de inscrição, etc."
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-indigo-400 flex items-center"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Salvando...
                    </>
                  ) : (
                    'Adicionar Débito'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Seção: Débitos Históricos Registrados */}
      <div className="border border-gray-200 rounded-lg">
        <div 
          className="bg-gray-50 px-4 py-3 cursor-pointer hover:bg-gray-100"
          onClick={() => toggleSection('registered-debts')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-5 w-5 text-green-600 mr-2" />
              <h3 className="font-medium text-gray-900">
                Débitos Históricos Registrados ({historicalDebts.length})
              </h3>
            </div>
            {expandedSections.has('registered-debts') ? (
              <ChevronUpIcon className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDownIcon className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>

        {expandedSections.has('registered-debts') && (
          <div className="p-4 border-t border-gray-200">
            {historicalDebts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Nenhum débito histórico registrado.</p>
                <p className="text-sm mt-1">Adicione débitos históricos usando o formulário acima.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {historicalDebts.map(debt => (
                  <div key={debt.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{debt.playerName}</h4>
                        <p className="text-sm text-gray-600">
                          {formatMonthYear(debt.month, debt.year)}
                        </p>
                        {debt.description && (
                          <p className="text-xs text-gray-500 mt-1">{debt.description}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
                            {formatCurrency(debt.amount)}
                          </p>
                          <p className="text-xs text-gray-500">Valor</p>
                        </div>
                        <button
                          onClick={() => handleDeleteDebt(debt.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Excluir débito"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 