'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AdminPlayersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    if (!session || !session.user.isAdmin) {
      router.push('/dashboard')
    }
  }, [session, status, router])

  if (status === 'loading' || !session?.user.isAdmin) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Gerenciar Jogadores</h1>
      <p className="mt-2 text-gray-600">Esta página está em desenvolvimento.</p>
    </div>
  )
} 