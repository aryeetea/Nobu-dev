// /app/login/page.tsx
'use client'
import { signIn } from 'next-auth/react'

export default function LoginPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
      <h1 style={{ color: '#fff', fontWeight: 700, fontSize: 36, marginBottom: 32 }}>Sign in to Nobu</h1>
      <button
        style={{
          background: '#7c3aed',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '16px 32px',
          fontSize: 18,
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 2px 16px #7c3aed44',
          transition: 'background 0.2s',
        }}
        onClick={() => signIn('google', { callbackUrl: '/' })}
      >
        Continue with Google
      </button>
    </div>
  )
}
