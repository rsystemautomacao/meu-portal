'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Verificar se está em modo standalone (instalado)
    const checkStandalone = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone === true
      setIsStandalone(standalone)
      setIsInstalled(standalone)
    }

    // Verificar conectividade
    const checkOnline = () => {
      setIsOnline(navigator.onLine)
    }

    // Capturar evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    // Capturar evento appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    // Event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    window.addEventListener('online', checkOnline)
    window.addEventListener('offline', checkOnline)

    // Verificações iniciais
    checkStandalone()
    checkOnline()

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('online', checkOnline)
      window.removeEventListener('offline', checkOnline)
    }
  }, [])

  const installApp = async () => {
    if (!deferredPrompt) return false

    try {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('Usuário aceitou a instalação do PWA')
        setDeferredPrompt(null)
        return true
      } else {
        console.log('Usuário rejeitou a instalação do PWA')
        return false
      }
    } catch (error) {
      console.error('Erro ao instalar PWA:', error)
      return false
    }
  }

  const canInstall = !isInstalled && !isStandalone && deferredPrompt !== null

  return {
    canInstall,
    isInstalled,
    isStandalone,
    isOnline,
    installApp,
  }
} 