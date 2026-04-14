import { hashPassword, normalizeUsername } from '../../../lib/password'
import { prisma } from '../../../lib/prisma'

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
  })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as {
    name?: unknown
    password?: unknown
    username?: unknown
  } | null

  const username = normalizeUsername(typeof body?.username === 'string' ? body.username : '')
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''

  if (username.length < 3) {
    return jsonResponse({ error: 'Choose a username with at least 3 characters.' }, 400)
  }

  if (password.length < 8) {
    return jsonResponse({ error: 'Use a password with at least 8 characters.' }, 400)
  }

  const existingUser = await prisma.user.findUnique({
    where: { username },
  })

  if (existingUser) {
    return jsonResponse({ error: 'That username is already taken.' }, 409)
  }

  const user = await prisma.user.create({
    data: {
      name: name || username,
      passwordHash: hashPassword(password),
      username,
    },
    select: {
      id: true,
      name: true,
      username: true,
    },
  })

  return jsonResponse({ user })
}
