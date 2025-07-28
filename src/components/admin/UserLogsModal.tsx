'use client'

import { useState, useEffect } from 'react'
import { Dialog } from '@headlessui/react'
import { XMarkIcon, ClockIcon, UserIcon } from '@heroicons/react/24/outline'

interface UserLog {
  id: string
  action: string
  type: 'automatic' | 'manual'
  details?: string
  createdAt: string
  team: {
    name: string
  }
}

interface UserLogsModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  userName: string
}

export default function UserLogsModal({ isOpen, onClose, userId, userName }: UserLogsModalProps) {
  const [logs, setLogs] = useState<UserLog[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && userId) {
      fetchLogs()
    }
  }, [isOpen, userId])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}/logs`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data)
      } else {
        console.error('Erro ao buscar logs:', response.status)
      }
    } catch (error) {
      console.error('Erro ao buscar logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'payment_reminder_sent': 'Lembrete de Pagamento Enviado',
      'access_blocked': 'Acesso Bloqueado',
      'welcome_message_sent': 'Mensagem de Boas-vindas Enviada',
      'payment_overdue': 'Pagamento em Atraso',
      'manual_message_sent': 'Mensagem Manual Enviada',
      'access_unblocked': 'Acesso Desbloqueado',
      'payment_received': 'Pagamento Recebido',
      'system_notification': 'Notificação do Sistema',
      'team_created': 'Time Criado',
      'last_access': 'Último Acesso',
      'transaction_created': 'Transação Criada',
      'match_created': 'Partida Criada',
      'admin_block': 'Bloqueio Manual (Admin)',
      'admin_unblock': 'Desbloqueio Manual (Admin)',
      'admin_pause': 'Pausa Manual (Admin)',
      'admin_activate': 'Ativação Manual (Admin)',
      'admin_reset_password': 'Reset de Senha (Admin)',
      'admin_message': 'Mensagem Manual (Admin)'
    }
    return labels[action] || action
  }

  const getTypeColor = (type: string) => {
    return type === 'automatic' 
      ? 'bg-blue-100 text-blue-800 border-blue-200' 
      : 'bg-green-100 text-green-800 border-green-200'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-4xl w-full bg-white rounded-lg shadow-xl">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <UserIcon className="h-6 w-6 text-gray-600" />
              <div>
                <Dialog.Title className="text-lg font-semibold text-gray-900">
                  Logs de Atividade
                </Dialog.Title>
                <p className="text-sm text-gray-500">
                  {userName}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ClockIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhum log encontrado</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {logs.map((log) => (
                  <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-medium text-gray-900">
                            {getActionLabel(log.action)}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getTypeColor(log.type)}`}>
                            {log.type === 'automatic' ? 'Automático' : 'Manual'}
                          </span>
                        </div>
                        
                        {log.details && (
                          <p className="text-sm text-gray-600 mb-2">
                            {log.details}
                          </p>
                        )}
                        
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <ClockIcon className="h-4 w-4" />
                          <span>{formatDate(log.createdAt)}</span>
                          <span>•</span>
                          <span>Time: {log.team.name}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Fechar
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
} 