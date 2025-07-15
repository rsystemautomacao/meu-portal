'use client'

import { Dialog, Transition } from '@headlessui/react'
import { Fragment, useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PencilIcon, TrashIcon, ChartBarIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import MatchModal from '@/components/matches/MatchModal'
import StatsModal from '@/components/matches/StatsModal'
import { useRouter } from 'next/navigation'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { toast } from 'react-toastify'

// Desabilitar pré-renderização estática
export const dynamic = 'force-dynamic'

interface Match {
  id: string
  date: string
  opponent: string
  ourScore: number
  opponentScore: number
  ourScore1: number
  opponentScore1: number
  ourScore2: number
  opponentScore2: number
  teamId: string
  team?: {
    name: string
    primaryColor: string
    secondaryColor: string
  }
  matchSheet?: {
    id: string
    shareToken: string
    status: string
  }
  matchStats?: Array<{
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
  events?: Array<{
    id: string
    type: string
    player: string
    minute: number
    team: string
    quadro: number
    assist?: string
  }>
}

// Função utilitária para cor do badge por resultado
function getQuadroBadgeColor(ourScore: number, opponentScore: number) {
  if (ourScore > opponentScore) return 'bg-green-100 text-green-800';
  if (ourScore < opponentScore) return 'bg-red-100 text-red-800';
  return 'bg-blue-100 text-blue-800';
}

export default function MatchesPage() {
  const { data: session, status } = useSession()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState<Match | undefined>(undefined)
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false)
  const [choice, setChoice] = useState<'manual' | 'sumula' | null>(null)
  const [sumulaLink, setSumulaLink] = useState<string | null>(null)
  const [sumulaLoading, setSumulaLoading] = useState(false)
  const [showSumulaForm, setShowSumulaForm] = useState(false)
  const [sumulaForm, setSumulaForm] = useState({ date: null as Date | null, opponent: '', location: '' })
  const [sumulaFormError, setSumulaFormError] = useState('')
  const router = useRouter()
  const [copied, setCopied] = useState(false)

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
    setChoice(null)
    setIsChoiceModalOpen(true)
  }

  const handleEditMatch = (match: Match) => {
    setSelectedMatch(match)
    setIsMatchModalOpen(true)
  }

  const handleDeleteMatch = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta partida?')) return

    try {
      const response = await fetch(`/api/matches/${id}`, {
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
      const url = selectedMatch ? `/api/matches/${selectedMatch.id}` : '/api/matches'
      const method = selectedMatch ? 'PUT' : 'POST'
      const data = selectedMatch ? matchData : matchData

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

  const handleCreateMatchSheet = async () => {
    setSumulaForm({ date: null, opponent: '', location: '' })
    setSumulaFormError('')
    setShowSumulaForm(true)
  }
  const handleConfirmSumulaForm = async () => {
    if (!sumulaForm.date || !sumulaForm.opponent || !sumulaForm.location) {
      setSumulaFormError('Preencha todos os campos!')
      return
    }
    setSumulaLoading(true)
    setSumulaFormError('')
    try {
      const res = await fetch('/api/matches/sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: sumulaForm.date.toISOString(),
          opponent: sumulaForm.opponent,
          location: sumulaForm.location
        })
      })
      const data = await res.json()
      if (data.shareToken) {
        setSumulaLink(`${window.location.origin}/matches/sheet/${data.shareToken}`)
        setShowSumulaForm(false)
      } else {
        setSumulaFormError(data.error || 'Erro ao criar súmula')
      }
    } catch (e) {
      setSumulaFormError('Erro ao criar súmula')
    } finally {
      setSumulaLoading(false)
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
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8 w-full">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300 text-xs sm:text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Data
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Adversário
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      1º Quadro
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      2º Quadro
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
                      <td className="whitespace-nowrap px-3 py-4 text-center">
                        <span className={`inline-block text-base font-bold rounded px-3 py-1 ${getQuadroBadgeColor(match.ourScore1, match.opponentScore1)}`}>
                          {match.ourScore1} × {match.opponentScore1}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-center">
                        <span className={`inline-block text-base font-bold rounded px-3 py-1 ${getQuadroBadgeColor(match.ourScore2, match.opponentScore2)}`}>
                          {match.ourScore2} × {match.opponentScore2}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {match.events && match.events.length > 0 ? (
                          <button
                            type="button"
                            className="inline-flex items-center text-primary hover:text-primary-dark"
                            onClick={() => handleViewStats(match)}
                          >
                            <ChartBarIcon className="h-5 w-5 mr-1" />
                            Ver Estatísticas
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="inline-flex items-center text-gray-400 cursor-not-allowed"
                            title="Estatísticas indisponíveis"
                            disabled
                          >
                            <ChartBarIcon className="h-5 w-5 mr-1" />
                            Ver Estatísticas
                          </button>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {(!match.events || match.events.length === 0) ? (
                          match.matchSheet ? (
                            // Se já existe súmula online, mostrar opção de copiar link
                            <div className="flex flex-col gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  const link = `${window.location.origin}/matches/sheet/${match.matchSheet.shareToken}`
                                  navigator.clipboard.writeText(link)
                                  toast.success('Link copiado para a área de transferência!')
                                }}
                                className="inline-flex items-center text-green-600 hover:text-green-800"
                              >
                                <DocumentTextIcon className="h-5 w-5 mr-1" />
                                Copiar Link
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const link = `${window.location.origin}/matches/sheet/${match.matchSheet.shareToken}`
                                  window.open(link, '_blank')
                                }}
                                className="inline-flex items-center text-blue-600 hover:text-blue-800 text-xs"
                              >
                                <DocumentTextIcon className="h-4 w-4 mr-1" />
                                Abrir Súmula
                              </button>
                            </div>
                          ) : (
                            // Se não existe súmula online, mostrar opção de criar
                            <button
                              type="button"
                              onClick={() => handleCreateMatchSheet()}
                              className="inline-flex items-center text-primary hover:text-primary-dark"
                            >
                              <DocumentTextIcon className="h-5 w-5 mr-1" />
                              Criar Súmula
                            </button>
                          )
                        ) : null}
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

      {/* Modal de escolha */}
      <Transition.Root show={isChoiceModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-30" onClose={() => setIsChoiceModalOpen(false)}>
          <div className="fixed inset-0 bg-black bg-opacity-50" />
          <div className="fixed inset-0 z-30 flex items-center justify-center">
            <Dialog.Panel className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg mx-auto">
              <Dialog.Title as="h3" className="text-2xl font-bold leading-6 text-gray-900 mb-6 text-center">
                Como deseja registrar o resultado da partida?
              </Dialog.Title>
              {!sumulaLink ? (
                <div className="flex flex-col gap-4">
                  <button
                    className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 text-lg font-bold shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105"
                    onClick={() => {
                      setIsChoiceModalOpen(false)
                      setIsMatchModalOpen(true)
                    }}
                  >
                    📝 Preencher placar manualmente
                  </button>
                  <button
                    className="w-full rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 text-lg font-bold shadow-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105"
                    onClick={handleCreateMatchSheet}
                    disabled={sumulaLoading}
                  >
                    {sumulaLoading ? '⏳ Gerando link...' : '🔗 Gerar link de súmula online (colaborativa)'}
                  </button>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                  <div className="text-center mb-4">
                    <div className="text-4xl mb-2">🎉</div>
                    <div className="text-lg font-semibold text-green-900 mb-2">Link da súmula online gerado!</div>
                    <div className="text-sm text-green-700">Compartilhe este link com os jogadores para que eles possam colaborar na súmula.</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-green-300 mb-4">
                    <div className="text-xs text-gray-600 mb-2 font-semibold">Link da súmula online:</div>
                    <input
                      className="w-full text-sm p-3 rounded-lg border border-gray-300 mb-3 bg-gray-50 font-mono"
                      value={sumulaLink}
                      readOnly
                      onFocus={e => e.target.select()}
                    />
                    <button
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg py-3 font-bold text-sm shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105"
                      onClick={async () => {
                        await navigator.clipboard.writeText(sumulaLink!)
                        setCopied(true)
                        setTimeout(() => setCopied(false), 2000)
                      }}
                    >
                      {copied ? '✅ Copiado!' : '📋 Copiar link'}
                    </button>
                  </div>
                  <div className="flex gap-3">
                    <button
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg py-3 font-bold shadow-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105"
                      onClick={() => {
                        window.open(sumulaLink, '_blank')
                        setSumulaLink(null)
                        setIsChoiceModalOpen(false)
                      }}
                    >
                      🔗 Abrir Súmula
                    </button>
                    <button
                      className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg py-3 font-bold shadow-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200 transform hover:scale-105"
                      onClick={() => {
                        setSumulaLink(null)
                        setIsChoiceModalOpen(false)
                      }}
                    >
                      ✅ OK
                    </button>
                  </div>
                </div>
              )}
              <div className="mt-6 text-center">
                <button
                  className="text-base text-gray-500 hover:text-gray-700 font-semibold px-4 py-2 rounded-lg transition-colors"
                  onClick={() => setIsChoiceModalOpen(false)}
                >
                  Cancelar
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition.Root>
      {/* Modal de criação de súmula online estilizado */}
      {showSumulaForm && (
        <Transition.Root show={showSumulaForm} as={Fragment}>
          <Dialog as="div" className="relative z-30" onClose={() => setShowSumulaForm(false)}>
            <div className="fixed inset-0 bg-black bg-opacity-40" />
            <div className="fixed inset-0 z-30 flex items-center justify-center overflow-y-auto p-4">
              <Dialog.Panel className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-auto my-8">
                <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-gray-900 mb-6 text-center">
                  Nova Súmula Online
                </Dialog.Title>
                <div className="space-y-4">
                  <div className="text-center">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data da partida</label>
                    <DatePicker
                      selected={sumulaForm.date}
                      onChange={date => setSumulaForm(f => ({ ...f, date }))}
                      dateFormat="dd/MM/yyyy"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-3 text-center"
                      placeholderText="Selecione a data"
                      popperPlacement="bottom"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adversário</label>
                    <input
                      type="text"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-3"
                      placeholder="Nome do adversário"
                      value={sumulaForm.opponent}
                      onChange={e => setSumulaForm(f => ({ ...f, opponent: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Local</label>
                    <select
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-3"
                      value={sumulaForm.location}
                      onChange={e => setSumulaForm(f => ({ ...f, location: e.target.value }))}
                    >
                      <option value="">Selecione o local</option>
                      <option value="Casa">Casa</option>
                      <option value="Visitante">Visitante</option>
                    </select>
                  </div>
                  {sumulaFormError && <div className="text-red-500 text-sm">{sumulaFormError}</div>}
                  <div className="flex flex-col gap-2 mt-6">
                    <button
                      className="w-full bg-black text-white font-bold py-3 rounded-lg hover:bg-gray-900 transition"
                      onClick={handleConfirmSumulaForm}
                    >
                      Criar Súmula
                    </button>
                    <button
                      className="w-full bg-gray-100 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-200 transition"
                      onClick={() => setShowSumulaForm(false)}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </div>
          </Dialog>
        </Transition.Root>
      )}
      {/* Modal de estatísticas */}
      {selectedMatch && selectedMatch.events && selectedMatch.events.length > 0 && (
        <StatsModal
          isOpen={!!selectedMatch}
          onClose={() => setSelectedMatch(undefined)}
          events={selectedMatch.events}
        />
      )}
    </div>
  )
} 