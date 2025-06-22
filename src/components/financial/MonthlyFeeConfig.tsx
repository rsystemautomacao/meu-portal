import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'
import { QuestionMarkCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

interface MonthlyFeeConfigProps {
  onConfigUpdate: () => void
}

export default function MonthlyFeeConfig({ onConfigUpdate }: MonthlyFeeConfigProps) {
  const { data: session } = useSession()
  const [amount, setAmount] = useState('')
  const [dueDay, setDueDay] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/financial/monthly-config')
      if (response.ok) {
        const data = await response.json()
        if (data) {
          setAmount(data.amount.toString())
          setDueDay(data.dueDay.toString())
          setIsActive(data.isActive)
        }
      }
    } catch (error) {
      console.error('Erro ao buscar configuração:', error)
      toast.error('Erro ao carregar configuração')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Iniciando salvamento da configuração...')
    setLoading(true)

    try {
      const data = {
        amount: parseFloat(amount),
        dueDay: parseInt(dueDay),
        isActive
      }
      console.log('Dados a serem enviados:', data)

      const response = await fetch('/api/financial/monthly-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      console.log('Resposta recebida:', response.status)

      if (response.ok) {
        const result = await response.json()
        console.log('Configuração salva:', result)
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 3000)
        toast.success('Configuração de mensalidade salva com sucesso!')
        onConfigUpdate()
      } else {
        const error = await response.json()
        console.error('Erro na resposta:', error)
        toast.error(error.message || 'Erro ao salvar configuração')
      }
    } catch (error) {
      console.error('Erro ao salvar configuração:', error)
      toast.error('Erro ao salvar configuração')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Configuração de Mensalidade</h2>
        <button
          type="button"
          onClick={() => setShowHelp(!showHelp)}
          className="text-gray-400 hover:text-gray-500"
        >
          <QuestionMarkCircleIcon className="h-5 w-5" />
        </button>
      </div>

      {showHelp && (
        <div className="mb-4 p-4 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-700">
            Configure aqui o valor e o dia de vencimento da mensalidade dos jogadores.
            Quando a geração automática estiver ativa, as mensalidades serão geradas
            automaticamente no dia configurado para todos os jogadores ativos.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Valor da Mensalidade
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">R$</span>
            </div>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md"
              placeholder="0.00"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Dia do Vencimento
          </label>
          <input
            type="number"
            min="1"
            max="31"
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value)}
            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            required
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-900">
            Geração automática ativa
          </label>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar Configuração'}
          </button>
        </div>
      </form>

      {showSuccess && (
        <div className="mt-4 p-4 bg-green-50 rounded-md flex items-center">
          <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
          <p className="text-sm text-green-700">
            Configuração salva com sucesso!
          </p>
        </div>
      )}
    </div>
  )
} 