import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChartBarIcon, ClipboardIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import { usePathname } from 'next/navigation'

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

interface Player {
  id: string
  name: string
}

interface MatchData {
  matches: Match[]
  statistics: {
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
}

export default function SharedMatchStatsReport() {
  const pathname = usePathname()
  const [matchData, setMatchData] = useState<MatchData | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date())

  useEffect(() => {
    fetchData()
  }, [selectedMonth, pathname])

  const fetchData = async () => {
    try {
      setLoading(true)
      const isSharedReport = pathname?.includes('/shared-reports/') || false
      const token = pathname?.split('/shared-reports/')[1]?.split('/')[0]
      
      if (!isSharedReport || !token) {
        throw new Error('Token não encontrado')
      }
      
      const monthParam = format(selectedMonth, 'MM')
      const yearParam = format(selectedMonth, 'yyyy')
      
      // Buscar partidas
      const matchesResponse = await fetch(`/api/shared-reports/${token}/matches?month=${monthParam}&year=${yearParam}`)
      if (!matchesResponse.ok) {
        throw new Error('Erro ao carregar partidas')
      }
      const matchData = await matchesResponse.json()
      setMatchData(matchData)
      
      // Buscar jogadores
      const playersResponse = await fetch(`/api/shared-reports/${token}/players`)
      if (playersResponse.ok) {
        const playersData = await playersResponse.json()
        setPlayers(playersData)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const calculatePlayerStats = () => {
    if (!matchData || !players.length) return []

    const playerStats = players.map(player => {
      const playerEvents = matchData.matches.flatMap(match => 
        match.events.filter(event => event.player === player.name)
      )

      const goals = playerEvents.filter(e => e.type === 'goal').length
      const assists = playerEvents.filter(e => e.type === 'assist').length
      const yellowCards = playerEvents.filter(e => e.type === 'yellow_card').length
      const redCards = playerEvents.filter(e => e.type === 'red_card').length

      return {
        name: player.name,
        goals,
        assists,
        yellowCards,
        redCards,
        totalEvents: playerEvents.length
      }
    })

    return playerStats.filter(p => p.totalEvents > 0).sort((a, b) => b.goals - a.goals)
  }

  const calculateGoalieStats = () => {
    if (!matchData || !players.length) return []

    const goalieStats = players.map(player => {
      const playerEvents = matchData.matches.flatMap(match => 
        match.events.filter(event => event.goleiro === player.name)
      )

      const goalsConceded = playerEvents.filter(e => e.type === 'goal').length
      const cleanSheets = matchData.matches.filter(match => {
        const matchEvents = match.events.filter(e => e.goleiro === player.name)
        return matchEvents.length === 0 || matchEvents.filter(e => e.type === 'goal').length === 0
      }).length

      return {
        name: player.name,
        goalsConceded,
        cleanSheets,
        matchesPlayed: matchData.matches.filter(match => 
          match.events.some(e => e.goleiro === player.name)
        ).length
      }
    })

    return goalieStats.filter(p => p.matchesPlayed > 0).sort((a, b) => a.goalsConceded - b.goalsConceded)
  }

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${type} copiado!`)
    } catch (error) {
      toast.error('Erro ao copiar')
    }
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

  if (!matchData) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Estatísticas das Partidas</h3>
        <p className="text-gray-500">Nenhum dado disponível.</p>
      </div>
    )
  }

  const playerStats = calculatePlayerStats()
  const goalieStats = calculateGoalieStats()

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <span className="bg-indigo-100 p-2 rounded-full">
            <ChartBarIcon className="h-7 w-7 text-indigo-500" />
          </span>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Estatísticas Detalhadas</h3>
            <p className="text-gray-600 text-sm">Performance de jogadores e goleiros</p>
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

      {/* Resumo Rápido */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Resumo do Período</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-500">Partidas</p>
            <p className="text-lg font-bold text-gray-900">{matchData.statistics.totalMatches}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Vitórias</p>
            <p className="text-lg font-bold text-green-600">{matchData.statistics.wins}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Gols Marcados</p>
            <p className="text-lg font-bold text-gray-900">{matchData.statistics.totalGoalsScored}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Gols Sofridos</p>
            <p className="text-lg font-bold text-gray-900">{matchData.statistics.totalGoalsConceded}</p>
          </div>
        </div>
      </div>

      {/* Estatísticas dos Jogadores */}
      {playerStats.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-900">Estatísticas dos Jogadores</h4>
            <button
              onClick={() => {
                const text = playerStats.map(p => 
                  `${p.name}: ${p.goals} gols, ${p.assists} assistências`
                ).join('\n')
                handleCopy(text, 'Estatísticas dos jogadores')
              }}
              className="flex items-center gap-2 px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
            >
              <ClipboardIcon className="h-4 w-4" />
              Copiar
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jogador
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gols
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assistências
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cartões
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {playerStats.map((player) => (
                  <tr key={player.name}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {player.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {player.goals}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {player.assists}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {player.yellowCards + player.redCards}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Estatísticas dos Goleiros */}
      {goalieStats.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-900">Estatísticas dos Goleiros</h4>
            <button
              onClick={() => {
                const text = goalieStats.map(g => 
                  `${g.name}: ${g.goalsConceded} gols sofridos, ${g.cleanSheets} jogos sem sofrer gols`
                ).join('\n')
                handleCopy(text, 'Estatísticas dos goleiros')
              }}
              className="flex items-center gap-2 px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
            >
              <ClipboardIcon className="h-4 w-4" />
              Copiar
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Goleiro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jogos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gols Sofridos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jogos sem Sofrer Gols
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {goalieStats.map((goalie) => (
                  <tr key={goalie.name}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {goalie.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {goalie.matchesPlayed}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {goalie.goalsConceded}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {goalie.cleanSheets}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {playerStats.length === 0 && goalieStats.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Nenhuma estatística disponível para o período selecionado.
        </div>
      )}
    </div>
  )
} 