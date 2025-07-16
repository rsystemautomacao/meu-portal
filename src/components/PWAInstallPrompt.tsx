'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Verificar se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone === true) {
      setIsInstalled(true)
      return
    }

    // Verificar se foi dispensado
    const dismissedStorage = localStorage.getItem('pwa-install-dismissed')
    if (dismissedStorage) {
      setDismissed(true)
      return
    }

    // Mostrar prompt após 3 segundos se não foi dispensado
    const timer = setTimeout(() => {
      if (!isInstalled && !dismissed) {
        setShowInstallPrompt(true)
      }
    }, 3000)

    // Escutar o evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallPrompt(true)
    }

    // Escutar o evento appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [isInstalled, dismissed])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setIsInstalled(true)
      setShowInstallPrompt(false)
    }

    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    setDeferredPrompt(null)
    setDismissed(true)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  const handleManualInstall = () => {
    console.log('Botão "Como Instalar" clicado')
    
    // Verificar se estamos em um dispositivo móvel
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    
    if (isMobile) {
      // Instruções específicas para mobile
      const instructions = `
Para instalar o app no seu celular:

📱 Android (Chrome):
1. Toque no menu do navegador (⋮)
2. Selecione "Adicionar à tela inicial"
3. Toque em "Adicionar"

📱 iPhone (Safari):
1. Toque no botão de compartilhar (□↑)
2. Selecione "Adicionar à Tela Inicial"
3. Toque em "Adicionar"

O app aparecerá na sua tela inicial como um ícone!
      `
      alert(instructions)
    } else {
      // Instruções para desktop
      const instructions = `
Para instalar o app no seu computador:

🖥️ Chrome/Edge:
1. Clique no ícone de instalação (⬇️) na barra de endereços
2. Ou pressione Ctrl+Shift+I e clique em "Install"

🖥️ Firefox:
1. Clique no ícone de instalação na barra de endereços
2. Ou vá em Menu > Aplicações Web > Instalar

O app será instalado como um programa normal!
      `
      alert(instructions)
    }
    
    // Marcar como dispensado após mostrar as instruções
    setDismissed(true)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  console.log('PWAInstallPrompt render:', { isInstalled, showInstallPrompt, dismissed, deferredPrompt: !!deferredPrompt })
  
  if (isInstalled || !showInstallPrompt || dismissed) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50" style={{ pointerEvents: 'auto' }}>
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-2xl p-4 border border-blue-200" style={{ pointerEvents: 'auto' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white bg-opacity-20 rounded-lg p-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-lg">Instalar Meu Portal</h3>
              <p className="text-blue-100 text-sm">
                Instale o app para acesso rápido e offline
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                console.log('Botão clicado:', e.target)
                console.log('Evento:', e)
                e.preventDefault()
                e.stopPropagation()
                if (deferredPrompt) {
                  handleInstallClick()
                } else {
                  handleManualInstall()
                }
              }}
              onTouchStart={(e) => {
                console.log('Touch start:', e)
              }}
              onTouchEnd={(e) => {
                console.log('Touch end:', e)
              }}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors cursor-pointer select-none touch-manipulation"
              style={{ 
                userSelect: 'none', 
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              {deferredPrompt ? 'Instalar' : 'Como Instalar'}
            </button>
            <button
              onClick={handleDismiss}
              className="text-blue-100 hover:text-white transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 