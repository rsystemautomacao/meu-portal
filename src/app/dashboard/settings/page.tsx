'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { 
  PhotoIcon, 
  UserCircleIcon, 
  Cog6ToothIcon, 
  ShieldExclamationIcon, 
  ArrowPathIcon, 
  LockClosedIcon,
  UserGroupIcon,
  SwatchIcon,
  CreditCardIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import HistoricalDebts from '@/components/financial/HistoricalDebts'
import SharedReportsConfig from '@/components/financial/SharedReportsConfig'
import { signOut } from 'next-auth/react'

// Interface para os dados do time e configurações
interface TeamSettings {
  name: string
  primaryColor: string
  secondaryColor: string
  logo?: string
  dueDay: number
  whatsapp: string
}

// Interface para alteração de senha
interface PasswordChange {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

// Componente para o modal de confirmação
const ConfirmationModal = ({ isOpen, onClose, onConfirm, isLoading }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, isLoading: boolean }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-75">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="flex items-center mb-4">
          <ShieldExclamationIcon className="h-8 w-8 text-red-500 mr-3"/>
          <h2 className="text-xl font-bold text-gray-900">Confirmar Exclusão</h2>
        </div>
        <p className="text-gray-600 mb-6">
          Você tem certeza absoluta que deseja excluir seu time? Esta ação é <strong>irreversível</strong>. Todos os dados, incluindo jogadores, partidas e informações financeiras, serão permanentemente apagados.
        </p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 flex items-center"
          >
            {isLoading && <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />}
            Sim, excluir time
          </button>
        </div>
      </div>
    </div>
  )
}


