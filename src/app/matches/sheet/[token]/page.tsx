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
    if (!form.minute) {
      alert('Preencha o minuto do evento!')
      return
    }
    let evento: any = { ...form, minute: parseInt(form.minute), quadro: quadroSelecionado }
    evento.team = getTeamType(form.team)
    if (!(form.type === 'goal' && evento.team === 'home')) {
      // Não incluir assist se não for gol do próprio time
      const { assist, ...rest } = evento
      evento = rest
    }
    // NOVO: se for gol do adversário, incluir goleiro se selecionado
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
  if (loading) return <div className="p-6 text-center">Carregando...</div>
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>
  if (!match) return null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center px-2 py-4">
      {/* NOVO: Seleção inicial do quadro, desabilitando quadros já preenchidos */}
      {quadroSelecionado === null && !sumulaCompleta && !finalizado && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow p-6 max-w-xs w-full text-center">
            <div className="font-bold mb-4">Qual quadro deseja preencher?</div>
            <div className="flex gap-4 justify-center">
              <button
                className={`bg-blue-600 text-white rounded px-4 py-2 font-bold text-lg hover:bg-blue-700 ${quadrosPreenchidos[1] ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => !quadrosPreenchidos[1] && setQuadroSelecionado(1)}
                disabled={quadrosPreenchidos[1]}
              >1º Quadro</button>
              <button
                className={`bg-blue-600 text-white rounded px-4 py-2 font-bold text-lg hover:bg-blue-700 ${quadrosPreenchidos[2] ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => !quadrosPreenchidos[2] && setQuadroSelecionado(2)}
                disabled={quadrosPreenchidos[2]}
              >2º Quadro</button>
            </div>
          </div>
        </div>
      )}
      {/* Modal de seleção de jogadores presentes */}
      {selecionandoPresentes && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow p-6 max-w-xs w-full text-center">
            <div className="font-bold mb-4">Selecione os jogadores presentes</div>
            <div className="max-h-60 overflow-y-auto mb-4 text-left">
              {jogadores.map((j: any) => (
                <label key={j.id} className="flex items-center gap-2 py-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={presentes.some(p => p.id === j.id)}
                    onChange={e => {
                      if (e.target.checked) setPresentes(p => [...p, j])
                      else setPresentes(p => p.filter(pj => pj.id !== j.id))
                    }}
                  />
                  <span>{j.name}</span>
                </label>
              ))}
            </div>
            <button
              className="bg-primary text-white rounded px-4 py-2 font-bold mt-2 disabled:opacity-50"
              disabled={presentes.length === 0}
              onClick={() => setSelecionandoPresentes(false)}
            >
              Confirmar
            </button>
          </div>
        </div>
      )}
      <div className="w-full max-w-md bg-white rounded-lg shadow p-4 mb-4">
        <div className="text-center mb-2">
          <div className="text-xs text-gray-400">Súmula Online</div>
          <div className="font-bold text-lg">{match.team?.name} vs {match.opponent}</div>
          <div className="text-sm text-gray-500">{format(new Date(match.date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}</div>
          <div className="mt-2">
            <label className="block text-sm font-medium text-gray-700">Local</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              value={match.location || ''}
              disabled
            >
              <option value="">Selecione</option>
              <option value="Casa">Casa</option>
              <option value="Visitante">Visitante</option>
            </select>
          </div>
        </div>
        <div className="flex justify-between my-2">
          <div className="flex-1 text-center">
            <div className="text-xs text-gray-500">1º Quadro</div>
            <div className="text-2xl font-bold">
              {placarQuadro(1).nosso} <span className="text-gray-400">x</span> {placarQuadro(1).adv}
            </div>
          </div>
          <div className="flex-1 text-center">
            <div className="text-xs text-gray-500">2º Quadro</div>
            <div className="text-2xl font-bold">
              {placarQuadro(2).nosso} <span className="text-gray-400">x</span> {placarQuadro(2).adv}
            </div>
          </div>
        </div>
      </div>

      {/* Só exibe o formulário se quadroSelecionado estiver definido E já selecionou presentes */}
      {podeAdicionarEvento && !sumulaCompleta && (
        <div className="w-full max-w-md bg-white rounded-lg shadow p-4 mb-4">
          <div className="mb-2 font-semibold text-center">Adicionar Evento</div>
          <div className="flex flex-col gap-2">
            {/* Mover seleção de time para o topo */}
            <select
              className="rounded border-gray-300 p-2"
              value={form.team}
              onChange={e => setForm(f => ({ ...f, team: e.target.value }))}
            >
              <option value="home">Meu time</option>
              <option value="away">Adversário</option>
            </select>
            <select
              className="rounded border-gray-300 p-2"
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            >
              {EVENT_TYPES.map(ev => (
                <option key={ev.type} value={ev.type}>{ev.label}</option>
              ))}
            </select>
            {/* Campo de jogador: dropdown se for Meu time, texto livre se for Adversário */}
            {form.team === 'home' ? (
              <select
                className="rounded border-gray-300 p-2"
                value={form.player}
                onChange={e => setForm(f => ({ ...f, player: e.target.value }))}
              >
                <option value="">Selecione o jogador</option>
                {presentes.map((j: any) => (
                  <option key={j.id} value={j.name}>{j.name}</option>
                ))}
              </select>
            ) : (
              <input
                className="rounded border-gray-300 p-2"
                placeholder="Nome do jogador"
                value={form.player}
                onChange={e => setForm(f => ({ ...f, player: e.target.value }))}
              />
            )}
            {/* NOVO: campo de assistência se for gol do próprio time */}
            {form.type === 'goal' && form.team === 'home' && (
              <select
                className="rounded border-gray-300 p-2"
                value={form.assist}
                onChange={e => setForm(f => ({ ...f, assist: e.target.value }))}
              >
                <option value="">Assistência (opcional)</option>
                {presentes.filter(j => j.name !== form.player).map((j: any) => (
                  <option key={j.id} value={j.name}>{j.name}</option>
                ))}
                <option value="">Nenhuma</option>
              </select>
            )}
            {/* NOVO: campo de goleiro se for gol do adversário */}
            {form.type === 'goal' && form.team === 'away' && (
              <select
                className="rounded border-gray-300 p-2"
                value={form.goleiro}
                onChange={e => setForm(f => ({ ...f, goleiro: e.target.value }))}
              >
                <option value="">Selecione o goleiro</option>
                {presentes.map((j: any) => (
                  <option key={j.id} value={j.name}>{j.name}</option>
                ))}
              </select>
            )}
            {/* Timer do quadro */}
            {podeAdicionarEvento && (
              <div className="w-full max-w-md bg-white rounded-lg shadow p-4 mb-4 flex flex-col items-center">
                <div className="mb-2 font-semibold text-center">Tempo do {quadroSelecionado}º Quadro</div>
                <div className="flex items-center gap-4 mb-2">
                  <span className="text-3xl font-mono">{formatTimer(timer[quadroSelecionado as 1|2])}</span>
                  <button
                    className={`px-3 py-1 rounded ${timerRunning[quadroSelecionado as 1|2] ? 'bg-yellow-500 text-white' : 'bg-green-600 text-white'} font-bold`}
                    onClick={() => {
                      if (!timerRunning[quadroSelecionado as 1|2]) {
                        // Ao iniciar, se timer estiver zerado, resetar para valor inicial
                        if (timer[quadroSelecionado as 1|2] === 0) {
                          setTimer(t => ({ ...t, [quadroSelecionado as 1|2]: timerInitial[quadroSelecionado as 1|2] * 60 }))
                        }
                      }
                      setTimerRunning(t => ({ ...t, [quadroSelecionado as 1|2]: !t[quadroSelecionado as 1|2] }))
                    }}
                    type="button"
                  >
                    {timerRunning[quadroSelecionado as 1|2] ? 'Pausar' : 'Iniciar'}
                  </button>
                  <button
                    className="px-3 py-1 rounded bg-gray-300 text-gray-700 font-bold"
                    onClick={() => setTimer(t => ({ ...t, [quadroSelecionado as 1|2]: timerInitial[quadroSelecionado as 1|2] * 60 }))}
                    type="button"
                  >
                    Zerar
                  </button>
                  <input
                    type="number"
                    min={1}
                    className="w-16 ml-2 rounded border-gray-300 p-1 text-center"
                    value={timerInitial[quadroSelecionado as 1|2]}
                    onChange={e => {
                      const min = Math.max(1, Number(e.target.value))
                      setTimerInitial(ti => ({ ...ti, [quadroSelecionado as 1|2]: min }))
                      setTimer(t => ({ ...t, [quadroSelecionado as 1|2]: min * 60 }))
                    }}
                    disabled={timerRunning[quadroSelecionado as 1|2]}
                    title="Editar minutos antes de iniciar"
                  />
                  <span className="text-xs text-gray-500">min</span>
                </div>
              </div>
            )}
            {/* Modal de fim do tempo do timer */}
            <Dialog open={showTimerEndModal} onClose={() => setShowTimerEndModal(false)} className="fixed z-50 inset-0 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen px-4">
                <Dialog.Panel className="bg-white rounded-lg shadow-xl p-6 z-50 max-w-sm mx-auto">
                  <Dialog.Title className="text-lg font-bold mb-2">Tempo esgotado!</Dialog.Title>
                  <Dialog.Description className="mb-4">O tempo do quadro acabou. Clique em OK para continuar.</Dialog.Description>
                  <button
                    className="bg-primary text-white px-4 py-2 rounded font-bold"
                    onClick={() => setShowTimerEndModal(false)}
                  >OK</button>
                </Dialog.Panel>
              </div>
            </Dialog>
            {/* Campo minuto preenchido automaticamente ao adicionar evento */}
            <input
              className="rounded border-gray-300 p-2"
              placeholder="Minuto"
              type="number"
              value={form.minute}
              readOnly
            />
            {/* Campo quadro fixo, não editável */}
            <div className="rounded border border-gray-300 p-2 bg-gray-100 text-center text-gray-700">
              {quadroSelecionado}º Quadro
            </div>
            <button
              className="bg-primary text-white rounded py-2 font-bold mt-2"
              onClick={() => {
                setForm(f => ({ ...f, minute: String(Math.ceil(timer[quadroSelecionado as 1|2]/60)) }));
                handleAddEvent();
              }}
              type="button"
            >
              Adicionar Evento
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-md bg-white rounded-lg shadow p-4 mb-4">
        <div className="mb-2 font-semibold text-center">Eventos</div>
        {events.length === 0 && <div className="text-center text-gray-400">Nenhum evento registrado.</div>}
        <ul className="divide-y divide-gray-100">
          {events.map((ev, i) => (
            <li key={i} className="flex items-center justify-between py-2 text-sm">
              <span className={`px-2 py-1 rounded ${EVENT_TYPES.find(t => t.type === ev.type)?.color || 'bg-gray-200'}`}>{EVENT_TYPES.find(t => t.type === ev.type)?.label || ev.type}</span>
              <span>{ev.player}</span>
              <span>{ev.minute}'</span>
              <span>{ev.quadro}ºQ</span>
              <span>{ev.team === 'home' ? 'Meu time' : 'Adversário'}</span>
              {/* NOVO: mostrar assistência se houver */}
              {ev.type === 'goal' && ev.team === 'home' && ev.assist && (
                <span className="ml-2 text-xs text-blue-600">Assist: {ev.assist}</span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {!sumulaCompleta ? (
        <button
          className="w-full max-w-md bg-green-600 text-white rounded-lg py-3 font-bold text-lg shadow mb-4"
          onClick={handleFinalizarQuadro}
          disabled={saving}
        >
          {saving ? 'Salvando...' : 'Finalizar e Salvar Quadro'}
        </button>
      ) : (
        <button
          className="w-full max-w-md bg-green-700 text-white rounded-lg py-3 font-bold text-lg shadow mb-4"
          onClick={() => {
            setFinalizado(true)
            router.push('/dashboard/matches')
          }}
        >
          Súmula finalizada e salva!
        </button>
      )}

      <button
        className="w-full max-w-md bg-gray-200 text-gray-700 rounded-lg py-2 text-center"
        onClick={() => router.push('/dashboard/matches')}
      >
        Voltar
      </button>
    </div>
  )
} 