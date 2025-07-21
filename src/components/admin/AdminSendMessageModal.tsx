import { Dialog, Transition } from '@headlessui/react'
import { Fragment, useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'

interface AdminSendMessageModalProps {
  isOpen: boolean
  onClose: () => void
  teamName: string
  teamId: string
  onMessageSent?: () => void
}

const LOCAL_STORAGE_KEY = 'admin_custom_messages'

const defaultMessages = {
  late: 'Olá, sua mensalidade está em atraso. Por favor, regularize o pagamento para evitar bloqueio do acesso.',
  block: 'Atenção: seu acesso será bloqueado em até 48 horas por falta de pagamento. Regularize para evitar o bloqueio.',
}

type MessageType = 'late' | 'block' | 'custom'

export default function AdminSendMessageModal({ isOpen, onClose, teamName, teamId, onMessageSent }: AdminSendMessageModalProps) {
  const [selectedType, setSelectedType] = useState<MessageType>('late')
  const [customMessages, setCustomMessages] = useState<{ late: string; block: string }>({ ...defaultMessages })
  const [editing, setEditing] = useState<MessageType | null>(null)
  const [customText, setCustomText] = useState('')
  const [sending, setSending] = useState(false)

  // Carregar mensagens personalizadas do localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (saved) {
        try {
          setCustomMessages(JSON.parse(saved))
        } catch {}
      }
    }
  }, [isOpen])

  // Salvar mensagens personalizadas
  const saveCustomMessage = (type: MessageType, value: string) => {
    if (type === 'custom') return
    const updated = { ...customMessages, [type]: value }
    setCustomMessages(updated)
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated))
    toast.success('Mensagem personalizada salva!')
    setEditing(null)
  }

  const getMessageValue = () => {
    if (selectedType === 'late') return customMessages.late
    if (selectedType === 'block') return customMessages.block
    return customText
  }

  const getApiMessageType = (type: MessageType) => {
    if (type === 'late') return 'payment_reminder'
    if (type === 'block') return 'access_blocked'
    if (type === 'custom') return 'custom'
    return type
  }

  const handleSend = async () => {
    setSending(true)
    try {
      let messageType = getApiMessageType(selectedType)
      let message = getMessageValue()
      if (!message.trim()) {
        toast.error('A mensagem não pode ser vazia.')
        setSending(false)
        return
      }
      // Enviar para a API
      const body: any = { messageType }
      if (messageType === 'custom') body.customMessage = message
      const response = await fetch(`/api/admin/teams/${teamId}/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao enviar mensagem')
      }
      toast.success('Mensagem enviada com sucesso!')
      if (onMessageSent) onMessageSent()
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar mensagem')
    } finally {
      setSending(false)
    }
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900 bg-opacity-60 transition-opacity" />
        </Transition.Child>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <Dialog.Panel className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-auto border-2 border-blue-200">
              <Dialog.Title as="h3" className="text-xl font-bold text-blue-900 mb-4 text-center">
                Enviar Mensagem para <span className="text-indigo-600">{teamName}</span>
              </Dialog.Title>
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="font-semibold text-sm text-gray-700">Tipo de mensagem:</label>
                  <div className="flex gap-2">
                    <button
                      className={`px-3 py-1 rounded-lg border text-xs font-medium ${selectedType === 'late' ? 'bg-blue-600 text-white' : 'bg-white text-blue-700 border-blue-300'}`}
                      onClick={() => setSelectedType('late')}
                    >
                      Aviso de Mensalidade Atrasada
                    </button>
                    <button
                      className={`px-3 py-1 rounded-lg border text-xs font-medium ${selectedType === 'block' ? 'bg-red-600 text-white' : 'bg-white text-red-700 border-red-300'}`}
                      onClick={() => setSelectedType('block')}
                    >
                      Aviso de Bloqueio 48h
                    </button>
                    <button
                      className={`px-3 py-1 rounded-lg border text-xs font-medium ${selectedType === 'custom' ? 'bg-gray-700 text-white' : 'bg-white text-gray-700 border-gray-300'}`}
                      onClick={() => setSelectedType('custom')}
                    >
                      Mensagem Livre
                    </button>
                  </div>
                </div>
                {/* Campo de mensagem */}
                {selectedType !== 'custom' && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Mensagem:</label>
                    {editing === selectedType ? (
                      <div className="flex flex-col gap-2">
                        <textarea
                          className="w-full rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-sm p-2"
                          rows={4}
                          value={customMessages[selectedType]}
                          onChange={e => setCustomMessages({ ...customMessages, [selectedType]: e.target.value })}
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            className="px-3 py-1 rounded bg-gray-200 text-gray-700 text-xs font-medium"
                            onClick={() => setEditing(null)}
                            type="button"
                          >
                            Cancelar
                          </button>
                          <button
                            className="px-3 py-1 rounded bg-blue-600 text-white text-xs font-medium"
                            onClick={() => saveCustomMessage(selectedType, customMessages[selectedType])}
                            type="button"
                          >
                            Salvar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <textarea
                          className="w-full rounded-md border-gray-200 bg-gray-50 text-sm p-2"
                          rows={4}
                          value={customMessages[selectedType]}
                          readOnly
                        />
                        <button
                          className="px-3 py-1 rounded bg-blue-100 text-blue-700 text-xs font-medium w-max self-end"
                          onClick={() => setEditing(selectedType)}
                          type="button"
                        >
                          Editar mensagem
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {selectedType === 'custom' && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Mensagem personalizada:</label>
                    <textarea
                      className="w-full rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-sm p-2"
                      rows={4}
                      value={customText}
                      onChange={e => setCustomText(e.target.value)}
                      placeholder="Digite sua mensagem..."
                    />
                  </div>
                )}
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold"
                    onClick={onClose}
                    type="button"
                    disabled={sending}
                  >
                    Cancelar
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition-colors"
                    onClick={handleSend}
                    disabled={sending}
                  >
                    {sending ? 'Enviando...' : 'Enviar Mensagem'}
                  </button>
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  )
} 