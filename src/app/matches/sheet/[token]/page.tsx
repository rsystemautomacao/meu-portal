'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface MatchSheet {
  id: string
  shareToken: string
  status: string
  startTime: string | null
  endTime: string | null
  firstHalfEnd: string | null
  secondHalfStart: string | null
  match: {
    id: string
    date: string
    opponent: string
    score: string | null
    team: {
      name: string
      primaryColor: string
      secondaryColor: string
    }
  }
  events: Array<{
    id: string
    type: string
    minute: number
    playerName: string
    playerNumber: number | null
    teamSide: string
    details: string | null
  }>
}

export default function MatchSheetPage() {
  const params = useParams()
  const token = params?.token as string
  const [matchSheet, setMatchSheet] = useState<MatchSheet | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newEvent, setNewEvent] = useState({
    type: 'goal',
    minute: 0,
    playerName: '',
    playerNumber: '',
    teamSide: 'home',
    details: ''
  })

  const fetchMatchSheet = async () => {
    if (!token) {
      setError('Token não encontrado')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/matches/sheet?shareToken=${token}`)
      if (!response.ok) throw new Error('Erro ao buscar súmula')
      const data = await response.json()
      setMatchSheet(data)
    } catch (error) {
      console.error(error)
      setError('Erro ao carregar súmula')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMatchSheet()
  }, [token])

  const handleStartMatch = async () => {
    if (!token) return

    try {
      const response = await fetch('/api/matches/sheet', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          shareToken: token,
          status: 'in_progress',
          startTime: new Date().toISOString()
        })
      })

      if (!response.ok) throw new Error('Erro ao iniciar partida')
      await fetchMatchSheet()
    } catch (error) {
      console.error(error)
      setError('Erro ao iniciar partida')
    }
  }

  const handleEndHalf = async () => {
    if (!matchSheet || !token) return

    try {
      const response = await fetch('/api/matches/sheet', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          shareToken: token,
          firstHalfEnd: new Date().toISOString()
        })
      })

      if (!response.ok) throw new Error('Erro ao finalizar primeiro tempo')
      await fetchMatchSheet()
    } catch (error) {
      console.error(error)
      setError('Erro ao finalizar primeiro tempo')
    }
  }

  const handleStartSecondHalf = async () => {
    if (!token) return

    try {
      const response = await fetch('/api/matches/sheet', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          shareToken: token,
          secondHalfStart: new Date().toISOString()
        })
      })

      if (!response.ok) throw new Error('Erro ao iniciar segundo tempo')
      await fetchMatchSheet()
    } catch (error) {
      console.error(error)
      setError('Erro ao iniciar segundo tempo')
    }
  }

  const handleEndMatch = async () => {
    if (!token) return

    try {
      const response = await fetch('/api/matches/sheet', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          shareToken: token,
          status: 'finished',
          endTime: new Date().toISOString()
        })
      })

      if (!response.ok) throw new Error('Erro ao finalizar partida')
      await fetchMatchSheet()
    } catch (error) {
      console.error(error)
      setError('Erro ao finalizar partida')
    }
  }

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch('/api/matches/sheet/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          matchSheetId: matchSheet?.id,
          ...newEvent,
          playerNumber: newEvent.playerNumber ? parseInt(newEvent.playerNumber) : null
        })
      })

      if (!response.ok) throw new Error('Erro ao adicionar evento')
      
      setNewEvent({
        type: 'goal',
        minute: 0,
        playerName: '',
        playerNumber: '',
        teamSide: 'home',
        details: ''
      })
      
      await fetchMatchSheet()
    } catch (error) {
      console.error(error)
      setError('Erro ao adicionar evento')
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/matches/sheet/events?id=${eventId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Erro ao excluir evento')
      await fetchMatchSheet()
    } catch (error) {
      console.error(error)
      setError('Erro ao excluir evento')
    }
  }

  if (loading) return <div className="p-4">Carregando...</div>
  if (error) return <div className="p-4 text-red-500">{error}</div>
  if (!matchSheet) return <div className="p-4">Súmula não encontrada</div>

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Súmula da Partida
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                {matchSheet.match.team.name} vs {matchSheet.match.opponent}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {format(new Date(matchSheet.match.date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>

            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <div className="space-y-4">
                {/* Status da Partida */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Status</h4>
                  <p className="mt-1 text-sm text-gray-900">
                    {matchSheet.status === 'pending' && 'Pendente'}
                    {matchSheet.status === 'in_progress' && 'Em Andamento'}
                    {matchSheet.status === 'finished' && 'Finalizada'}
                  </p>
                </div>

                {/* Controles da Partida */}
                {matchSheet.status === 'pending' && (
                  <button
                    type="button"
                    onClick={handleStartMatch}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-opacity-90"
                  >
                    Iniciar Partida
                  </button>
                )}

                {matchSheet.status === 'in_progress' && !matchSheet.firstHalfEnd && (
                  <button
                    type="button"
                    onClick={handleEndHalf}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-opacity-90"
                  >
                    Finalizar 1º Tempo
                  </button>
                )}

                {matchSheet.status === 'in_progress' && matchSheet.firstHalfEnd && !matchSheet.secondHalfStart && (
                  <button
                    type="button"
                    onClick={handleStartSecondHalf}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-opacity-90"
                  >
                    Iniciar 2º Tempo
                  </button>
                )}

                {matchSheet.status === 'in_progress' && matchSheet.secondHalfStart && (
                  <button
                    type="button"
                    onClick={handleEndMatch}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-opacity-90"
                  >
                    Finalizar Partida
                  </button>
                )}

                {/* Formulário de Eventos */}
                {matchSheet.status === 'in_progress' && (
                  <form onSubmit={handleAddEvent} className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                          Tipo de Evento
                        </label>
                        <select
                          id="type"
                          name="type"
                          value={newEvent.type}
                          onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                        >
                          <option value="goal">Gol</option>
                          <option value="assist">Assistência</option>
                          <option value="yellow_card">Cartão Amarelo</option>
                          <option value="red_card">Cartão Vermelho</option>
                          <option value="substitution">Substituição</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="minute" className="block text-sm font-medium text-gray-700">
                          Minuto
                        </label>
                        <input
                          type="number"
                          name="minute"
                          id="minute"
                          min="0"
                          required
                          value={newEvent.minute}
                          onChange={(e) => setNewEvent({ ...newEvent, minute: parseInt(e.target.value) })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="playerName" className="block text-sm font-medium text-gray-700">
                          Nome do Jogador
                        </label>
                        <input
                          type="text"
                          name="playerName"
                          id="playerName"
                          required
                          value={newEvent.playerName}
                          onChange={(e) => setNewEvent({ ...newEvent, playerName: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="playerNumber" className="block text-sm font-medium text-gray-700">
                          Número do Jogador
                        </label>
                        <input
                          type="number"
                          name="playerNumber"
                          id="playerNumber"
                          min="0"
                          value={newEvent.playerNumber}
                          onChange={(e) => setNewEvent({ ...newEvent, playerNumber: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="teamSide" className="block text-sm font-medium text-gray-700">
                          Time
                        </label>
                        <select
                          id="teamSide"
                          name="teamSide"
                          value={newEvent.teamSide}
                          onChange={(e) => setNewEvent({ ...newEvent, teamSide: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                        >
                          <option value="home">{matchSheet.match.team.name}</option>
                          <option value="away">{matchSheet.match.opponent}</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="details" className="block text-sm font-medium text-gray-700">
                          Detalhes
                        </label>
                        <input
                          type="text"
                          name="details"
                          id="details"
                          value={newEvent.details}
                          onChange={(e) => setNewEvent({ ...newEvent, details: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <button
                        type="submit"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-opacity-90"
                      >
                        Adicionar Evento
                      </button>
                    </div>
                  </form>
                )}

                {/* Lista de Eventos */}
                <div className="mt-8">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Eventos da Partida</h4>
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Minuto
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Tipo
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Jogador
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Time
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Detalhes
                          </th>
                          {matchSheet.status === 'in_progress' && (
                            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                              <span className="sr-only">Ações</span>
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {matchSheet.events.map((event) => (
                          <tr key={event.id}>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {event.minute}'
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {event.type === 'goal' && 'Gol'}
                              {event.type === 'assist' && 'Assistência'}
                              {event.type === 'yellow_card' && 'Cartão Amarelo'}
                              {event.type === 'red_card' && 'Cartão Vermelho'}
                              {event.type === 'substitution' && 'Substituição'}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {event.playerName} {event.playerNumber && `(${event.playerNumber})`}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {event.teamSide === 'home' ? matchSheet.match.team.name : matchSheet.match.opponent}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {event.details || '-'}
                            </td>
                            {matchSheet.status === 'in_progress' && (
                              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteEvent(event.id)}
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 