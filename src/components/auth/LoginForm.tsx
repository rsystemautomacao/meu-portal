'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('blocked') === '1') {
        setError('Seu acesso está bloqueado por inadimplência ou punição.\nEntre em contato para regularizar:\nE-mail: rsautomacao2000@gmail.com\nWhatsApp: (11) 94832-1756')
      }
    }
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Remover o parâmetro blocked=1 da URL ao tentar novo login
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      if (url.searchParams.has('blocked')) {
        url.searchParams.delete('blocked')
        window.history.replaceState({}, document.title, url.pathname + url.search)
      }
    }

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      })

      if (result?.error) {
        if (result.error === 'blocked') {
          setError('Seu acesso está bloqueado por inadimplência ou punição.\nEntre em contato para regularizar:\nE-mail: rsautomacao2000@gmail.com\nWhatsApp: (11) 94832-1756')
        } else {
          setError('Credenciais inválidas')
        }
        return
      }

      router.push('/dashboard')
    } catch (error) {
      setError('Ocorreu um erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && error.includes('bloqueado') ? (
        <div className="rounded-2xl bg-gradient-to-r from-red-50 to-red-100 p-6 border border-red-200 shadow-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="bg-red-500 p-2 rounded-full">
                <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-bold text-red-800">Seu acesso está bloqueado por inadimplência ou punição.</h3>
              <p className="text-sm text-gray-700 mt-2">Entre em contato para regularizar:</p>
              <div className="mt-2 flex flex-col gap-2">
                <button onClick={() => navigator.clipboard.writeText('rsautomacao2000@gmail.com')} className="px-3 py-1 rounded bg-blue-100 text-blue-800 text-xs font-medium hover:bg-blue-200">Copiar e-mail: rsautomacao2000@gmail.com</button>
                <a href="https://wa.me/5511948321756" target="_blank" rel="noopener noreferrer" className="px-3 py-1 rounded bg-green-100 text-green-800 text-xs font-medium hover:bg-green-200">Abrir WhatsApp: (11) 94832-1756</a>
              </div>
            </div>
          </div>
        </div>
      ) : error && (
        <div className="rounded-2xl bg-gradient-to-r from-red-50 to-red-100 p-6 border border-red-200 shadow-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="bg-red-500 p-2 rounded-full">
                <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-bold text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <label
          htmlFor="email"
          className="block text-sm font-bold leading-6 text-gray-900"
        >
          E-mail
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
            autoComplete="current-password"
            required
            className="block w-full rounded-2xl border-0 py-4 pl-12 pr-4 text-gray-900 shadow-lg ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 sm:text-sm sm:leading-6 bg-white/80 backdrop-blur-sm"
            placeholder="••••••••"
          />
        </div>
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
              <span className="opacity-0">Entrando...</span>
            </>
          ) : (
            'Entrar'
          )}
        </button>
      </div>
    </form>
  )
} 