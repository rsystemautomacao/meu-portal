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
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-xl bg-red-50 p-4 border border-red-100">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
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
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="rounded-xl bg-green-50 p-4 border border-green-100">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
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
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Conta criada com sucesso! Redirecionando para o login...
              </h3>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="block w-full rounded-xl border-0 py-2.5 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary transition-shadow sm:text-sm sm:leading-6"
          placeholder="seu@email.com"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          className="block w-full rounded-xl border-0 py-2.5 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary transition-shadow sm:text-sm sm:leading-6"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          Confirmar Senha
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          className="block w-full rounded-xl border-0 py-2.5 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary transition-shadow sm:text-sm sm:leading-6"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="teamName"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          Nome do Time
        </label>
        <input
          id="teamName"
          name="teamName"
          type="text"
          required
          className="block w-full rounded-xl border-0 py-2.5 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary transition-shadow sm:text-sm sm:leading-6"
          placeholder="Ex: Real Madrid"
        />
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
          className="flex w-full justify-center rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Criando conta...' : 'Criar conta'}
        </button>
      </div>
    </form>
  )
} 