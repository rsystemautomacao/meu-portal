import '@/styles/globals.css'
import { Inter } from 'next/font/google'
import type { Metadata } from 'next'
import { Providers } from '@/components/providers'
import dynamic from 'next/dynamic'

// Carregar componentes PWA dinamicamente apenas em produção
const PWAInstallPrompt = dynamic(() => import('@/components/PWAInstallPrompt'), {
  ssr: false,
  loading: () => null,
})

const OfflineIndicator = dynamic(() => import('@/components/OfflineIndicator').then(mod => ({ default: mod.OfflineIndicator })), {
  ssr: false,
  loading: () => null,
})

const ServiceWorkerRegister = dynamic(() => import('@/components/ServiceWorkerRegister'), {
  ssr: false,
  loading: () => null,
})

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: 'Meu Portal - Gerenciamento de Times',
  description: 'Aplicativo completo para gerenciamento de times esportivos com controle de jogadores, partidas, estatísticas e finanças',
  manifest: '/manifest.json',
  themeColor: '#1a365d',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Meu Portal',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://meu-portal.vercel.app',
    title: 'Meu Portal - Gerenciamento de Times',
    description: 'Aplicativo completo para gerenciamento de times esportivos',
    siteName: 'Meu Portal',
  },
  twitter: {
    card: 'summary',
    title: 'Meu Portal - Gerenciamento de Times',
    description: 'Aplicativo completo para gerenciamento de times esportivos',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`h-full ${inter.variable} font-sans antialiased`}>
      <head>
        <meta name="application-name" content="Meu Portal" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Meu Portal" />
        <meta name="description" content="Aplicativo completo para gerenciamento de times esportivos" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#1a365d" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-192x192.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="mask-icon" href="/icons/icon.svg" color="#1a365d" />
        <link rel="shortcut icon" href="/favicon.ico" />
        
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:url" content="https://meu-portal.vercel.app" />
        <meta name="twitter:title" content="Meu Portal - Gerenciamento de Times" />
        <meta name="twitter:description" content="Aplicativo completo para gerenciamento de times esportivos" />
        <meta name="twitter:image" content="https://meu-portal.vercel.app/icons/icon-192x192.png" />
        <meta name="twitter:creator" content="@meuportal" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Meu Portal - Gerenciamento de Times" />
        <meta property="og:description" content="Aplicativo completo para gerenciamento de times esportivos" />
        <meta property="og:site_name" content="Meu Portal" />
        <meta property="og:url" content="https://meu-portal.vercel.app" />
        <meta property="og:image" content="https://meu-portal.vercel.app/icons/icon-192x192.png" />
      </head>
      <body className="h-full bg-gray-50 text-gray-900">
        <Providers>
          {process.env.NODE_ENV === 'production' && <ServiceWorkerRegister />}
          {children}
          {process.env.NODE_ENV === 'production' && <PWAInstallPrompt />}
          {process.env.NODE_ENV === 'production' && <OfflineIndicator />}
        </Providers>
      </body>
    </html>
  )
} 