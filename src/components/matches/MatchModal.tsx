'use client'

import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
// NOVO: importar react-datepicker e estilos
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { ptBR } from 'date-fns/locale'
import { format, parse } from 'date-fns'

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
  const [formData, setFormData] = useState({
    date: match?.date ? new Date(match.date) : null,
    opponent: match?.opponent || '',
    location: match?.location || '',
    score1: '',
    score2: '',
    opponentScore1: '',
    opponentScore2: '',
  })

  const [players, setPlayers] = useState<any[]>([])
  const [presentes1, setPresentes1] = useState<any[]>([])
  const [playerStats1, setPlayerStats1] = useState<Record<string, { gols: number, assist: number, amarelo: number, vermelho: number, golsSofridos: number }>>({})
  const [presentes2, setPresentes2] = useState<any[]>([])
  const [playerStats2, setPlayerStats2] = useState<Record<string, { gols: number, assist: number, amarelo: number, vermelho: number, golsSofridos: number }>>({})

  useEffect(() => {
    if (match) {
      setFormData({
        date: new Date(match.date),
        opponent: match.opponent,
        location: match.location || '',
        score1: match.ourScore1.toString(),
        score2: match.ourScore2.toString(),
        opponentScore1: match.opponentScore1.toString(),
        opponentScore2: match.opponentScore2.toString(),
      })
    } else {
      setFormData({
        date: null,
        opponent: '',
        location: '',
        score1: '',
        score2: '',
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
    const ourScore1 = parseInt(formData.score1) || 0
    const opponentScore1 = parseInt(formData.opponentScore1) || 0
    const ourScore2 = parseInt(formData.score2) || 0
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

    onSave({
      ...formData,
      date: formData.date ? formData.date.toISOString() : '',
      ourScore1,
      opponentScore1,
      ourScore2,
      opponentScore2,
      location: formData.location,
      events
    })
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

        <div className="fixed inset-0 z-10 overflow-y-auto flex items-center justify-center">
          <div className="flex min-h-full items-center justify-center p-2 text-center sm:items-center sm:p-0 w-full">
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
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-2xl font-bold leading-6 text-gray-900 mb-4">
                      {match ? 'Editar Partida' : 'Nova Partida'}
                    </Dialog.Title>
                    <div className="space-y-6">
                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label htmlFor="date" className="block text-sm font-semibold text-gray-700 mb-1">Data</label>
                            <DatePicker
                              selected={formData.date}
                              onChange={date => setFormData({ ...formData, date })}
                              dateFormat="dd/MM/yyyy"
                              locale={ptBR}
                              placeholderText="Selecione a data"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                              id="date"
                              name="date"
                              required
                            />
                          </div>
                          <div>
                            <label htmlFor="opponent" className="block text-sm font-semibold text-gray-700 mb-1">Adversário</label>
                            <input
                              type="text"
                              name="opponent"
                              id="opponent"
                              required
                              value={formData.opponent}
                              onChange={(e) => setFormData({ ...formData, opponent: e.target.value })}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                            />
                          </div>
                          <div>
                            <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-1">Local</label>
                            <select
                              name="location"
                              id="location"
                              required
                              value={formData.location}
                              onChange={e => setFormData({ ...formData, location: e.target.value })}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                            >
                              <option value="">Selecione</option>
                              <option value="Casa">Casa</option>
                              <option value="Visitante">Visitante</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-gray-50 rounded-xl p-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Placar 1º Quadro</label>
                            <div className="flex gap-2 items-center">
                              <input
                                type="number"
                                name="score1"
                                id="score1"
                                min="0"
                                required
                                placeholder="Seu time"
                                value={formData.score1}
                                onChange={(e) => setFormData({ ...formData, score1: e.target.value })}
                                className="block w-20 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm text-center"
                              />
                              <span className="text-lg font-bold">x</span>
                              <input
                                type="number"
                                name="opponentScore1"
                                id="opponentScore1"
                                min="0"
                                required
                                placeholder="Adversário"
                                value={formData.opponentScore1}
                                onChange={(e) => setFormData({ ...formData, opponentScore1: e.target.value })}
                                className="block w-20 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm text-center"
                              />
                            </div>
                          </div>
                          <div className="bg-gray-50 rounded-xl p-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Placar 2º Quadro</label>
                            <div className="flex gap-2 items-center">
                              <input
                                type="number"
                                name="score2"
                                id="score2"
                                min="0"
                                required
                                placeholder="Seu time"
                                value={formData.score2}
                                onChange={(e) => setFormData({ ...formData, score2: e.target.value })}
                                className="block w-20 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm text-center"
                              />
                              <span className="text-lg font-bold">x</span>
                              <input
                                type="number"
                                name="opponentScore2"
                                id="opponentScore2"
                                min="0"
                                required
                                placeholder="Adversário"
                                value={formData.opponentScore2}
                                onChange={(e) => setFormData({ ...formData, opponentScore2: e.target.value })}
                                className="block w-20 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm text-center"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Jogadores presentes 1º Quadro (opcional)</label>
                          <div className="flex flex-wrap gap-4 mb-2">
                            {players.map(j => (
                              <label key={j.id} className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={presentes1.some(p => p.id === j.id)}
                                  onChange={e => {
                                    if (e.target.checked) setPresentes1(p => [...p, j])
                                    else setPresentes1(p => p.filter(pj => pj.id !== j.id))
                                  }}
                                />
                                <span>{j.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        {presentes1.length > 0 && (
                          <div className="bg-gray-50 rounded-xl p-4 mb-2">
                            <div className="font-medium text-base mb-2 text-gray-800">Estatísticas dos jogadores 1º Quadro</div>
                            <div className="space-y-2">
                              {presentes1.map(j => (
                                <div key={j.id} className="flex items-center gap-2 bg-white rounded px-2 py-1 border border-gray-100">
                                  <span className="w-24 text-xs font-semibold text-gray-800">{j.name}</span>
                                  <span title="Gols" className="text-green-600">⚽</span>
                                  <input type="number" min={0} className="w-10 rounded border-gray-300 text-center" value={playerStats1[j.id]?.gols ?? 0} onChange={e => setPlayerStats1(s => ({ ...s, [j.id]: { ...s[j.id], gols: Number(e.target.value) } }))} />
                                  <span title="Assistências" className="text-blue-600">🅰️</span>
                                  <input type="number" min={0} className="w-10 rounded border-gray-300 text-center" value={playerStats1[j.id]?.assist ?? 0} onChange={e => setPlayerStats1(s => ({ ...s, [j.id]: { ...s[j.id], assist: Number(e.target.value) } }))} />
                                  <span title="Amarelo" className="text-yellow-500">🟨</span>
                                  <input type="number" min={0} className="w-8 rounded border-gray-300 text-center" value={playerStats1[j.id]?.amarelo ?? 0} onChange={e => setPlayerStats1(s => ({ ...s, [j.id]: { ...s[j.id], amarelo: Number(e.target.value) } }))} />
                                  <span title="Vermelho" className="text-red-600">🟥</span>
                                  <input type="number" min={0} className="w-8 rounded border-gray-300 text-center" value={playerStats1[j.id]?.vermelho ?? 0} onChange={e => setPlayerStats1(s => ({ ...s, [j.id]: { ...s[j.id], vermelho: Number(e.target.value) } }))} />
                                  <span title="Gols sofridos (goleiro)" className="text-gray-700">🥅</span>
                                  <input type="number" min={0} className="w-10 rounded border-gray-300 text-center" value={playerStats1[j.id]?.golsSofridos ?? 0} onChange={e => setPlayerStats1(s => ({ ...s, [j.id]: { ...s[j.id], golsSofridos: Number(e.target.value) } }))} />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Jogadores presentes 2º Quadro (opcional)</label>
                          <div className="flex flex-wrap gap-4 mb-2">
                            {players.map(j => (
                              <label key={j.id} className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={presentes2.some(p => p.id === j.id)}
                                  onChange={e => {
                                    if (e.target.checked) setPresentes2(p => [...p, j])
                                    else setPresentes2(p => p.filter(pj => pj.id !== j.id))
                                  }}
                                />
                                <span>{j.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        {presentes2.length > 0 && (
                          <div className="bg-gray-50 rounded-xl p-4 mb-2">
                            <div className="font-medium text-base mb-2 text-gray-800">Estatísticas dos jogadores 2º Quadro</div>
                            <div className="space-y-2">
                              {presentes2.map(j => (
                                <div key={j.id} className="flex items-center gap-2 bg-white rounded px-2 py-1 border border-gray-100">
                                  <span className="w-24 text-xs font-semibold text-gray-800">{j.name}</span>
                                  <span title="Gols" className="text-green-600">⚽</span>
                                  <input type="number" min={0} className="w-10 rounded border-gray-300 text-center" value={playerStats2[j.id]?.gols ?? 0} onChange={e => setPlayerStats2(s => ({ ...s, [j.id]: { ...s[j.id], gols: Number(e.target.value) } }))} />
                                  <span title="Assistências" className="text-blue-600">🅰️</span>
                                  <input type="number" min={0} className="w-10 rounded border-gray-300 text-center" value={playerStats2[j.id]?.assist ?? 0} onChange={e => setPlayerStats2(s => ({ ...s, [j.id]: { ...s[j.id], assist: Number(e.target.value) } }))} />
                                  <span title="Amarelo" className="text-yellow-500">🟨</span>
                                  <input type="number" min={0} className="w-8 rounded border-gray-300 text-center" value={playerStats2[j.id]?.amarelo ?? 0} onChange={e => setPlayerStats2(s => ({ ...s, [j.id]: { ...s[j.id], amarelo: Number(e.target.value) } }))} />
                                  <span title="Vermelho" className="text-red-600">🟥</span>
                                  <input type="number" min={0} className="w-8 rounded border-gray-300 text-center" value={playerStats2[j.id]?.vermelho ?? 0} onChange={e => setPlayerStats2(s => ({ ...s, [j.id]: { ...s[j.id], vermelho: Number(e.target.value) } }))} />
                                  <span title="Gols sofridos (goleiro)" className="text-gray-700">🥅</span>
                                  <input type="number" min={0} className="w-10 rounded border-gray-300 text-center" value={playerStats2[j.id]?.golsSofridos ?? 0} onChange={e => setPlayerStats2(s => ({ ...s, [j.id]: { ...s[j.id], golsSofridos: Number(e.target.value) } }))} />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="mt-6 flex justify-end gap-4">
                          <button
                            type="button"
                            className="inline-flex justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                            onClick={onClose}
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="inline-flex justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-opacity-90"
                          >
                            {match ? 'Salvar' : 'Adicionar'}
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