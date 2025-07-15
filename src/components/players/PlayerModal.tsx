'use client'

import { Dialog, Transition } from '@headlessui/react'
import { PhotoIcon } from '@heroicons/react/24/solid'
import { Fragment, useRef, useState, useEffect } from 'react'

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
        id: player.id,
        name: player.name,
        number: player.number.toString(),
        position: player.position,
        status: player.status,
        photoUrl: player.photoUrl || '',
        birthDate: player.birthDate ? new Date(player.birthDate).toISOString().split('T')[0] : '',
        joinDate: player.joinDate ? new Date(player.joinDate).toISOString().split('T')[0] : '',
        isExempt: player.isExempt,
        monthlyFee: player.monthlyFee?.toString() || ''
      })
      if (player.photoUrl) {
        setPhotoPreview(player.photoUrl)
      }
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
        monthlyFee: ''
      })
      setPhotoPreview(null)
    }
  }, [player])

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

  const handlePhotoClick = () => {
    // Usar o input existente se disponível
    if (fileInputRef.current) {
      fileInputRef.current.click()
      return
    }
    
    // Criar input temporário para mobile
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.capture = 'environment' // Permitir câmera no mobile
    
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement
      if (target.files?.[0]) {
        const file = target.files[0]
        
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
    
    // Trigger do input
    input.click()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Garantir que monthlyFee seja 0 quando isento
    const dataToSend = {
      ...formData,
      id: player?.id,
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white px-2 pb-4 pt-5 text-left shadow-xl transition-all w-full max-w-full sm:my-8 sm:w-full sm:max-w-lg sm:p-6 mx-2">
                <div>
                  <div className="mt-3 sm:mt-5">
                    <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-gray-900 mb-4 text-center">
                      {player ? '✏️ Editar Jogador' : '👤 Novo Jogador'}
                    </Dialog.Title>
                    <div className="mt-2">
                      <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Upload de Foto */}
                        <div className="flex justify-center">
                          <div
                            className="relative mt-2 h-32 w-32 cursor-pointer overflow-hidden rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors flex items-center justify-center"
                            onClick={handlePhotoClick}
                          >
                            {photoPreview ? (
                              <img
                                src={photoPreview}
                                alt="Preview"
                                className="h-32 w-32 rounded-xl object-cover"
                              />
                            ) : (
                              <div className="text-center">
                                <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" aria-hidden="true" />
                                <p className="text-xs text-gray-500">Clique para adicionar foto</p>
                              </div>
                            )}
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handlePhotoChange}
                              accept="image/*"
                              className="hidden"
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                            Nome
                          </label>
                          <input
                            type="text"
                            name="name"
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            required
                          />
                        </div>

                        <div>
                          <label htmlFor="number" className="block text-sm font-medium text-gray-700">
                            Número
                          </label>
                          <input
                            type="number"
                            name="number"
                            id="number"
                            value={formData.number}
                            onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            required
                          />
                        </div>

                        <div>
                          <label htmlFor="position" className="block text-sm font-medium text-gray-700">
                            Posição
                          </label>
                          <select
                            id="position"
                            name="position"
                            value={formData.position}
                            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            required
                          >
                            <option value="">Selecione uma posição</option>
                            {PLAYER_POSITIONS.map((pos) => (
                              <option key={pos} value={pos}>
                                {pos}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                            Status
                          </label>
                          <select
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          >
                            {statusOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
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
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="isExempt" className="ml-2 block text-sm text-gray-900">
                              Isento de mensalidade
                            </label>
                          </div>
                        </div>

                        {!formData.isExempt && (
                          <div>
                            <label htmlFor="monthlyFee" className="block text-sm font-medium text-gray-700">
                              Valor da Mensalidade
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">R$</span>
                              </div>
                              <input
                                type="number"
                                name="monthlyFee"
                                id="monthlyFee"
                                value={formData.monthlyFee}
                                onChange={(e) => setFormData({ ...formData, monthlyFee: e.target.value })}
                                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md"
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                              />
                            </div>
                          </div>
                        )}

                        <div>
                          <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700">
                            Data de Nascimento
                          </label>
                          <input
                            type="text"
                            name="birthDate"
                            id="birthDate"
                            value={formData.birthDate}
                            onChange={(e) => {
                              let value = e.target.value;
                              // Formatar automaticamente DD/MM/AAAA
                              if (value.length === 2 && !value.includes('/')) {
                                value += '/';
                              } else if (value.length === 5 && value.split('/').length === 2) {
                                value += '/';
                              }
                              setFormData({ ...formData, birthDate: value });
                            }}
                            placeholder="DD/MM/AAAA"
                            maxLength={10}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                        </div>

                        <div>
                          <label htmlFor="joinDate" className="block text-sm font-medium text-gray-700">
                            Data de Entrada
                          </label>
                          <input
                            type="text"
                            name="joinDate"
                            id="joinDate"
                            value={formData.joinDate}
                            onChange={(e) => {
                              let value = e.target.value;
                              // Formatar automaticamente DD/MM/AAAA
                              if (value.length === 2 && !value.includes('/')) {
                                value += '/';
                              } else if (value.length === 5 && value.split('/').length === 2) {
                                value += '/';
                              }
                              setFormData({ ...formData, joinDate: value });
                            }}
                            placeholder="DD/MM/AAAA"
                            maxLength={10}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                        </div>

                        <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                          <button
                            type="submit"
                            className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:col-start-2"
                          >
                            Salvar
                          </button>
                          <button
                            type="button"
                            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
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