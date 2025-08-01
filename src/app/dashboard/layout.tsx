'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/dashboard/Sidebar'
import NotificationBell from '@/components/NotificationBell'
import { ShieldCheckIcon } from '@heroicons/react/24/outline'

interface TeamColors {
  primaryColor: string
  secondaryColor: string
}

// Função para gerar variações de cores
function generateColorVariations(color: string, prefix: string) {
  const r = parseInt(color.slice(1, 3), 16)
  const g = parseInt(color.slice(3, 5), 16)
  const b = parseInt(color.slice(5, 7), 16)
  
  const variations = {
    50: `rgb(${r + 240}, ${g + 244}, ${b + 249})`,
    100: `rgb(${r + 220}, ${g + 229}, ${b + 241})`,
    200: `rgb(${r + 188}, ${g + 206}, ${b + 228})`,
    300: `rgb(${r + 146}, ${g + 175}, ${b + 209})`,
    400: `rgb(${r + 101}, ${g + 137}, ${b + 188})`,
    500: `rgb(${r + 71}, ${g + 107}, ${b + 163})`,
    600: color,
    700: `rgb(${r - 22}, ${g - 29}, ${b - 77})`,
    800: `rgb(${r - 18}, ${g - 36}, ${b - 62})`,
    900: `rgb(${r - 14}, ${g - 43}, ${b - 47})`,
  }
  
  Object.entries(variations).forEach(([shade, value]) => {
    document.documentElement.style.setProperty(`--team-${prefix}-${shade}`, value)
  })
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const [teamColors, setTeamColors] = useState<TeamColors>({
    primaryColor: '#1a365d',
    secondaryColor: '#2563eb',
  })

  useEffect(() => {
    async function fetchTeamColors() {
      if (session?.user?.id) {
        try {
          const response = await fetch(`/api/teams/colors?userId=${session.user.id}`)
          if (response.ok) {
            const colors = await response.json()
            setTeamColors(colors)
            
            // Gerar variações para as cores primária e secundária
            generateColorVariations(colors.primaryColor, 'primary')
            generateColorVariations(colors.secondaryColor, 'secondary')
            
            // Aplicar as cores como variáveis CSS principais
            document.documentElement.style.setProperty('--team-primary', colors.primaryColor)
            document.documentElement.style.setProperty('--team-secondary', colors.secondaryColor)
            
            // Aplicar as cores como classes Tailwind
            document.documentElement.classList.add('bg-gradient-to-b')
            document.documentElement.classList.add('from-primary/5')
            document.documentElement.classList.add('to-secondary/5')
          }
        } catch (error) {
          console.error('Erro ao buscar cores do time:', error)
        }
      }
    }

    if (status === 'authenticated') {
      fetchTeamColors()
    }
  }, [session?.user?.id, status])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    redirect('/auth/login')
    return null
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-b from-primary/5 to-secondary/5">
      {/* Sidebar */}
      <div className="flex-shrink-0 transition-all duration-300 ease-in-out">
        <Sidebar teamColors={teamColors} />
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {/* Header com notificações */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-2 sm:px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-lg font-semibold text-gray-900">Meu Portal</h1>
              
              {/* Indicador de Admin Universal */}
              {session?.user?.isUniversalAdmin && (
                <div className="bg-indigo-600 text-white px-2 py-1 rounded-md shadow-md text-xs font-medium flex items-center space-x-1 opacity-80 hover:opacity-100 transition-opacity">
                  <ShieldCheckIcon className="h-3 w-3" />
                  <span>Admin</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <NotificationBell />
            </div>
          </div>
        </header>

        <main className="py-2 px-2 sm:py-4 sm:px-4">
          {children}
        </main>
      </div>
    </div>
  )
} 