'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { 
  HomeIcon, 
  UsersIcon, 
  CalendarIcon, 
  ChartBarIcon,
  BanknotesIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'
import { signOut } from 'next-auth/react'

const menuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Jogadores', href: '/dashboard/players', icon: UsersIcon },
  { name: 'Partidas', href: '/dashboard/matches', icon: CalendarIcon },
  // { name: 'Estatísticas', href: '/dashboard/stats', icon: ChartBarIcon }, // Página a ser implementada
  { name: 'Financeiro', href: '/dashboard/financial', icon: BanknotesIcon },
  { name: 'Configurações', href: '/dashboard/settings', icon: Cog6ToothIcon },
]

interface SidebarProps {
  teamColors: {
    primaryColor: string;
    secondaryColor: string;
  }
}

export default function Sidebar({ teamColors }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded)
  }

  const handleLogout = async () => {
    try {
      const data = await signOut({ 
        redirect: false,
        callbackUrl: '/' 
      })
      window.location.href = '/'
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      window.location.href = '/'
    }
  }

  // Sidebar para mobile (drawer)
  return (
    <>
      {/* Botão para abrir menu no mobile */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-primary text-white p-2 rounded-full shadow-lg focus:outline-none"
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menu"
        style={{ backgroundColor: teamColors.primaryColor }}
      >
        <Bars3Icon className="h-7 w-7" />
      </button>

      {/* Drawer mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Fundo escuro */}
          <div className="fixed inset-0 bg-black bg-opacity-40" onClick={() => setMobileOpen(false)} />
          {/* Menu drawer */}
          <div className="relative w-4/5 max-w-xs bg-primary h-full flex flex-col p-4" style={{ backgroundColor: teamColors.primaryColor }}>
            <button
              onClick={() => setMobileOpen(false)}
              className="self-end mb-4 text-white"
              aria-label="Fechar menu"
            >
              <XMarkIcon className="h-7 w-7" />
            </button>
            <nav className="flex-1 space-y-2">
              {menuItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center px-3 py-3 text-base font-semibold rounded-lg transition-all duration-200 ${isActive ? 'bg-secondary text-white' : 'text-white hover:bg-secondary/80'}`}
                    style={{ backgroundColor: isActive ? teamColors.secondaryColor : 'transparent' }}
                  >
                    <item.icon className="h-6 w-6 mr-3" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
            <button
              onClick={() => { setShowLogoutConfirm(true); setMobileOpen(false); }}
              className="mt-6 flex items-center px-3 py-3 text-base font-semibold rounded-lg text-white hover:bg-red-600 transition-all"
            >
              <ArrowRightOnRectangleIcon className="h-6 w-6 mr-3" />
              Sair
            </button>
          </div>
        </div>
      )}

      {/* Sidebar desktop/tablet */}
      <div className={`hidden md:flex flex-col h-screen transition-all duration-300 ease-in-out ${isExpanded ? 'w-64' : 'w-16'}`} style={{ backgroundColor: teamColors.primaryColor }}>
        {/* Botão de Toggle */}
        <button
          onClick={toggleSidebar}
          className="p-3 hover:bg-opacity-75 text-white self-end"
        >
          {isExpanded ? (
            <XMarkIcon className="h-6 w-6" />
          ) : (
            <Bars3Icon className="h-6 w-6" />
          )}
        </button>
        {/* Menu principal */}
        <nav className="flex-none px-2 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-300 ease-in-out ${isActive ? 'bg-opacity-90 text-white' : 'text-white hover:bg-opacity-75'}`}
                style={{ backgroundColor: isActive ? teamColors.secondaryColor : 'transparent' }}
              >
                <item.icon className="flex-shrink-0 h-6 w-6 text-white" aria-hidden="true" />
                {isExpanded && (
                  <span className="ml-3 transition-opacity duration-300">{item.name}</span>
                )}
              </Link>
            )
          })}
        </nav>
        {/* Botão de Logout */}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className={`w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-300 ease-in-out text-white hover:bg-opacity-75`}
        >
          <ArrowRightOnRectangleIcon className="flex-shrink-0 h-6 w-6 text-white" aria-hidden="true" />
          {isExpanded && (
            <span className="ml-3 transition-opacity duration-300">Sair</span>
          )}
        </button>
      </div>

      {/* Modal de Confirmação de Logout */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirmar Saída</h3>
            <p className="text-sm text-gray-500 mb-6">Tem certeza que deseja sair do sistema?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancelar
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 