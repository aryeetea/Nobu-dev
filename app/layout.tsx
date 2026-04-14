import type { Metadata, Viewport } from 'next'
import ProvidersWrapper from './providers-wrapper'
import PWARegister from './pwa-register'
import './globals.css'
import { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Nobu',
  description: 'A personal mobile voice assistant for memory, planning, style, and everyday decisions.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Nobu',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: [{ url: '/icon', sizes: '512x512', type: 'image/png' }],
    apple: [{ url: '/apple-icon', sizes: '180x180', type: 'image/png' }],
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'application-name': 'Nobu',
  },
}

export const viewport: Viewport = {
  themeColor: '#eaf6ff',
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <PWARegister />
        <ProvidersWrapper>
          {children}
        </ProvidersWrapper>
      </body>
    </html>
  )
}
