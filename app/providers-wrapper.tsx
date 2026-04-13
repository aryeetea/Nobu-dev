'use client'

import Providers from './providers'

export default function ProvidersWrapper({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>
}
