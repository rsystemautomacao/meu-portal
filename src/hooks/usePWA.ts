'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'

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

  // Memoizar verificações para evitar recálculos
  const checkStandalone = useCallback(() => {
    return window.matchMedia('(display-mode: standalone)').matches || 
           (window.navigator as any).standalone === true
  }, [])

  const checkOnline = useCallback(() => {
    return navigator.onLine
  }, [])

  useEffect(() => {
    // Verificar se está em modo standalone (instalado)
    const updateStandalone = () => {
      const standalone = checkStandalone()
      setIsStandalone(standalone)
      setIsInstalled(standalone)
    }

    // Verificar conectividade
    const updateOnline = () => {
      setIsOnline(checkOnline())
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
    window.addEventListener('online', updateOnline)
    window.addEventListener('offline', updateOnline)

    // Verificações iniciais
    updateStandalone()
    updateOnline()

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('online', updateOnline)
      window.removeEventListener('offline', updateOnline)
    }
  }, [checkStandalone, checkOnline])

  const installApp = useCallback(async () => {
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
  }, [deferredPrompt])

  // Memoizar canInstall para evitar recálculos
  const canInstall = useMemo(() => {
    return !isInstalled && !isStandalone && deferredPrompt !== null
  }, [isInstalled, isStandalone, deferredPrompt])

  return {
    canInstall,
    isInstalled,
    isStandalone,
    isOnline,
    installApp,
  }
} 