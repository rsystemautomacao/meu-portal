import { useState } from 'react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [resetLink, setResetLink] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)
    setResetLink('')
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erro ao solicitar reset')
      setSuccess(true)
      setResetLink(data.resetLink)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border-2 border-blue-200">
        <h1 className="text-2xl font-bold text-blue-900 mb-4 text-center">Recuperar Senha</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">E-mail cadastrado:</label>
          <input
            type="email"
            className="w-full rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-sm p-2"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="seu@email.com"
          />
          <button
            type="submit"
            className="w-full py-2 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition-colors"
            disabled={loading}
          >
            {loading ? 'Enviando...' : 'Enviar link de recuperação'}
          </button>
        </form>
        {error && <p className="mt-4 text-red-600 text-center">{error}</p>}
        {success && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-green-700 font-semibold mb-2">E-mail de recuperação enviado!</p>
            <p className="text-xs text-gray-500 mb-2">(Simulação: use o link abaixo para redefinir sua senha)</p>
            <a href={resetLink} className="break-all text-blue-700 underline">{resetLink}</a>
          </div>
        )}
      </div>
    </div>
  )
} 