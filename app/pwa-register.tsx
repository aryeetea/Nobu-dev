'use client'

import { useEffect } from 'react'

export default function PWARegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister())
      })

      window.caches?.keys().then((cacheNames) => {
        cacheNames
          .filter((cacheName) => cacheName.startsWith('nobu-'))
          .forEach((cacheName) => window.caches.delete(cacheName))
      })

      return
    }

    function registerServiceWorker() {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.error('Nobu service worker registration failed:', error)
      })
    }

    window.addEventListener('load', registerServiceWorker)

    return () => {
      window.removeEventListener('load', registerServiceWorker)
    }
  }, [])

  return null
}
