import { useState } from 'react'
import { toast } from 'react-hot-toast'

interface PlayerFormProps {
  onSuccess?: () => void
}

export default function PlayerForm({ onSuccess }: PlayerFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    monthlyFee: '',
    isExempt: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/dashboard/financial/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          monthlyFee: formData.isExempt ? 0 : Number(formData.monthlyFee),
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao cadastrar jogador')
      }

      toast.success('Jogador cadastrado com sucesso!')
      setFormData({ name: '', monthlyFee: '', isExempt: false })
      onSuccess?.()
    } catch (error) {
      console.error('Erro ao cadastrar jogador:', error)
      toast.error('Erro ao cadastrar jogador')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Nome do Jogador
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formData.isExempt}
            onChange={(e) => setFormData({ ...formData, isExempt: e.target.checked })}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm font-medium text-gray-700">Isento de Mensalidade</span>
        </label>
      </div>

      {!formData.isExempt && (
        <div>
          <label htmlFor="monthlyFee" className="block text-sm font-medium text-gray-700">
            Valor da Mensalidade
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">R$</span>
            </div>
            <input
              type="number"
              id="monthlyFee"
              value={formData.monthlyFee}
              onChange={(e) => setFormData({ ...formData, monthlyFee: e.target.value })}
              required
              min="0"
              step="0.01"
              className="block w-full pl-12 rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        {loading ? 'Cadastrando...' : 'Cadastrar Jogador'}
      </button>
    </form>
  )
} 