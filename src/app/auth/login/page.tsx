import Link from 'next/link'
import LoginForm from '@/components/auth/LoginForm'
import Image from 'next/image'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-white to-secondary/10" />
        <div className="absolute inset-y-0 right-1/2 -z-10 mr-16 w-[200%] origin-bottom-left skew-x-[-30deg] bg-white/80 shadow-xl shadow-primary/10 ring-1 ring-primary/10 sm:mr-28 lg:mr-0 xl:mr-16 xl:origin-center" />
      </div>

      <div className="w-full max-w-md space-y-8 bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-gray-100">
        <div>
          <div className="flex justify-center">
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary to-secondary opacity-20 blur-2xl" />
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
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
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Entrar no Meu Portal
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ou{' '}
            <Link 
              href="/auth/register" 
              className="font-medium text-primary hover:text-secondary transition-colors duration-200"
            >
              crie sua conta gratuitamente
            </Link>
          </p>
          <p className="mt-4 text-center text-sm text-gray-500">
            <a href="/auth/forgot-password" className="text-blue-600 hover:underline">Esqueci minha senha?</a>
          </p>
        </div>

        <div className="mt-8">
          <LoginForm />
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white/80 px-4 text-gray-500 rounded-full">
                  Precisa de ajuda?
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 text-center text-sm">
              <Link 
                href="/auth/forgot-password" 
                className="rounded-lg py-2 px-4 font-medium text-primary hover:text-secondary transition-colors duration-200 hover:bg-primary/5"
              >
                Esqueceu sua senha?
              </Link>
              <Link 
                href="/auth/register" 
                className="rounded-lg py-2 px-4 font-medium text-primary hover:text-secondary transition-colors duration-200 hover:bg-primary/5"
              >
                Não tem uma conta? Cadastre-se
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 