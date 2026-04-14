'use client'

import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'

type LoginMode = 'signin' | 'signup'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<LoginMode>('signin')
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      if (mode === 'signup') {
        const response = await fetch('/api/auth/register', {
          body: JSON.stringify({ name, password, username }),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        })
        const result = await response.json()

        if (!response.ok) {
          setError(result.error ?? 'Unable to create your Nobu account.')
          return
        }
      }

      const signInResult = await signIn('credentials', {
        password,
        redirect: false,
        username,
      })

      if (signInResult?.error) {
        setError('That username or password is not right.')
        return
      }

      router.replace('/')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login-shell">
      <style>{`
        .login-shell { min-height: 100vh; background: linear-gradient(180deg, #f9ece7 0%, #eef8f7 100%); color: #2b4254; display: grid; place-items: center; padding: 24px; font-family: Arial, Helvetica, sans-serif; }
        .login-card { width: min(430px, 100%); display: grid; gap: 20px; }
        .login-title { font-size: 44px; line-height: 0.96; letter-spacing: 0; }
        .login-copy { color: rgba(43,66,84,0.68); line-height: 1.6; }
        .mode-switch { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; border: 1px solid rgba(43,66,84,0.12); border-radius: 8px; padding: 5px; background: rgba(255,255,255,0.62); }
        .mode-btn { border: 0; border-radius: 6px; background: transparent; color: rgba(43,66,84,0.68); cursor: pointer; font-weight: 800; padding: 11px; }
        .mode-btn.active { background: #2b4254; color: #fff; }
        .login-form { display: grid; gap: 13px; }
        .login-input { width: 100%; border: 1px solid rgba(43,66,84,0.16); border-radius: 8px; background: rgba(255,255,255,0.76); color: #2b4254; font-size: 16px; outline: 0; padding: 15px 16px; }
        .login-input:focus { border-color: #e85d9b; box-shadow: 0 0 0 4px rgba(232,93,155,0.12); }
        .submit-btn { border: 0; border-radius: 8px; background: #e85d9b; color: #fff; cursor: pointer; font-size: 16px; font-weight: 800; padding: 15px 18px; }
        .submit-btn:disabled { cursor: wait; opacity: 0.72; }
        .error { color: #b4235f; font-size: 14px; font-weight: 700; line-height: 1.5; }
        .hint { color: rgba(43,66,84,0.58); font-size: 13px; line-height: 1.5; }
      `}</style>

      <section className="login-card">
        <header>
          <h1 className="login-title">Welcome to Nobu.</h1>
          <p className="login-copy">
            Use a username and password. No Google account needed.
          </p>
        </header>

        <div className="mode-switch" role="tablist">
          <button
            className={`mode-btn ${mode === 'signin' ? 'active' : ''}`}
            onClick={() => {
              setMode('signin')
              setError('')
            }}
            type="button"
          >
            Sign in
          </button>
          <button
            className={`mode-btn ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => {
              setMode('signup')
              setError('')
            }}
            type="button"
          >
            Create account
          </button>
        </div>

        <form className="login-form" onSubmit={submit}>
          {mode === 'signup' && (
            <input
              autoComplete="name"
              className="login-input"
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              value={name}
            />
          )}
          <input
            autoCapitalize="none"
            autoComplete="username"
            className="login-input"
            minLength={3}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Username"
            required
            value={username}
          />
          <input
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            className="login-input"
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            required
            type="password"
            value={password}
          />

          {error && <p className="error">{error}</p>}

          <button className="submit-btn" disabled={isSubmitting} type="submit">
            {isSubmitting
              ? 'One second...'
              : mode === 'signup'
                ? 'Create Nobu account'
                : 'Sign in'}
          </button>
          <p className="hint">
            Passwords are stored as salted hashes. You can add email recovery later before launch.
          </p>
        </form>
      </section>
    </main>
  )
}
