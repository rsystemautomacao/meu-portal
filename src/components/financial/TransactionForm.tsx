'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { CurrencyDollarIcon } from '@heroicons/react/24/solid'

type IncomeType = 'DONATION' | 'FESTIVAL' | 'MONTHLY_FEE' | 'RAFFLE' | 'OTHER'
type ExpenseType = 'CHAMPIONSHIP' | 'CLEANING' | 'GAME_MATERIALS' | 'LEAGUE_MONTHLY' | 'COURT_MONTHLY' | 'UNIFORMS' | 'OTHER'

interface Player {
  id: string
  name: string
  monthlyFee: number
}

interface TransactionFormProps {
  onTransactionCreated?: () => void
}

export default function TransactionForm({ onTransactionCreated }: TransactionFormProps) {
  const [loading, setLoading] = useState(false)
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [formData, setFormData] = useState({
    type: 'INCOME' as 'INCOME' | 'EXPENSE',
    incomeType: '' as IncomeType | '',
    expenseType: '' as ExpenseType | '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
  })

  useEffect(() => {
    fetchPlayers()
  }, [])

  const fetchPlayers = async () => {
    try {
      const response = await fetch('/api/dashboard/financial/players')
      if (!response.ok) {
        throw new Error('Erro ao carregar jogadores')
      }
      const data = await response.json()
      setPlayers(data)
    } catch (error) {
      console.error('Erro ao carregar jogadores:', error)
      toast.error('Erro ao carregar jogadores')
    }
  }

  const handleTypeChange = (type: 'INCOME' | 'EXPENSE') => {
    setFormData({
      ...formData,
      type,
      incomeType: '',
      expenseType: '',
      description: '',
      amount: '',
    })
    setSelectedPlayers([])
  }

  const handleCategoryChange = (category: IncomeType | ExpenseType) => {
    if (formData.type === 'INCOME') {
      setFormData({
        ...formData,
        incomeType: category as IncomeType,
        description: getCategoryLabel(category),
      })
    } else {
      setFormData({
        ...formData,
        expenseType: category as ExpenseType,
        description: getCategoryLabel(category),
      })
    }
  }

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      // Entradas
      DONATION: 'Doação',
      FESTIVAL: 'Festival',
      MONTHLY_FEE: 'Mensalidade',
      RAFFLE: 'Rifa',
      OTHER: 'Outros',
      // Saídas
      CHAMPIONSHIP: 'Campeonato',
      CLEANING: 'Itens de limpeza',
      GAME_MATERIALS: 'Materiais de jogo',
      LEAGUE_MONTHLY: 'Mensal Liga',
      COURT_MONTHLY: 'Mensal Quadra',
      UNIFORMS: 'Uniformes',
    }
    return labels[category] || category
  }

  const calculateTotalAmount = () => {
    if (formData.type === 'INCOME' && formData.incomeType === 'MONTHLY_FEE') {
      return selectedPlayers.reduce((total, playerId) => {
        const player = players.find(p => p.id === playerId)
        return total + (player?.monthlyFee || 0)
      }, 0)
    }
    return parseFloat(formData.amount) || 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const amount = calculateTotalAmount()
      if (amount <= 0) {
        toast.error('Valor deve ser maior que zero')
        return
      }

      const transactionData = {
        type: formData.type,
        category: formData.type === 'INCOME' ? formData.incomeType : formData.expenseType,
        amount,
        date: formData.date,
        description: formData.description,
        playerIds: formData.type === 'INCOME' && formData.incomeType === 'MONTHLY_FEE' ? selectedPlayers : [],
      }

      const response = await fetch('/api/dashboard/financial/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao criar transação')
      }

      toast.success('Transação criada com sucesso!')
      
      // Reset form
      setFormData({
        type: 'INCOME',
        incomeType: '',
        expenseType: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: '',
      })
      setSelectedPlayers([])
      
      onTransactionCreated?.()
    } catch (error) {
      console.error('Erro ao criar transação:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao criar transação')
    } finally {
      setLoading(false)
    }
  }

  const showDescription = formData.type === 'INCOME' && formData.incomeType === 'OTHER'

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-white to-blue-50 rounded-2xl shadow-2xl border border-indigo-100 p-8 w-full max-w-xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <span className="bg-indigo-100 p-2 rounded-full"><CurrencyDollarIcon className="h-7 w-7 text-indigo-500" /></span>
        <h2 className="text-2xl font-bold text-indigo-900 drop-shadow">Registrar Transação</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Tipo de Transação
          </label>
          <div className="mt-1 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleTypeChange('INCOME')}
              className={`px-3 py-2 rounded-md text-sm font-semibold shadow transition-colors duration-200 ${
                formData.type === 'INCOME'
                  ? 'bg-green-100 text-green-800 ring-2 ring-green-200'
                  : 'bg-gray-100 text-gray-800 hover:bg-green-50'
              }`}
            >
              Entrada
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('EXPENSE')}
              className={`px-3 py-2 rounded-md text-sm font-semibold shadow transition-colors duration-200 ${
                formData.type === 'EXPENSE'
                  ? 'bg-red-100 text-red-800 ring-2 ring-red-200'
                  : 'bg-gray-100 text-gray-800 hover:bg-red-50'
              }`}
            >
              Saída
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Categoria
          </label>
          <div className="mt-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3">
            {formData.type === 'INCOME' ? (
              <>
                <button
                  type="button"
                  onClick={() => handleCategoryChange('DONATION')}
                  className={`px-2 py-2 rounded-lg text-xs sm:text-sm font-semibold shadow transition-colors duration-200 ${
                    formData.incomeType === 'DONATION'
                      ? 'bg-green-100 text-green-800 ring-2 ring-green-200'
                      : 'bg-gray-100 text-gray-800 hover:bg-green-50'
                  }`}
                >
                  Doação
                </button>
                <button
                  type="button"
                  onClick={() => handleCategoryChange('FESTIVAL')}
                  className={`px-2 py-2 rounded-lg text-xs sm:text-sm font-semibold shadow transition-colors duration-200 ${
                    formData.incomeType === 'FESTIVAL'
                      ? 'bg-green-100 text-green-800 ring-2 ring-green-200'
                      : 'bg-gray-100 text-gray-800 hover:bg-green-50'
                  }`}
                >
                  Festival
                </button>
                <button
                  type="button"
                  onClick={() => handleCategoryChange('MONTHLY_FEE')}
                  className={`px-2 py-2 rounded-lg text-xs sm:text-sm font-semibold shadow transition-colors duration-200 ${
                    formData.incomeType === 'MONTHLY_FEE'
                      ? 'bg-green-100 text-green-800 ring-2 ring-green-200'
                      : 'bg-gray-100 text-gray-800 hover:bg-green-50'
                  }`}
                >
                  Mensalidade
                </button>
                <button
                  type="button"
                  onClick={() => handleCategoryChange('RAFFLE')}
                  className={`px-2 py-2 rounded-lg text-xs sm:text-sm font-semibold shadow transition-colors duration-200 ${
                    formData.incomeType === 'RAFFLE'
                      ? 'bg-green-100 text-green-800 ring-2 ring-green-200'
                      : 'bg-gray-100 text-gray-800 hover:bg-green-50'
                  }`}
                >
                  Rifa
                </button>
                <button
                  type="button"
                  onClick={() => handleCategoryChange('OTHER')}
                  className={`px-2 py-2 rounded-lg text-xs sm:text-sm font-semibold shadow transition-colors duration-200 ${
                    formData.incomeType === 'OTHER'
                      ? 'bg-green-100 text-green-800 ring-2 ring-green-200'
                      : 'bg-gray-100 text-gray-800 hover:bg-green-50'
                  }`}
                >
                  Outros
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleCategoryChange('CHAMPIONSHIP')}
                  className={`px-2 py-2 rounded-lg text-xs sm:text-sm font-semibold shadow transition-colors duration-200 ${
                    formData.expenseType === 'CHAMPIONSHIP'
                      ? 'bg-red-100 text-red-800 ring-2 ring-red-200'
                      : 'bg-gray-100 text-gray-800 hover:bg-red-50'
                  }`}
                >
                  Campeonato
                </button>
                <button
                  type="button"
                  onClick={() => handleCategoryChange('CLEANING')}
                  className={`px-2 py-2 rounded-lg text-xs sm:text-sm font-semibold shadow transition-colors duration-200 ${
                    formData.expenseType === 'CLEANING'
                      ? 'bg-red-100 text-red-800 ring-2 ring-red-200'
                      : 'bg-gray-100 text-gray-800 hover:bg-red-50'
                  }`}
                >
                  Itens de limpeza
                </button>
                <button
                  type="button"
                  onClick={() => handleCategoryChange('GAME_MATERIALS')}
                  className={`px-2 py-2 rounded-lg text-xs sm:text-sm font-semibold shadow transition-colors duration-200 ${
                    formData.expenseType === 'GAME_MATERIALS'
                      ? 'bg-red-100 text-red-800 ring-2 ring-red-200'
                      : 'bg-gray-100 text-gray-800 hover:bg-red-50'
                  }`}
                >
                  Materiais de jogo
                </button>
                <button
                  type="button"
                  onClick={() => handleCategoryChange('LEAGUE_MONTHLY')}
                  className={`px-2 py-2 rounded-lg text-xs sm:text-sm font-semibold shadow transition-colors duration-200 ${
                    formData.expenseType === 'LEAGUE_MONTHLY'
                      ? 'bg-red-100 text-red-800 ring-2 ring-red-200'
                      : 'bg-gray-100 text-gray-800 hover:bg-red-50'
                  }`}
                >
                  Mensal Liga
                </button>
                <button
                  type="button"
                  onClick={() => handleCategoryChange('COURT_MONTHLY')}
                  className={`px-2 py-2 rounded-lg text-xs sm:text-sm font-semibold shadow transition-colors duration-200 ${
                    formData.expenseType === 'COURT_MONTHLY'
                      ? 'bg-red-100 text-red-800 ring-2 ring-red-200'
                      : 'bg-gray-100 text-gray-800 hover:bg-red-50'
                  }`}
                >
                  Mensal Quadra
                </button>
                <button
                  type="button"
                  onClick={() => handleCategoryChange('UNIFORMS')}
                  className={`px-2 py-2 rounded-lg text-xs sm:text-sm font-semibold shadow transition-colors duration-200 ${
                    formData.expenseType === 'UNIFORMS'
                      ? 'bg-red-100 text-red-800 ring-2 ring-red-200'
                      : 'bg-gray-100 text-gray-800 hover:bg-red-50'
                  }`}
                >
                  Uniformes
                </button>
                <button
                  type="button"
                  onClick={() => handleCategoryChange('OTHER')}
                  className={`px-2 py-2 rounded-lg text-xs sm:text-sm font-semibold shadow transition-colors duration-200 ${
                    formData.expenseType === 'OTHER'
                      ? 'bg-red-100 text-red-800 ring-2 ring-red-200'
                      : 'bg-gray-100 text-gray-800 hover:bg-red-50'
                  }`}
                >
                  Outros
                </button>
              </>
            )}
          </div>
        </div>

        {formData.type === 'INCOME' && formData.incomeType === 'MONTHLY_FEE' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jogadores
            </label>
            <div className="max-h-40 overflow-y-auto border rounded-md p-2">
              {Array.isArray(players) && players.map((player) => (
                <label key={player.id} className="flex items-center space-x-2 py-1">
                  <input
                    type="checkbox"
                    checked={selectedPlayers.includes(player.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPlayers([...selectedPlayers, player.id])
                      } else {
                        setSelectedPlayers(selectedPlayers.filter(id => id !== player.id))
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">{player.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {showDescription && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Descrição
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Descreva a transação"
            />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Valor
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="R$ 0,00"
              disabled={formData.type === 'INCOME' && formData.incomeType === 'MONTHLY_FEE'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Data
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        {formData.type === 'INCOME' && formData.incomeType === 'MONTHLY_FEE' && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              <strong>Total:</strong> R$ {calculateTotalAmount().toFixed(2)}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white py-3 px-4 rounded-xl font-bold shadow-lg hover:from-indigo-600 hover:to-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg mt-4"
        >
          {loading ? 'Registrando...' : 'Registrar Transação'}
        </button>
      </form>
    </div>
  )
} 