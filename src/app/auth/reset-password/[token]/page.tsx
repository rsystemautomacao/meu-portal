"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage({ params }: { params: { token: string } }) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      setLoading(false)
      return
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.')
      setLoading(false)
      return
    }
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: params.token, password })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erro ao redefinir senha')
      setSuccess(true)
      setTimeout(() => router.push('/auth/login'), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border-2 border-blue-200">
        <h1 className="text-2xl font-bold text-blue-900 mb-4 text-center">Redefinir Senha</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">Nova senha:</label>
          <input
            type="password"
            className="w-full rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-sm p-2"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="Nova senha"
          />
          <label className="block text-sm font-medium text-gray-700">Confirmar nova senha:</label>
          <input
            type="password"
            className="w-full rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-sm p-2"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
            minLength={6}
            placeholder="Confirme a nova senha"
          />
          <button
            type="submit"
            className="w-full py-2 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition-colors"
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Redefinir Senha'}
          </button>
        </form>
        {error && <p className="mt-4 text-red-600 text-center">{error}</p>}
        {success && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-green-700 font-semibold mb-2">Senha redefinida com sucesso!</p>
            <p className="text-xs text-gray-500 mb-2">Você será redirecionado para o login em instantes.</p>
          </div>
        )}
      </div>
    </div>
  )
} 