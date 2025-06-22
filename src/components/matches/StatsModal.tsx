'use client'

import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface StatsModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (statsData: any) => void
  matchId: string
  initialStats?: {
    goals: number
    assists: number
    yellowCards: number
    redCards: number
  }
}

export default function StatsModal({ isOpen, onClose, onSave, matchId, initialStats }: StatsModalProps) {
  const [formData, setFormData] = useState({
    goals: initialStats?.goals || 0,
    assists: initialStats?.assists || 0,
    yellowCards: initialStats?.yellowCards || 0,
    redCards: initialStats?.redCards || 0
  })

  useEffect(() => {
    if (initialStats) {
      setFormData(initialStats)
    } else {
      setFormData({
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0
      })
    }
  }, [initialStats])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...formData,
      matchId
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

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
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
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      Estatísticas da Partida
                    </Dialog.Title>
                    <div className="mt-4">
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="goals" className="block text-sm font-medium text-gray-700">
                              Gols
                            </label>
                            <input
                              type="number"
                              name="goals"
                              id="goals"
                              min="0"
                              value={formData.goals}
                              onChange={(e) => setFormData({ ...formData, goals: parseInt(e.target.value) || 0 })}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                            />
                          </div>

                          <div>
                            <label htmlFor="assists" className="block text-sm font-medium text-gray-700">
                              Assistências
                            </label>
                            <input
                              type="number"
                              name="assists"
                              id="assists"
                              min="0"
                              value={formData.assists}
                              onChange={(e) => setFormData({ ...formData, assists: parseInt(e.target.value) || 0 })}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                            />
                          </div>

                          <div>
                            <label htmlFor="yellowCards" className="block text-sm font-medium text-gray-700">
                              Cartões Amarelos
                            </label>
                            <input
                              type="number"
                              name="yellowCards"
                              id="yellowCards"
                              min="0"
                              value={formData.yellowCards}
                              onChange={(e) => setFormData({ ...formData, yellowCards: parseInt(e.target.value) || 0 })}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                            />
                          </div>

                          <div>
                            <label htmlFor="redCards" className="block text-sm font-medium text-gray-700">
                              Cartões Vermelhos
                            </label>
                            <input
                              type="number"
                              name="redCards"
                              id="redCards"
                              min="0"
                              value={formData.redCards}
                              onChange={(e) => setFormData({ ...formData, redCards: parseInt(e.target.value) || 0 })}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                            />
                          </div>
                        </div>

                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                          <button
                            type="submit"
                            className="inline-flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-opacity-90 sm:ml-3 sm:w-auto"
                          >
                            Salvar
                          </button>
                          <button
                            type="button"
                            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
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