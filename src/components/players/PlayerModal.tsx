'use client'

import { Dialog, Transition } from '@headlessui/react'
import { PhotoIcon } from '@heroicons/react/24/solid'
import { Fragment, useRef, useState, useEffect } from 'react'
import { format, parse } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const PLAYER_POSITIONS = [
  'Goleiro',
  'Fixo',
  'Ala Direita',
  'Ala Esquerda',
  'Pivô'
]

interface FormData {
  id?: string
  name: string
  number: string
  position: string
  status: 'ACTIVE' | 'INACTIVE'
  photoUrl?: string
  birthDate?: string
  joinDate?: string
  isExempt: boolean
  monthlyFee?: string
}

interface PlayerModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (player: FormData) => void
  player?: FormData
}

const statusOptions = [
  { value: 'ACTIVE', label: 'Ativo' },
  { value: 'INACTIVE', label: 'Inativo' }
]

export default function PlayerModal({ isOpen, onClose, onSave, player }: PlayerModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    number: '',
    position: '',
    status: 'ACTIVE',
    photoUrl: '',
    birthDate: '',
    joinDate: '',
    isExempt: false,
    monthlyFee: ''
  })

  useEffect(() => {
    if (player) {
      setFormData({
        ...player,
        birthDate: player.birthDate ? format(new Date(player.birthDate), 'dd/MM/yyyy') : '',
        joinDate: player.joinDate ? format(new Date(player.joinDate), 'dd/MM/yyyy') : '',
      })
      setPhotoPreview(player.photoUrl || null)
    } else {
      setFormData({
        name: '',
        number: '',
        position: '',
        status: 'ACTIVE',
        photoUrl: '',
        birthDate: '',
        joinDate: '',
        isExempt: false,
        monthlyFee: '',
      })
      setPhotoPreview(null)
    }
  }, [player, isOpen])

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem')
        return
      }
      
      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 5MB')
        return
      }
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
        setFormData({ ...formData, photoUrl: reader.result as string })
      }
      reader.onerror = () => {
        alert('Erro ao ler o arquivo. Tente novamente.')
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePhotoClick = (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const parseDate = (str: string) => {
      if (!str) return ''
      const [d, m, y] = str.split('/')
      if (d && m && y) {
        const date = new Date(`${y}-${m}-${d}T00:00:00`)
        if (!isNaN(date.getTime())) return date.toISOString().split('T')[0]
      }
      return ''
    }
    const dataToSend = {
      ...formData,
      id: player?.id,
      birthDate: parseDate(formData.birthDate || ''),
      joinDate: parseDate(formData.joinDate || ''),
      monthlyFee: formData.isExempt ? '0' : formData.monthlyFee || '0'
    }
    onSave(dataToSend)
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

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-2 text-center sm:items-center sm:p-0 w-full">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-white to-indigo-100 px-2 pb-4 pt-5 text-left shadow-2xl transition-all w-full max-w-full sm:my-8 sm:w-full sm:max-w-lg sm:p-6 mx-2 border border-blue-200">
                <div>
                  <div className="mt-3 sm:mt-5">
                    <Dialog.Title as="h3" className="text-2xl font-extrabold leading-6 text-blue-900 mb-4 text-center drop-shadow-sm">
                      {player ? '✏️ Editar Jogador' : '👤 Novo Jogador'}
                    </Dialog.Title>
                    <div className="mt-2">
                      <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Upload de Foto */}
                        <div className="flex justify-center">
                          <label
                            htmlFor="player-photo-input"
                            className="relative mt-2 h-32 w-32 cursor-pointer overflow-hidden rounded-full bg-gradient-to-br from-blue-200 via-white to-indigo-200 border-4 border-blue-400 shadow-lg hover:border-indigo-500 transition-colors flex items-center justify-center group"
                            onClick={handlePhotoClick}
                            onTouchEnd={handlePhotoClick}
                            style={{
                              touchAction: 'manipulation',
                              WebkitTapHighlightColor: 'transparent',
                              boxShadow: '0 4px 24px 0 rgba(30,64,175,0.10)'
                            }}
                          >
                            {photoPreview ? (
                              <img
                                src={photoPreview}
                                alt="Preview"
                                className="h-32 w-32 rounded-full object-cover border-2 border-white shadow-md group-hover:scale-105 transition-transform duration-200"
                              />
                            ) : (
                              <div className="text-center flex flex-col items-center justify-center">
                                <PhotoIcon className="h-14 w-14 text-blue-400 mb-2 drop-shadow" aria-hidden="true" />
                                <p className="text-xs text-blue-700 font-semibold">Clique para adicionar foto</p>
                              </div>
                            )}
                            <input
                              id="player-photo-input"
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handlePhotoChange}
                              style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', left: 0, top: 0, zIndex: 2, cursor: 'pointer' }}
                              tabIndex={-1}
                            />
                            <div className="absolute bottom-2 right-2 bg-blue-600 text-white rounded-full p-1 shadow-md text-xs font-bold group-hover:bg-indigo-600 transition-colors">+</div>
                          </label>
                        </div>

                        {/* Botão de teste para mobile */}
                        {/* Removido o botão de teste upload */}

                        <div>
                          <label htmlFor="name" className="block text-sm font-bold text-blue-900 mb-1">Nome</label>
                          <input
                            type="text"
                            name="name"
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="mt-1 block w-full rounded-md border-blue-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white/80 text-blue-900 font-semibold placeholder:text-blue-300"
                            required
                          />
                        </div>

                        <div>
                          <label htmlFor="number" className="block text-sm font-bold text-blue-900 mb-1">Número</label>
                          <input
                            type="number"
                            name="number"
                            id="number"
                            value={formData.number}
                            onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                            className="mt-1 block w-full rounded-md border-blue-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white/80 text-blue-900 font-semibold placeholder:text-blue-300"
                            required
                          />
                        </div>

                        <div>
                          <label htmlFor="position" className="block text-sm font-bold text-blue-900 mb-1">Posição</label>
                          <select
                            id="position"
                            name="position"
                            value={formData.position}
                            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                            className="mt-1 block w-full rounded-md border-blue-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white/80 text-blue-900 font-semibold"
                            required
                          >
                            <option value="">Selecione uma posição</option>
                            {PLAYER_POSITIONS.map((pos) => (
                              <option key={pos} value={pos} className="text-blue-900">
                                {pos}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label htmlFor="status" className="block text-sm font-bold text-blue-900 mb-1">Status</label>
                          <select
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                            className="mt-1 block w-full rounded-md border-blue-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white/80 text-blue-900 font-semibold"
                          >
                            {statusOptions.map((option) => (
                              <option key={option.value} value={option.value} className="text-blue-900">
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center">
                          <input
                            id="isExempt"
                            name="isExempt"
                            type="checkbox"
                            checked={formData.isExempt}
                            onChange={(e) => {
                              setFormData({ 
                                ...formData, 
                                isExempt: e.target.checked,
                                monthlyFee: e.target.checked ? '' : formData.monthlyFee 
                              })
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-blue-300 rounded"
                          />
                          <label htmlFor="isExempt" className="ml-2 block text-sm text-blue-900 font-semibold">
                            Isento de mensalidade
                          </label>
                        </div>

                        {!formData.isExempt && (
                          <div>
                            <label htmlFor="monthlyFee" className="block text-sm font-bold text-blue-900 mb-1">Valor da Mensalidade</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-blue-400 sm:text-sm font-bold">R$</span>
                              </div>
                              <input
                                type="number"
                                name="monthlyFee"
                                id="monthlyFee"
                                value={formData.monthlyFee}
                                onChange={(e) => setFormData({ ...formData, monthlyFee: e.target.value })}
                                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 sm:text-sm border-blue-200 rounded-md bg-white/80 text-blue-900 font-semibold placeholder:text-blue-300"
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                              />
                            </div>
                          </div>
                        )}

                        <div>
                          <label htmlFor="birthDate" className="block text-sm font-bold text-blue-900 mb-1">Data de Nascimento</label>
                          <input
                            type="text"
                            name="birthDate"
                            id="birthDate"
                            value={formData.birthDate}
                            onChange={e => setFormData({ ...formData, birthDate: e.target.value.replace(/[^\d\/]/g, '').slice(0, 10) })}
                            placeholder="DD/MM/AAAA"
                            maxLength={10}
                            className="mt-1 block w-full rounded-md border-blue-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white/80 text-blue-900 font-semibold placeholder:text-blue-300"
                          />
                        </div>

                        <div>
                          <label htmlFor="joinDate" className="block text-sm font-bold text-blue-900 mb-1">Data de Entrada</label>
                          <input
                            type="text"
                            name="joinDate"
                            id="joinDate"
                            value={formData.joinDate}
                            onChange={e => setFormData({ ...formData, joinDate: e.target.value.replace(/[^\d\/]/g, '').slice(0, 10) })}
                            placeholder="DD/MM/AAAA"
                            maxLength={10}
                            className="mt-1 block w-full rounded-md border-blue-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white/80 text-blue-900 font-semibold placeholder:text-blue-300"
                          />
                        </div>

                        <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                          <button
                            type="submit"
                            className="inline-flex w-full justify-center rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-2 text-sm font-bold text-white shadow-lg hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:col-start-2 transition-colors duration-200"
                          >
                            Salvar
                          </button>
                          <button
                            type="button"
                            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-bold text-blue-900 shadow-sm ring-1 ring-inset ring-blue-200 hover:bg-blue-50 sm:col-start-1 sm:mt-0 transition-colors duration-200"
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