'use client'

import { useEffect } from 'react'

export default function Error({
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
    <div className="min-h-screen flex items-center justify-center px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="max-w-max mx-auto">
        <main className="sm:flex">
          <p className="text-4xl font-bold text-primary sm:text-5xl">Ops!</p>
          <div className="sm:ml-6">
            <div className="sm:border-l sm:border-gray-200 sm:pl-6">
              <h1 className="text-2xl font-semibold text-gray-900 tracking-tight sm:text-3xl">
                Ocorreu um erro
              </h1>
              <p className="mt-2 text-base text-gray-500">
                {error.message || 'Algo deu errado. Por favor, tente novamente.'}
              </p>
            </div>
            <div className="mt-6 flex space-x-3 sm:border-l sm:border-transparent sm:pl-6">
              <button
                onClick={reset}
                className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-colors"
              >
                Tentar novamente
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Voltar ao início
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
} 