export default function SettingsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [settings, setSettings] = useState<TeamSettings>({
    name: '',
    primaryColor: '#000000',
    secondaryColor: '#ffffff',
    logo: '',
    dueDay: 10,
    whatsapp: '',
  })
  const [passwordChange, setPasswordChange] = useState<PasswordChange>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [paused, setPaused] = useState(false)

  // Função para formatar WhatsApp
  const formatWhatsApp = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '')
    
    // Aplica formatação
    if (numbers.length <= 2) {
      return numbers
    } else if (numbers.length <= 6) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
    } else if (numbers.length <= 10) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
    }
  }

  // Função para salvar informações gerais
  const handleSaveGeneral = async () => {
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('name', settings.name)
      formData.append('whatsapp', settings.whatsapp)
      
      if (logoFile) {
        formData.append('logo', logoFile)
      }

      const response = await fetch('/api/team-settings', {
        method: 'PUT',
        body: formData,
      })

      if (!response.ok) throw new Error('Falha ao salvar configurações')

      toast.success('Informações gerais salvas com sucesso!')
      setLogoFile(null)
    } catch (error) {
      console.error('Erro ao salvar informações gerais:', error)
      toast.error('Erro ao salvar informações gerais')
    } finally {
      setSaving(false)
    }
  }

  // Função para salvar aparência
  const handleSaveAppearance = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/team-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryColor: settings.primaryColor,
          secondaryColor: settings.secondaryColor
        })
      })

      if (!response.ok) throw new Error('Falha ao salvar aparência')

      toast.success('Aparência salva com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar aparência:', error)
      toast.error('Erro ao salvar aparência')
    } finally {
      setSaving(false)
    }
  }

  // Função para salvar configurações financeiras
  const handleSaveFinancial = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/team-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dueDay: settings.dueDay
        })
      })

      if (!response.ok) throw new Error('Falha ao salvar configurações financeiras')

      toast.success('Configurações financeiras salvas com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar configurações financeiras:', error)
      toast.error('Erro ao salvar configurações financeiras')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    // Lógica para buscar os dados do time da API
    const fetchSettings = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/team-settings')
        if (!response.ok) throw new Error('Falha ao buscar configurações')
        const data = await response.json()
        if (data.status === 'BLOCKED') {
          await fetch('/api/auth/logout')
          router.push('/auth/login?blocked=1')
          return
        }
        setSettings({
          name: data.name || '',
          primaryColor: data.primaryColor || '#000000',
          secondaryColor: data.secondaryColor || '#ffffff',
          logo: data.logo || '',
          dueDay: data.dueDay || 10,
          whatsapp: data.whatsapp || '',
        })
        setPaused(data.status === 'PAUSED')
        if (data.logo) {
          setLogoPreview(data.logo)
        }
      } catch (error) {
        console.error('Erro ao buscar configurações:', error)
        toast.error('Erro ao carregar configurações')
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      fetchSettings()
    }
  }, [session, router])
  
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordChange(prev => ({ ...prev, [name]: value }))
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordChange.newPassword !== passwordChange.confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }

    if (passwordChange.newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres')
      return
    }

    setChangingPassword(true)

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordChange.currentPassword,
          newPassword: passwordChange.newPassword,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao alterar senha')
      }

      toast.success('Senha alterada com sucesso!')
      setPasswordChange({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (error) {
      console.error('Erro ao alterar senha:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao alterar senha')
    } finally {
      setChangingPassword(false)
    }
  }

  const handleDeleteTeam = async () => {
    setDeleting(true)
    toast.loading('Excluindo time...')

    try {
      const response = await fetch('/api/team-settings', {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Falha ao excluir o time')

      toast.dismiss()
      toast.success('Time excluído com sucesso. Você será redirecionado.', {
          duration: 4000
      })
      // Forçar o signOut para limpar a sessão e redirecionar
      await signOut({ callbackUrl: '/auth/login?deleted=true' })
      // router.push('/auth/login?deleted=true') // não precisa mais

    } catch (error) {
      toast.dismiss()
      toast.error('Não foi possível excluir o time.')
      console.error(error)
    } finally {
      setDeleting(false)
      setIsModalOpen(false)
    }
  }

  if (loading) {
    return <div className="p-8">Carregando configurações...</div>
  }

  return (
    <>
      <div className="w-full p-2 sm:p-4 lg:p-6">
        <div className="mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
                <Cog6ToothIcon className="h-6 w-6 sm:h-8 sm:w-8 mr-2 sm:mr-3 text-indigo-600"/>
                Configurações do Time
            </h1>
            <p className="mt-2 text-sm text-gray-500">
                Gerencie as informações, aparência e outras configurações do seu time.
            </p>
        </div>

        {/* Banner de aviso para PAUSED */}
        {paused && (
          <div className="w-full bg-yellow-100 border-b border-yellow-300 text-yellow-900 text-center py-2 font-semibold mb-4">
            Seu time está <span className="font-bold">pausado</span>. Não serão geradas novas mensalidades até reativação.
          </div>
        )}

        {/* Débitos Históricos - PRIMEIRA SEÇÃO */}
        <HistoricalDebts onDebtsChange={() => {}} />

        {/* Relatórios Compartilháveis */}
        <SharedReportsConfig />

        {/* Informações Gerais */}
        <div className="mt-8 bg-gradient-to-br from-white to-gray-50 p-8 rounded-xl shadow-lg border border-gray-200">
          <div className="border-b border-gray-200 pb-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center mb-2">
              <UserGroupIcon className="h-6 w-6 mr-3 text-indigo-600"/>
              Informações Gerais
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Atualize o nome e o logo do seu time para personalizar sua experiência.
            </p>
          </div>

                     <div className="space-y-6">
            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
              <div className="sm:col-span-4">
                <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">Nome do Time</label>
                <div className="mt-2">
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={settings.name}
                    onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>
              <div className="sm:col-span-4">
                <label htmlFor="whatsapp" className="block text-sm font-medium leading-6 text-gray-900">WhatsApp</label>
                <div className="mt-2">
                  <input
                    type="text"
                    name="whatsapp"
                    id="whatsapp"
                    value={settings.whatsapp}
                    onChange={(e) => setSettings({ ...settings, whatsapp: formatWhatsApp(e.target.value) })}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
              <div className="col-span-full">
                <label htmlFor="logo" className="block text-sm font-medium leading-6 text-gray-900">Logo do Time</label>
                <div className="mt-2 flex items-center gap-x-3">
                    {logoPreview ? (
                        <img src={logoPreview} alt="Logo preview" className="h-16 w-16 rounded-full object-cover" />
                    ) : (
                        <UserCircleIcon className="h-16 w-16 text-gray-300" aria-hidden="true" />
                    )}
                  <input type="file" id="logo-upload" className="hidden" onChange={handleLogoChange} accept="image/*" />
                  <label htmlFor="logo-upload" className="cursor-pointer rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                    Alterar
                  </label>
                </div>
              </div>
            </div>

                         <div className="flex items-center justify-end gap-x-6">
               <button type="button" className="text-sm font-semibold leading-6 text-gray-900">
                 Cancelar
               </button>
               <button
                 onClick={handleSaveGeneral}
                 disabled={saving}
                 className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-indigo-400 flex items-center"
               >
                 {saving && <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />}
                 Salvar Informações Gerais
               </button>
              </div>
            </div>
          </div>

          {/* Aparência */}
        <div className="mt-8 bg-gradient-to-br from-white to-gray-50 p-8 rounded-xl shadow-lg border border-gray-200">
          <div className="border-b border-gray-200 pb-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center mb-2">
              <SwatchIcon className="h-6 w-6 mr-3 text-indigo-600"/>
              Aparência
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Personalize as cores do seu time para criar uma identidade visual única.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="primaryColor" className="block text-sm font-medium leading-6 text-gray-900">Cor Primária</label>
                <div className="mt-2 flex items-center gap-x-2">
                  <input
                    type="color"
                    name="primaryColor"
                    id="primaryColor"
                    value={settings.primaryColor}
                    onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                    className="h-10 w-10 p-1 block border-gray-300 rounded-md"
                  />
                   <span className="text-gray-700">{settings.primaryColor}</span>
                </div>
              </div>
              <div className="sm:col-span-3">
                <label htmlFor="secondaryColor" className="block text-sm font-medium leading-6 text-gray-900">Cor Secundária</label>
                <div className="mt-2 flex items-center gap-x-2">
                  <input
                    type="color"
                    name="secondaryColor"
                    id="secondaryColor"
                    value={settings.secondaryColor}
                    onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                    className="h-10 w-10 p-1 block border-gray-300 rounded-md"
                  />
                  <span className="text-gray-700">{settings.secondaryColor}</span>
                </div>
              </div>
            </div>
          <div className="flex items-center justify-end gap-x-6 mt-6">
            <button type="button" className="text-sm font-semibold leading-6 text-gray-900">
              Cancelar
            </button>
            <button
              onClick={handleSaveAppearance}
              disabled={saving}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-indigo-400 flex items-center"
            >
              {saving && <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />}
              Salvar Aparência
            </button>
          </div>
          </div>
          
          {/* Configurações Financeiras */}
        <div className="mt-8 bg-gradient-to-br from-white to-gray-50 p-8 rounded-xl shadow-lg border border-gray-200">
          <div className="border-b border-gray-200 pb-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center mb-2">
              <CreditCardIcon className="h-6 w-6 mr-3 text-indigo-600"/>
              Financeiro
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Defina o dia de vencimento das mensalidades para organizar melhor seus pagamentos.
            </p>
          </div>

          <div>
                 <label htmlFor="dueDay" className="block text-sm font-medium leading-6 text-gray-900">Dia do Vencimento</label>
                <input
                    type="number"
                    name="dueDay"
                    id="dueDay"
                    value={settings.dueDay}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10)
                  if (value >= 1 && value <= 31) {
                    setSettings({ ...settings, dueDay: value })
                  }
                }}
                    className="mt-2 block w-full max-w-xs rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                    min="1"
                max="31"
                />
          </div>
          <div className="flex items-center justify-end gap-x-6 mt-6">
            <button type="button" className="text-sm font-semibold leading-6 text-gray-900">
              Cancelar
            </button>
            <button
              onClick={handleSaveFinancial}
              disabled={saving}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-indigo-400 flex items-center"
            >
              {saving && <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />}
              Salvar Financeiro
            </button>
          </div>
        </div>

        {/* Alteração de Senha */}
        <div className="mt-8 bg-gradient-to-br from-white to-gray-50 p-8 rounded-xl shadow-lg border border-gray-200">
          <div className="border-b border-gray-200 pb-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center mb-2">
              <LockClosedIcon className="h-6 w-6 mr-3 text-indigo-600"/>
              Alterar Senha
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Atualize sua senha de acesso ao sistema para manter sua conta segura.
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="currentPassword" className="block text-sm font-medium leading-6 text-gray-900">
                  Senha Atual
                </label>
                <div className="mt-2">
                  <input
                    type="password"
                    name="currentPassword"
                    id="currentPassword"
                    value={passwordChange.currentPassword}
                    onChange={handlePasswordChange}
                    required
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium leading-6 text-gray-900">
                  Nova Senha
                </label>
                <div className="mt-2">
                  <input
                    type="password"
                    name="newPassword"
                    id="newPassword"
                    value={passwordChange.newPassword}
                    onChange={handlePasswordChange}
                    required
                    minLength={6}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Mínimo 6 caracteres</p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium leading-6 text-gray-900">
                  Confirmar Nova Senha
                </label>
                <div className="mt-2">
                  <input
                    type="password"
                    name="confirmPassword"
                    id="confirmPassword"
                    value={passwordChange.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={changingPassword}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-indigo-400 flex items-center"
              >
                {changingPassword && <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />}
                Alterar Senha
              </button>
            </div>
          </form>
        </div>

        {/* Zona de Perigo */}
        <div className="mt-8 bg-gradient-to-br from-red-50 to-red-100 p-8 rounded-xl shadow-lg border border-red-200">
          <div className="border-b border-red-200 pb-6 mb-6">
            <h2 className="text-2xl font-bold text-red-900 flex items-center mb-2">
              <ExclamationTriangleIcon className="h-6 w-6 mr-3 text-red-600"/>
              Zona de Perigo
            </h2>
            <p className="text-red-700 leading-relaxed">
              Ações irreversíveis que podem resultar na perda permanente de dados.
            </p>
          </div>

          <div className="bg-white border border-red-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-gray-800">Excluir Time</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            A exclusão do time é permanente e não pode ser desfeita.
                        </p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
                    >
                        Excluir este time
                    </button>
                </div>
            </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleDeleteTeam}
        isLoading={deleting}
      />
    </>
  )
} 