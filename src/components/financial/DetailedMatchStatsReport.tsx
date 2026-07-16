import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChartBarIcon, ClipboardIcon, CheckCircleIcon, ChevronDownIcon, ChevronUpIcon, FunnelIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import { usePathname } from 'next/navigation'

const PERIODS = [
  { label: 'Mês atual', value: 'month' },
  { label: 'Últimos 90 dias', value: '90' },
  { label: 'Últimos 180 dias', value: '180' },
  { label: 'Últimos 360 dias', value: '360' },
  { label: 'Ano atual', value: 'year' },
  { label: 'Personalizado', value: 'custom' },
]

export default function DetailedMatchStatsReport() {
  const pathname = usePathname()
  const [matches, setMatches] = useState<any[]>([])
  const [players, setPlayers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [copied, setCopied] = useState(false)
  const [showPeriodMenu, setShowPeriodMenu] = useState(false)

  // Estado de ordenação para jogadores
  const [sortFieldPlayers, setSortFieldPlayers] = useState<string>('nome')
  const [sortOrderPlayers, setSortOrderPlayers] = useState<'desc' | 'asc' | null>(null)
  const [sortPercentPlayers, setSortPercentPlayers] = useState(false)
  // Estado de ordenação para goleiros
  const [sortFieldGoalies, setSortFieldGoalies] = useState<string>('nome')
  const [sortOrderGoalies, setSortOrderGoalies] = useState<'desc' | 'asc' | null>(null)
  const [sortPercentGoalies, setSortPercentGoalies] = useState(false)
  // Estado de cópia
  const [copiedPlayers, setCopiedPlayers] = useState(false)
  const [copiedGoalies, setCopiedGoalies] = useState(false)
  const [copiedAll, setCopiedAll] = useState(false)

  useEffect(() => {
    fetchMatches()
    fetchPlayers()
  }, [])

  async function fetchMatches() {
    try {
      setLoading(true)
      // Verificar se estamos em um relatório compartilhado
      const isSharedReport = pathname?.includes('/shared-reports/') || false
      const token = pathname?.split('/shared-reports/')[1]?.split('/')[0]
      
      let url = '/api/matches'
      if (isSharedReport && token) {
        url = `/api/shared-reports/${token}/matches`
      }
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Falha ao buscar partidas')
      }
      const data = await response.json()
      // Se estamos em um relatório compartilhado, a API retorna { matches, statistics }
      // Se não, retorna apenas o array de partidas
      if (isSharedReport && data.matches) {
        setMatches(data.matches)
      } else {
      setMatches(data)
      }
    } catch (error) {
      console.error('Erro ao carregar partidas:', error)
      toast.error('Erro ao carregar partidas')
    } finally {
      setLoading(false)
    }
  }

  async function fetchPlayers() {
    try {
      setLoading(true)
      // Verificar se estamos em um relatório compartilhado
      const isSharedReport = pathname?.includes('/shared-reports/') || false
      const token = pathname?.split('/shared-reports/')[1]?.split('/')[0]
      
      let url = '/api/players'
      if (isSharedReport && token) {
        url = `/api/shared-reports/${token}/players`
      }
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Falha ao buscar jogadores')
      }
      const data = await response.json()
      setPlayers(data)
    } catch (error) {
      console.error('Erro ao carregar jogadores:', error)
      toast.error('Erro ao carregar jogadores')
    } finally {
      setLoading(false)
    }
  }

  // Lista de nomes dos jogadores do time
  const playerNames = Array.isArray(players) ? players.map((p: any) => p.name) : []

  // Filtro de período
  const now = new Date()
  let start: Date, end: Date
  if (period === 'month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1)
    end = now
  } else if (period === '90') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90)
    end = now
  } else if (period === '180') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 180)
    end = now
  } else if (period === '360') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 360)
    end = now
  } else if (period === 'year') {
    start = new Date(now.getFullYear(), 0, 1)
    end = now
  } else {
    start = customStart ? new Date(customStart) : new Date(2000,0,1)
    end = customEnd ? new Date(customEnd) : now
  }

  // Verificar se matches é um array antes de usar filter
  if (!Array.isArray(matches)) {
    console.error('matches não é um array:', matches)
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Estatísticas das Partidas</h3>
        <p className="text-gray-500">Erro ao carregar dados das partidas.</p>
      </div>
    )
  }

  const filteredMatches = matches.filter(m => {
    const d = typeof m.date === 'string' ? new Date(m.date) : new Date(m.date)
    return d >= start && d <= end
  })

  // Função utilitária para agrupar estatísticas por jogador
  function getPlayerStats(matches: any[]) {
    const stats: Record<string, any> = {};
    let allPlayers = new Set<string>();
    let golsPro = 0;
    let golsContra = 0;
    let presencas: Record<string, number> = {};
    
    matches.forEach(match => {
      // PRESENÇAS: APENAS baseadas na seleção explícita do jogador
      if (Array.isArray(match.presences)) {
        match.presences.forEach((presence: any) => {
          const playerId = presence.playerId
          const playerName = presence.player?.name || playerId
          if (playerName && playerName !== 'Adversário' && playerName.trim() !== '') {
            allPlayers.add(playerName)
            if (!presencas[playerName]) presencas[playerName] = 0
            presencas[playerName]++
          }
        })
      }
      
      // EVENTOS: apenas para estatísticas de jogo (gols, cartões, etc.)
      if (Array.isArray(match.events)) {
        match.events.forEach((ev: any) => {
          // Gols sofridos por goleiro: contabilizar SEMPRE que houver campo goleiro
          if (ev.goleiro && typeof ev.goleiro === 'string' && ev.type === 'goal' && ev.team === 'away' && ev.goleiro !== 'Adversário' && ev.goleiro.trim() !== '') {
            allPlayers.add(ev.goleiro);
            if (!stats[ev.goleiro]) stats[ev.goleiro] = { presencas: 0, gols: 0, assist: 0, amarelo: 0, vermelho: 0, faltas: 0, golsSofridos: 0 };
            stats[ev.goleiro].golsSofridos++;
          }
          
          // Contabilizar gols contra (gols do adversário)
          if (ev.type === 'goal' && ev.team === 'away') {
            golsContra++;
          }
          
          // Estatísticas normais para jogadores do time (NUNCA para adversário)
          if (!ev.player || ev.player === 'Adversário' || ev.player.trim() === '' || ev.team === 'away') return;
          
          const playerName = typeof ev.player === 'string' ? ev.player : ev.player.name;
          
          // Garantir que é um jogador válido do time
          if (!playerName || playerName === 'Adversário' || playerName.trim() === '') return;
          
          allPlayers.add(playerName);
          if (!stats[playerName]) stats[playerName] = { presencas: 0, gols: 0, assist: 0, amarelo: 0, vermelho: 0, faltas: 0, golsSofridos: 0 };
          
          if (ev.type === 'goal') {
            if (ev.team === 'home') {
              stats[playerName].gols++;
              golsPro++;
            }
          }
          if (ev.type === 'assist') stats[playerName].assist++;
          if (ev.type === 'yellow_card') stats[playerName].amarelo++;
          if (ev.type === 'red_card') stats[playerName].vermelho++;
          if (ev.type === 'fault') stats[playerName].faltas = (stats[playerName].faltas || 0) + 1
        });
      }
    });
    
    // Preencher presenças no stats
    Object.keys(presencas).forEach((playerName: string) => {
      if (!stats[playerName]) stats[playerName] = { presencas: 0, gols: 0, assist: 0, amarelo: 0, vermelho: 0, faltas: 0, golsSofridos: 0 }
      stats[playerName].presencas = presencas[playerName]
    })
    
    return { stats, allPlayers, golsPro, golsContra, presencas };
  }

  const { stats, allPlayers, golsPro, golsContra, presencas } = getPlayerStats(filteredMatches);

  // Após o cálculo das estatísticas:
  const totalMatches = filteredMatches.length
  const totalGoals = golsPro
  const totalConceded = golsContra
  const totalYellow = Object.values(stats).reduce((sum, s) => sum + (s.amarelo || 0), 0)
  const totalRed = Object.values(stats).reduce((sum, s) => sum + (s.vermelho || 0), 0)
  const totalAssists = Object.values(stats).reduce((sum, s) => sum + (s.assist || 0), 0)
  const totalFaults = Object.values(stats).reduce((sum, s) => sum + (s.faltas || 0), 0)

  // Médias
  const avgGoals = totalMatches ? (totalGoals / totalMatches) : 0
  const avgConceded = totalMatches ? (totalConceded / totalMatches) : 0
  const avgYellow = totalMatches ? (totalYellow / totalMatches) : 0
  const avgRed = totalMatches ? (totalRed / totalMatches) : 0
  const avgAssists = totalMatches ? (totalAssists / totalMatches) : 0
  const avgFaults = totalMatches ? (totalFaults / totalMatches) : 0

  // Função para calcular porcentagem (evita divisão por zero)
  function percent(part: number, total: number) {
    if (!total) return '0%'
    return ((part / total) * 100).toFixed(0) + '%'
  }

  // Copiar para WhatsApp
  function handleCopy() {
    let text = `📊 *Estatísticas do Período*\nDe ${format(start, 'dd/MM/yyyy')} até ${format(end, 'dd/MM/yyyy')}\n\n`
    text += `*Jogos:* ${totalMatches}\n*Gols marcados:* ${totalGoals} (média ${avgGoals.toFixed(2)})\n*Gols sofridos:* ${totalConceded} (média ${avgConceded.toFixed(2)})\n*Assistências:* ${totalAssists}\n*Cartões amarelos:* ${totalYellow} (média ${avgYellow.toFixed(2)})\n*Cartões vermelhos:* ${totalRed} (média ${avgRed.toFixed(2)})\n*Faltas:* ${totalFaults} (média ${avgFaults.toFixed(2)})\n\n*Por Jogador:*\n`
    Object.entries(stats).sort(([,a], [,b]) => b.gols - a.gols).forEach(([name, stats]) => {
      text += `• ${name}: ${stats.gols} gols, ${stats.assist} ass, ${stats.amarelo} amarelos, ${stats.vermelho} vermelhos, ${stats.faltas || 0} faltas, ${stats.presencas} jogos\n`
      if (stats.goleiro) text += `   (Goleiro: ${stats.golsSofridos} gols sofridos)\n`
    })
    text += '\n*Goleiros:*\n'
    Object.entries(stats).filter(entry => entry[1].goleiro).forEach(([name, stats]) => {
      text += `• ${name}: ${stats.presencas} jogos, ${stats.golsSofridos} gols sofridos, média ${(stats.presencas ? stats.golsSofridos/stats.presencas : 0).toFixed(2)}\n`
    })
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleSortPlayers(field: string, percent = false) {
    if (sortFieldPlayers !== field || sortPercentPlayers !== percent) {
      setSortFieldPlayers(field)
      setSortOrderPlayers('desc')
      setSortPercentPlayers(percent)
    } else if (sortOrderPlayers === 'desc') {
      setSortOrderPlayers('asc')
    } else if (sortOrderPlayers === 'asc') {
      setSortFieldPlayers('nome')
      setSortOrderPlayers(null)
      setSortPercentPlayers(false)
    }
  }

  function handleSortGoalies(field: string, percent = false) {
    if (sortFieldGoalies !== field || sortPercentGoalies !== percent) {
      setSortFieldGoalies(field)
      setSortOrderGoalies('desc')
      setSortPercentGoalies(percent)
    } else if (sortOrderGoalies === 'desc') {
      setSortOrderGoalies('asc')
    } else if (sortOrderGoalies === 'asc') {
      setSortFieldGoalies('nome')
      setSortOrderGoalies(null)
      setSortPercentGoalies(false)
    }
  }

  // Função para obter valor de ordenação (valor absoluto ou porcentagem)
  function getSortValueCustom(s: any, field: string, percent: boolean) {
    if (!percent) return s[field] || 0
    if (field === 'presencas') return s.presencas / (totalMatches || 1)
    return s[field] / (s.presencas || 1)
  }

  // Ordenação dos jogadores
  const sortedPlayers = Object.entries(stats).sort(([aName, a], [bName, b]) => {
    if (!sortOrderPlayers || sortFieldPlayers === 'nome') return aName.localeCompare(bName)
    if (sortOrderPlayers === 'desc') return getSortValueCustom(b, sortFieldPlayers, sortPercentPlayers) - getSortValueCustom(a, sortFieldPlayers, sortPercentPlayers)
    return getSortValueCustom(a, sortFieldPlayers, sortPercentPlayers) - getSortValueCustom(b, sortFieldPlayers, sortPercentPlayers)
  })

  // Ordenação dos goleiros
  const sortedGoalies = Object.entries(stats).filter(([_, s]) => s.goleiro).sort(([aName, a], [bName, b]) => {
    if (!sortOrderGoalies || sortFieldGoalies === 'nome') return aName.localeCompare(bName)
    if (sortOrderGoalies === 'desc') return getSortValueCustom(b, sortFieldGoalies, sortPercentGoalies) - getSortValueCustom(a, sortFieldGoalies, sortPercentGoalies)
    return getSortValueCustom(a, sortFieldGoalies, sortPercentGoalies) - getSortValueCustom(b, sortFieldGoalies, sortPercentGoalies)
  })

  // Funções de cópia separadas
  function handleCopyPlayers() {
    let text = '📊 *Estatísticas dos Jogadores de Linha*\n\n'
    text += 'Nome | Jogos | %Pres | Gols | %Gols | Assist | %Ass | Amarelos | %Am | Vermelhos | %Verm | Faltas | %Faltas\n'
    sortedPlayers.forEach(([name, s]) => {
      text += `${name} | ${s.presencas} | ${percent(s.presencas, totalMatches)} | ${s.gols} | ${percent(s.gols, s.presencas)} | ${s.assist} | ${percent(s.assist, s.presencas)} | ${s.amarelo} | ${percent(s.amarelo, s.presencas)} | ${s.vermelho} | ${percent(s.vermelho, s.presencas)} | ${s.faltas || 0} | ${percent(s.faltas || 0, s.presencas)}\n`
    })
    navigator.clipboard.writeText(text)
    setCopiedPlayers(true)
    setTimeout(() => setCopiedPlayers(false), 2000)
  }
  function handleCopyGoalies() {
    let text = '📊 *Estatísticas dos Goleiros*\n\n'
    text += 'Nome | Jogos | %Jogos | Gols Sofridos | %Gols/jogo\n'
    sortedGoalies.forEach(([name, s]) => {
      text += `${name} | ${s.presencas} | ${percent(s.presencas, totalMatches)} | ${s.golsSofridos} | ${s.presencas ? (s.golsSofridos/s.presencas*100).toFixed(0)+'%' : '0%'}\n`
    })
    navigator.clipboard.writeText(text)
    setCopiedGoalies(true)
    setTimeout(() => setCopiedGoalies(false), 2000)
  }
  function handleCopyAll() {
    handleCopyPlayers()
    handleCopyGoalies()
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 2000)
  }

  return (
    <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-xl border border-blue-100 p-8 w-full">
      <div className="flex items-center gap-3 mb-6">
        <ChartBarIcon className="h-7 w-7 text-blue-500" />
        <h2 className="text-2xl font-bold text-blue-900 drop-shadow">Relatório Detalhado de Estatísticas</h2>
      </div>
      {/* Filtro de período compacto (corrigir para mostrar datas ao escolher Personalizado) */}
      <div className="relative mb-6">
        <button
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition"
          onClick={() => setShowPeriodMenu(v => !v)}
        >
          <FunnelIcon className="h-5 w-5" />
          {PERIODS.find(p => p.value === period)?.label || 'Período'}
          <ChevronDownIcon className="h-4 w-4" />
        </button>
        {showPeriodMenu && (
          <div className="absolute z-10 mt-2 bg-white border border-blue-200 rounded-lg shadow-lg p-2 flex flex-col gap-2 min-w-[180px]">
            {PERIODS.map(p => (
              <button
                key={p.value}
                onClick={() => {
                  setPeriod(p.value)
                  if (p.value !== 'custom') setShowPeriodMenu(false)
                }}
                className={`px-3 py-1 rounded-lg font-semibold text-sm transition-colors duration-200 ${period === p.value ? 'bg-blue-600 text-white' : 'bg-white text-blue-700 hover:bg-blue-50'}`}
              >
                {p.label}
              </button>
            ))}
            {period === 'custom' && (
              <div className="flex items-center gap-2 mt-2">
                <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="border rounded px-2 py-1 text-sm" />
                <span className="text-gray-500">até</span>
                <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="border rounded px-2 py-1 text-sm" />
                <button className="ml-2 px-3 py-1 bg-blue-600 text-white rounded" onClick={() => setShowPeriodMenu(false)}>OK</button>
              </div>
            )}
          </div>
        )}
      </div>
      {loading ? (
        <div className="text-center text-blue-600 py-8">Carregando estatísticas...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow p-4 flex flex-col items-center border border-blue-100">
              <span className="text-3xl font-bold text-blue-700">{totalMatches}</span>
              <span className="text-xs text-gray-500 mt-1">Jogos</span>
            </div>
            <div className="bg-white rounded-xl shadow p-4 flex flex-col items-center border border-blue-100">
              <span className="text-3xl font-bold text-green-600">{totalGoals}</span>
              <span className="text-xs text-gray-500 mt-1">Gols marcados</span>
              <span className="text-xs text-green-700">Média {avgGoals.toFixed(2)}</span>
            </div>
            <div className="bg-white rounded-xl shadow p-4 flex flex-col items-center border border-blue-100">
              <span className="text-3xl font-bold text-red-600">{totalConceded}</span>
              <span className="text-xs text-gray-500 mt-1">Gols sofridos</span>
              <span className="text-xs text-red-700">Média {avgConceded.toFixed(2)}</span>
            </div>
            <div className="bg-white rounded-xl shadow p-4 flex flex-col items-center border border-blue-100">
              <span className="text-3xl font-bold text-yellow-500">{totalYellow}</span>
              <span className="text-xs text-gray-500 mt-1">Cartões amarelos</span>
              <span className="text-xs text-yellow-600">Média {avgYellow.toFixed(2)}</span>
            </div>
            <div className="bg-white rounded-xl shadow p-4 flex flex-col items-center border border-blue-100">
              <span className="text-3xl font-bold text-red-500">{totalRed}</span>
              <span className="text-xs text-gray-500 mt-1">Cartões vermelhos</span>
              <span className="text-xs text-red-600">Média {avgRed.toFixed(2)}</span>
            </div>
            <div className="bg-white rounded-xl shadow p-4 flex flex-col items-center border border-blue-100">
              <span className="text-3xl font-bold text-blue-700">{totalAssists}</span>
              <span className="text-xs text-gray-500 mt-1">Assistências</span>
              <span className="text-xs text-blue-700">Média {avgAssists.toFixed(2)}</span>
            </div>
            <div className="bg-white rounded-xl shadow p-4 flex flex-col items-center border border-blue-100">
              <span className="text-3xl font-bold text-gray-600">{totalFaults}</span>
              <span className="text-xs text-gray-500 mt-1">Faltas</span>
              <span className="text-xs text-gray-700">Média {avgFaults.toFixed(2)}</span>
            </div>
          </div>
          <div className="mb-8">
            <h3 className="text-lg font-bold text-blue-800 mb-2">Por Jogador</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="px-2 py-1 text-left cursor-pointer" onClick={() => handleSortPlayers('nome')}>Nome {sortFieldPlayers === 'nome' && (sortOrderPlayers === 'desc' ? <ChevronDownIcon className="inline h-3 w-3" /> : sortOrderPlayers === 'asc' ? <ChevronUpIcon className="inline h-3 w-3" /> : null)}</th>
                    <th className="px-2 py-1 cursor-pointer" onClick={() => handleSortPlayers('presencas', false)}>Jogos {sortFieldPlayers === 'presencas' && !sortPercentPlayers && (sortOrderPlayers === 'desc' ? <ChevronDownIcon className="inline h-3 w-3" /> : sortOrderPlayers === 'asc' ? <ChevronUpIcon className="inline h-3 w-3" /> : null)}</th>
                    <th className="px-2 py-1 cursor-pointer" onClick={() => handleSortPlayers('presencas', true)}>% Pres. {sortFieldPlayers === 'presencas' && sortPercentPlayers && (sortOrderPlayers === 'desc' ? <ChevronDownIcon className="inline h-3 w-3" /> : sortOrderPlayers === 'asc' ? <ChevronUpIcon className="inline h-3 w-3" /> : null)}</th>
                    <th className="px-2 py-1 cursor-pointer" onClick={() => handleSortPlayers('gols', false)}>Gols {sortFieldPlayers === 'gols' && !sortPercentPlayers && (sortOrderPlayers === 'desc' ? <ChevronDownIcon className="inline h-3 w-3" /> : sortOrderPlayers === 'asc' ? <ChevronUpIcon className="inline h-3 w-3" /> : null)}</th>
                    <th className="px-2 py-1 cursor-pointer" onClick={() => handleSortPlayers('gols', true)}>% Gols {sortFieldPlayers === 'gols' && sortPercentPlayers && (sortOrderPlayers === 'desc' ? <ChevronDownIcon className="inline h-3 w-3" /> : sortOrderPlayers === 'asc' ? <ChevronUpIcon className="inline h-3 w-3" /> : null)}</th>
                    <th className="px-2 py-1 cursor-pointer" onClick={() => handleSortPlayers('assist', false)}>Assist. {sortFieldPlayers === 'assist' && !sortPercentPlayers && (sortOrderPlayers === 'desc' ? <ChevronDownIcon className="inline h-3 w-3" /> : sortOrderPlayers === 'asc' ? <ChevronUpIcon className="inline h-3 w-3" /> : null)}</th>
                    <th className="px-2 py-1 cursor-pointer" onClick={() => handleSortPlayers('assist', true)}>% Ass. {sortFieldPlayers === 'assist' && sortPercentPlayers && (sortOrderPlayers === 'desc' ? <ChevronDownIcon className="inline h-3 w-3" /> : sortOrderPlayers === 'asc' ? <ChevronUpIcon className="inline h-3 w-3" /> : null)}</th>
                    <th className="px-2 py-1 cursor-pointer" onClick={() => handleSortPlayers('amarelo', false)}>Amarelos {sortFieldPlayers === 'amarelo' && !sortPercentPlayers && (sortOrderPlayers === 'desc' ? <ChevronDownIcon className="inline h-3 w-3" /> : sortOrderPlayers === 'asc' ? <ChevronUpIcon className="inline h-3 w-3" /> : null)}</th>
                    <th className="px-2 py-1 cursor-pointer" onClick={() => handleSortPlayers('amarelo', true)}>% Am. {sortFieldPlayers === 'amarelo' && sortPercentPlayers && (sortOrderPlayers === 'desc' ? <ChevronDownIcon className="inline h-3 w-3" /> : sortOrderPlayers === 'asc' ? <ChevronUpIcon className="inline h-3 w-3" /> : null)}</th>
                    <th className="px-2 py-1 cursor-pointer" onClick={() => handleSortPlayers('vermelho', false)}>Vermelhos {sortFieldPlayers === 'vermelho' && !sortPercentPlayers && (sortOrderPlayers === 'desc' ? <ChevronDownIcon className="inline h-3 w-3" /> : sortOrderPlayers === 'asc' ? <ChevronUpIcon className="inline h-3 w-3" /> : null)}</th>
                    <th className="px-2 py-1 cursor-pointer" onClick={() => handleSortPlayers('vermelho', true)}>% Verm. {sortFieldPlayers === 'vermelho' && sortPercentPlayers && (sortOrderPlayers === 'desc' ? <ChevronDownIcon className="inline h-3 w-3" /> : sortOrderPlayers === 'asc' ? <ChevronUpIcon className="inline h-3 w-3" /> : null)}</th>
                    <th className="px-2 py-1 cursor-pointer" onClick={() => handleSortPlayers('faltas', false)}>Faltas {sortFieldPlayers === 'faltas' && !sortPercentPlayers && (sortOrderPlayers === 'desc' ? <ChevronDownIcon className="inline h-3 w-3" /> : sortOrderPlayers === 'asc' ? <ChevronUpIcon className="inline h-3 w-3" /> : null)}</th>
                    <th className="px-2 py-1 cursor-pointer" onClick={() => handleSortPlayers('faltas', true)}>% Faltas {sortFieldPlayers === 'faltas' && sortPercentPlayers && (sortOrderPlayers === 'desc' ? <ChevronDownIcon className="inline h-3 w-3" /> : sortOrderPlayers === 'asc' ? <ChevronUpIcon className="inline h-3 w-3" /> : null)}</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(sortedPlayers) && sortedPlayers.map(([name, s]) => (
                    <tr key={name} className="border-b">
                      <td className="px-2 py-1 font-semibold text-blue-900">{name}</td>
                      <td className="px-2 py-1 text-center font-bold">{s.presencas}</td>
                      <td className="px-2 py-1 text-center">{percent(s.presencas, totalMatches)}</td>
                      <td className="px-2 py-1 text-center text-green-700 font-bold">{s.gols}</td>
                      <td className="px-2 py-1 text-center text-green-700">{percent(s.gols, s.presencas)}</td>
                      <td className="px-2 py-1 text-center text-blue-700 font-bold">{s.assist}</td>
                      <td className="px-2 py-1 text-center text-blue-700">{percent(s.assist, s.presencas)}</td>
                      <td className="px-2 py-1 text-center text-yellow-600 font-bold">{s.amarelo}</td>
                      <td className="px-2 py-1 text-center text-yellow-600">{percent(s.amarelo, s.presencas)}</td>
                      <td className="px-2 py-1 text-center text-red-600 font-bold">{s.vermelho}</td>
                      <td className="px-2 py-1 text-center text-red-600">{percent(s.vermelho, s.presencas)}</td>
                      <td className="px-2 py-1 text-center text-gray-700 font-bold">{s.faltas || 0}</td>
                      <td className="px-2 py-1 text-center text-gray-700">{percent(s.faltas || 0, s.presencas)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="mb-8">
            <h3 className="text-lg font-bold text-blue-800 mb-2">Goleiros</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="px-2 py-1 text-left cursor-pointer" onClick={() => handleSortGoalies('nome')}>Nome {sortFieldGoalies === 'nome' && (sortOrderGoalies === 'desc' ? <ChevronDownIcon className="inline h-3 w-3" /> : sortOrderGoalies === 'asc' ? <ChevronUpIcon className="inline h-3 w-3" /> : null)}</th>
                    <th className="px-2 py-1 cursor-pointer" onClick={() => handleSortGoalies('presencas', false)}>Jogos {sortFieldGoalies === 'presencas' && !sortPercentGoalies && (sortOrderGoalies === 'desc' ? <ChevronDownIcon className="inline h-3 w-3" /> : sortOrderGoalies === 'asc' ? <ChevronUpIcon className="inline h-3 w-3" /> : null)}</th>
                    <th className="px-2 py-1 cursor-pointer" onClick={() => handleSortGoalies('presencas', true)}>
                      % Jogos {sortFieldGoalies === 'presencas' && sortPercentGoalies && (sortOrderGoalies === 'desc' ? <ChevronDownIcon className="inline h-3 w-3" /> : sortOrderGoalies === 'asc' ? <ChevronUpIcon className="inline h-3 w-3" /> : null)}
                    </th>
                    <th className="px-2 py-1 cursor-pointer" onClick={() => handleSortGoalies('golsSofridos', false)}>Gols sofridos {sortFieldGoalies === 'golsSofridos' && !sortPercentGoalies && (sortOrderGoalies === 'desc' ? <ChevronDownIcon className="inline h-3 w-3" /> : sortOrderGoalies === 'asc' ? <ChevronUpIcon className="inline h-3 w-3" /> : null)}</th>
                    <th className="px-2 py-1 cursor-pointer" onClick={() => handleSortGoalies('golsSofridos', true)}>
                      Média Gols/jogo {sortFieldGoalies === 'golsSofridos' && sortPercentGoalies && (sortOrderGoalies === 'desc' ? <ChevronDownIcon className="inline h-3 w-3" /> : sortOrderGoalies === 'asc' ? <ChevronUpIcon className="inline h-3 w-3" /> : null)}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(sortedGoalies) && sortedGoalies.map(([name, s]) => (
                    <tr key={name} className="border-b">
                      <td className="px-2 py-1 font-semibold text-blue-900">{name}</td>
                      <td className="px-2 py-1 text-center font-bold">{s.presencas}</td>
                      <td className="px-2 py-1 text-center">{percent(s.presencas, totalMatches)}</td>
                      <td className="px-2 py-1 text-center text-red-600 font-bold">{s.golsSofridos}</td>
                      <td className="px-2 py-1 text-center text-blue-700">{s.presencas ? (s.golsSofridos/s.presencas).toFixed(2) : '0.00'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 justify-end mt-4">
            <button onClick={handleCopyPlayers} className={`inline-flex items-center gap-2 px-4 py-2 rounded font-semibold text-sm shadow transition-colors duration-200 ${copiedPlayers ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>{copiedPlayers ? <CheckCircleIcon className="h-5 w-5" /> : <ClipboardIcon className="h-5 w-5" />} Jogadores de Linha</button>
            <button onClick={handleCopyGoalies} className={`inline-flex items-center gap-2 px-4 py-2 rounded font-semibold text-sm shadow transition-colors duration-200 ${copiedGoalies ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>{copiedGoalies ? <CheckCircleIcon className="h-5 w-5" /> : <ClipboardIcon className="h-5 w-5" />} Goleiros</button>
            <button onClick={handleCopyAll} className={`inline-flex items-center gap-2 px-4 py-2 rounded font-semibold text-sm shadow transition-colors duration-200 ${copiedAll ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>{copiedAll ? <CheckCircleIcon className="h-5 w-5" /> : <ClipboardIcon className="h-5 w-5" />} Todos</button>
          </div>
        </>
      )}
    </div>
  )
}
