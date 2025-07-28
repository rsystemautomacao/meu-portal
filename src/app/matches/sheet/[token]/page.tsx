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
  { type: 'fault', label: 'Falta', color: 'bg-orange-500', icon: '⚠️' },
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
  const [tempoAtual, setTempoAtual] = useState<1|2>(1) // 1º ou 2º tempo do quadro atual
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
  
  // Estados para controlar os tempos de cada quadro
  const [temposQuadro1, setTemposQuadro1] = useState<{1: boolean, 2: boolean}>({1: false, 2: false})
  const [temposQuadro2, setTemposQuadro2] = useState<{1: boolean, 2: boolean}>({1: false, 2: false})

  // Estados para controle de faltas
  const [faultsHome, setFaultsHome] = useState<Record<1|2, number>>({ 1: 0, 2: 0 })
  const [faultsAway, setFaultsAway] = useState<Record<1|2, number>>({ 1: 0, 2: 0 })
  const [showFaultAlert, setShowFaultAlert] = useState(false)
  const [faultAlertTeam, setFaultAlertTeam] = useState<'home' | 'away' | null>(null)
  const [faultAlertQuadro, setFaultAlertQuadro] = useState<1|2|null>(null)

  // Estados para o novo layout
  const [selectedEventType, setSelectedEventType] = useState<string>('')
  const [homeForm, setHomeForm] = useState({ player: '', assist: '' })
  const [awayForm, setAwayForm] = useState({ player: '', goleiro: '' })

  // Filtrar eventos do quadro atual
  const eventosQuadroAtual = events.filter(ev => ev.quadro === quadroSelecionado)

  const STORAGE_KEY = token ? `sumula-online-${token}` : 'sumula-online-temp'

  // Proteção contra reload/refresh
  const [showReloadModal, setShowReloadModal] = useState(false)
  const reloadCallback = useRef<(() => void) | null>(null)

  // Estados para controle de orientação e fullscreen
  const [isLandscape, setIsLandscape] = useState(true)
  const [showOrientationBanner, setShowOrientationBanner] = useState(false)
  const [fullscreenError, setFullscreenError] = useState('')

  // Estados para controle de timer quando página perde foco
  const [pageHidden, setPageHidden] = useState(false)
  const [timerPausedAt, setTimerPausedAt] = useState<number | null>(null)

  // Detectar se é Safari/iOS
  const isSafari = typeof window !== 'undefined' &&
    /Safari/.test(navigator.userAgent) &&
    !/Chrome/.test(navigator.userAgent)
  const isIOS = typeof window !== 'undefined' &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))

  // Calcular se deve mostrar banner de proteção
  const showBanner = (events.length > 0 || presentes.length > 0 || timerRunning[1] || timerRunning[2]) && !finalizado

  // Manter tela ligada e prevenir bloqueio automático
  useEffect(() => {
    let wakeLock: any = null

    const requestWakeLock = async () => {
      try {
        // Tentar usar Wake Lock API (suportada em alguns navegadores)
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen')
          console.log('Wake Lock ativado - tela permanecerá ligada')
        }
      } catch (error) {
        console.log('Wake Lock não disponível:', error)
      }
    }

    const releaseWakeLock = async () => {
      if (wakeLock) {
        try {
          await wakeLock.release()
          wakeLock = null
          console.log('Wake Lock liberado')
        } catch (error) {
          console.log('Erro ao liberar Wake Lock:', error)
        }
      }
    }

    // Ativar Wake Lock quando página carregar
    requestWakeLock()

    // Fallback: Simular atividade para manter tela ligada
    let activityInterval: NodeJS.Timeout | null = null
    
    if (timerRunning[1] || timerRunning[2]) {
      // Se timer está rodando, simular atividade a cada 20 segundos
      activityInterval = setInterval(() => {
        // Método 1: Simular movimento do mouse
        const mouseEvent = new MouseEvent('mousemove', {
          view: window,
          bubbles: true,
          cancelable: true,
          clientX: Math.random() * window.innerWidth,
          clientY: Math.random() * window.innerHeight
        })
        document.dispatchEvent(mouseEvent)
        
        // Método 2: Simular toque (para dispositivos móveis)
        const touchEvent = new TouchEvent('touchstart', {
          bubbles: true,
          cancelable: true,
          touches: [new Touch({
            identifier: Date.now(),
            target: document.body,
            clientX: 0,
            clientY: 0,
            pageX: 0,
            pageY: 0,
            radiusX: 0,
            radiusY: 0,
            rotationAngle: 0,
            force: 0
          })]
        })
        document.dispatchEvent(touchEvent)
        
        // Método 3: Alternar visibilidade de um elemento
        const hiddenElement = document.createElement('div')
        hiddenElement.style.position = 'absolute'
        hiddenElement.style.top = '-1000px'
        hiddenElement.style.left = '-1000px'
        hiddenElement.style.width = '1px'
        hiddenElement.style.height = '1px'
        hiddenElement.style.opacity = '0'
        document.body.appendChild(hiddenElement)
        
        // Método 4: Simular scroll
        window.scrollTo(window.scrollX, window.scrollY)
        
        setTimeout(() => {
          if (document.body.contains(hiddenElement)) {
            document.body.removeChild(hiddenElement)
          }
        }, 100)
        
        console.log('Atividade simulada para manter tela ligada')
      }, 14000) // A cada 14 segundos (antes dos 15s padrão)
    }

    // Cleanup
    return () => {
      releaseWakeLock()
      if (activityInterval) {
        clearInterval(activityInterval)
      }
    }
  }, [timerRunning])

  // Listener para detectar quando página perde foco (apenas para logs)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setPageHidden(true)
        console.log('Página oculta - Timer continua rodando em background')
      } else {
        setPageHidden(false)
        console.log('Página visível - Timer continua rodando')
      }
    }

    const handlePageHide = () => {
      setPageHidden(true)
      console.log('Página escondida - Timer continua rodando em background')
    }

    const handlePageShow = () => {
      setPageHidden(false)
      console.log('Página mostrada - Timer continua rodando')
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pagehide', handlePageHide)
    window.addEventListener('pageshow', handlePageShow)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pagehide', handlePageHide)
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [])

  // Proteção contra reload/refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (showBanner) {
        e.preventDefault()
        e.returnValue = ''
        setShowReloadModal(true)
        reloadCallback.current = () => window.location.reload()
        return ''
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault()
        setShowReloadModal(true)
        reloadCallback.current = () => window.location.reload()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [showBanner])

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

  // Função para ativar Wake Lock
  const activateWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        const wakeLock = await (navigator as any).wakeLock.request('screen')
        console.log('Wake Lock ativado para manter tela ligada')
        return wakeLock
      }
    } catch (error) {
      console.log('Wake Lock não disponível:', error)
    }
    return null
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

  // Função para calcular faltas por tempo dentro do quadro atual
  const calcularFaltasTempo = (quadro: 1 | 2, tempo: 1 | 2) => {
    const faltasHome = events.filter(ev => ev.type === 'fault' && ev.team === 'home' && ev.quadro === quadro && ev.tempo === tempo).length
    const faltasAway = events.filter(ev => ev.type === 'fault' && ev.team === 'away' && ev.quadro === quadro && ev.tempo === tempo).length
    return { home: faltasHome, away: faltasAway }
  }

  // Função para verificar e mostrar alerta de 5 faltas
  const verificarFaltas = (quadro: 1 | 2, tempo: 1 | 2, team: 'home' | 'away') => {
    const faltas = calcularFaltasTempo(quadro, tempo)
    const faltasTime = team === 'home' ? faltas.home : faltas.away
    
    if (faltasTime === 4) {
      setFaultAlertTeam(team)
      setFaultAlertQuadro(quadro)
      setShowFaultAlert(true)
      
      // Auto-hide após 5 segundos
      setTimeout(() => {
        setShowFaultAlert(false)
        setFaultAlertTeam(null)
        setFaultAlertQuadro(null)
      }, 5000)
    }
  }

  // Função para adicionar evento do meu time
  const handleAddHomeEvent = () => {
    if (!selectedEventType) {
      alert('Selecione o tipo de evento!')
      return
    }
    if (!homeForm.player) {
      alert('Selecione o jogador!')
      return
    }
    
    let minuteValue = Math.ceil(timer[quadroSelecionado as 1|2]/60)
    if (isNaN(minuteValue)) minuteValue = 0
    
    let evento: any = { 
      type: selectedEventType,
      player: homeForm.player,
      minute: minuteValue,
      quadro: quadroSelecionado,
      tempo: tempoAtual,
      team: 'home'
    }
    
    if (selectedEventType === 'goal' && homeForm.assist) {
      evento.assist = homeForm.assist
    }
    
    setEvents([...events, evento])
    setHomeForm({ player: '', assist: '' })
    setSelectedEventType('')
    
    // Verificar faltas se for uma falta (após adicionar o evento)
    if (selectedEventType === 'fault') {
      setTimeout(() => {
        verificarFaltas(quadroSelecionado as 1|2, tempoAtual, 'home')
      }, 100)
    }
  }

  // Função para adicionar evento do adversário
  const handleAddAwayEvent = () => {
    if (!selectedEventType) {
      alert('Selecione o tipo de evento!')
      return
    }
    if (selectedEventType === 'goal') {
      if (!awayForm.goleiro) {
        alert('Selecione o goleiro!')
        return
      }
    } else {
      if (!awayForm.player) {
        alert('Preencha o nome do jogador!')
        return
      }
    }
    
    let minuteValue = Math.ceil(timer[quadroSelecionado as 1|2]/60)
    if (isNaN(minuteValue)) minuteValue = 0
    
    let evento: any = { 
      type: selectedEventType,
      player: selectedEventType === 'goal' ? 'Jogador Adversário' : awayForm.player,
      minute: minuteValue,
      quadro: quadroSelecionado,
      tempo: tempoAtual,
      team: 'away'
    }
    
    if (selectedEventType === 'goal' && awayForm.goleiro) {
      evento.goleiro = awayForm.goleiro
    }
    
    setEvents([...events, evento])
    setAwayForm({ player: '', goleiro: '' })
    setSelectedEventType('')
    
    // Verificar faltas se for uma falta (após adicionar o evento)
    if (selectedEventType === 'fault') {
      setTimeout(() => {
        verificarFaltas(quadroSelecionado as 1|2, tempoAtual, 'away')
      }, 100)
    }
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

  const handleFinalizarTempo = async () => {
    if (saving) return
    setSaving(true)
    
    try {
      // Marcar o tempo atual como finalizado
      if (quadroSelecionado === 1) {
        setTemposQuadro1(prev => ({ ...prev, [tempoAtual]: true }))
      } else if (quadroSelecionado === 2) {
        setTemposQuadro2(prev => ({ ...prev, [tempoAtual]: true }))
      }
      
      // Se ainda não finalizou o segundo tempo, ir para o próximo tempo
      if (tempoAtual === 1) {
        alert(`✅ ${tempoAtual}º Tempo finalizado com sucesso!`)
        setTempoAtual(2)
        setSaving(false)
        return
      }
      
      // Se finalizou o segundo tempo, finalizar o quadro
      alert(`✅ ${quadroSelecionado}º Quadro finalizado com sucesso!`)
      await handleFinalizarQuadro()
    } catch (error) {
      console.error('Erro ao finalizar tempo:', error)
      alert('Erro ao salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const sumulaCompleta = quadrosPreenchidos[1] && quadrosPreenchidos[2]

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
      // Para iOS/Safari, tentar diferentes abordagens
      if (isIOS || isSafari) {
        // iOS não suporta requestFullscreen, então tentar apenas orientação
        if ('orientation' in screen && (screen.orientation as any).lock) {
          await (screen.orientation as any).lock('landscape')
          setFullscreenError('No iPhone, gire o celular manualmente para a posição horizontal.')
        } else {
          setFullscreenError('No iPhone, gire o celular manualmente para a posição horizontal.')
        }
      } else {
        // Para outros dispositivos, tentar fullscreen normal
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen()
        }
        if ('orientation' in screen && (screen.orientation as any).lock) {
          await (screen.orientation as any).lock('landscape')
        }
      }
      setTimeout(checkOrientation, 500)
    } catch (err: any) {
      if (isIOS || isSafari) {
        setFullscreenError('No iPhone, gire o celular manualmente para a posição horizontal.')
      } else {
        setFullscreenError('Não foi possível forçar a orientação. Gire o celular manualmente.')
      }
    }
  }

  // Estado para controle de fechamento
  const [showCloseInfo, setShowCloseInfo] = useState(false)

  // Função para fechar a aba/janela da súmula
  function closeSheetPage() {
    window.close()
    // Se não fechar, mostrar orientação
    setTimeout(() => {
      if (!window.closed) setShowCloseInfo(true)
    }, 300)
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
      {/* Modal de confirmação de reload/refresh */}
      {showReloadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border-2 border-red-300">
            <div className="text-4xl mb-4">⚠️</div>
            <div className="font-bold text-xl text-red-700 mb-2">Atenção!</div>
            <div className="text-gray-700 mb-6">Você tem dados não salvos. Tem certeza que deseja recarregar a página?</div>
            <div className="flex gap-4 justify-center">
              <button
                className="bg-red-600 text-white rounded-xl px-6 py-3 font-bold text-lg shadow-lg hover:bg-red-700 transition-all duration-200"
                onClick={() => {
                  setShowReloadModal(false)
                  if (reloadCallback.current) {
                    reloadCallback.current()
                  }
                }}
              >
                Sim, recarregar
              </button>
              <button
                className="bg-gray-600 text-white rounded-xl px-6 py-3 font-bold text-lg shadow-lg hover:bg-gray-700 transition-all duration-200"
                onClick={() => {
                  setShowReloadModal(false)
                  reloadCallback.current = null
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Banner de orientação */}
      {showOrientationBanner && (
        <div className="fixed top-0 left-0 w-full z-50 bg-yellow-100 border-b-2 border-yellow-300 text-yellow-900 text-center py-3 font-bold flex flex-col items-center shadow-lg animate-pulse">
          <span className="text-lg">
            {isIOS || isSafari 
              ? 'Para melhor experiência no iPhone, gire o celular para a posição horizontal (deitado).'
              : 'Para melhor experiência, use o app na horizontal (paisagem).'
            }
          </span>
          <button
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition"
            onClick={handleFullscreenAndLandscape}
          >
            {isIOS || isSafari ? 'Girar para Horizontal' : 'Ativar Tela Cheia e Horizontal'}
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
                onClick={() => {
                  if (!quadrosPreenchidos[1]) {
                    setQuadroSelecionado(1)
                    setTempoAtual(1)
                  }
                }}
                disabled={quadrosPreenchidos[1]}
              >
                <div className="text-sm mb-1">1º</div>
                <div>Quadro</div>
              </button>
              <button
                className={`bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl px-8 py-4 font-bold text-lg shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 ${quadrosPreenchidos[2] ? 'opacity-50 cursor-not-allowed' : 'transform hover:scale-105'}`}
                onClick={() => {
                  if (!quadrosPreenchidos[2]) {
                    setQuadroSelecionado(2)
                    setTempoAtual(1)
                  }
                }}
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

      {/* Modal de alerta de 5 faltas */}
      {showFaultAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border-2 border-orange-300">
            <div className="text-4xl mb-4">⚠️</div>
            <div className="font-bold text-2xl text-orange-700 mb-2">ATENÇÃO!</div>
            <div className="text-lg text-gray-700 mb-4">
              5ª falta para o time <strong>{faultAlertTeam === 'home' ? '�� Meu time' : '⚔️ Adversário'}</strong>
            </div>
            <div className="text-sm text-gray-600 mb-6">
              {faultAlertQuadro}º Quadro - {faultAlertTeam === 'home' ? '1º' : '2º'} Tempo
            </div>
            <button
              className="bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl px-6 py-3 font-bold text-lg shadow-lg hover:from-orange-700 hover:to-red-700 transition-all duration-200"
              onClick={() => setShowFaultAlert(false)}
            >
              Entendi
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
              {quadroSelecionado}º QUADRO - {tempoAtual}º TEMPO
            </div>
            <div className="text-sm text-gray-600">Local: {match.location || 'Casa'}</div>
            
            {/* Exibição de faltas */}
            <div className="mt-2 p-2 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-orange-600 font-semibold text-center">Faltas do {tempoAtual}º Tempo:</div>
              <div className="flex justify-between gap-4 mt-1">
                <span className="text-green-700 font-semibold">🏠 {calcularFaltasTempo(quadroSelecionado as 1|2, tempoAtual).home}</span>
                <span className="text-red-700 font-semibold">⚔️ {calcularFaltasTempo(quadroSelecionado as 1|2, tempoAtual).away}</span>
              </div>
            </div>
            
            {/* Controles de tempo */}
            <div className="flex justify-center mt-2">
              <div className="flex gap-2">
                <button
                  className={`px-3 py-1 rounded text-sm font-semibold ${
                    tempoAtual === 1 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  onClick={() => setTempoAtual(1)}
                >
                  1º Tempo
                </button>
                <button
                  className={`px-3 py-1 rounded text-sm font-semibold ${
                    tempoAtual === 2 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  } ${!temposQuadro1[1] && quadroSelecionado === 1 || !temposQuadro2[1] && quadroSelecionado === 2 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => {
                    const temposQuadro = quadroSelecionado === 1 ? temposQuadro1 : temposQuadro2
                    if (temposQuadro[1]) {
                      setTempoAtual(2)
                    }
                  }}
                  disabled={!temposQuadro1[1] && quadroSelecionado === 1 || !temposQuadro2[1] && quadroSelecionado === 2}
                >
                  2º Tempo
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="text-center bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4">
              <div className="text-sm text-green-700 font-semibold mb-1">1º Tempo</div>
              <div className="text-2xl font-bold text-green-900">
                {placarQuadro(1).nosso} <span className="text-gray-400">×</span> {placarQuadro(1).adv}
              </div>
              {/* Faltas do 1º tempo */}
              <div className="mt-2 text-xs">
                <div className="text-orange-600 font-semibold">Faltas:</div>
                <div className="flex justify-between gap-2">
                  <span className="text-green-700">🏠 {calcularFaltasTempo(1, 1).home}</span>
                  <span className="text-red-700">⚔️ {calcularFaltasTempo(1, 1).away}</span>
                </div>
              </div>
            </div>
            
            <div className="text-center bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4">
              <div className="text-sm text-indigo-700 font-semibold mb-1">2º Tempo</div>
              <div className="text-2xl font-bold text-indigo-900">
                {placarQuadro(2).nosso} <span className="text-gray-400">×</span> {placarQuadro(2).adv}
              </div>
              {/* Faltas do 2º tempo */}
              <div className="mt-2 text-xs">
                <div className="text-orange-600 font-semibold">Faltas:</div>
                <div className="flex justify-between gap-2">
                  <span className="text-green-700">🏠 {calcularFaltasTempo(2, 1).home}</span>
                  <span className="text-red-700">⚔️ {calcularFaltasTempo(2, 1).away}</span>
                </div>
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
              {timerRunning[quadroSelecionado as 1|2] && (
                <div className="mt-2 text-sm text-green-600 font-semibold">
                  🔋 Tela mantida ligada automaticamente
                </div>
              )}
            </div>
            <div className="flex justify-center gap-3 mb-4">
              <button
                className={`px-4 py-2 rounded-lg font-bold shadow-lg transition-all duration-200 ${timerRunning[quadroSelecionado as 1|2] ? 'bg-yellow-500 text-white hover:bg-yellow-600' : 'bg-green-600 text-white hover:bg-green-700'} transform hover:scale-105`}
                onClick={async () => {
                  if (!timerRunning[quadroSelecionado as 1|2]) {
                    if (timer[quadroSelecionado as 1|2] === 0) {
                      setTimer(t => ({ ...t, [quadroSelecionado as 1|2]: timerInitial[quadroSelecionado as 1|2] * 60 }))
                    }
                    // Ativar Wake Lock quando timer é iniciado
                    await activateWakeLock()
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
              {selectedEventType !== 'goal' && (
                <input
                  className="w-full rounded-xl border-gray-300 p-3 text-lg bg-white shadow-sm focus:border-red-500 focus:ring-red-500"
                  placeholder="👤 Nome do jogador"
                  value={awayForm.player}
                  onChange={e => setAwayForm(f => ({ ...f, player: e.target.value }))}
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
              )}

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
          TODOS OS EVENTOS
        </div>
        {events.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">📝</div>
            <div className="font-semibold">Nenhum evento registrado ainda.</div>
            <div className="text-sm">Adicione eventos usando os formulários acima.</div>
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
                <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-lg text-sm font-semibold">{ev.tempo}ºT</span>
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

      {/* Botão de finalizar tempo/quadro */}
      {quadroSelecionado !== null && !finalizado && (() => {
        const temposQuadro = quadroSelecionado === 1 ? temposQuadro1 : temposQuadro2
        const tempoAtualFinalizado = temposQuadro[tempoAtual]
        
        if (tempoAtualFinalizado) {
          return (
            <div className="w-full max-w-6xl bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-2xl py-6 font-bold text-xl shadow-xl mb-6 border-2 border-green-300">
              ✅ {tempoAtual}º Tempo Finalizado
            </div>
          )
        }
        
        return (
          <button
            className="w-full max-w-6xl bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl py-6 font-bold text-xl shadow-xl mb-6 hover:from-green-700 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105"
            onClick={handleFinalizarTempo}
            disabled={saving}
          >
            {saving ? '💾 Salvando...' : tempoAtual === 1 ? `✅ Finalizar ${tempoAtual}º Tempo` : `✅ Finalizar ${quadroSelecionado}º Quadro`}
          </button>
        )
      })()}

      {finalizado && (
        <button
          className="w-full max-w-6xl bg-gradient-to-r from-green-700 to-emerald-700 text-white rounded-2xl py-6 font-bold text-xl shadow-xl mb-6"
          onClick={closeSheetPage}
        >
          🎉 Súmula finalizada e salva!
        </button>
      )}

      <button
        className="w-full max-w-6xl bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 rounded-2xl py-4 text-center font-bold shadow-lg mb-2 hover:from-gray-300 hover:to-gray-400 transition-all duration-200 transform hover:scale-105"
        onClick={closeSheetPage}
      >
        ← Voltar
      </button>

      {/* Modal/mensagem de orientação caso não consiga fechar: */}
      {showCloseInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border-2 border-blue-300">
            <div className="text-3xl mb-4">ℹ️</div>
            <div className="font-bold text-xl text-blue-700 mb-2">Feche esta aba</div>
            <div className="text-gray-700 mb-6">Por favor, feche esta aba manualmente para retornar ao app ou à tela anterior.</div>
            <button
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl px-6 py-3 font-bold text-lg shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
              onClick={() => setShowCloseInfo(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  )
}