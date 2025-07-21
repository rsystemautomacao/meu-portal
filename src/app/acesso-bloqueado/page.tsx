export default function AcessoBloqueadoPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-blue-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border-2 border-red-200 flex flex-col items-center">
        <div className="mb-4">
          <svg className="h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12c0 4.418-4.03 8-9 8s-9-3.582-9-8 4.03-8 9-8 9 3.582 9 8z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-red-700 mb-2 text-center">Acesso Bloqueado</h1>
        <p className="text-gray-700 text-center mb-4">
          O acesso ao sistema foi <span className="font-semibold text-red-600">bloqueado</span> ou <span className="font-semibold text-yellow-600">pausado</span> devido à <span className="font-semibold">falta de pagamento</span> ou pendências administrativas do seu time.
        </p>
        <p className="text-gray-600 text-center mb-6">
          Para regularizar sua situação, entre em contato com o administrador do sistema ou realize o pagamento das mensalidades em aberto.
        </p>
        <a href="/auth/logout" className="inline-block px-6 py-2 rounded-lg bg-red-600 text-white font-semibold shadow hover:bg-red-700 transition-colors">Sair</a>
      </div>
    </div>
  )
} 