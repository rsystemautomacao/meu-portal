'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'

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
    return 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validações
    if (formData.type === 'INCOME' && formData.incomeType === 'MONTHLY_FEE' && selectedPlayers.length === 0) {
      toast.error('Selecione pelo menos um jogador')
      return
    }

    if (formData.type === 'INCOME' && formData.incomeType !== 'MONTHLY_FEE' && !formData.amount) {
      toast.error('Informe o valor')
      return
    }

    if (formData.type === 'EXPENSE' && !formData.amount) {
      toast.error('Informe o valor')
      return
    }

    if (formData.type === 'INCOME' && formData.incomeType === 'OTHER' && !formData.description) {
      toast.error('Informe a descrição')
      return
    }

    try {
      setLoading(true)
      console.log('Enviando dados:', formData)

      const response = await fetch('/api/dashboard/financial/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: formData.type === 'INCOME' && formData.incomeType === 'MONTHLY_FEE'
            ? calculateTotalAmount()
            : parseFloat(formData.amount),
          playerIds: formData.type === 'INCOME' && formData.incomeType === 'MONTHLY_FEE'
            ? selectedPlayers
            : [],
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao criar transação')
      }

      const transaction = await response.json()
      console.log('Transação criada:', transaction)
      
      toast.success('Transação registrada com sucesso!')
      onTransactionCreated?.()
      
      // Limpar o formulário
      setFormData({
        type: 'INCOME',
        incomeType: '',
        expenseType: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: '',
      })
      setSelectedPlayers([])
    } catch (error) {
      console.error('Erro ao criar transação:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao registrar transação')
    } finally {
      setLoading(false)
    }
  }

  const showDescription = formData.type === 'INCOME' && formData.incomeType === 'OTHER'

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Registrar Transação</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Tipo de Transação
          </label>
          <div className="mt-1 flex space-x-4">
            <button
              type="button"
              onClick={() => handleTypeChange('INCOME')}
              className={`px-4 py-2 rounded-md ${
                formData.type === 'INCOME'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              Entrada
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('EXPENSE')}
              className={`px-4 py-2 rounded-md ${
                formData.type === 'EXPENSE'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
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
          <div className="mt-1 grid grid-cols-2 gap-2">
            {formData.type === 'INCOME' ? (
              <>
                <button
                  type="button"
                  onClick={() => handleCategoryChange('DONATION')}
                  className={`px-4 py-2 rounded-md ${
                    formData.incomeType === 'DONATION'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  Doação
                </button>
                <button
                  type="button"
                  onClick={() => handleCategoryChange('FESTIVAL')}
                  className={`px-4 py-2 rounded-md ${
                    formData.incomeType === 'FESTIVAL'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  Festival
                </button>
                <button
                  type="button"
                  onClick={() => handleCategoryChange('MONTHLY_FEE')}
                  className={`px-4 py-2 rounded-md ${
                    formData.incomeType === 'MONTHLY_FEE'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  Mensalidade
                </button>
                <button
                  type="button"
                  onClick={() => handleCategoryChange('RAFFLE')}
                  className={`px-4 py-2 rounded-md ${
                    formData.incomeType === 'RAFFLE'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  Rifa
                </button>
                <button
                  type="button"
                  onClick={() => handleCategoryChange('OTHER')}
                  className={`px-4 py-2 rounded-md ${
                    formData.incomeType === 'OTHER'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
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
                  className={`px-4 py-2 rounded-md ${
                    formData.expenseType === 'CHAMPIONSHIP'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  Campeonato
                </button>
                <button
                  type="button"
                  onClick={() => handleCategoryChange('CLEANING')}
                  className={`px-4 py-2 rounded-md ${
                    formData.expenseType === 'CLEANING'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  Itens de limpeza
                </button>
                <button
                  type="button"
                  onClick={() => handleCategoryChange('GAME_MATERIALS')}
                  className={`px-4 py-2 rounded-md ${
                    formData.expenseType === 'GAME_MATERIALS'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  Materiais de jogo
                </button>
                <button
                  type="button"
                  onClick={() => handleCategoryChange('LEAGUE_MONTHLY')}
                  className={`px-4 py-2 rounded-md ${
                    formData.expenseType === 'LEAGUE_MONTHLY'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  Mensal Liga
                </button>
                <button
                  type="button"
                  onClick={() => handleCategoryChange('COURT_MONTHLY')}
                  className={`px-4 py-2 rounded-md ${
                    formData.expenseType === 'COURT_MONTHLY'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  Mensal Quadra
                </button>
                <button
                  type="button"
                  onClick={() => handleCategoryChange('UNIFORMS')}
                  className={`px-4 py-2 rounded-md ${
                    formData.expenseType === 'UNIFORMS'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  Uniformes
                </button>
                <button
                  type="button"
                  onClick={() => handleCategoryChange('OTHER')}
                  className={`px-4 py-2 rounded-md ${
                    formData.expenseType === 'OTHER'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
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
            <label className="block text-sm font-medium text-gray-700">
              Selecionar Jogadores
            </label>
            <div className="mt-1 max-h-60 overflow-y-auto border rounded-md">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center p-2 hover:bg-gray-50"
                >
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
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    {player.name} - R$ {player.monthlyFee.toFixed(2)}
                  </label>
                </div>
              ))}
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Total: R$ {calculateTotalAmount().toFixed(2)}
            </div>
          </div>
        )}

        {formData.type === 'INCOME' && formData.incomeType !== 'MONTHLY_FEE' && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Valor
            </label>
            <div className="relative mt-1 rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-gray-500 sm:text-sm">R$</span>
              </div>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>
        )}

        {formData.type === 'EXPENSE' && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Valor
            </label>
            <div className="relative mt-1 rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-gray-500 sm:text-sm">R$</span>
              </div>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>
        )}

        {showDescription && (
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Descrição
            </label>
            <input
              type="text"
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Data
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Registrando...' : 'Registrar Transação'}
        </button>
      </form>
    </div>
  )
} 