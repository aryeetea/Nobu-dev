'use client'

import { ConversationProvider } from '@elevenlabs/react'
import { SessionProvider } from 'next-auth/react'

const AGENT_ID = 'agent_0301knzm0v3efm3th0qnb84gkqrg'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ConversationProvider agentId={AGENT_ID}>{children}</ConversationProvider>
    </SessionProvider>
  )
}
