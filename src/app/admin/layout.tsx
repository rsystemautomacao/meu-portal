'use client';

import { ReactNode } from 'react';
import { Menu } from '@headlessui/react';
import { Cog6ToothIcon, HomeIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  
  // Não mostrar header na página de login
  const isLoginPage = pathname === '/admin/login';
  
  const handleLogout = () => {
    document.cookie = 'adminSession=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'adminEmail=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/admin/login');
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {!isLoginPage && (
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between py-4">
          <div className="flex items-center space-x-4">
            <span className="text-xl font-bold text-gray-900">Painel do Admin</span>
            <Menu as="div" className="relative inline-block text-left">
              <Menu.Button className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Menu
              </Menu.Button>
              <Menu.Items className="origin-top-left absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => router.push('/admin/dashboard')}
                        className={`${active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'} group flex items-center px-4 py-2 text-sm w-full`}
                      >
                        <HomeIcon className="h-5 w-5 mr-2 text-blue-600" />
                        Dashboard
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => router.push('/admin/configuracoes')}
                        className={`${active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'} group flex items-center px-4 py-2 text-sm w-full`}
                      >
                        <Cog6ToothIcon className="h-5 w-5 mr-2 text-blue-600" />
                        Configurações
                      </button>
                    )}
                  </Menu.Item>
                  {/* Adicione outros itens do menu aqui */}
                </div>
              </Menu.Items>
            </Menu>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4" />
            <span>Sair</span>
          </button>
        </div>
      </div>
      )}
      <main className={isLoginPage ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8"}>
        {children}
      </main>
    </div>
  );
} 