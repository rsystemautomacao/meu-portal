'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PencilIcon, TrashIcon, ChartBarIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import MatchModal from '@/components/matches/MatchModal'
import StatsModal from '@/components/matches/StatsModal'
import { useRouter } from 'next/navigation'

// Desabilitar pré-renderização estática
export const dynamic = 'force-dynamic'

interface Match {
  id: string
  date: string
  opponent: string
  score: string | null
  teamId: string
  team: {
    name: string
    primaryColor: string
    secondaryColor: string
  }
  matchSheet?: {
    id: string
    shareToken: string
    status: string
  }
  matchStats: Array<{
    id: string
    goals: number
    assists: number
    yellowCards: number
    redCards: number
    player: {
      id: string
      name: string
    }
  }>
}

export default function MatchesPage() {
  const { data: session, status } = useSession()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState<Match | undefined>(undefined)
  const router = useRouter()

  const fetchMatches = async () => {
    try {
      const response = await fetch('/api/matches')
      if (!response.ok) throw new Error('Erro ao buscar partidas')
      const data = await response.json()
      setMatches(data)
    } catch (error) {
      setError('Erro ao carregar partidas')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/login')
      return
    }

    // Se for admin, redirecionar para o painel admin
    if (session.user.isAdmin) {
      router.push('/admin')
      return
    }

    // Usuários comuns continuam no dashboard
    fetchMatches()
  }, [session, status, router])

  const handleAddMatch = () => {
    setSelectedMatch(undefined)
    setIsMatchModalOpen(true)
  }

  const handleEditMatch = (match: Match) => {
    setSelectedMatch(match)
    setIsMatchModalOpen(true)
  }

  const handleDeleteMatch = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta partida?')) return

    try {
      const response = await fetch(`/api/matches?id=${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Erro ao excluir partida')
      
      await fetchMatches()
    } catch (error) {
      console.error(error)
      setError('Erro ao excluir partida')
    }
  }

  const handleSaveMatch = async (matchData: any) => {
    try {
      const url = selectedMatch ? '/api/matches' : '/api/matches'
      const method = selectedMatch ? 'PUT' : 'POST'
      const data = selectedMatch ? { ...matchData, id: selectedMatch.id } : matchData

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) throw new Error('Erro ao salvar partida')

      await fetchMatches()
      setIsMatchModalOpen(false)
    } catch (error) {
      console.error(error)
      setError('Erro ao salvar partida')
    }
  }

  const handleViewStats = (match: Match) => {
    setSelectedMatch(match)
  }

  const handleCreateMatchSheet = async (matchId: string) => {
    try {
      const response = await fetch('/api/matches/sheet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ matchId })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao criar súmula')
      }

      const data = await response.json()
      const shareUrl = `${window.location.origin}/matches/sheet/${data.shareToken}`
      
      // Copia o link para a área de transferência
      await navigator.clipboard.writeText(shareUrl)
      alert('Link da súmula copiado para a área de transferência!')
      
      // Atualiza a lista de partidas
      fetchMatches()
    } catch (error) {
      console.error(error)
      alert('Erro ao criar súmula')
    }
  }

  if (loading) return <div className="p-4">Carregando...</div>
  if (error) return <div className="p-4 text-red-500">{error}</div>

  return (
    <div className="p-4">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Partidas</h1>
          <p className="mt-2 text-sm text-gray-700">
            Lista de todas as partidas do time
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={handleAddMatch}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-opacity-90"
          >
            Adicionar Partida
          </button>
        </div>
      </div>

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Data
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Adversário
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Placar
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Estatísticas
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Súmula
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {matches.map((match) => (
                    <tr key={match.id}>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {format(new Date(match.date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {match.opponent}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {match.score || '-'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <button
                          type="button"
                          onClick={() => handleViewStats(match)}
                          className="inline-flex items-center text-primary hover:text-opacity-90"
                        >
                          <ChartBarIcon className="h-5 w-5 mr-1" />
                          Ver Estatísticas
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {match.matchSheet ? (
                          <a
                            href={`/matches/sheet/${match.matchSheet.shareToken}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-primary hover:text-opacity-90"
                          >
                            <DocumentTextIcon className="h-5 w-5 mr-1" />
                            Ver Súmula
                            {match.matchSheet.status === 'pending' && (
                              <span className="ml-2 inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                                Pendente
                              </span>
                            )}
                            {match.matchSheet.status === 'in_progress' && (
                              <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                Em Andamento
                              </span>
                            )}
                            {match.matchSheet.status === 'finished' && (
                              <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                Finalizada
                              </span>
                            )}
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleCreateMatchSheet(match.id)}
                            className="inline-flex items-center text-primary hover:text-opacity-90"
                          >
                            <DocumentTextIcon className="h-5 w-5 mr-1" />
                            Criar Súmula
                          </button>
                        )}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditMatch(match)}
                            className="text-primary hover:text-primary-dark"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMatch(match.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                          {!match.matchSheet && (
                            <button
                              type="button"
                              onClick={() => handleCreateMatchSheet(match.id)}
                              className="text-primary hover:text-primary-dark"
                            >
                              <DocumentTextIcon className="h-5 w-5" />
                            </button>
                          )}
                          {match.matchSheet && (
                            <Link
                              href={`/matches/sheet/${match.matchSheet.shareToken}`}
                              className="text-primary hover:text-primary-dark"
                            >
                              <DocumentTextIcon className="h-5 w-5" />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <MatchModal
        isOpen={isMatchModalOpen}
        onClose={() => setIsMatchModalOpen(false)}
        onSave={handleSaveMatch}
        match={selectedMatch}
      />
    </div>
  )
} 