"use client"

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Dialog } from '@headlessui/react'

const EVENT_TYPES = [
  { type: 'goal', label: 'Gol', color: 'bg-green-500', icon: '⚽' },
  { type: 'yellow_card', label: 'Amarelo', color: 'bg-yellow-400', icon: '🟨' },
  { type: 'red_card', label: 'Vermelho', color: 'bg-red-500', icon: '🟥' },
  { type: 'assist', label: 'Assistência', color: 'bg-blue-400', icon: '🅰️' },
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
    assist: '',
    goleiro: '',
  })
  const [saving, setSaving] = useState(false)
  const [finalizado, setFinalizado] = useState(false)
  const [quadroSelecionado, setQuadroSelecionado] = useState<number|null>(null)
  const [presentes, setPresentes] = useState<any[]>([])
  const [selecionandoPresentes, setSelecionandoPresentes] = useState(false)
  const [jogadores, setJogadores] = useState<any[]>([])
  const [timer, setTimer] = useState<Record<1|2, number>>({ 1: 0, 2: 0 })
  const [timerRunning, setTimerRunning] = useState<Record<1|2, boolean>>({ 1: false, 2: false })
  const [timerInitial, setTimerInitial] = useState<Record<1|2, number>>({ 1: 25, 2: 25 })
  const timerInterval = useRef<NodeJS.Timeout | null>(null)
  const [quadrosPreenchidos, setQuadrosPreenchidos] = useState<{1: boolean, 2: boolean}>({1: false, 2: false})
  const [showTimerEndModal, setShowTimerEndModal] = useState(false)
  const [restaurado, setRestaurado] = useState(false)

  // Estados para o novo layout
  const [selectedEventType, setSelectedEventType] = useState<string>('')
  const [homeForm, setHomeForm] = useState({ player: '', assist: '' })
  const [awayForm, setAwayForm] = useState({ player: '', goleiro: '' })

  const STORAGE_KEY = token ? `sumula-online-${token}` : 'sumula-online-temp'

  // Forçar orientação landscape em dispositivos móveis
  useEffect(() => {
    const forceLandscape = async () => {
      // Verificar se é dispositivo móvel
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      
      if (isMobile && 'screen' in window && 'orientation' in screen) {
        try {
          // Tentar forçar landscape
          await (screen.orientation as any).lock('landscape')
          console.log('Orientação forçada para landscape')
        } catch (error) {
          console.log('Não foi possível forçar landscape:', error)
          // Fallback: mostrar mensagem para o usuário
          if (window.innerHeight > window.innerWidth) {
            alert('Para melhor experiência, gire o celular para a posição horizontal (deitado)')
          }
        }
      }
    }

    // Executar após um pequeno delay para garantir que a página carregou
    const timer = setTimeout(forceLandscape, 500)
    return () => clearTimeout(timer)
  }, [])

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
    const eventosEssenciais = events.map(ev => ({
      type: ev.type,
      player: ev.player,
      minute: ev.minute,
      team: ev.team,
      quadro: ev.quadro,
      assist: ev.assist,
      goleiro: ev.goleiro
    }))
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
  }, [token])

  const fetchJogadores = async () => {
    try {
      const res = await fetch(`/api/matches/sheet/players?shareToken=${token}`)
      if (!res.ok) throw new Error('Erro ao buscar jogadores')
      const data = await res.json()
      setJogadores(data)
    } catch (e) {
      setError('Erro ao buscar jogadores do time')
    }
  }

  useEffect(() => {
    if (!restaurado) return
    if (quadroSelecionado !== null && !finalizado) {
      fetchJogadores()
      setSelecionandoPresentes(true)
    }
  }, [quadroSelecionado, finalizado, restaurado])

  const podeAdicionarEvento = restaurado && !finalizado && quadroSelecionado !== null && presentes.length > 0

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

  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    if (!restaurado) return
    if (quadroSelecionado !== null) {
      setTimerRunning({ 1: false, 2: false })
      setTimer(t => ({ ...t, [quadroSelecionado as 1|2]: timerInitial[quadroSelecionado as 1|2] * 60 }))
    }
  }, [quadroSelecionado, restaurado])

  const handleTimeSelect = (minutes: number) => {
    setTimerInitial(t => ({ ...t, [quadroSelecionado as 1|2]: minutes }))
    setTimer(t => ({ ...t, [quadroSelecionado as 1|2]: minutes * 60 }))
  }

  const getTeamType = (selected: string) => {
    if (!match) return selected
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

  // Função para adicionar evento do meu time
  const handleAddHomeEvent = () => {
    if (!homeForm.player) {
      alert('Selecione o jogador!')
      return
    }
    if (!selectedEventType) {
      alert('Selecione o tipo de evento!')
      return
    }
    
    let minuteValue = Math.ceil(timer[quadroSelecionado as 1|2]/60)
    if (isNaN(minuteValue)) minuteValue = 0
    
    let evento: any = { 
      type: selectedEventType,
      player: homeForm.player,
      minute: minuteValue,
      quadro: quadroSelecionado,
      team: 'home'
    }
    
    if (selectedEventType === 'goal' && homeForm.assist) {
      evento.assist = homeForm.assist
    }
    
    setEvents([...events, evento])
    setHomeForm({ player: '', assist: '' })
    setSelectedEventType('')
  }

  // Função para adicionar evento do adversário
  const handleAddAwayEvent = () => {
    if (!awayForm.player) {
      alert('Preencha o nome do jogador!')
      return
    }
    if (!selectedEventType) {
      alert('Selecione o tipo de evento!')
      return
    }
    
    let minuteValue = Math.ceil(timer[quadroSelecionado as 1|2]/60)
    if (isNaN(minuteValue)) minuteValue = 0
    
    let evento: any = { 
      type: selectedEventType,
      player: awayForm.player,
      minute: minuteValue,
      quadro: quadroSelecionado,
      team: 'away'
    }
    
    if (selectedEventType === 'goal' && awayForm.goleiro) {
      evento.goleiro = awayForm.goleiro
    }
    
    setEvents([...events, evento])
    setAwayForm({ player: '', goleiro: '' })
    setSelectedEventType('')
  }

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
      setQuadroSelecionado(null)
      await fetchMatch()
      localStorage.removeItem(STORAGE_KEY)
    } catch (e) {
      setError('Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const sumulaCompleta = quadrosPreenchidos[1] && quadrosPreenchidos[2]

  // Filtrar eventos do quadro atual
  const eventosQuadroAtual = events.filter(ev => ev.quadro === quadroSelecionado)

  const [isLandscape, setIsLandscape] = useState(true)
  const [showOrientationBanner, setShowOrientationBanner] = useState(false)
  const [fullscreenError, setFullscreenError] = useState('')

  // Função para checar orientação
  function checkOrientation() {
    const landscape = window.innerWidth > window.innerHeight
    setIsLandscape(landscape)
    setShowOrientationBanner(!landscape)
  }

  // Checar orientação ao carregar e ao redimensionar
  useEffect(() => {
    checkOrientation()
    window.addEventListener('resize', checkOrientation)
    window.addEventListener('orientationchange', checkOrientation)
    return () => {
      window.removeEventListener('resize', checkOrientation)
      window.removeEventListener('orientationchange', checkOrientation)
    }
  }, [])

  // Função para forçar fullscreen e landscape
  async function handleFullscreenAndLandscape() {
    setFullscreenError('')
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen()
      }
      if ('orientation' in screen && (screen.orientation as any).lock) {
        await (screen.orientation as any).lock('landscape')
      }
      setTimeout(checkOrientation, 500)
    } catch (err: any) {
      setFullscreenError('Não foi possível forçar a orientação. Gire o celular manualmente.')
    }
  }

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
      {/* Banner de orientação */}
      {showOrientationBanner && (
        <div className="fixed top-0 left-0 w-full z-50 bg-yellow-100 border-b-2 border-yellow-300 text-yellow-900 text-center py-3 font-bold flex flex-col items-center shadow-lg animate-pulse">
          <span className="text-lg">Para melhor experiência, use o app na horizontal (paisagem).</span>
          <button
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition"
            onClick={handleFullscreenAndLandscape}
          >
            Ativar Tela Cheia e Horizontal
          </button>
          {fullscreenError && <span className="text-red-600 text-sm mt-1">{fullscreenError}</span>}
        </div>
      )}
      {/* Seleção inicial do quadro */}
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
      <div className="w-full max-w-6xl bg-gradient-to-r from-white to-blue-50 rounded-2xl shadow-xl p-6 mb-6 border border-blue-200">
        <div className="text-center mb-4">
          <div className="text-sm text-blue-600 font-semibold mb-2">⚽ Súmula Online</div>
          <div className="font-bold text-2xl text-gray-900 mb-2">{match.team?.name} vs {match.opponent}</div>
          <div className="text-lg text-gray-600">{format(new Date(match.date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}</div>
        </div>
        
        {/* Quadro atual e placares */}
        <div className="flex justify-between items-center">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-900 mb-2">
              QUADRO ATUAL: {quadroSelecionado}º QUADRO
            </div>
            <div className="text-sm text-gray-600">Local: {match.location || 'Casa'}</div>
          </div>
          
          <div className="flex gap-4">
            <div className="text-center bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4">
              <div className="text-sm text-green-700 font-semibold mb-1">1º Quadro</div>
              <div className="text-2xl font-bold text-green-900">
                {placarQuadro(1).nosso} <span className="text-gray-400">×</span> {placarQuadro(1).adv}
              </div>
            </div>
            <div className="text-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4">
              <div className="text-sm text-blue-700 font-semibold mb-1">2º Quadro</div>
              <div className="text-2xl font-bold text-blue-900">
                {placarQuadro(2).nosso} <span className="text-gray-400">×</span> {placarQuadro(2).adv}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timer do quadro */}
      {podeAdicionarEvento && (
        <div className="w-full max-w-6xl bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl shadow-xl p-6 mb-6 border border-yellow-200">
          <div className="text-center mb-4">
            <div className="font-bold text-xl text-yellow-900 flex items-center justify-center">
              <span className="mr-2">⏱️</span>
              Tempo do {quadroSelecionado}º Quadro
            </div>
            <div className="text-center mb-4">
              <span className="text-4xl font-mono bg-white px-6 py-3 rounded-xl shadow-lg border border-yellow-200 text-yellow-900">
                {formatTimer(timer[quadroSelecionado as 1|2])}
              </span>
            </div>
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
              >
                {timerRunning[quadroSelecionado as 1|2] ? '⏸️ Pausar' : '▶️ Iniciar'}
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-gray-300 text-gray-700 font-bold shadow-lg hover:bg-gray-400 transition-all duration-200 transform hover:scale-105"
                onClick={() => setTimer(t => ({ ...t, [quadroSelecionado as 1|2]: timerInitial[quadroSelecionado as 1|2] * 60 }))}
              >
                🔄 Zerar
              </button>
            </div>
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
        </div>
      )}

      {/* Formulários paralelos para adicionar eventos */}
      {podeAdicionarEvento && (
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* MEU TIME */}
          <div className="bg-gradient-to-r from-white to-green-50 rounded-2xl shadow-xl p-6 border border-green-200">
            <div className="text-center mb-4">
              <div className="font-bold text-xl text-green-900 flex items-center justify-center">
                <span className="mr-2">🏠</span>
                MEU TIME
              </div>
            </div>

            {/* Botões de eventos para meu time */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {EVENT_TYPES.map(ev => (
                <button
                  key={ev.type}
                  className={`p-2 rounded-lg font-semibold text-sm transition-all duration-200 transform hover:scale-105 ${
                    selectedEventType === ev.type
                      ? 'bg-green-600 text-white shadow-lg'
                      : 'bg-white text-green-700 border-2 border-green-200 hover:border-green-400'
                  }`}
                  onClick={() => setSelectedEventType(ev.type)}
                >
                  <div className="text-lg mb-1">{ev.icon}</div>
                  <div className="text-xs">{ev.label}</div>
                </button>
              ))}
            </div>

            {/* Campos específicos para meu time */}
            <div className="space-y-3">
              <select
                className="w-full rounded-xl border-gray-300 p-3 text-lg bg-white shadow-sm focus:border-green-500 focus:ring-green-500"
                value={homeForm.player}
                onChange={e => setHomeForm(f => ({ ...f, player: e.target.value }))}
              >
                <option value="">👤 Selecione o jogador</option>
                {presentes.map((j: any) => (
                  <option key={j.id} value={j.name}>{j.name}</option>
                ))}
              </select>

              {selectedEventType === 'goal' && (
                <select
                  className="w-full rounded-xl border-gray-300 p-3 text-lg bg-white shadow-sm focus:border-green-500 focus:ring-green-500"
                  value={homeForm.assist}
                  onChange={e => setHomeForm(f => ({ ...f, assist: e.target.value }))}
                >
                  <option value="">🅰️ Assistência (opcional)</option>
                  {presentes.filter(j => j.name !== homeForm.player).map((j: any) => (
                    <option key={j.id} value={j.name}>{j.name}</option>
                  ))}
                </select>
              )}

              <button
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl py-4 font-bold text-lg shadow-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105"
                onClick={handleAddHomeEvent}
                disabled={!selectedEventType || !homeForm.player}
              >
                ➕ ADICIONAR MEU TIME
              </button>
            </div>
          </div>

          {/* ADVERSÁRIO */}
          <div className="bg-gradient-to-r from-white to-red-50 rounded-2xl shadow-xl p-6 border border-red-200">
            <div className="text-center mb-4">
              <div className="font-bold text-xl text-red-900 flex items-center justify-center">
                <span className="mr-2">⚔️</span>
                ADVERSÁRIO
              </div>
            </div>

            {/* Botões de eventos para adversário */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {EVENT_TYPES.filter(ev => ev.type !== 'assist').map(ev => (
                <button
                  key={ev.type}
                  className={`p-2 rounded-lg font-semibold text-sm transition-all duration-200 transform hover:scale-105 ${
                    selectedEventType === ev.type
                      ? 'bg-red-600 text-white shadow-lg'
                      : 'bg-white text-red-700 border-2 border-red-200 hover:border-red-400'
                  }`}
                  onClick={() => setSelectedEventType(ev.type)}
                >
                  <div className="text-lg mb-1">{ev.icon}</div>
                  <div className="text-xs">{ev.label}</div>
                </button>
              ))}
            </div>

            {/* Campos específicos para adversário */}
            <div className="space-y-3">
              <input
                className="w-full rounded-xl border-gray-300 p-3 text-lg bg-white shadow-sm focus:border-red-500 focus:ring-red-500"
                placeholder="👤 Nome do jogador"
                value={awayForm.player}
                onChange={e => setAwayForm(f => ({ ...f, player: e.target.value }))}
              />

              {selectedEventType === 'goal' && (
                <select
                  className="w-full rounded-xl border-gray-300 p-3 text-lg bg-white shadow-sm focus:border-red-500 focus:ring-red-500"
                  value={awayForm.goleiro}
                  onChange={e => setAwayForm(f => ({ ...f, goleiro: e.target.value }))}
                >
                  <option value="">🥅 Selecione o goleiro</option>
                  {presentes.map((j: any) => (
                    <option key={j.id} value={j.name}>{j.name}</option>
                  ))}
                </select>
              )}

              <button
                className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl py-4 font-bold text-lg shadow-lg hover:from-red-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105"
                onClick={handleAddAwayEvent}
                disabled={!selectedEventType || !awayForm.player}
              >
                ➕ ADICIONAR ADVERSÁRIO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de eventos do quadro atual */}
      <div className="w-full max-w-6xl bg-gradient-to-r from-white to-gray-50 rounded-2xl shadow-xl p-6 mb-6 border border-gray-200">
        <div className="mb-4 font-bold text-center text-xl text-gray-900 flex items-center justify-center">
          <span className="mr-2">📋</span>
          EVENTOS DO {quadroSelecionado}º QUADRO
        </div>
        {eventosQuadroAtual.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">📝</div>
            <div className="font-semibold">Nenhum evento registrado ainda.</div>
            <div className="text-sm">Adicione eventos usando os formulários acima.</div>
          </div>
        )}
        <ul className="space-y-3">
          {eventosQuadroAtual.map((ev, i) => (
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
                {ev.type === 'goal' && ev.team === 'away' && ev.goleiro && (
                  <span className="px-2 py-1 bg-red-50 text-red-700 rounded-lg text-xs">🥅 {ev.goleiro}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Botão de finalizar quadro */}
      {quadroSelecionado !== null && !finalizado && (
        <button
          className="w-full max-w-6xl bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl py-6 font-bold text-xl shadow-xl mb-6 hover:from-green-700 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105"
          onClick={handleFinalizarQuadro}
          disabled={saving}
        >
          {saving ? '💾 Salvando...' : `✅ Finalizar e Salvar ${quadroSelecionado}º Quadro`}
        </button>
      )}

      {finalizado && (
        <button
          className="w-full max-w-6xl bg-gradient-to-r from-green-700 to-emerald-700 text-white rounded-2xl py-6 font-bold text-xl shadow-xl mb-6"
          onClick={() => {
            setFinalizado(true)
            router.push('/dashboard/matches')
          }}
        >
          🎉 Súmula finalizada e salva!
        </button>
      )}

      <button
        className="w-full max-w-6xl bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 rounded-2xl py-4 text-center font-bold shadow-lg mb-2 hover:from-gray-300 hover:to-gray-400 transition-all duration-200 transform hover:scale-105"
        onClick={() => router.push('/dashboard/matches')}
      >
        ← Voltar
      </button>
    </div>
  )
} 