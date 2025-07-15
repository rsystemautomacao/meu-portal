"use client"

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Dialog } from '@headlessui/react'

const EVENT_TYPES = [
  { type: 'goal', label: 'Gol', color: 'bg-green-500' },
  { type: 'yellow_card', label: 'Amarelo', color: 'bg-yellow-400' },
  { type: 'red_card', label: 'Vermelho', color: 'bg-red-500' },
  { type: 'assist', label: 'Assistência', color: 'bg-blue-400' },
]

export default function MatchSheetPage() {
  const params = useParams()
  const router = useRouter()
  const token = params?.token as string
  const [match, setMatch] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [events, setEvents] = useState<any[]>([])
  const [form, setForm] = useState({
    type: 'goal',
    player: '',
    minute: '',
    quadro: 1,
    team: 'home',
    assist: '', // NOVO: campo de assistência
    goleiro: '', // NOVO: campo de goleiro
  })
  const [saving, setSaving] = useState(false)
  const [finalizado, setFinalizado] = useState(false)
  // NOVO: Estado para seleção inicial do quadro
  const [quadroSelecionado, setQuadroSelecionado] = useState<number|null>(null)
  // NOVO: Estado para seleção de jogadores presentes
  const [presentes, setPresentes] = useState<any[]>([])
  const [selecionandoPresentes, setSelecionandoPresentes] = useState(false)
  const [jogadores, setJogadores] = useState<any[]>([])
  // Timer por quadro
  const [timer, setTimer] = useState<Record<1|2, number>>({ 1: 0, 2: 0 }) // segundos restantes
  const [timerRunning, setTimerRunning] = useState<Record<1|2, boolean>>({ 1: false, 2: false })
  const [timerInitial, setTimerInitial] = useState<Record<1|2, number>>({ 1: 25, 2: 25 }) // minutos padrão
  const timerInterval = useRef<NodeJS.Timeout | null>(null)
  // NOVO: Estado para controlar quadros preenchidos
  const [quadrosPreenchidos, setQuadrosPreenchidos] = useState<{1: boolean, 2: boolean}>({1: false, 2: false})
  // NOVO: Estado para controlar modal de fim do tempo
  const [showTimerEndModal, setShowTimerEndModal] = useState(false)
  const [restaurado, setRestaurado] = useState(false)

  // Chave única para o localStorage baseada no token da súmula
  const STORAGE_KEY = token ? `sumula-online-${token}` : 'sumula-online-temp'

  // Carregar rascunho salvo ao abrir a página
  useEffect(() => {
    if (!token) return
    const draft = localStorage.getItem(STORAGE_KEY)
    if (draft) {
      try {
        const data = JSON.parse(draft)
        if (data.events) setEvents(data.events)
        if (data.quadroSelecionado !== undefined) setQuadroSelecionado(data.quadroSelecionado)
        if (data.presentes) setPresentes(data.presentes)
        if (data.timer) setTimer(data.timer)
        if (data.timerRunning) setTimerRunning(data.timerRunning)
        if (data.timerInitial) setTimerInitial(data.timerInitial)
        if (data.quadrosPreenchidos) setQuadrosPreenchidos(data.quadrosPreenchidos)
        setSelecionandoPresentes(false)
      } catch {}
    }
    setRestaurado(true)
  }, [token])

  // Salvar rascunho sempre que eventos, quadro, presentes ou timers mudarem
  useEffect(() => {
    if (!token || !restaurado) return
    // Salvar apenas os campos essenciais dos eventos
    const eventosEssenciais = events.map(ev => ({
      type: ev.type,
      player: ev.player,
      minute: ev.minute,
      team: ev.team,
      quadro: ev.quadro,
      assist: ev.assist,
      goleiro: ev.goleiro
    }))
    // Salvar apenas id e nome dos presentes
    const presentesEssenciais = presentes.map((p: any) => ({ id: p.id, name: p.name }))
    const draft = {
      events: eventosEssenciais,
      quadroSelecionado,
      presentes: presentesEssenciais,
      timer,
      timerRunning,
      timerInitial,
      quadrosPreenchidos
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
    } catch (e) {
      // Se exceder a cota, não salva e evita crash
      console.error('Erro ao salvar rascunho da súmula:', e)
    }
  }, [events, quadroSelecionado, presentes, timer, timerRunning, timerInitial, quadrosPreenchidos, token, restaurado])

  const fetchMatch = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/matches/sheet?shareToken=${token}`)
      if (!res.ok) throw new Error('Erro ao buscar súmula')
      const data = await res.json()
      setMatch(data)
      setEvents(data.events || [])
    } catch (e) {
      setError('Erro ao carregar súmula')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) fetchMatch()
    // eslint-disable-next-line
  }, [token])

  // Buscar jogadores do time
  const fetchJogadores = async () => {
    try {
      // Buscar jogadores do time da partida
      const res = await fetch(`/api/matches/sheet/players?shareToken=${token}`)
      if (!res.ok) throw new Error('Erro ao buscar jogadores')
      const data = await res.json()
      setJogadores(data)
    } catch (e) {
      setError('Erro ao buscar jogadores do time')
    }
  }

  // Remover o bloco 'if (!restaurado) return ...' daqui (meio dos hooks)

  // Ao escolher quadro, abrir seleção de jogadores presentes
  useEffect(() => {
    if (!restaurado) return
    if (quadroSelecionado !== null && !finalizado) {
      fetchJogadores()
      setSelecionandoPresentes(true)
    }
  }, [quadroSelecionado, finalizado, restaurado])

  // Só libera o formulário se já selecionou presentes E já restaurou
  const podeAdicionarEvento = restaurado && !finalizado && quadroSelecionado !== null && presentes.length > 0

  // Atualiza timer do quadro selecionado (regressivo)
  useEffect(() => {
    if (!restaurado) return
    if (quadroSelecionado === null) return
    if (timerRunning[quadroSelecionado as 1|2]) {
      timerInterval.current = setInterval(() => {
        setTimer(t => {
          const current = t[quadroSelecionado as 1|2]
          if (current > 0) {
            return { ...t, [quadroSelecionado as 1|2]: current - 1 }
          } else {
            setTimerRunning(tr => ({ ...tr, [quadroSelecionado as 1|2]: false }))
            setShowTimerEndModal(true)
            return t
          }
        })
      }, 1000)
    } else if (timerInterval.current) {
      clearInterval(timerInterval.current)
    }
    return () => { if (timerInterval.current) clearInterval(timerInterval.current) }
  }, [timerRunning, quadroSelecionado, restaurado])

  // Função para formatar segundos em mm:ss
  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  // Ao mudar quadro, parar timer e resetar para valor inicial
  useEffect(() => {
    if (!restaurado) return
    if (quadroSelecionado !== null) {
      setTimerRunning({ 1: false, 2: false })
      setTimer(t => ({ ...t, [quadroSelecionado as 1|2]: timerInitial[quadroSelecionado as 1|2] * 60 }))
    }
  }, [quadroSelecionado, restaurado])

  // Ao abrir formulário, preencher minuto com timer atual (minutos restantes)
  useEffect(() => {
    if (!restaurado) return
    if (podeAdicionarEvento) {
      setForm(f => ({ ...f, minute: String(Math.ceil(timer[quadroSelecionado as 1|2]/60)) }))
    }
    // eslint-disable-next-line
  }, [podeAdicionarEvento, restaurado])

  // Função para selecionar tempo de jogo
  const handleTimeSelect = (minutes: number) => {
    setTimerInitial(t => ({ ...t, [quadroSelecionado as 1|2]: minutes }))
    setTimer(t => ({ ...t, [quadroSelecionado as 1|2]: minutes * 60 }))
  }

  // Ao trocar tipo de evento, atualizar minuto automaticamente
  useEffect(() => {
    if (!restaurado) return
    if (podeAdicionarEvento && quadroSelecionado !== null) {
      setForm(f => ({ ...f, minute: String(Math.ceil(timer[quadroSelecionado as 1|2]/60)) }))
    }
    // eslint-disable-next-line
  }, [form.type, form.team, restaurado])

  // Função para garantir que 'home' é sempre o time do match.team
  const getTeamType = (selected: string) => {
    if (!match) return selected
    // 'home' sempre é o time do match.team
    return selected
  }

  const placarQuadro = (quadro: 1 | 2) => {
    let nosso = 0, adv = 0
    events.filter(ev => ev.type === 'goal' && (ev.quadro || 1) === quadro).forEach(ev => {
      if (ev.team === 'home') nosso++
      else if (ev.team === 'away') adv++
    })
    return { nosso, adv }
  }

  // NOVO: ao adicionar evento, incluir assistência se for gol do próprio time
  const handleAddEvent = () => {
    if (!form.player) {
      alert('Selecione ou preencha o jogador!')
      return
    }
    // Permitir campo minuto vazio e considerar como zero
    let minuteValue = parseInt(form.minute)
    if (isNaN(minuteValue)) minuteValue = 0
    let evento: any = { ...form, minute: minuteValue, quadro: quadroSelecionado }
    evento.team = getTeamType(form.team)
    if (!(form.type === 'goal' && evento.team === 'home')) {
      const { assist, ...rest } = evento
      evento = rest
    }
    if (evento.type === 'goal' && evento.team === 'away' && form.goleiro) {
      evento.goleiro = form.goleiro
    }
    setEvents([...events, evento])
    setForm({ ...form, player: '', minute: '', assist: '', goleiro: '' })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const q1 = placarQuadro(1)
      const q2 = placarQuadro(2)
      await fetch('/api/matches/sheet', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shareToken: token,
          ourScore1: q1.nosso,
          opponentScore1: q1.adv,
          ourScore2: q2.nosso,
          opponentScore2: q2.adv,
          events: events.map(ev => ({
            type: ev.type,
            player: ev.player,
            minute: ev.minute,
            team: ev.team,
            quadro: ev.quadro || quadroSelecionado, // garantir que sempre tem quadro
            assist: ev.assist, // Incluir assistência no salvamento
            goleiro: ev.goleiro
          }))
        })
      })
      setFinalizado(true)
      await fetchMatch() // garantir atualização dos eventos
      localStorage.removeItem(STORAGE_KEY)
    } catch (e) {
      setError('Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  // Atualizar quadros preenchidos ao finalizar
  const handleFinalizarQuadro = async () => {
    setSaving(true)
    try {
      const q1 = placarQuadro(1)
      const q2 = placarQuadro(2)
      await fetch('/api/matches/sheet', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shareToken: token,
          ourScore1: q1.nosso,
          opponentScore1: q1.adv,
          ourScore2: q2.nosso,
          opponentScore2: q2.adv,
          events: events.map(ev => ({
            type: ev.type,
            player: ev.player,
            minute: ev.minute,
            team: ev.team,
            quadro: ev.quadro || quadroSelecionado,
            assist: ev.assist,
            goleiro: ev.goleiro
          }))
        })
      })
      setQuadrosPreenchidos(q => ({ ...q, [quadroSelecionado as 1|2]: true }))
      setQuadroSelecionado(null) // volta para seleção de quadro
      await fetchMatch()
      localStorage.removeItem(STORAGE_KEY)
    } catch (e) {
      setError('Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  // Só finalizar a súmula quando ambos quadros estiverem preenchidos
  const sumulaCompleta = quadrosPreenchidos[1] && quadrosPreenchidos[2]

  if (!restaurado) return <div className="p-6 text-center">Carregando...</div>
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando súmula...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-xl">⚠️</span>
          </div>
          <p className="text-red-600 font-semibold">{error}</p>
        </div>
      </div>
    )
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-gray-100 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-4">
            <span className="text-gray-600 text-xl">❌</span>
          </div>
          <p className="text-gray-600">Súmula não encontrada</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col items-center px-4 py-6">
      {/* NOVO: Seleção inicial do quadro, desabilitando quadros já preenchidos */}
      {quadroSelecionado === null && !sumulaCompleta && !finalizado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center border border-blue-200">
            <div className="font-bold text-2xl mb-6 text-blue-900 flex items-center justify-center">
              <span className="mr-2">⚽</span>
              Qual quadro deseja preencher?
            </div>
            <div className="flex gap-4 justify-center">
              <button
                className={`bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl px-8 py-4 font-bold text-lg shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 ${quadrosPreenchidos[1] ? 'opacity-50 cursor-not-allowed' : 'transform hover:scale-105'}`}
                onClick={() => !quadrosPreenchidos[1] && setQuadroSelecionado(1)}
                disabled={quadrosPreenchidos[1]}
              >
                <div className="text-sm mb-1">1º</div>
                <div>Quadro</div>
              </button>
              <button
                className={`bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl px-8 py-4 font-bold text-lg shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 ${quadrosPreenchidos[2] ? 'opacity-50 cursor-not-allowed' : 'transform hover:scale-105'}`}
                onClick={() => !quadrosPreenchidos[2] && setQuadroSelecionado(2)}
                disabled={quadrosPreenchidos[2]}
              >
                <div className="text-sm mb-1">2º</div>
                <div>Quadro</div>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal de seleção de jogadores presentes */}
      {selecionandoPresentes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center border border-green-200">
            <div className="font-bold text-2xl mb-6 text-green-900 flex items-center justify-center">
              <span className="mr-2">👥</span>
              Jogadores Presentes
            </div>
            <div className="max-h-60 overflow-y-auto mb-6 text-left bg-gray-50 rounded-lg p-4">
              {jogadores.map((j: any) => (
                <label key={j.id} className="flex items-center gap-3 py-2 cursor-pointer hover:bg-gray-100 rounded px-2 transition-colors">
                  <input
                    type="checkbox"
                    checked={presentes.some(p => p.id === j.id)}
                    onChange={e => {
                      if (e.target.checked) setPresentes(p => [...p, j])
                      else setPresentes(p => p.filter(pj => pj.id !== j.id))
                    }}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="font-medium">{j.name}</span>
                </label>
              ))}
            </div>
            <button
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl px-8 py-3 font-bold text-lg shadow-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105"
              disabled={presentes.length === 0}
              onClick={() => setSelecionandoPresentes(false)}
            >
              Confirmar ({presentes.length} jogadores)
            </button>
          </div>
        </div>
      )}
      {/* Cabeçalho da súmula */}
      <div className="w-full max-w-lg bg-gradient-to-r from-white to-blue-50 rounded-2xl shadow-xl p-8 mb-6 border border-blue-200">
        <div className="text-center mb-6">
          <div className="text-sm text-blue-600 font-semibold mb-2">⚽ Súmula Online</div>
          <div className="font-bold text-3xl text-gray-900 mb-2">{match.team?.name} vs {match.opponent}</div>
          <div className="text-lg text-gray-600">{format(new Date(match.date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}</div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Local</label>
            <select
              className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-lg bg-white text-center font-semibold"
              value={match.location || ''}
              disabled
            >
              <option value="">Selecione</option>
              <option value="Casa">🏠 Casa</option>
              <option value="Visitante">🚌 Visitante</option>
            </select>
          </div>
        </div>
        <div className="flex justify-between my-6">
          <div className="flex-1 text-center bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 mx-2">
            <div className="text-sm text-green-700 font-semibold mb-2">1º Quadro</div>
            <div className="text-3xl font-bold text-green-900">
              {placarQuadro(1).nosso} <span className="text-gray-400">×</span> {placarQuadro(1).adv}
            </div>
          </div>
          <div className="flex-1 text-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 mx-2">
            <div className="text-sm text-blue-700 font-semibold mb-2">2º Quadro</div>
            <div className="text-3xl font-bold text-blue-900">
              {placarQuadro(2).nosso} <span className="text-gray-400">×</span> {placarQuadro(2).adv}
            </div>
          </div>
        </div>
      </div>
      {/* Formulário de eventos */}
      {podeAdicionarEvento && (
        <div className="w-full max-w-lg bg-gradient-to-r from-white to-purple-50 rounded-2xl shadow-xl p-8 mb-6 border border-purple-200">
          <div className="mb-6 font-bold text-center text-2xl text-purple-900 flex items-center justify-center">
            <span className="mr-2">➕</span>
            Adicionar Evento
          </div>
          <div className="flex flex-col gap-4">
            <select
              className="rounded-xl border-gray-300 p-4 text-lg bg-white shadow-sm focus:border-purple-500 focus:ring-purple-500"
              value={form.team}
              onChange={e => setForm(f => ({ ...f, team: e.target.value }))}
            >
              <option value="home">🏠 Meu time</option>
              <option value="away">⚔️ Adversário</option>
            </select>
            <select
              className="rounded-xl border-gray-300 p-4 text-lg bg-white shadow-sm focus:border-purple-500 focus:ring-purple-500"
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            >
              {EVENT_TYPES.map(ev => (
                <option key={ev.type} value={ev.type}>{ev.label}</option>
              ))}
            </select>
            {form.team === 'home' ? (
              <select
                className="rounded-xl border-gray-300 p-4 text-lg bg-white shadow-sm focus:border-purple-500 focus:ring-purple-500"
                value={form.player}
                onChange={e => setForm(f => ({ ...f, player: e.target.value }))}
              >
                <option value="">👤 Selecione o jogador</option>
                {presentes.map((j: any) => (
                  <option key={j.id} value={j.name}>{j.name}</option>
                ))}
              </select>
            ) : (
              <input
                className="rounded-xl border-gray-300 p-4 text-lg bg-white shadow-sm focus:border-purple-500 focus:ring-purple-500"
                placeholder="👤 Nome do jogador"
                value={form.player}
                onChange={e => setForm(f => ({ ...f, player: e.target.value }))}
              />
            )}
            {/* NOVO: campo de assistência se for gol do próprio time */}
            {form.type === 'goal' && form.team === 'home' && (
              <select
                className="rounded-xl border-gray-300 p-4 text-lg bg-white shadow-sm focus:border-purple-500 focus:ring-purple-500"
                value={form.assist}
                onChange={e => setForm(f => ({ ...f, assist: e.target.value }))}
              >
                <option value="">🅰️ Assistência (opcional)</option>
                {presentes.filter(j => j.name !== form.player).map((j: any) => (
                  <option key={j.id} value={j.name}>{j.name}</option>
                ))}
              </select>
            )}
            {/* NOVO: campo de goleiro se for gol do adversário */}
            {form.type === 'goal' && form.team === 'away' && (
              <select
                className="rounded-xl border-gray-300 p-4 text-lg bg-white shadow-sm focus:border-purple-500 focus:ring-purple-500"
                value={form.goleiro}
                onChange={e => setForm(f => ({ ...f, goleiro: e.target.value }))}
              >
                <option value="">Selecione o goleiro</option>
                {presentes.map((j: any) => (
                  <option key={j.id} value={j.name}>{j.name}</option>
                ))}
              </select>
            )}
            
            {/* Timer do quadro - Reposicionado e melhorado */}
            <div className="w-full bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
              <div className="mb-4 font-bold text-center text-xl text-yellow-900 flex items-center justify-center">
                <span className="mr-2">⏱️</span>
                Tempo do {quadroSelecionado}º Quadro
              </div>
              
              {/* Display do timer */}
              <div className="text-center mb-4">
                <span className="text-5xl font-mono bg-white px-6 py-3 rounded-xl shadow-lg border border-yellow-200 text-yellow-900">
                  {formatTimer(timer[quadroSelecionado as 1|2])}
                </span>
              </div>
              
              {/* Controles do timer */}
              <div className="flex justify-center gap-3 mb-4">
                <button
                  className={`px-4 py-2 rounded-lg font-bold shadow-lg transition-all duration-200 ${timerRunning[quadroSelecionado as 1|2] ? 'bg-yellow-500 text-white hover:bg-yellow-600' : 'bg-green-600 text-white hover:bg-green-700'} transform hover:scale-105`}
                  onClick={() => {
                    if (!timerRunning[quadroSelecionado as 1|2]) {
                      if (timer[quadroSelecionado as 1|2] === 0) {
                        setTimer(t => ({ ...t, [quadroSelecionado as 1|2]: timerInitial[quadroSelecionado as 1|2] * 60 }))
                      }
                    }
                    setTimerRunning(t => ({ ...t, [quadroSelecionado as 1|2]: !t[quadroSelecionado as 1|2] }))
                  }}
                  type="button"
                >
                  {timerRunning[quadroSelecionado as 1|2] ? '⏸️ Pausar' : '▶️ Iniciar'}
                </button>
                <button
                  className="px-4 py-2 rounded-lg bg-gray-300 text-gray-700 font-bold shadow-lg hover:bg-gray-400 transition-all duration-200 transform hover:scale-105"
                  onClick={() => setTimer(t => ({ ...t, [quadroSelecionado as 1|2]: timerInitial[quadroSelecionado as 1|2] * 60 }))}
                  type="button"
                >
                  🔄 Zerar
                </button>
              </div>
              
              {/* Seleção rápida de tempo */}
              <div className="text-center">
                <div className="text-sm text-yellow-700 font-semibold mb-2">Tempo de jogo:</div>
                <div className="flex flex-wrap justify-center gap-2">
                  {[5, 10, 15, 20, 25, 30].map(minutes => (
                    <button
                      key={minutes}
                      className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all duration-200 ${
                        timerInitial[quadroSelecionado as 1|2] === minutes
                          ? 'bg-yellow-600 text-white'
                          : 'bg-white text-yellow-700 hover:bg-yellow-100'
                      }`}
                      onClick={() => handleTimeSelect(minutes)}
                      disabled={timerRunning[quadroSelecionado as 1|2]}
                    >
                      {minutes}min
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {/* Campo minuto preenchido automaticamente ao adicionar evento */}
            <input
              className="rounded-xl border-gray-300 p-4 text-lg bg-white shadow-sm focus:border-purple-500 focus:ring-purple-500 text-center"
              placeholder="⏰ Minuto"
              type="number"
              value={form.minute}
              onChange={e => setForm(f => ({ ...f, minute: e.target.value }))}
            />
            {/* Campo quadro fixo, não editável */}
            <div className="rounded-xl border border-purple-300 p-4 bg-gradient-to-r from-purple-50 to-pink-50 text-center text-purple-900 font-bold text-lg">
              {quadroSelecionado}º Quadro
            </div>
            <button
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl py-4 font-bold text-xl shadow-lg mt-4 hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105"
              onClick={() => {
                setForm(f => ({ ...f, minute: String(Math.ceil(timer[quadroSelecionado as 1|2]/60)) }));
                handleAddEvent();
              }}
              type="button"
            >
              ➕ Adicionar Evento
            </button>
          </div>
        </div>
      )}
      {/* Lista de eventos */}
      <div className="w-full max-w-lg bg-gradient-to-r from-white to-gray-50 rounded-2xl shadow-xl p-8 mb-6 border border-gray-200">
        <div className="mb-6 font-bold text-center text-2xl text-gray-900 flex items-center justify-center">
          <span className="mr-2">📋</span>
          Eventos Registrados
        </div>
        {events.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">📝</div>
            <div className="font-semibold">Nenhum evento registrado ainda.</div>
            <div className="text-sm">Adicione eventos usando o formulário acima.</div>
          </div>
        )}
        <ul className="space-y-3">
          {events.map((ev, i) => (
            <li key={i} className="flex items-center justify-between py-4 px-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-2 rounded-lg text-white font-semibold text-sm ${EVENT_TYPES.find(t => t.type === ev.type)?.color || 'bg-gray-500'}`}>
                  {EVENT_TYPES.find(t => t.type === ev.type)?.label || ev.type}
                </span>
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-900">{ev.player}</span>
                  <span className="text-xs text-gray-500">{ev.team === 'home' ? '🏠 Meu time' : '⚔️ Adversário'}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-gray-700">{ev.minute}'</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-semibold">{ev.quadro}ºQ</span>
                {ev.type === 'goal' && ev.team === 'home' && ev.assist && (
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs">🅰️ {ev.assist}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
      {/* Botão de finalizar quadro ou sumula */}
      {quadroSelecionado !== null && !finalizado && (
        <button
          className="w-full max-w-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl py-6 font-bold text-xl shadow-xl mb-6 hover:from-green-700 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105"
          onClick={handleFinalizarQuadro}
          disabled={saving}
        >
          {saving ? '💾 Salvando...' : '✅ Finalizar e Salvar Quadro'}
        </button>
      )}
      {finalizado && (
        <button
          className="w-full max-w-lg bg-gradient-to-r from-green-700 to-emerald-700 text-white rounded-2xl py-6 font-bold text-xl shadow-xl mb-6"
          onClick={() => {
            setFinalizado(true)
            router.push('/dashboard/matches')
          }}
        >
          🎉 Súmula finalizada e salva!
        </button>
      )}
      <button
        className="w-full max-w-lg bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 rounded-2xl py-4 text-center font-bold shadow-lg mb-2 hover:from-gray-300 hover:to-gray-400 transition-all duration-200 transform hover:scale-105"
        onClick={() => router.push('/dashboard/matches')}
      >
        ← Voltar
      </button>
    </div>
  )
} 