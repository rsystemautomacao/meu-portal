'use client'

import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import { UserIcon } from '@heroicons/react/24/outline'

interface StatsModalProps {
  isOpen: boolean
  onClose: () => void
  events: Array<{
    id: string
    type: string
    player: string
    minute: number
    team: string
    quadro: number
    assist?: string
  }>
}

export default function StatsModal({ isOpen, onClose, events }: StatsModalProps) {
  // Agrupar eventos por quadro
  const quadros = [1, 2];
  const getLabel = (type: string) => {
    switch (type) {
      case 'goal': return 'Gol';
      case 'assist': return 'Assistência';
      case 'yellow_card': return 'Amarelo';
      case 'red_card': return 'Vermelho';
      default: return type;
    }
  };
  const getColor = (type: string) => {
    switch (type) {
      case 'goal': return 'text-green-700';
      case 'assist': return 'text-blue-700';
      case 'yellow_card': return 'text-yellow-600';
      case 'red_card': return 'text-red-600';
      default: return 'text-gray-700';
    }
  };

  const ICONS: Record<string, React.ReactNode> = {
    goal: <span className="inline-block text-green-600 mr-1">⚽</span>,
    assist: <span className="inline-block text-blue-600 mr-1">🅰️</span>,
    yellow_card: <span className="inline-block text-yellow-500 mr-1">🟨</span>,
    red_card: <span className="inline-block text-red-600 mr-1">🟥</span>,
  }

  const grouped = quadros.map(q => ({
    quadro: q,
    events: events.filter(ev => ev.quadro === q)
  }))

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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-2 pb-4 pt-5 text-left shadow-xl transition-all w-full max-w-full sm:my-8 sm:w-full sm:max-w-lg sm:p-6 mx-2">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <span className="sr-only">Fechar</span>
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 mb-4">
                  Estatísticas da Súmula
                </Dialog.Title>
                {grouped.map(({ quadro, events }) => (
                  <div key={quadro} className="mb-6">
                    <div className="font-bold mb-2 text-base">{quadro}º Quadro</div>
                    {events.length === 0 && <div className="text-gray-400 text-sm mb-2">Nenhum evento registrado.</div>}
                    <ul className="space-y-1">
                      {events.map(ev => (
                        <li key={ev.id} className="flex items-center gap-1 text-sm">
                          {ICONS[ev.type as keyof typeof ICONS] || <UserIcon className="h-3 w-3 text-gray-400" />}
                          <span className={`font-semibold ${getColor(ev.type)} text-xs`}>{getLabel(ev.type)}</span>
                          <span className="font-medium text-gray-800 text-xs">{ev.player}</span>
                          {ev.type === 'goal' && ev.assist && (
                            <span className="text-xs text-blue-600">🅰️{ev.assist}</span>
                          )}
                          <span className="text-xs text-gray-500">{ev.minute}'</span>
                          <span className="text-xs text-gray-400">({ev.team === 'home' ? '🏠' : '⚔️'})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                <div className="mt-4 text-right">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-opacity-90"
                    onClick={onClose}
                  >
                    Fechar
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
} 