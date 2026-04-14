'use client'

import { SessionProvider } from 'next-auth/react'
import { ConversationProvider } from '@elevenlabs/react'

import { NOBU_ELEVENLABS_AGENT_ID } from './lib/nobu-env'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ConversationProvider agentId={NOBU_ELEVENLABS_AGENT_ID}>
        {children}
      </ConversationProvider>
    </SessionProvider>
  )
}
