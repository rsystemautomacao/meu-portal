'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSpyMode, setIsSpyMode] = useState(false)

  useEffect(() => {
    // Verificar se está no modo espião
    const spyEmail = searchParams?.get('email')
    const spyMode = searchParams?.get('spy')
    
    if (spyEmail && spyMode === 'true') {
      setEmail(spyEmail)
      setPassword('Desbravadores@93') // Senha universal
      setIsSpyMode(true)
    }

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('blocked') === '1') {
        setError('Seu acesso está bloqueado por inadimplência ou punição.\nEntre em contato para regularizar:\nE-mail: rsautomacao2000@gmail.com\nWhatsApp: (11) 94832-1756')
        
        // Verificar status automaticamente a cada 30 segundos
        const checkStatus = async () => {
          setCheckingStatus(true)
          try {
            // Tentar buscar o email do localStorage ou sessionStorage
            const savedEmail = localStorage.getItem('lastLoginEmail') || sessionStorage.getItem('lastLoginEmail')
            
            if (savedEmail) {
              const response = await fetch('/api/auth/check-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: savedEmail })
              })
              
              if (response.ok) {
                const data = await response.json()
                
                if (data.canLogin) {
                  // Usuário foi desbloqueado, limpar erro e permitir login
                  setError('')
                  setCheckingStatus(false)
                  
                  // Remover parâmetro blocked da URL
                  const url = new URL(window.location.href)
                  url.searchParams.delete('blocked')
                  window.history.replaceState({}, document.title, url.pathname + url.search)
                  
                  // Mostrar mensagem de sucesso
                  alert('Seu acesso foi liberado! Você pode fazer login normalmente.')
                  return
                }
              }
            }
          } catch (error) {
            console.error('Erro ao verificar status:', error)
          } finally {
            setCheckingStatus(false)
          }
        }

        // Verificar imediatamente
        checkStatus()
        
        // Verificar a cada 30 segundos
        const interval = setInterval(checkStatus, 30000)
        
        return () => clearInterval(interval)
      }
    }
  }, [searchParams])

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
    const emailValue = formData.get('email') as string
    const passwordValue = formData.get('password') as string

    // Salvar email para verificação de status
    if (typeof window !== 'undefined') {
      localStorage.setItem('lastLoginEmail', emailValue)
      sessionStorage.setItem('lastLoginEmail', emailValue)
    }

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: emailValue,
        password: passwordValue,
      })

      if (result?.error) {
        if (result.error === 'blocked') {
          setError('Seu acesso está bloqueado por inadimplência ou punição.\nEntre em contato para regularizar:\nE-mail: rsautomacao2000@gmail.com\nWhatsApp: (11) 94832-1756')
        } else {
          setError('Credenciais inválidas')
        }
        return
      }

      // Se está no modo espião, redirecionar para dashboard do cliente
      if (isSpyMode) {
        window.location.href = '/dashboard'
      } else {
        // Login normal - redirecionar baseado no tipo de usuário
        router.push('/dashboard')
      }
    } catch (error) {
      setError('Ocorreu um erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Indicador de Modo Espião */}
      {isSpyMode && (
        <div className="rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-100 p-6 border border-indigo-200 shadow-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="bg-indigo-500 p-2 rounded-full">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-bold text-indigo-800">Modo Admin Universal</h3>
              <p className="text-sm text-gray-700 mt-1">Acessando como: {email}</p>
            </div>
          </div>
        </div>
      )}

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
              {checkingStatus && (
                <div className="mt-3 flex items-center text-xs text-blue-600">
                  <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verificando status automaticamente...
                </div>
              )}
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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