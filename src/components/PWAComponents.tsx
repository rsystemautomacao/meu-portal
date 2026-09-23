'use client'

import dynamic from 'next/dynamic'

// Componentes PWA só no navegador. No Next 15, `ssr: false` precisa ficar num
// Client Component, por isso eles saíram do layout raiz (Server Component).
const PWAInstallPrompt = dynamic(() => import('@/components/PWAInstallPrompt'), {
  ssr: false,
  loading: () => null,
})

const OfflineIndicator = dynamic(() => import('@/components/OfflineIndicator').then(mod => ({ default: mod.OfflineIndicator })), {
  ssr: false,
  loading: () => null,
})

const ServiceWorkerRegister = dynamic(() => import('@/components/ServiceWorkerRegister'), {
  ssr: false,
  loading: () => null,
})

export function PWAServiceWorker() {
  return <ServiceWorkerRegister />
}

export function PWAOverlays() {
  return (
    <>
      <PWAInstallPrompt />
      <OfflineIndicator />
    </>
  )
}
