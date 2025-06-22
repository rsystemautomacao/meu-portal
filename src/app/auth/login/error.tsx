'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function LoginError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-gray-100">
        <div>
          <div className="flex justify-center">
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 rounded-full bg-red-100" />
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                <svg
                  className="w-14 h-14 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>
          </div>
          <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-gray-900">
            Erro ao fazer login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {error.message || 'Ocorreu um erro ao tentar fazer login. Por favor, tente novamente.'}
          </p>
        </div>

        <div className="flex flex-col space-y-4">
          <button
            onClick={reset}
            className="relative w-full rounded-xl bg-gradient-to-r from-primary to-secondary py-3 px-4 text-sm font-semibold text-white shadow-sm hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all"
          >
            Tentar novamente
          </button>
          <Link
            href="/"
            className="text-center rounded-lg py-2 px-4 font-medium text-primary hover:text-secondary transition-colors duration-200 hover:bg-primary/5"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  )
} 