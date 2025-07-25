'use client'

import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
// NOVO: importar react-datepicker e estilos
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { ptBR } from 'date-fns/locale'
import { format, parse } from 'date-fns'
import { CalendarIcon, TrophyIcon, UserGroupIcon, ChartBarIcon } from '@heroicons/react/24/outline'

interface MatchModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (matchData: any) => void
  match?: {
    id: string
    date: string
    opponent: string
    ourScore: number
    opponentScore: number
    ourScore1: number
    opponentScore1: number
    ourScore2: number
    opponentScore2: number
    location?: string
  }
}

export default function MatchModal({ isOpen, onClose, onSave, match }: MatchModalProps) {
  // Forçar orientação landscape em dispositivos móveis quando modal abrir
  useEffect(() => {
    if (isOpen) {
      const forceLandscape = async () => {
        // Verificar se é dispositivo móvel
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        
        if (isMobile && 'screen' in window && 'orientation' in screen) {
          try {
            // Tentar forçar landscape
            await (screen.orientation as any).lock('landscape')
            console.log('Orientação forçada para landscape no modal manual')
          } catch (error) {
            console.log('Não foi possível forçar landscape no modal manual:', error)
            // Fallback: mostrar mensagem para o usuário
            if (window.innerHeight > window.innerWidth) {
              alert('Para melhor experiência, gire o celular para a posição horizontal (deitado)')
            }
          }
        }
      }

      // Executar após um pequeno delay para garantir que o modal abriu
      const timer = setTimeout(forceLandscape, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  const [formData, setFormData] = useState({
    date: match?.date ? new Date(match.date) : null,
    opponent: match?.opponent || '',
    location: match?.location || '',
    ourScore1: '',
    ourScore2: '',
    opponentScore1: '',
    opponentScore2: '',
  })

  const [players, setPlayers] = useState<any[]>([])
  const [presentes1, setPresentes1] = useState<any[]>([])
  const [playerStats1, setPlayerStats1] = useState<Record<string, { gols: number, assist: number, amarelo: number, vermelho: number, golsSofridos: number }>>({})
  const [presentes2, setPresentes2] = useState<any[]>([])
  const [playerStats2, setPlayerStats2] = useState<Record<string, { gols: number, assist: number, amarelo: number, vermelho: number, golsSofridos: number }>>({})
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

  // Tentar forçar fullscreen e landscape automaticamente ao abrir
  useEffect(() => {
    async function tryFullscreenAndLandscape() {
      setFullscreenError('')
      try {
        if (isOpen && document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen()
        }
        if (isOpen && 'orientation' in screen && (screen.orientation as any).lock) {
          await (screen.orientation as any).lock('landscape')
        }
        setTimeout(checkOrientation, 500)
      } catch (err: any) {
        setFullscreenError('Não foi possível forçar a orientação. Toque no botão abaixo ou gire o celular manualmente.')
      }
    }
    if (isOpen) tryFullscreenAndLandscape()
  }, [isOpen])

  // Função para forçar fullscreen e landscape manualmente
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

  useEffect(() => {
    if (match) {
      setFormData({
        date: new Date(match.date),
        opponent: match.opponent,
        location: match.location || '',
        ourScore1: match.ourScore1.toString(),
        ourScore2: match.ourScore2.toString(),
        opponentScore1: match.opponentScore1.toString(),
        opponentScore2: match.opponentScore2.toString(),
      })
    } else {
      setFormData({
        date: null,
        opponent: '',
        location: '',
        ourScore1: '',
        ourScore2: '',
        opponentScore1: '',
        opponentScore2: '',
      })
    }
  }, [match])

  useEffect(() => {
    if (isOpen) {
      fetch('/api/players').then(res => res.json()).then(data => setPlayers(data))
    }
  }, [isOpen])

  // Atualizar stats ao marcar/desmarcar presentes de cada quadro
  useEffect(() => {
    setPlayerStats1(prev => {
      const novo: Record<string, any> = { ...prev }
      presentes1.forEach(j => {
        if (!novo[j.id]) novo[j.id] = { gols: 0, assist: 0, amarelo: 0, vermelho: 0, golsSofridos: 0 }
      })
      Object.keys(novo).forEach(id => {
        if (!presentes1.find(j => j.id === id)) delete novo[id]
      })
      return novo
    })
  }, [presentes1])
  useEffect(() => {
    setPlayerStats2(prev => {
      const novo: Record<string, any> = { ...prev }
      presentes2.forEach(j => {
        if (!novo[j.id]) novo[j.id] = { gols: 0, assist: 0, amarelo: 0, vermelho: 0, golsSofridos: 0 }
      })
      Object.keys(novo).forEach(id => {
        if (!presentes2.find(j => j.id === id)) delete novo[id]
      })
      return novo
    })
  }, [presentes2])

  // Atualizar o handleSubmit para gerar eventos por quadro
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const ourScore1 = parseInt(formData.ourScore1) || 0
    const opponentScore1 = parseInt(formData.opponentScore1) || 0
    const ourScore2 = parseInt(formData.ourScore2) || 0
    const opponentScore2 = parseInt(formData.opponentScore2) || 0

    // Validação: exigir goleiro para cada gol do adversário
    let golsSofridosMarcados1 = presentes1.reduce((acc, j) => acc + (playerStats1[j.id]?.golsSofridos || 0), 0)
    let golsSofridosMarcados2 = presentes2.reduce((acc, j) => acc + (playerStats2[j.id]?.golsSofridos || 0), 0)
    if (opponentScore1 > 0 && golsSofridosMarcados1 < opponentScore1) {
      alert('Você deve atribuir todos os gols sofridos do 1º quadro a um goleiro.');
      return;
    }
    if (opponentScore2 > 0 && golsSofridosMarcados2 < opponentScore2) {
      alert('Você deve atribuir todos os gols sofridos do 2º quadro a um goleiro.');
      return;
    }

    const events: any[] = []
    // 1º quadro - nosso time
    presentes1.forEach(j => {
      // Evento de presença
      events.push({ type: 'presenca', player: j.name, minute: 0, team: 'home', quadro: 1 })
      const stats = playerStats1[j.id] || {}
      for (let i = 0; i < (stats.gols || 0); i++) {
        events.push({ type: 'goal', player: j.name, minute: 0, team: 'home', quadro: 1, assist: stats.assist > 0 ? presentes1.find(p => p.id !== j.id && playerStats1[p.id]?.assist > 0)?.name : null })
      }
      for (let i = 0; i < (stats.assist || 0); i++) {
        events.push({ type: 'assist', player: j.name, minute: 0, team: 'home', quadro: 1 })
      }
      for (let i = 0; i < (stats.amarelo || 0); i++) {
        events.push({ type: 'yellow_card', player: j.name, minute: 0, team: 'home', quadro: 1 })
      }
      for (let i = 0; i < (stats.vermelho || 0); i++) {
        events.push({ type: 'red_card', player: j.name, minute: 0, team: 'home', quadro: 1 })
      }
      // Gols sofridos pelo goleiro
      for (let i = 0; i < (stats.golsSofridos || 0); i++) {
        events.push({ type: 'goal', player: 'Adversário', minute: 0, team: 'away', quadro: 1, goleiro: j.name })
      }
    })
    // 1º quadro - gols do adversário (caso não tenha goleiro marcado)
    for (let i = golsSofridosMarcados1; i < opponentScore1; i++) {
      events.push({ type: 'goal', player: 'Adversário', minute: 0, team: 'away', quadro: 1 })
    }

    // 2º quadro - nosso time
    presentes2.forEach(j => {
      // Evento de presença
      events.push({ type: 'presenca', player: j.name, minute: 0, team: 'home', quadro: 2 })
      const stats = playerStats2[j.id] || {}
      for (let i = 0; i < (stats.gols || 0); i++) {
        events.push({ type: 'goal', player: j.name, minute: 0, team: 'home', quadro: 2, assist: stats.assist > 0 ? presentes2.find(p => p.id !== j.id && playerStats2[p.id]?.assist > 0)?.name : null })
      }
      for (let i = 0; i < (stats.assist || 0); i++) {
        events.push({ type: 'assist', player: j.name, minute: 0, team: 'home', quadro: 2 })
      }
      for (let i = 0; i < (stats.amarelo || 0); i++) {
        events.push({ type: 'yellow_card', player: j.name, minute: 0, team: 'home', quadro: 2 })
      }
      for (let i = 0; i < (stats.vermelho || 0); i++) {
        events.push({ type: 'red_card', player: j.name, minute: 0, team: 'home', quadro: 2 })
      }
      // Gols sofridos pelo goleiro
      for (let i = 0; i < (stats.golsSofridos || 0); i++) {
        events.push({ type: 'goal', player: 'Adversário', minute: 0, team: 'away', quadro: 2, goleiro: j.name })
      }
    })
    // 2º quadro - gols do adversário (caso não tenha goleiro marcado)
    for (let i = golsSofridosMarcados2; i < opponentScore2; i++) {
      events.push({ type: 'goal', player: 'Adversário', minute: 0, team: 'away', quadro: 2 })
    }

    const matchData = {
      ...formData,
      date: formData.date ? formData.date.toISOString() : '',
      ourScore1,
      opponentScore1,
      ourScore2,
      opponentScore2,
      location: formData.location,
      events
    }
    // Remover shareToken se existir (por segurança)
    if ('shareToken' in matchData) {
      delete (matchData as any).shareToken
    }
    onSave(matchData)
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

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-2 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white px-4 pb-4 pt-5 text-left shadow-2xl transition-all w-full max-w-4xl sm:my-8 sm:w-full sm:max-w-4xl sm:p-6 mx-2">
                <div>
                  <div className="mt-3 sm:mt-5">
                    <Dialog.Title as="h3" className="text-2xl font-bold leading-6 text-gray-900 text-center mb-6">
                      {match ? 'Editar Partida' : 'Nova Partida'}
                    </Dialog.Title>
                    <div className="mt-2">
                      <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Informações básicas */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                          <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                            <CalendarIcon className="h-5 w-5 mr-2" />
                            Informações da Partida
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Data</label>
                              <DatePicker
                                selected={formData.date}
                                onChange={date => setFormData(f => ({ ...f, date: date }))}
                                dateFormat="dd/MM/yyyy"
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3"
                                placeholderText="Selecione a data"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Adversário</label>
                              <input
                                type="text"
                                value={formData.opponent}
                                onChange={e => setFormData(f => ({ ...f, opponent: e.target.value }))}
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3"
                                placeholder="Nome do adversário"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Local</label>
                              <select
                                value={formData.location}
                                onChange={e => setFormData(f => ({ ...f, location: e.target.value }))}
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3"
                                required
                              >
                                <option value="">Selecione o local</option>
                                <option value="Casa">Casa</option>
                                <option value="Visitante">Visitante</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Placar */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                          <h4 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                            <TrophyIcon className="h-5 w-5 mr-2" />
                            Placar da Partida
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white rounded-lg p-4 border border-green-200">
                              <h5 className="font-semibold text-green-800 mb-3 text-center">1º Quadro</h5>
                              <div className="flex items-center justify-center space-x-4">
                                <div className="text-center">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Seu Time</label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={formData.ourScore1}
                                    onChange={e => setFormData(f => ({ ...f, ourScore1: e.target.value }))}
                                    className="w-16 rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-center text-lg font-bold"
                                    required
                                  />
                                </div>
                                <span className="text-2xl font-bold text-gray-400">×</span>
                                <div className="text-center">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Adversário</label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={formData.opponentScore1}
                                    onChange={e => setFormData(f => ({ ...f, opponentScore1: e.target.value }))}
                                    className="w-16 rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-center text-lg font-bold"
                                    required
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="bg-white rounded-lg p-4 border border-green-200">
                              <h5 className="font-semibold text-green-800 mb-3 text-center">2º Quadro</h5>
                              <div className="flex items-center justify-center space-x-4">
                                <div className="text-center">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Seu Time</label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={formData.ourScore2}
                                    onChange={e => setFormData(f => ({ ...f, ourScore2: e.target.value }))}
                                    className="w-16 rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-center text-lg font-bold"
                                    required
                                  />
                                </div>
                                <span className="text-2xl font-bold text-gray-400">×</span>
                                <div className="text-center">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Adversário</label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={formData.opponentScore2}
                                    onChange={e => setFormData(f => ({ ...f, opponentScore2: e.target.value }))}
                                    className="w-16 rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-center text-lg font-bold"
                                    required
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Jogadores e Estatísticas */}
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                          <h4 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                            <UserGroupIcon className="h-5 w-5 mr-2" />
                            Jogadores e Estatísticas
                          </h4>
                          
                          {/* 1º Quadro */}
                          <div className="bg-white rounded-lg p-4 border border-purple-200 mb-4">
                            <h5 className="font-semibold text-purple-800 mb-3 flex items-center">
                              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-bold mr-2">1º</span>
                              Jogadores presentes 1º Quadro
                            </h5>
                            <div className="flex flex-wrap gap-3 mb-4">
                              {Array.isArray(players) && players.map(j => (
                                <label key={j.id} className="flex items-center gap-2 text-sm cursor-pointer bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={presentes1.some(p => p.id === j.id)}
                                    onChange={e => {
                                      if (e.target.checked) setPresentes1(p => [...p, j])
                                      else setPresentes1(p => p.filter(pj => pj.id !== j.id))
                                    }}
                                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                  />
                                  <span className="font-medium">{j.name}</span>
                                </label>
                              ))}
                            </div>
                            
                            {Array.isArray(presentes1) && presentes1.length > 0 && (
                              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200">
                                <h6 className="font-semibold text-blue-900 mb-3 flex items-center">
                                  <ChartBarIcon className="h-4 w-4 mr-2" />
                                  Estatísticas dos jogadores 1º Quadro
                                </h6>
                                <div className="space-y-3">
                                  {Array.isArray(presentes1) && presentes1.map(j => (
                                    <div key={j.id} className="flex items-center gap-3 bg-white rounded-lg px-4 py-3 border border-blue-200 shadow-sm">
                                      <span className="w-24 text-sm font-semibold text-gray-800">{j.name}</span>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span title="Gols" className="text-green-600 text-base sm:text-lg">⚽</span>
                                        <input 
                                          type="text" 
                                          inputMode="numeric"
                                          pattern="[0-9]*"
                                          className="w-8 sm:w-12 rounded border-gray-300 text-center text-sm" 
                                          value={playerStats1[j.id]?.gols === 0 ? '' : playerStats1[j.id]?.gols || ''} 
                                          onChange={e => {
                                            const value = e.target.value;
                                            setPlayerStats1(s => ({ 
                                              ...s, 
                                              [j.id]: { 
                                                ...s[j.id], 
                                                gols: value === '' ? 0 : Number(value) || 0
                                              } 
                                            }))
                                          }} 
                                          placeholder="0"
                                        />
                                        <span title="Assistências" className="text-blue-600 text-base sm:text-lg">🅰️</span>
                                        <input 
                                          type="text" 
                                          inputMode="numeric"
                                          pattern="[0-9]*"
                                          className="w-8 sm:w-12 rounded border-gray-300 text-center text-sm" 
                                          value={playerStats1[j.id]?.assist === 0 ? '' : playerStats1[j.id]?.assist || ''} 
                                          onChange={e => {
                                            const value = e.target.value;
                                            setPlayerStats1(s => ({ 
                                              ...s, 
                                              [j.id]: { 
                                                ...s[j.id], 
                                                assist: value === '' ? 0 : Number(value) || 0
                                              } 
                                            }))
                                          }} 
                                          placeholder="0"
                                        />
                                        <span title="Amarelo" className="text-yellow-500 text-base sm:text-lg">🟨</span>
                                        <input 
                                          type="text" 
                                          inputMode="numeric"
                                          pattern="[0-9]*"
                                          className="w-6 sm:w-10 rounded border-gray-300 text-center text-sm" 
                                          value={playerStats1[j.id]?.amarelo === 0 ? '' : playerStats1[j.id]?.amarelo || ''} 
                                          onChange={e => {
                                            const value = e.target.value;
                                            setPlayerStats1(s => ({ 
                                              ...s, 
                                              [j.id]: { 
                                                ...s[j.id], 
                                                amarelo: value === '' ? 0 : Number(value) || 0
                                              } 
                                            }))
                                          }} 
                                          placeholder="0"
                                        />
                                        <span title="Vermelho" className="text-red-600 text-base sm:text-lg">🟥</span>
                                        <input 
                                          type="text" 
                                          inputMode="numeric"
                                          pattern="[0-9]*"
                                          className="w-6 sm:w-10 rounded border-gray-300 text-center text-sm" 
                                          value={playerStats1[j.id]?.vermelho === 0 ? '' : playerStats1[j.id]?.vermelho || ''} 
                                          onChange={e => {
                                            const value = e.target.value;
                                            setPlayerStats1(s => ({ 
                                              ...s, 
                                              [j.id]: { 
                                                ...s[j.id], 
                                                vermelho: value === '' ? 0 : Number(value) || 0
                                              } 
                                            }))
                                          }} 
                                          placeholder="0"
                                        />
                                        <span title="Gols sofridos (goleiro)" className="text-gray-700 text-base sm:text-lg">🥅</span>
                                        <input 
                                          type="text" 
                                          inputMode="numeric"
                                          pattern="[0-9]*"
                                          className="w-8 sm:w-12 rounded border-gray-300 text-center text-sm" 
                                          value={playerStats1[j.id]?.golsSofridos === 0 ? '' : playerStats1[j.id]?.golsSofridos || ''} 
                                          onChange={e => {
                                            const value = e.target.value;
                                            setPlayerStats1(s => ({ 
                                              ...s, 
                                              [j.id]: { 
                                                ...s[j.id], 
                                                golsSofridos: value === '' ? 0 : Number(value) || 0
                                              } 
                                            }))
                                          }} 
                                          placeholder="0"
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 2º Quadro */}
                          <div className="bg-white rounded-lg p-4 border border-purple-200">
                            <h5 className="font-semibold text-purple-800 mb-3 flex items-center">
                              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-bold mr-2">2º</span>
                              Jogadores presentes 2º Quadro
                            </h5>
                            <div className="flex flex-wrap gap-3 mb-4">
                              {players.map(j => (
                                <label key={j.id} className="flex items-center gap-2 text-sm cursor-pointer bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={presentes2.some(p => p.id === j.id)}
                                    onChange={e => {
                                      if (e.target.checked) setPresentes2(p => [...p, j])
                                      else setPresentes2(p => p.filter(pj => pj.id !== j.id))
                                    }}
                                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                  />
                                  <span className="font-medium">{j.name}</span>
                                </label>
                              ))}
                            </div>
                            
                            {Array.isArray(presentes2) && presentes2.length > 0 && (
                              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                                <h6 className="font-semibold text-green-900 mb-3 flex items-center">
                                  <ChartBarIcon className="h-4 w-4 mr-2" />
                                  Estatísticas dos jogadores 2º Quadro
                                </h6>
                                <div className="space-y-3">
                                  {Array.isArray(presentes2) && presentes2.map(j => (
                                    <div key={j.id} className="flex items-center gap-3 bg-white rounded-lg px-4 py-3 border border-green-200 shadow-sm">
                                      <span className="w-24 text-sm font-semibold text-gray-800">{j.name}</span>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span title="Gols" className="text-green-600 text-base sm:text-lg">⚽</span>
                                        <input 
                                          type="text" 
                                          inputMode="numeric"
                                          pattern="[0-9]*"
                                          className="w-8 sm:w-12 rounded border-gray-300 text-center text-sm" 
                                          value={playerStats2[j.id]?.gols === 0 ? '' : playerStats2[j.id]?.gols || ''} 
                                          onChange={e => {
                                            const value = e.target.value;
                                            setPlayerStats2(s => ({ 
                                              ...s, 
                                              [j.id]: { 
                                                ...s[j.id], 
                                                gols: value === '' ? 0 : Number(value) || 0
                                              } 
                                            }))
                                          }} 
                                          placeholder="0"
                                        />
                                        <span title="Assistências" className="text-blue-600 text-base sm:text-lg">🅰️</span>
                                        <input 
                                          type="text" 
                                          inputMode="numeric"
                                          pattern="[0-9]*"
                                          className="w-8 sm:w-12 rounded border-gray-300 text-center text-sm" 
                                          value={playerStats2[j.id]?.assist === 0 ? '' : playerStats2[j.id]?.assist || ''} 
                                          onChange={e => {
                                            const value = e.target.value;
                                            setPlayerStats2(s => ({ 
                                              ...s, 
                                              [j.id]: { 
                                                ...s[j.id], 
                                                assist: value === '' ? 0 : Number(value) || 0
                                              } 
                                            }))
                                          }} 
                                          placeholder="0"
                                        />
                                        <span title="Amarelo" className="text-yellow-500 text-base sm:text-lg">🟨</span>
                                        <input 
                                          type="text" 
                                          inputMode="numeric"
                                          pattern="[0-9]*"
                                          className="w-6 sm:w-10 rounded border-gray-300 text-center text-sm" 
                                          value={playerStats2[j.id]?.amarelo === 0 ? '' : playerStats2[j.id]?.amarelo || ''} 
                                          onChange={e => {
                                            const value = e.target.value;
                                            setPlayerStats2(s => ({ 
                                              ...s, 
                                              [j.id]: { 
                                                ...s[j.id], 
                                                amarelo: value === '' ? 0 : Number(value) || 0
                                              } 
                                            }))
                                          }} 
                                          placeholder="0"
                                        />
                                        <span title="Vermelho" className="text-red-600 text-base sm:text-lg">🟥</span>
                                        <input 
                                          type="text" 
                                          inputMode="numeric"
                                          pattern="[0-9]*"
                                          className="w-6 sm:w-10 rounded border-gray-300 text-center text-sm" 
                                          value={playerStats2[j.id]?.vermelho === 0 ? '' : playerStats2[j.id]?.vermelho || ''} 
                                          onChange={e => {
                                            const value = e.target.value;
                                            setPlayerStats2(s => ({ 
                                              ...s, 
                                              [j.id]: { 
                                                ...s[j.id], 
                                                vermelho: value === '' ? 0 : Number(value) || 0
                                              } 
                                            }))
                                          }} 
                                          placeholder="0"
                                        />
                                        <span title="Gols sofridos (goleiro)" className="text-gray-700 text-base sm:text-lg">🥅</span>
                                        <input 
                                          type="text" 
                                          inputMode="numeric"
                                          pattern="[0-9]*"
                                          className="w-8 sm:w-12 rounded border-gray-300 text-center text-sm" 
                                          value={playerStats2[j.id]?.golsSofridos === 0 ? '' : playerStats2[j.id]?.golsSofridos || ''} 
                                          onChange={e => {
                                            const value = e.target.value;
                                            setPlayerStats2(s => ({ 
                                              ...s, 
                                              [j.id]: { 
                                                ...s[j.id], 
                                                golsSofridos: value === '' ? 0 : Number(value) || 0
                                              } 
                                            }))
                                          }} 
                                          placeholder="0"
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-8 sm:mt-10 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                          <button
                            type="submit"
                            className="inline-flex w-full justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-base font-semibold text-white shadow-sm hover:from-blue-700 hover:to-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:col-start-2 transition-all duration-200"
                          >
                            Salvar Partida
                          </button>
                          <button
                            type="button"
                            className="mt-3 inline-flex w-full justify-center rounded-xl bg-white px-4 py-3 text-base font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0 transition-all duration-200"
                            onClick={onClose}
                          >
                            Cancelar
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
} 