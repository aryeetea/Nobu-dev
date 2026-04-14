import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

import { normalizeUsername, verifyPassword } from '../../../lib/password'
import { prisma } from '../../../lib/prisma'

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Nobu Account',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const username = normalizeUsername(credentials?.username ?? '')
        const password = credentials?.password ?? ''

        if (!username || !password) return null

        const user = await prisma.user.findUnique({
          where: { username },
        })

        if (!user?.passwordHash || !verifyPassword(password, user.passwordHash)) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.username ?? 'Nobu user',
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id
      }

      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.name = session.user.name ?? token.name
      }

      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }
