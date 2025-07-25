import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon, TrophyIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import { usePathname } from 'next/navigation'

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
  goleiro?: string
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

export default function SharedMatchesReport() {
  const pathname = usePathname()
  const [data, setData] = useState<MatchData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date())

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

  const getEventTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      goal: 'Gol',
      assist: 'Assistência',
      yellow_card: 'Cartão Amarelo',
      red_card: 'Cartão Vermelho',
    }
    return labels[type] || type
  }

  const getEventTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      goal: 'bg-green-100 text-green-800',
      assist: 'bg-blue-100 text-blue-800',
      yellow_card: 'bg-yellow-100 text-yellow-800',
      red_card: 'bg-red-100 text-red-800',
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
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
            <p className="text-gray-600 text-sm">Lista completa de partidas com eventos</p>
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

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <TrophyIcon className="h-5 w-5 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-600">Total de Partidas</p>
              <p className="text-lg font-semibold text-blue-900">
                {data.statistics.totalMatches}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <TrophyIcon className="h-5 w-5 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-600">Vitórias</p>
              <p className="text-lg font-semibold text-green-900">
                {data.statistics.wins}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center">
            <TrophyIcon className="h-5 w-5 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-red-600">Derrotas</p>
              <p className="text-lg font-semibold text-red-900">
                {data.statistics.losses}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center">
            <TrophyIcon className="h-5 w-5 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-600">Empates</p>
              <p className="text-lg font-semibold text-yellow-900">
                {data.statistics.draws}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Estatísticas de Gols */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Gols Marcados</h4>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-gray-900">
              {data.statistics.totalGoalsScored}
            </span>
            <span className="text-sm text-gray-500">
              Média: {data.statistics.averageGoalsScored}/jogo
            </span>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Gols Sofridos</h4>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-gray-900">
              {data.statistics.totalGoalsConceded}
            </span>
            <span className="text-sm text-gray-500">
              Média: {data.statistics.averageGoalsConceded}/jogo
            </span>
          </div>
        </div>
      </div>

      {/* Lista de Partidas */}
      <div className="space-y-4">
        {data.matches.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhuma partida encontrada para o período selecionado.
          </div>
        ) : (
          data.matches.map((match) => (
            <div key={match.id} className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {format(new Date(match.date), 'dd/MM/yyyy', { locale: ptBR })}
                      </h4>
                      <p className="text-sm text-gray-500">vs {match.opponent}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">1°</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getScoreColor(match.ourScore1, match.opponentScore1)}`}>
                          {match.ourScore1}x{match.opponentScore1}
                        </span>
                        <span className="text-sm text-gray-500">2°</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getScoreColor(match.ourScore2, match.opponentScore2)}`}>
                          {match.ourScore2}x{match.opponentScore2}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">Total: {match.ourScore}x{match.opponentScore}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Eventos da Partida */}
              {match.events.length > 0 && (
                <div className="px-4 py-3 bg-white">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Eventos da Partida</h5>
                  <div className="space-y-1">
                    {match.events.map((event) => (
                      <div key={event.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getEventTypeColor(event.type)}`}>
                            {getEventTypeLabel(event.type)}
                          </span>
                          <span className="text-gray-600">{event.player}</span>
                          {event.assist && (
                            <span className="text-gray-500">(assist: {event.assist})</span>
                          )}
                        </div>
                        <span className="text-gray-500">{event.minute}'</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
} 