import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CurrencyDollarIcon } from '@heroicons/react/24/outline'

interface Transaction {
  id: string
  description: string
  amount: number
  type: 'INCOME' | 'EXPENSE'
  date: string
}

interface TransactionListProps {
  onTransactionDeleted?: () => void
  refresh?: number
  showActions?: boolean
}

export default function TransactionList({ onTransactionDeleted, refresh, showActions = true }: TransactionListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false) // Mudado para false inicialmente
  const [initialLoad, setInitialLoad] = useState(true) // Novo estado para controle inicial

  useEffect(() => {
    fetchTransactions()
  }, [refresh])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      // Verificar se estamos em um relatório compartilhado
      const isSharedReport = window.location.pathname.includes('/shared-reports/')
      const token = window.location.pathname.split('/shared-reports/')[1]?.split('/')[0]
      
      let url = '/api/dashboard/financial/transactions'
      if (isSharedReport && token) {
        url = `/api/shared-reports/${token}/financial/transactions`
      }
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Erro ao carregar transações')
      }
      const data = await response.json()
      setTransactions(data)
    } catch (error) {
      console.error('Erro ao carregar transações:', error)
      toast.error('Erro ao carregar transações')
    } finally {
      setLoading(false)
      setInitialLoad(false) // Marcar que o carregamento inicial foi concluído
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return

    try {
      const response = await fetch(`/api/dashboard/financial/transactions?id=${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Erro ao excluir transação')
      
      toast.success('Transação excluída com sucesso!')
      setTransactions(transactions.filter(t => t.id !== id))
      onTransactionDeleted?.()
    } catch (error) {
      console.error('Erro ao excluir transação:', error)
      toast.error('Erro ao excluir transação')
    }
  }

  // Mostrar loading apenas se não for o carregamento inicial e estiver carregando
  if (loading && !initialLoad) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // Se ainda está no carregamento inicial, mostrar conteúdo vazio sem loading
  if (initialLoad) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <span className="bg-green-100 p-2 rounded-full"><CurrencyDollarIcon className="h-7 w-7 text-green-500" /></span>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Transações Financeiras</h2>
            <p className="text-gray-600 text-sm">Histórico detalhado das movimentações do time</p>
          </div>
        </div>
        <div className="overflow-x-auto w-full max-h-[420px] md:max-h-[520px] overflow-y-auto rounded-xl border border-gray-100 shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descrição
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                {showActions && (
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Ações</span>
                </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Conteúdo vazio durante carregamento inicial */}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <span className="bg-green-100 p-2 rounded-full"><CurrencyDollarIcon className="h-7 w-7 text-green-500" /></span>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Transações Financeiras</h2>
            <p className="text-gray-600 text-sm">Histórico detalhado das movimentações do time</p>
          </div>
        </div>
        <div className="text-center py-8 text-gray-500 bg-white rounded-xl border border-gray-100 shadow-sm">
          <CurrencyDollarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-lg font-medium">Nenhuma transação registrada</p>
          <p className="text-sm text-gray-400">As transações aparecerão aqui quando forem criadas</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <span className="bg-green-100 p-2 rounded-full"><CurrencyDollarIcon className="h-7 w-7 text-green-500" /></span>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Transações Financeiras</h2>
          <p className="text-gray-600 text-sm">Histórico detalhado das movimentações do time</p>
        </div>
      </div>
      <div className="overflow-x-auto w-full max-h-[420px] md:max-h-[520px] overflow-y-auto rounded-xl border border-gray-100 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Descrição
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              {showActions && (
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Ações</span>
              </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <tr key={transaction.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(transaction.date), 'dd/MM/yyyy', { locale: ptBR })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {transaction.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}>
                    {transaction.type === 'INCOME' ? '+' : '-'} R$ {transaction.amount.toFixed(2)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    transaction.type === 'INCOME' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {transaction.type === 'INCOME' ? 'Entrada' : 'Saída'}
                  </span>
                </td>
                {showActions && (
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleDelete(transaction.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Excluir
                  </button>
                </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
} 