'use client'

import { useSession } from 'next-auth/react'
import {
  TrophyIcon,
  BanknotesIcon,
  ExclamationCircleIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ScaleIcon,
  ClipboardIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import StatsModal from '@/components/matches/StatsModal'
import { toast } from 'react-hot-toast';

// Desabilitar pré-renderização estática
export const dynamic = 'force-dynamic'

interface Match {
  id: string;
  opponent: string;
  date: string;
  score: string;
  result: 'victory' | 'draw' | 'defeat';
  stats: {
    goals: number;
    yellowCards: number;
    redCards: number;
  };
  ourScore1?: number;
  opponentScore1?: number;
  ourScore2?: number;
  opponentScore2?: number;
  events?: any[]; // Adicionado para armazenar os eventos de cada partida
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
}

interface DashboardData {
  lastMatchResult: 'victory' | 'draw' | 'defeat' | null;
  balance: number;
  pendingPayments: number;
  activePlayers: number;
  totalPlayers: number;
  recentMatches: Match[];
  recentTransactions: Transaction[];
  teamStatus: 'ACTIVE' | 'BLOCKED' | 'PAUSED'; // Adicionado para checar o status do time
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)

  // Estado para ordenação
  const [sortField, setSortField] = useState<'presencas' | 'gols' | 'assist' | 'amarelo' | 'vermelho' | 'golsSofridos' | null>('gols');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc' | null>('desc');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/login')
      return
    }

    if (session.user.isAdmin) {
      router.push('/admin')
      return
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/dashboard/summary')
        if (res.ok) {
          const data = await res.json()
          // Checagem de status do time
          if (data.teamStatus === 'BLOCKED' || data.teamStatus === 'PAUSED') {
            router.push('/acesso-bloqueado')
            return
          }
          setDashboardData(data)
        } else {
          console.error('Erro ao buscar dados do dashboard:', res.status)
          setDashboardData(null)
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data', error)
        setDashboardData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [session, status, router])

  if (loading || !session) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  const getResultText = (result: 'victory' | 'draw' | 'defeat' | null) => {
    if (!result) return 'N/A';
    switch (result) {
      case 'victory': return 'Vitória';
      case 'draw': return 'Empate';
      case 'defeat': return 'Derrota';
      default: return 'N/A';
    }
  }

  const getResultColor = (result: 'victory' | 'draw' | 'defeat') => {
    switch (result) {
      case 'victory': return 'bg-green-100 text-green-800';
      case 'draw': return 'bg-yellow-100 text-yellow-800';
      case 'defeat': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  // Função para resultado por quadro
  function getQuadroResult(ourScore: number, opponentScore: number) {
    if (ourScore > opponentScore) return { text: 'Vitória', color: 'text-green-700' };
    if (ourScore < opponentScore) return { text: 'Derrota', color: 'text-red-700' };
    return { text: 'Empate', color: 'text-blue-700' };
  }

  function getStatsFromEvents(events?: any[]) {
    if (!Array.isArray(events)) return { goals: 0, yellowCards: 0, redCards: 0 };
    return {
      goals: events.filter(ev => ev.type === 'goal').length,
      yellowCards: events.filter(ev => ev.type === 'yellow_card').length,
      redCards: events.filter(ev => ev.type === 'red_card').length,
    };
  }

  // Função utilitária para agrupar estatísticas por jogador
  function getPlayerStats(matches: Match[]) {
    const stats: Record<string, any> = {};
    let allPlayers = new Set<string>();
    let golsPro = 0;
    let golsContra = 0;
    let presencas: Record<string, number> = {};
    
    matches.forEach(match => {
      if (!Array.isArray(match.events)) return;
      
      // Presenças: para cada quadro, se o jogador tem evento 'home' naquele quadro, conta presença
      [1, 2].forEach(quadro => {
        const presentesQuadro = new Set(
          (match.events || [])
            .filter(ev => 
              ev.team === 'home' && 
              ev.quadro === quadro && 
              ev.player && 
              typeof ev.player === 'string' && 
              ev.player !== 'Adversário' &&
              ev.player.trim() !== ''
            )
            .map(ev => ev.player)
        );
        presentesQuadro.forEach(playerName => {
          allPlayers.add(playerName);
          if (!presencas[playerName]) presencas[playerName] = 0;
          presencas[playerName]++;
        });
      });
      
      (match.events || []).forEach(ev => {
        // Gols sofridos por goleiro: contabilizar SEMPRE que houver campo goleiro
        if (ev.goleiro && typeof ev.goleiro === 'string' && ev.type === 'goal' && ev.team === 'away' && ev.goleiro !== 'Adversário' && ev.goleiro.trim() !== '') {
          allPlayers.add(ev.goleiro);
          if (!stats[ev.goleiro]) stats[ev.goleiro] = { presencas: 0, gols: 0, assist: 0, amarelo: 0, vermelho: 0, golsSofridos: 0 };
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
        if (!stats[playerName]) stats[playerName] = { presencas: 0, gols: 0, assist: 0, amarelo: 0, vermelho: 0, golsSofridos: 0 };
        
        if (ev.type === 'goal') {
          if (ev.team === 'home') {
            stats[playerName].gols++;
            golsPro++;
          }
        }
        if (ev.type === 'assist') stats[playerName].assist++;
        if (ev.type === 'yellow_card') stats[playerName].amarelo++;
        if (ev.type === 'red_card') stats[playerName].vermelho++;
      });
    });
    
    // Preencher presenças no stats
    Object.keys(presencas).forEach(player => {
      if (!stats[player]) stats[player] = { presencas: 0, gols: 0, assist: 0, amarelo: 0, vermelho: 0, golsSofridos: 0 };
      stats[player].presencas = presencas[player];
    });
    
    return { stats, allPlayers: Array.from(allPlayers), golsPro, golsContra };
  }

  // Função para lidar com clique no ícone
  function handleSort(field: 'presencas' | 'gols' | 'assist' | 'amarelo' | 'vermelho' | 'golsSofridos') {
    if (sortField !== field) {
      setSortField(field);
      setSortOrder('desc');
    } else if (sortOrder === 'desc') {
      setSortOrder('asc');
    } else if (sortOrder === 'asc') {
      setSortField('gols');
      setSortOrder('desc');
    }
  }

  // Função para copiar estatísticas
  function handleCopyStats(stats: any, allPlayers: string[]) {
    // Cabeçalho com abreviações mais compactas
    const header = ['Jogador', 'P', 'G', 'A', 'CA', 'CV', 'GS'];
    // Calcular a largura máxima do nome do jogador para alinhamento
    const maxNameLength = Math.max(
      ...allPlayers.filter(p => p !== 'Adversário').map(name => name.length),
      'Jogador'.length
    );
    // Definir larguras fixas para cada coluna (mais compactas)
    const colWidths = [maxNameLength, 2, 2, 2, 2, 2, 2];
    const fixedSpace = '\u2007';
    const pad = (str: string | number, len: number, align: 'left' | 'right' = 'left') => {
      str = String(str ?? '');
      let padded = align === 'left' ? str.padEnd(len, ' ') : str.padStart(len, ' ');
      return padded.replace(/ /g, fixedSpace);
    };
    // Linha de cabeçalho
    const headerLine = '`' + header.map((h, i) => pad(h, colWidths[i])).join(' ') + '`';
    // Linhas dos jogadores
    const rows = allPlayers.filter(p => p !== 'Adversário').map(player =>
      '`' + [player, stats[player].presencas, stats[player].gols, stats[player].assist, stats[player].amarelo, stats[player].vermelho, stats[player].golsSofridos]
        .map((v, i) => pad(v, colWidths[i], i === 0 ? 'left' : 'right')).join(' ') + '`'
    );
    const text = [headerLine, ...rows].join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Estatísticas copiadas!');
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Bem-vindo, {session.user?.name}!
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Aqui está um resumo do seu time
        </p>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrophyIcon className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Último Jogo
                  </dt>
                  <dd className="flex flex-col items-start mt-2 space-y-1">
                    {dashboardData?.recentMatches && dashboardData.recentMatches.length > 0 &&
                      typeof dashboardData.recentMatches[0]?.ourScore1 === 'number' && typeof dashboardData.recentMatches[0]?.opponentScore1 === 'number' && (
                        <>
                          <div className={`text-sm font-medium ${getQuadroResult((dashboardData.recentMatches[0]?.ourScore1 ?? 0), (dashboardData.recentMatches[0]?.opponentScore1 ?? 0)).color}`}>
                            1º Quadro: {getQuadroResult((dashboardData.recentMatches[0]?.ourScore1 ?? 0), (dashboardData.recentMatches[0]?.opponentScore1 ?? 0)).text}
                          </div>
                          <div className={`text-sm font-medium ${getQuadroResult((dashboardData.recentMatches[0]?.ourScore2 ?? 0), (dashboardData.recentMatches[0]?.opponentScore2 ?? 0)).color}`}>
                            2º Quadro: {getQuadroResult((dashboardData.recentMatches[0]?.ourScore2 ?? 0), (dashboardData.recentMatches[0]?.opponentScore2 ?? 0)).text}
                          </div>
                        </>
                      )
                    }
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/dashboard/financial')}>
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BanknotesIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Saldo em Caixa
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      R$ {(dashboardData?.balance ?? 0).toFixed(2)}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/dashboard/financial')}>
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationCircleIcon className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pendências Financeiras
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {dashboardData?.pendingPayments ?? 0} jogadores
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/dashboard/players')}>
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Jogadores Ativos
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {dashboardData?.activePlayers ?? 0} / {dashboardData?.totalPlayers ?? 0}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seção de últimas partidas */}
      <div className="mt-8 overflow-x-auto w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Últimas Partidas</h2>
          <button 
            onClick={() => router.push('/dashboard/matches')}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Ver todas →
          </button>
        </div>
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {dashboardData?.recentMatches && dashboardData.recentMatches.length > 0 ? (
            <>
              <ul role="list" className="divide-y divide-gray-200">
                {dashboardData.recentMatches.slice(0, 3).map((match) => {
                  return (
                    <li key={match.id}>
                      <button className="w-full text-left px-4 py-4 sm:px-6 hover:bg-gray-50 focus:outline-none" onClick={() => setSelectedMatch(match)}>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900">
                              vs {match.opponent}
                            </p>
                            <span className="text-xs text-gray-500">{new Date(match.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 items-center">
                            {typeof match.ourScore1 === 'number' && typeof match.opponentScore1 === 'number' && (
                              <span className={`px-2 py-1 rounded text-sm font-bold ${getQuadroResult((match?.ourScore1 ?? 0), (match?.opponentScore1 ?? 0)).color}`}>1ºQ: {match?.ourScore1 ?? 0}×{match?.opponentScore1 ?? 0}</span>
                            )}
                            {typeof match.ourScore2 === 'number' && typeof match.opponentScore2 === 'number' && (
                              <span className={`px-2 py-1 rounded text-sm font-bold ${getQuadroResult((match?.ourScore2 ?? 0), (match?.opponentScore2 ?? 0)).color}`}>2ºQ: {match?.ourScore2 ?? 0}×{match?.opponentScore2 ?? 0}</span>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {selectedMatch && selectedMatch.events && selectedMatch.events.length > 0 && (
                <StatsModal
                  isOpen={!!selectedMatch}
                  onClose={() => setSelectedMatch(null)}
                  events={selectedMatch.events}
                />
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Nenhuma partida registrada ainda.
            </div>
          )}
        </div>
      </div>

      {/* Seção de estatísticas */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Estatísticas</h2>
        <div className="bg-white shadow overflow-hidden sm:rounded-md p-4">
          {dashboardData?.recentMatches && dashboardData.recentMatches.length > 0 ? (() => {
            const { stats, allPlayers, golsPro, golsContra } = getPlayerStats(dashboardData.recentMatches);
            return (
              <>
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm text-gray-700">
                    Gols Pró: <span className="font-bold">{golsPro}</span> &nbsp; | &nbsp; Gols Contra: <span className="font-bold">{golsContra}</span> &nbsp; | &nbsp; Saldo: <span className="font-bold">{golsPro - golsContra}</span>
                  </div>
                  <button
                    className={`flex items-center gap-1 text-xs focus:outline-none transition-colors duration-200 ${
                      copied 
                        ? 'text-green-600 font-semibold' 
                        : 'text-primary hover:underline'
                    }`}
                    onClick={() => handleCopyStats(stats, allPlayers)}
                    title="Copiar estatísticas para área de transferência"
                  >
                    <ClipboardIcon className="h-4 w-4" />
                    {copied ? 'Copiado!' : 'Copiar estatísticas'}
                  </button>
                </div>
                <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
                  <thead>
                    <tr>
                      <th className="px-2 py-1 text-left text-xs font-semibold text-gray-700">Jogador</th>
                      <th className="px-2 py-1 text-center text-xs font-semibold text-gray-700 cursor-pointer select-none" title="Presenças" onClick={() => handleSort('presencas')}>✅{sortField === 'presencas' && (sortOrder === 'desc' ? <ChevronDownIcon className="inline h-3 w-3" /> : <ChevronUpIcon className="inline h-3 w-3" />)}</th>
                      <th className="px-2 py-1 text-center text-xs font-semibold text-gray-700 cursor-pointer select-none" title="Gols" onClick={() => handleSort('gols')}>⚽{sortField === 'gols' && (sortOrder === 'desc' ? <ChevronDownIcon className="inline h-3 w-3" /> : <ChevronUpIcon className="inline h-3 w-3" />)}</th>
                      <th className="px-2 py-1 text-center text-xs font-semibold text-gray-700 cursor-pointer select-none" title="Assistências" onClick={() => handleSort('assist')}>🅰️{sortField === 'assist' && (sortOrder === 'desc' ? <ChevronDownIcon className="inline h-3 w-3" /> : <ChevronUpIcon className="inline h-3 w-3" />)}</th>
                      <th className="px-2 py-1 text-center text-xs font-semibold text-gray-700 cursor-pointer select-none" title="Amarelo" onClick={() => handleSort('amarelo')}>🟨{sortField === 'amarelo' && (sortOrder === 'desc' ? <ChevronDownIcon className="inline h-3 w-3" /> : <ChevronUpIcon className="inline h-3 w-3" />)}</th>
                      <th className="px-2 py-1 text-center text-xs font-semibold text-gray-700 cursor-pointer select-none" title="Vermelho" onClick={() => handleSort('vermelho')}>🟥{sortField === 'vermelho' && (sortOrder === 'desc' ? <ChevronDownIcon className="inline h-3 w-3" /> : <ChevronUpIcon className="inline h-3 w-3" />)}</th>
                      <th className="px-2 py-1 text-center text-xs font-semibold text-gray-700 cursor-pointer select-none" title="Gols Sofridos (Goleiro)" onClick={() => handleSort('golsSofridos')}>🥅{sortField === 'golsSofridos' && (sortOrder === 'desc' ? <ChevronDownIcon className="inline h-3 w-3" /> : <ChevronUpIcon className="inline h-3 w-3" />)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Ordenar os jogadores conforme o sortField e sortOrder */}
                    {allPlayers.filter(player => player !== 'Adversário').sort((a, b) => {
                      if (!sortField) return 0;
                      if (sortOrder === 'asc') return stats[a][sortField] - stats[b][sortField];
                      return stats[b][sortField] - stats[a][sortField];
                    }).map(player => (
                      <tr key={player}>
                        <td className="px-2 py-1 text-sm font-medium text-gray-900">{player}</td>
                        <td className="px-2 py-1 text-center">{stats[player].presencas}</td>
                        <td className="px-2 py-1 text-center">{stats[player].gols}</td>
                        <td className="px-2 py-1 text-center">{stats[player].assist}</td>
                        <td className="px-2 py-1 text-center">{stats[player].amarelo}</td>
                        <td className="px-2 py-1 text-center">{stats[player].vermelho}</td>
                        <td className="px-2 py-1 text-center">{stats[player].golsSofridos}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            );
          })() : <div className="text-center text-gray-500">Nenhuma estatística disponível.</div>}
        </div>
      </div>

      {/* Seção financeira */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Últimas Movimentações</h2>
          <button 
            onClick={() => router.push('/dashboard/financial')}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Ver todas →
          </button>
        </div>
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {dashboardData && dashboardData.recentTransactions && dashboardData.recentTransactions.length > 0 ? (
          <ul role="list" className="divide-y divide-gray-200">
              {dashboardData.recentTransactions.slice(0, 5).map((transaction) => (
              <li key={transaction.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-900">{transaction.description}</div>
                    <div className={`text-sm font-medium ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                        {transaction.type === 'income' ? <ArrowTrendingUpIcon className="h-5 w-5 inline mr-1" /> : <ArrowTrendingDownIcon className="h-5 w-5 inline mr-1" />}
                      R$ {Math.abs(transaction.amount).toFixed(2)}
                      </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Nenhuma movimentação financeira registrada.
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 