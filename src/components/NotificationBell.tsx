'use client'

import { useState, useEffect } from 'react'
import { BellIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Buscar notificações
  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications')
      if (!response.ok) {
        throw new Error('Erro ao buscar notificações')
      }
      const data = await response.json()
      setNotifications(data)
    } catch (error) {
      console.error('Erro ao buscar notificações:', error)
    }
  }

  // Marcar notificação como lida
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationId })
      })

      if (!response.ok) {
        throw new Error('Erro ao marcar notificação como lida')
      }

      // Atualizar lista de notificações
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      )
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error)
      toast.error('Erro ao marcar notificação como lida')
    }
  }

  // Buscar notificações ao montar componente
  useEffect(() => {
    fetchNotifications()
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  // Contar notificações não lidas
  const unreadCount = notifications.filter(n => !n.isRead).length

  // Formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      return 'Agora'
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h atrás`
    } else {
      return date.toLocaleDateString('pt-BR')
    }
  }

  // Obter ícone baseado no tipo
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'payment_reminder':
        return '💰'
      case 'payment_overdue':
        return '⚠️'
      case 'access_blocked':
        return '🔒'
      default:
        return '📢'
    }
  }

  return (
    <div className="relative">
      {/* Botão do sino */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
      >
        <BellIcon className="h-6 w-6" />
        
        {/* Badge de notificações não lidas */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown de notificações */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Notificações
              {unreadCount > 0 && (
                <span className="ml-2 text-sm text-gray-500">
                  ({unreadCount} não lida{unreadCount > 1 ? 's' : ''})
                </span>
              )}
            </h3>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <p>Nenhuma notificação</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 text-2xl">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium ${
                            !notification.isRead ? 'text-gray-900' : 'text-gray-600'
                          }`}>
                            {notification.title}
                          </p>
                          <span className="text-xs text-gray-400">
                            {formatDate(notification.createdAt)}
                          </span>
                        </div>
                        <p className={`text-sm mt-1 ${
                          !notification.isRead ? 'text-gray-700' : 'text-gray-500'
                        }`}>
                          {notification.message.split('\n').map((line, index) => {
                            // Verificar se a linha contém uma URL
                            const urlRegex = /(https?:\/\/[^\s]+)/g
                            const parts = line.split(urlRegex)
                            
                            return (
                              <span key={index}>
                                {parts.map((part, partIndex) => {
                                  if (urlRegex.test(part)) {
                                    return (
                                      <a
                                        key={partIndex}
                                        href={part}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 underline break-all"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {part}
                                      </a>
                                    )
                                  }
                                  return part
                                })}
                                {index < notification.message.split('\n').length - 1 && <br />}
                              </span>
                            )
                          })}
                        </p>
                        {!notification.isRead && (
                          <div className="mt-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Nova
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200">
              <button
                onClick={() => {
                  // Marcar todas como lidas
                  notifications.forEach(notif => {
                    if (!notif.isRead) {
                      markAsRead(notif.id)
                    }
                  })
                }}
                className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Marcar todas como lidas
              </button>
            </div>
          )}
        </div>
      )}

      {/* Overlay para fechar ao clicar fora */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
} 