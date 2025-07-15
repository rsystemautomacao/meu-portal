"use client"

export default function AuthError() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', background: '#111', color: '#fff' }}>
      <h1 style={{ fontSize: 32, marginBottom: 16 }}>Erro de autenticação</h1>
      <p>Ocorreu um erro ao tentar autenticar. Verifique suas credenciais ou tente novamente mais tarde.</p>
      <a href="/auth/login" style={{ color: '#4f8cff', marginTop: 24 }}>Voltar para o login</a>
    </div>
  )
} 