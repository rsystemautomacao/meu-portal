'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { PhotoIcon, UserCircleIcon, Cog6ToothIcon, ShieldExclamationIcon, ArrowPathIcon, LockClosedIcon } from '@heroicons/react/24/outline'

// Interface para os dados do time e configurações
interface TeamSettings {
  name: string
  primaryColor: string
  secondaryColor: string
  logo?: string
  dueDay: number
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


  useEffect(() => {
    // Lógica para buscar os dados do time da API
    const fetchSettings = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/team-settings')
        if (!response.ok) throw new Error('Falha ao buscar configurações')
        const data = await response.json()
        setSettings({
          name: data.name || '',
          primaryColor: data.primaryColor || '#000000',
          secondaryColor: data.secondaryColor || '#ffffff',
          logo: data.logo || '',
          dueDay: data.monthlyFeeConfig?.dueDay || 10,
        })
        setLogoPreview(data.logo || null)
      } catch (error) {
        toast.error('Não foi possível carregar as configurações do time.')
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      fetchSettings()
    }
  }, [session])
  
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordChange(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    toast.loading('Salvando alterações...')

    try {
      let logoUrl = settings.logo;
      if (logoFile) {
        // Upload da imagem para o Cloudinary
        const formData = new FormData();
        formData.append('file', logoFile);
        formData.append('upload_preset', 'my-uploads'); // Substitua pelo seu upload preset

        const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData,
        });

        if (!uploadResponse.ok) {
            throw new Error('Falha no upload da imagem.');
        }

        const uploadData = await uploadResponse.json();
        logoUrl = uploadData.secure_url;
      }

      const response = await fetch('/api/team-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...settings, logo: logoUrl }),
      })

      if (!response.ok) throw new Error('Falha ao salvar as configurações')
      
      toast.dismiss()
      toast.success('Configurações salvas com sucesso!')
    } catch (error) {
      toast.dismiss()
      toast.error(`Erro ao salvar: ${error instanceof Error ? error.message : String(error)}`)
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validações
    if (passwordChange.newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres')
      return
    }
    
    if (passwordChange.newPassword !== passwordChange.confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }

    setChangingPassword(true)
    toast.loading('Alterando senha...')

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordChange.currentPassword,
          newPassword: passwordChange.newPassword,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Falha ao alterar senha')
      }

      const result = await response.json();
      toast.dismiss()
      toast.success(result.message || 'Senha alterada com sucesso!')
      
      // Limpar formulário
      setPasswordChange({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (error) {
      toast.dismiss()
      toast.error(error instanceof Error ? error.message : 'Ocorreu um erro inesperado')
      console.error(error)
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
      router.push('/auth/login?deleted=true')

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
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Cog6ToothIcon className="h-8 w-8 mr-3 text-indigo-600"/>
                Configurações do Time
            </h1>
            <p className="mt-2 text-sm text-gray-500">
                Gerencie as informações, aparência e outras configurações do seu time.
            </p>
        </div>

        <form onSubmit={handleSave} className="space-y-8 bg-white p-8 rounded-lg shadow-md">
          {/* Informações Gerais */}
          <div className="border-b border-gray-900/10 pb-8">
            <h2 className="text-base font-semibold leading-7 text-gray-900">Informações Gerais</h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">Atualize o nome e o logo do seu time.</p>
            <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
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
          </div>

          {/* Aparência */}
          <div className="border-b border-gray-900/10 pb-8">
            <h2 className="text-base font-semibold leading-7 text-gray-900">Aparência</h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">Personalize as cores do seu time.</p>
            <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
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
          </div>
          
          {/* Configurações Financeiras */}
          <div className="border-b border-gray-900/10 pb-8">
            <h2 className="text-base font-semibold leading-7 text-gray-900">Financeiro</h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">Defina o dia de vencimento das mensalidades.</p>
            <div className="mt-6">
                 <label htmlFor="dueDay" className="block text-sm font-medium leading-6 text-gray-900">Dia do Vencimento</label>
                <input
                    type="number"
                    name="dueDay"
                    id="dueDay"
                    value={settings.dueDay}
                    onChange={(e) => setSettings({ ...settings, dueDay: parseInt(e.target.value, 10) })}
                    className="mt-2 block w-full max-w-xs rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                    min="1"
                    max="28"
                />
            </div>
          </div>
          

          <div className="mt-6 flex items-center justify-end gap-x-6">
            <button type="button" className="text-sm font-semibold leading-6 text-gray-900">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-indigo-400 flex items-center"
            >
              {saving && <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />}
              Salvar Alterações
            </button>
          </div>
        </form>

        {/* Alteração de Senha */}
        <div className="mt-8 bg-white p-8 rounded-lg shadow-md">
          <div className="border-b border-gray-900/10 pb-6">
            <h2 className="text-base font-semibold leading-7 text-gray-900 flex items-center">
              <LockClosedIcon className="h-5 w-5 mr-2 text-indigo-600"/>
              Alterar Senha
            </h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              Atualize sua senha de acesso ao sistema.
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-6">
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
        <div className="mt-8">
            <h2 className="text-lg font-semibold text-red-600">Zona de Perigo</h2>
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-6">
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