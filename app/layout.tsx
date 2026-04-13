import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import Providers from './providers'
import PWARegister from './pwa-register'
import './globals.css'
import React, { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Nobu',
  description: 'Your AI team member',
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
  themeColor: '#7c3aed',
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Use Next.js Script for Live2D scripts, no <head> wrapper needed */}
        <Script src="/live2d/live2dcubismcore.min.js" strategy="beforeInteractive" />
        <Script src="/live2d/live2d.min.js" strategy="beforeInteractive" />
        <PWARegister />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
