"use client"
import { useEffect } from 'react'

export default function ServiceWorkerRegister() {
  useEffect(() => {
    // Versões anteriores do service worker guardavam respostas de /api/* no cache "apis";
    // remove o que ficou salvo nos aparelhos.
    if (typeof window !== 'undefined' && 'caches' in window) {
      caches.delete('apis').catch(() => {})
    }

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.warn('Service Worker registration failed:', err)
        })
      })
    }
  }, [])
  return null
}
