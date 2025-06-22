'use client'

import { usePWA } from '@/hooks/usePWA'
import { WifiIcon } from '@heroicons/react/24/outline'

export function OfflineIndicator() {
  const { isOnline } = usePWA()

  if (isOnline) {
    return null
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <div className="flex items-center">
          <WifiIcon className="h-5 w-5 text-yellow-600 mr-2" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-800">
              Modo Offline
            </p>
            <p className="text-xs text-yellow-700">
              Algumas funcionalidades podem estar limitadas
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 