import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { PlusIcon, TrashIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline'

interface MonthlyFeeException {
  id?: string
  playerId: string
  amount?: number
  isExempt: boolean
  player?: {
    name: string
    number: number
  }
}

interface Player {
  id: string
  name: string
  number: number
}

interface MonthlyFeeExceptionsProps {
  onUpdate?: () => void
}

export default function MonthlyFeeExceptions({ onUpdate }: MonthlyFeeExceptionsProps) {
  const [exceptions, setExceptions] = useState<MonthlyFeeException[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showAmountHelp, setShowAmountHelp] = useState(false)

  useEffect(() => {
    fetchPlayers()
    fetchExceptions()
  }, [])

  const fetchPlayers = async () => {
    try {
      const response = await fetch('/api/players')
      if (!response.ok) throw new Error('Erro ao carregar jogadores')
      const data = await response.json()
      setPlayers(data)
    } catch (error) {
      toast.error('Erro ao carregar jogadores')
      console.error(error)
    }
  }

  const fetchExceptions = async () => {
    try {
      const response = await fetch('/api/dashboard/financial/monthly-exceptions')
      if (!response.ok) throw new Error('Erro ao carregar exceções')
      const data = await response.json()
      setExceptions(data)
    } catch (error) {
      toast.error('Erro ao carregar exceções')
      console.error(error)
    }
  }

  const handleAddException = () => {
    setExceptions(prev => [...prev, { playerId: '', isExempt: false }])
  }

  const handleRemoveException = (index: number) => {
    setExceptions(prev => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard/financial/monthly-exceptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exceptions)
      })

      if (!response.ok) throw new Error('Erro ao salvar exceções')
      
      const savedExceptions = await response.json()
      setExceptions(savedExceptions)
      toast.success('Exceções salvas com sucesso!')
      onUpdate?.()
    } catch (error) {
      toast.error('Erro ao salvar exceções')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Exceções de Mensalidade</h2>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="text-gray-400 hover:text-gray-500"
        >
          <QuestionMarkCircleIcon className="h-5 w-5" />
        </button>
      </div>

      {showHelp && (
        <div className="bg-blue-50 p-4 rounded-md mb-4 text-sm text-blue-700">
          Aqui você pode definir exceções para jogadores específicos:
          <ul className="list-disc ml-4 mt-2">
            <li>Marque "Isento" para jogadores que não pagam mensalidade</li>
            <li>Defina um valor diferente para jogadores que pagam outro valor</li>
            <li>Deixe o valor em branco para usar o valor padrão da configuração</li>
          </ul>
        </div>
      )}

      <div className="space-y-4">
        {exceptions.map((exception, index) => (
          <div key={index} className="flex gap-4 items-center">
            <select
              value={exception.playerId}
              onChange={(e) => {
                const newExceptions = [...exceptions]
                newExceptions[index] = { ...exception, playerId: e.target.value }
                setExceptions(newExceptions)
              }}
              className="flex-1 rounded-md border-gray-300"
            >
              <option value="">Selecione um jogador</option>
              {players.map(player => (
                <option key={player.id} value={player.id}>
                  {player.number} - {player.name}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={exception.isExempt}
                onChange={(e) => {
                  const newExceptions = [...exceptions]
                  newExceptions[index] = { ...exception, isExempt: e.target.checked }
                  setExceptions(newExceptions)
                }}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Isento</span>
            </div>

            {!exception.isExempt && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={exception.amount || ''}
                  onChange={(e) => {
                    const newExceptions = [...exceptions]
                    newExceptions[index] = { 
                      ...exception, 
                      amount: e.target.value ? Number(e.target.value) : undefined 
                    }
                    setExceptions(newExceptions)
                  }}
                  placeholder="Valor personalizado"
                  className="w-32 rounded-md border-gray-300"
                />
                <button
                  type="button"
                  onClick={() => setShowAmountHelp(!showAmountHelp)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <QuestionMarkCircleIcon className="h-5 w-5" />
                </button>
              </div>
            )}

            <button
              onClick={() => handleRemoveException(index)}
              className="text-red-600 hover:text-red-700"
            >
              Remover
            </button>
          </div>
        ))}

        {showAmountHelp && (
          <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm text-gray-600">
            Digite o valor total da mensalidade (não apenas a diferença).
            Por exemplo:
            <ul className="list-disc ml-4 mt-1">
              <li>Para um diretor que paga R$ 30, digite "30"</li>
              <li>Para um jogador que paga R$ 20, digite "20"</li>
              <li>Se deixar em branco, será usado o valor padrão da configuração</li>
            </ul>
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-4">
        <button
          onClick={handleAddException}
          className="px-4 py-2 text-sm font-medium text-blue-700 hover:text-blue-800"
        >
          + Adicionar Exceção
        </button>

        <button
          onClick={handleSave}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Salvando...' : 'Salvar Exceções'}
        </button>
      </div>
    </div>
  )
} 