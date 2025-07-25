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
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  
  // Form state
  const [selectedPlayer, setSelectedPlayer] = useState('')
  const [amount, setAmount] = useState('')
  const [selectedMonths, setSelectedMonths] = useState<number[]>([])
  const [year, setYear] = useState('')
  const [description, setDescription] = useState('')
  const [monthsCount, setMonthsCount] = useState(1)

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
    
    if (!selectedPlayer || !amount || selectedMonths.length === 0 || !year) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    setSaving(true)
    try {
      // Criar múltiplos débitos para os meses selecionados
      const promises = selectedMonths.map(month => 
        fetch('/api/dashboard/financial/historical-debts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerId: selectedPlayer,
            amount: parseFloat(amount),
            month: month,
            year: parseInt(year),
            description: description || `Débito histórico - ${month}/${year}`
          })
        })
      )

      const responses = await Promise.all(promises)
      const hasError = responses.some(response => !response.ok)

      if (hasError) {
        throw new Error('Erro ao salvar débitos históricos')
      }

      toast.success(`${selectedMonths.length} débito(s) histórico(s) registrado(s) com sucesso!`)
      
      // Limpar formulário
      setSelectedPlayer('')
      setAmount('')
      setSelectedMonths([])
      setYear('')
      setDescription('')
      setMonthsCount(1)
      
      // Recarregar dados
      fetchData()
      onDebtsChange?.()
    } catch (error) {
      toast.error('Erro ao salvar débitos históricos')
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

  const getMonthName = (month: number) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]
    return months[month - 1]
  }

  const handleMonthSelection = (month: number) => {
    const newSelectedMonths = [...selectedMonths]
    const index = newSelectedMonths.indexOf(month)
    
    if (index > -1) {
      newSelectedMonths.splice(index, 1)
    } else {
      newSelectedMonths.push(month)
    }
    
    setSelectedMonths(newSelectedMonths.sort((a, b) => a - b))
  }

  const handleQuickSelection = (count: number) => {
    const currentYear = parseInt(year) || new Date().getFullYear()
    const currentMonth = new Date().getMonth() + 1
    
    const months: number[] = []
    for (let i = 0; i < count; i++) {
      const month = currentMonth - i
      if (month > 0) {
        months.push(month)
      }
    }
    
    setSelectedMonths(months.sort((a, b) => a - b))
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
    <div className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-xl shadow-lg border border-gray-200">
      <div className="border-b border-gray-200 pb-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center mb-2">
          <UserGroupIcon className="h-6 w-6 mr-3 text-indigo-600"/>
          Débitos Históricos
        </h2>
        <p className="text-gray-600 leading-relaxed">
          Registre débitos antigos de jogadores que já existiam antes do uso do sistema.
        </p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 shadow-sm">
          <div className="flex items-center">
            <div className="bg-blue-600 p-3 rounded-full">
              <CurrencyDollarIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-700">Total em Débitos Históricos</p>
              <p className="text-2xl font-bold text-blue-900">
                {formatCurrency(totalHistoricalDebt)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200 shadow-sm">
          <div className="flex items-center">
            <div className="bg-orange-600 p-3 rounded-full">
              <UserGroupIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-orange-700">Registros Históricos</p>
              <p className="text-2xl font-bold text-orange-900">
                {historicalDebts.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Seção: Adicionar Débito Histórico */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-8">
        <div 
          className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 cursor-pointer hover:from-indigo-100 hover:to-purple-100 transition-all duration-200"
          onClick={() => toggleSection('add-debt')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-indigo-600 p-2 rounded-full mr-3">
                <PlusIcon className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Adicionar Débito Histórico</h3>
            </div>
            {expandedSections.has('add-debt') ? (
              <ChevronUpIcon className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDownIcon className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>

        {expandedSections.has('add-debt') && (
          <div className="p-6 border-t border-gray-200">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Jogador *
                  </label>
                  <select
                    value={selectedPlayer}
                    onChange={(e) => setSelectedPlayer(e.target.value)}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Valor por Mês *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                    placeholder="0,00"
                    required
                  />
                </div>
              </div>

              {/* Ano */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ano *
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm max-w-xs"
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

              {/* Seleção Rápida de Meses */}
              {year && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Seleção Rápida
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuickSelection(1)}
                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                      >
                        Último mês
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickSelection(3)}
                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                      >
                        Últimos 3 meses
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickSelection(6)}
                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                      >
                        Últimos 6 meses
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedMonths([])}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                      >
                        Limpar seleção
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Meses Selecionados ({selectedMonths.length})
                    </label>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <button
                          key={month}
                          type="button"
                          onClick={() => handleMonthSelection(month)}
                          className={`p-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium ${
                            selectedMonths.includes(month)
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-300 hover:bg-indigo-50'
                          }`}
                        >
                          {getMonthName(month)}
                        </button>
                      ))}
                    </div>
                    {selectedMonths.length > 0 && (
                      <p className="text-sm text-gray-600 mt-2">
                        Total: {formatCurrency(parseFloat(amount || '0') * selectedMonths.length)} 
                        ({selectedMonths.length} mês{selectedMonths.length > 1 ? 'es' : ''})
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Descrição */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Descrição (opcional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                  placeholder="Ex: Mensalidade atrasada, Taxa de inscrição, etc."
                />
              </div>

              {/* Botão de Envio */}
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={saving || selectedMonths.length === 0}
                  className="rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:from-indigo-700 hover:to-purple-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed flex items-center transition-all duration-200"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Adicionar {selectedMonths.length} Débito{selectedMonths.length > 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Seção: Débitos Históricos Registrados */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div 
          className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 cursor-pointer hover:from-green-100 hover:to-emerald-100 transition-all duration-200"
          onClick={() => toggleSection('registered-debts')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-green-600 p-2 rounded-full mr-3">
                <CurrencyDollarIcon className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
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
          <div className="p-6 border-t border-gray-200">
            {historicalDebts.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CurrencyDollarIcon className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">Nenhum débito histórico registrado</p>
                <p className="text-sm text-gray-400 mt-1">Adicione débitos históricos usando o formulário acima</p>
              </div>
            ) : (
              <div className="space-y-4">
                {historicalDebts.map(debt => (
                  <div key={debt.id} className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <div className="bg-indigo-100 p-2 rounded-full mr-3">
                            <UserGroupIcon className="h-4 w-4 text-indigo-600" />
                          </div>
                          <h4 className="font-bold text-gray-900 text-lg">{debt.playerName}</h4>
                        </div>
                        <div className="ml-11">
                          <p className="text-sm text-gray-600 font-medium">
                            {formatMonthYear(debt.month, debt.year)}
                          </p>
                          {debt.description && (
                            <p className="text-xs text-gray-500 mt-1 italic">"{debt.description}"</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-xl font-bold text-gray-900">
                            {formatCurrency(debt.amount)}
                          </p>
                          <p className="text-xs text-gray-500 font-medium">Valor</p>
                        </div>
                        <button
                          onClick={() => handleDeleteDebt(debt.id)}
                          className="bg-red-50 p-2 rounded-lg hover:bg-red-100 transition-colors group"
                          title="Excluir débito"
                        >
                          <TrashIcon className="h-4 w-4 text-red-600 group-hover:text-red-700" />
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