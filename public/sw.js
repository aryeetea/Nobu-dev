const APP_CACHE_NAME = 'nobu-app-v2'
const ASSET_CACHE_NAME = 'nobu-assets-v2'
const PRECACHE_URLS = ['/', '/offline', '/manifest.webmanifest', '/icon', '/apple-icon']
const IS_LOCAL_DEV =
  self.location.hostname === 'localhost' ||
  self.location.hostname === '127.0.0.1' ||
  self.location.hostname === '0.0.0.0'

async function clearNobuCaches() {
  const cacheNames = await caches.keys()
  await Promise.all(
    cacheNames
      .filter((cacheName) => cacheName.startsWith('nobu-'))
      .map((cacheName) => caches.delete(cacheName))
  )
}

self.addEventListener('install', (event) => {
  if (IS_LOCAL_DEV) {
    event.waitUntil(clearNobuCaches().then(() => self.skipWaiting()))
    return
  }

  event.waitUntil(
    caches
      .open(APP_CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  if (IS_LOCAL_DEV) {
    event.waitUntil(
      clearNobuCaches()
        .then(() => self.registration.unregister())
        .then(() => self.clients.matchAll())
        .then((clients) => Promise.all(clients.map((client) => client.navigate(client.url))))
    )
    return
  }

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== APP_CACHE_NAME && cacheName !== ASSET_CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName))
        )
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  if (IS_LOCAL_DEV) {
    event.respondWith(fetch(event.request))
    return
  }

  const { request } = event

  if (request.method !== 'GET') return

  const requestUrl = new URL(request.url)

  if (requestUrl.origin !== self.location.origin) return

  if (
    requestUrl.pathname.startsWith('/_next/') ||
    requestUrl.pathname.startsWith('/__nextjs') ||
    requestUrl.pathname.startsWith('/api/') ||
    request.destination === 'script' ||
    request.destination === 'style'
  ) {
    event.respondWith(fetch(request))
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(APP_CACHE_NAME).then((cache) => cache.put('/', copy))
          return response
        })
        .catch(() => caches.match('/') || caches.match('/offline') || Response.error())
    )
    return
  }

  if (
    requestUrl.pathname.startsWith('/models/') ||
    requestUrl.pathname.startsWith('/live2d/') ||
    requestUrl.pathname === '/icon' ||
    requestUrl.pathname === '/apple-icon' ||
    requestUrl.pathname === '/manifest.webmanifest'
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse

        return fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone()
            caches.open(ASSET_CACHE_NAME).then((cache) => cache.put(request, copy))
          }

          return response
        })
      })
    )
    return
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse

      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone()
          caches.open(APP_CACHE_NAME).then((cache) => cache.put(request, copy))
        }

        return response
      })
    })
  )
})
