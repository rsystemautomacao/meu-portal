import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon, ChartBarIcon, XMarkIcon, UserIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import { usePathname } from 'next/navigation'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { CheckCircleIcon } from '@heroicons/react/24/solid'

interface Match {
  id: string
  date: string
  opponent: string
  location: string
  ourScore: number
  opponentScore: number
  ourScore1: number
  opponentScore1: number
  ourScore2: number
  opponentScore2: number
  events: MatchEvent[]
}

interface MatchEvent {
  id: string
  type: string
  player: string
  minute: number
  team: string
  quadro: number
  assist?: string
}

interface MatchStatistics {
  totalMatches: number
  wins: number
  losses: number
  draws: number
  totalGoalsScored: number
  totalGoalsConceded: number
  averageGoalsScored: number
  averageGoalsConceded: number
  eventsByType: Record<string, number>
}

interface MatchData {
  matches: Match[]
  statistics: MatchStatistics
}

interface StatsModalProps {
  isOpen: boolean
  onClose: () => void
  events: MatchEvent[]
}

function StatsModal({ isOpen, onClose, events }: StatsModalProps) {
  const [copied, setCopied] = useState(false)

  const getLabel = (type: string) => {
    switch (type) {
      case 'goal': return 'Gol';
      case 'assist': return 'Assistência';
      case 'yellow_card': return 'Amarelo';
      case 'red_card': return 'Vermelho';
      case 'fault': return 'Falta';
      default: return type;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'goal': return 'text-green-700';
      case 'assist': return 'text-blue-700';
      case 'yellow_card': return 'text-yellow-600';
      case 'red_card': return 'text-red-600';
      case 'fault': return 'text-orange-600';
      default: return 'text-gray-700';
    }
  };

  const ICONS: Record<string, React.ReactNode> = {
    goal: <span className="inline-block text-green-600 mr-1">⚽</span>,
    assist: <span className="inline-block text-blue-600 mr-1">🅰️</span>,
    yellow_card: <span className="inline-block text-yellow-500 mr-1">🟨</span>,
    red_card: <span className="inline-block text-red-600 mr-1">🟥</span>,
    fault: <span className="inline-block text-orange-500 mr-1">⚠️</span>,
  }

  const quadros = [1, 2];
  const grouped = quadros.map(q => ({
    quadro: q,
    events: events.filter(ev => ev.quadro === q)
  }))

  // Função para copiar estatísticas formatadas
  function handleCopyStats() {
    let text = '📊 *Estatísticas da Partida*\n\n'
    for (const quadro of [1, 2]) {
      text += `*${quadro}º Quadro*\n`
      const evs = events.filter(ev => ev.quadro === quadro)
      if (evs.length === 0) {
        text += '_Nenhum evento registrado._\n'
      } else {
        for (const ev of evs) {
          let line = ''
          switch (ev.type) {
            case 'goal':
              line += '⚽ *Gol* ' + ev.player
              if (ev.assist) line += ` (🅰️ ${ev.assist})`
              break
            case 'assist':
              line += '🅰️ *Assistência* ' + ev.player
              break
            case 'yellow_card':
              line += '🟨 *Amarelo* ' + ev.player
              break
            case 'red_card':
              line += '🟥 *Vermelho* ' + ev.player
              break
            case 'fault':
              line += '⚠️ *Falta* ' + ev.player
              break
            default:
              line += ev.type + ' ' + ev.player
          }
          if (ev.minute) line += ` ${ev.minute}'`
          if (ev.team === 'home') line += ' (🏠)'
          if (ev.team === 'away') line += ' (⚔️)'
          text += line + '\n'
        }
      }
      text += '\n'
    }
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-2 text-center sm:items-center sm:p-0 w-full">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-2 pb-4 pt-5 text-left shadow-xl transition-all w-full max-w-full sm:my-8 sm:w-full sm:max-w-lg sm:p-6 mx-2">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <span className="sr-only">Fechar</span>
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                <div className="flex justify-end mb-2">
                  <button
                    onClick={handleCopyStats}
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded font-semibold text-sm shadow transition-colors duration-200 ${copied ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                    title="Copiar estatísticas"
                  >
                    {copied ? <CheckCircleIcon className="h-5 w-5" /> : <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16h8M8 12h8m-8-4h8m-2-4v16m-4-16v16" /></svg>}
                    {copied ? 'Copiado!' : 'Copiar' }
                  </button>
                </div>
                <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 mb-4">
                  Estatísticas da Partida
                </Dialog.Title>
                {grouped.map(({ quadro, events }) => (
                  <div key={quadro} className="mb-6">
                    <div className="font-bold mb-2 text-base">{quadro}º Quadro</div>
                    {events.length === 0 && <div className="text-gray-400 text-sm mb-2">Nenhum evento registrado.</div>}
                    <ul className="space-y-1">
                      {events.map(ev => (
                        <li key={ev.id} className="flex items-center gap-1 text-sm">
                          {ICONS[ev.type as keyof typeof ICONS] || <UserIcon className="h-3 w-3 text-gray-400" />}
                          <span className={`font-semibold ${getColor(ev.type)} text-xs`}>{getLabel(ev.type)}</span>
                          <span className="font-medium text-gray-800 text-xs">{ev.player}</span>
                          {ev.type === 'goal' && ev.assist && (
                            <span className="text-xs text-blue-600">🅰️{ev.assist}</span>
                          )}
                          <span className="text-xs text-gray-500">{ev.minute}'</span>
                          <span className="text-xs text-gray-400">({ev.team === 'home' ? '🏠' : '⚔️'})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                <div className="mt-4 text-right">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-opacity-90"
                    onClick={onClose}
                  >
                    Fechar
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

export default function SharedMatchesReport() {
  const pathname = usePathname()
  const [data, setData] = useState<MatchData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false)

  useEffect(() => {
    fetchMatches()
  }, [selectedMonth, pathname])

  const fetchMatches = async () => {
    try {
      setLoading(true)
      // Verificar se estamos em um relatório compartilhado
      const isSharedReport = pathname?.includes('/shared-reports/') || false
      const token = pathname?.split('/shared-reports/')[1]?.split('/')[0]
      
      if (!isSharedReport || !token) {
        throw new Error('Token não encontrado')
      }
      
      const monthParam = format(selectedMonth, 'MM')
      const yearParam = format(selectedMonth, 'yyyy')
      
      const url = `/api/shared-reports/${token}/matches?month=${monthParam}&year=${yearParam}`
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Erro ao carregar dados')
      }
      const data = await response.json()
      setData(data)
    } catch (error) {
      console.error('Erro ao carregar partidas:', error)
      toast.error('Erro ao carregar partidas')
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (ourScore: number, opponentScore: number) => {
    if (ourScore > opponentScore) return 'bg-green-100 text-green-800'
    if (ourScore < opponentScore) return 'bg-red-100 text-red-800'
    return 'bg-blue-100 text-blue-800'
  }

  const handleViewStats = (match: Match) => {
    setSelectedMatch(match)
    setIsStatsModalOpen(true)
  }

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
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

  if (!data) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Histórico de Partidas</h3>
        <p className="text-gray-500">Nenhum dado disponível.</p>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <span className="bg-blue-100 p-2 rounded-full">
            <CalendarIcon className="h-7 w-7 text-blue-500" />
          </span>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Histórico de Partidas</h3>
            <p className="text-gray-600 text-sm">Lista completa de partidas</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <input
            type="month"
            value={format(selectedMonth, 'yyyy-MM')}
            onChange={(e) => {
              const [year, month] = e.target.value.split('-').map(Number)
              setSelectedMonth(new Date(year, month - 1, 1))
            }}
            className="rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm font-medium"
          />
        </div>
      </div>

      {/* Lista de Partidas */}
      <div className="mt-6">
        {data.matches.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhuma partida encontrada para o período selecionado.
          </div>
        ) : (
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
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Total
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {data.matches.map((match) => (
                  <tr key={match.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {format(new Date(match.date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {match.opponent}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-center">
                      <span className={`inline-block text-base font-bold rounded px-3 py-1 ${getScoreColor(match.ourScore1, match.opponentScore1)}`}>
                        {match.ourScore1} × {match.opponentScore1}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-center">
                      <span className={`inline-block text-base font-bold rounded px-3 py-1 ${getScoreColor(match.ourScore2, match.opponentScore2)}`}>
                        {match.ourScore2} × {match.opponentScore2}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-center">
                      <span className={`inline-block text-base font-bold rounded px-3 py-1 ${getScoreColor(match.ourScore, match.opponentScore)}`}>
                        {match.ourScore} × {match.opponentScore}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {match.events && match.events.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleViewStats(match)}
                          className="inline-flex items-center text-blue-600 hover:text-blue-800"
                        >
                          <ChartBarIcon className="h-5 w-5 mr-1" />
                          Ver Estatísticas
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Estatísticas */}
      {selectedMatch && (
        <StatsModal
          isOpen={isStatsModalOpen}
          onClose={() => {
            setIsStatsModalOpen(false)
            setSelectedMatch(null)
          }}
          events={selectedMatch.events}
        />
      )}
    </div>
  )
} 