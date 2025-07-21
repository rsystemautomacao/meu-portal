'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RegisterForm() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const formData = new FormData(e.currentTarget)
      const email = formData.get('email') as string
      const password = formData.get('password') as string
      const confirmPassword = formData.get('confirmPassword') as string
      const teamName = formData.get('teamName') as string
      const whatsapp = formData.get('whatsapp') as string
      const primaryColor = formData.get('primaryColor') as string
      const secondaryColor = formData.get('secondaryColor') as string

      if (password !== confirmPassword) {
        setError('As senhas não coincidem')
        return
      }

      let logoUrl = null
      if (logoFile) {
        const uploadFormData = new FormData()
        uploadFormData.append('file', logoFile)
        
        try {
          console.log('Tentando fazer upload da logo...')
          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: uploadFormData,
          })

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json()
            throw new Error(errorData.message || 'Erro ao fazer upload da logo')
          }

          const uploadResult = await uploadResponse.json()
          logoUrl = uploadResult.secure_url
          console.log('Logo enviada com sucesso:', logoUrl)
        } catch (uploadError) {
          console.error('Erro no upload da logo:', uploadError)
          throw new Error('Erro ao fazer upload da logo')
        }
      }

      console.log('Tentando registrar usuário...')
      // Registrar usuário
      const registerResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          team: {
            name: teamName,
            whatsapp,
            primaryColor,
            secondaryColor,
            logo: logoUrl
          },
        }),
      })

      const responseData = await registerResponse.json()
      console.log('Resposta do registro:', responseData)

      if (!registerResponse.ok) {
        throw new Error(responseData.message || 'Erro ao criar conta')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/auth/login?registered=true')
      }, 2000)
    } catch (error) {
      console.error('Erro no registro:', error)
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('Ocorreu um erro ao criar sua conta')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-2xl bg-gradient-to-r from-red-50 to-red-100 p-6 border border-red-200 shadow-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="bg-red-500 p-2 rounded-full">
                <svg
                  className="h-5 w-5 text-white"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-bold text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="rounded-2xl bg-gradient-to-r from-green-50 to-green-100 p-6 border border-green-200 shadow-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="bg-green-500 p-2 rounded-full">
                <svg
                  className="h-5 w-5 text-white"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-bold text-green-800">
                Conta criada com sucesso! Redirecionando para o login...
              </h3>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <label
          htmlFor="email"
          className="block text-sm font-bold leading-6 text-gray-900"
        >
          Email
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
          </div>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="block w-full rounded-2xl border-0 py-4 pl-12 pr-4 text-gray-900 shadow-lg ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 sm:text-sm sm:leading-6 bg-white/80 backdrop-blur-sm"
            placeholder="seu@email.com"
          />
        </div>
      </div>

      <div className="space-y-3">
        <label
          htmlFor="password"
          className="block text-sm font-bold leading-6 text-gray-900"
        >
          Senha
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            className="block w-full rounded-2xl border-0 py-4 pl-12 pr-4 text-gray-900 shadow-lg ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 sm:text-sm sm:leading-6 bg-white/80 backdrop-blur-sm"
          />
        </div>
      </div>

      <div className="space-y-3">
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-bold leading-6 text-gray-900"
        >
          Confirmar Senha
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            className="block w-full rounded-2xl border-0 py-4 pl-12 pr-4 text-gray-900 shadow-lg ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 sm:text-sm sm:leading-6 bg-white/80 backdrop-blur-sm"
          />
        </div>
      </div>

      <div className="space-y-3">
        <label
          htmlFor="teamName"
          className="block text-sm font-bold leading-6 text-gray-900"
        >
          Nome do Time
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <input
            id="teamName"
            name="teamName"
            type="text"
            required
            className="block w-full rounded-2xl border-0 py-4 pl-12 pr-4 text-gray-900 shadow-lg ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 sm:text-sm sm:leading-6 bg-white/80 backdrop-blur-sm"
            placeholder="Ex: Real Madrid"
          />
        </div>
      </div>

      <div className="space-y-3">
        <label
          htmlFor="whatsapp"
          className="block text-sm font-bold leading-6 text-gray-900"
        >
          WhatsApp para Contato
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <input
            id="whatsapp"
            name="whatsapp"
            type="tel"
            required
            className="block w-full rounded-2xl border-0 py-4 pl-12 pr-4 text-gray-900 shadow-lg ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 sm:text-sm sm:leading-6 bg-white/80 backdrop-blur-sm"
            placeholder="(11) 99999-9999"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="logo"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          Logo do Time
        </label>
        <div className="mt-2 flex items-center gap-x-3">
          {logoPreview ? (
            <div className="relative w-12 h-12">
              <img
                src={logoPreview}
                alt="Logo preview"
                className="w-12 h-12 rounded-full object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setLogoFile(null)
                  setLogoPreview(null)
                }}
                className="absolute -top-1 -right-1 rounded-full bg-red-500 text-white p-1 w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
              >
                ×
              </button>
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <svg
                className="h-6 w-6 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
          <input
            id="logo"
            name="logo"
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => document.getElementById('logo')?.click()}
            className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Alterar
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="primaryColor"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          Cor Primária
        </label>
        <input
          id="primaryColor"
          name="primaryColor"
          type="color"
          defaultValue="#000000"
          required
          className="block h-10 w-full rounded-xl border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary transition-shadow sm:text-sm sm:leading-6"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="secondaryColor"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          Cor Secundária
        </label>
        <input
          id="secondaryColor"
          name="secondaryColor"
          type="color"
          defaultValue="#FFFFFF"
          required
          className="block h-10 w-full rounded-xl border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary transition-shadow sm:text-sm sm:leading-6"
        />
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="relative w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-4 px-6 text-sm font-bold text-white shadow-xl hover:shadow-2xl hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {loading ? (
            <>
              <svg
                className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 animate-spin text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span className="opacity-0">Criando conta...</span>
            </>
          ) : (
            'Criar conta'
          )}
        </button>
      </div>
    </form>
  )
} 