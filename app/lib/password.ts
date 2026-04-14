import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto'

const iterations = 210_000
const keyLength = 32
const digest = 'sha256'

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('base64url')
  const hash = pbkdf2Sync(password, salt, iterations, keyLength, digest).toString('base64url')

  return `pbkdf2$${iterations}$${salt}$${hash}`
}

export function verifyPassword(password: string, storedHash: string) {
  const [scheme, iterationValue, salt, hash] = storedHash.split('$')

  if (scheme !== 'pbkdf2' || !iterationValue || !salt || !hash) {
    return false
  }

  const parsedIterations = Number.parseInt(iterationValue, 10)
  if (!Number.isFinite(parsedIterations)) return false

  const expected = Buffer.from(hash, 'base64url')
  const actual = pbkdf2Sync(password, salt, parsedIterations, expected.length, digest)

  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

export function normalizeUsername(username: string) {
  return username.trim().toLowerCase().replace(/[^a-z0-9_.'-]/g, '')
}
