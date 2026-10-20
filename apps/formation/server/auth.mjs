// Primitives d'authentification : hash scrypt, comparaison en temps constant, jeton de session signé.
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }
const KEY_LENGTH = 64

/** Format : scrypt$<sel base64url>$<hash base64url> */
export function hashPassword(password) {
  const salt = randomBytes(16)
  const hash = scryptSync(password, salt, KEY_LENGTH, SCRYPT_PARAMS)
  return `scrypt$${salt.toString('base64url')}$${hash.toString('base64url')}`
}

export function verifyHash(password, stored) {
  const [scheme, salt, hash] = String(stored).split('$')
  if (scheme !== 'scrypt' || !salt || !hash) return false
  const expected = Buffer.from(hash, 'base64url')
  const actual = scryptSync(password, Buffer.from(salt, 'base64url'), expected.length, SCRYPT_PARAMS)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

/** Comparaison en temps constant de deux chaînes de longueurs éventuellement différentes */
export function safeEqual(a, b) {
  // On compare des empreintes de même taille pour ne pas révéler la longueur
  const ha = createHmac('sha256', 'compare').update(String(a)).digest()
  const hb = createHmac('sha256', 'compare').update(String(b)).digest()
  return timingSafeEqual(ha, hb)
}

/** Jeton : <expiration en ms>.<nonce>.<signature HMAC-SHA256> */
export function createSessionToken(secret, ttlMs) {
  const payload = `${Date.now() + ttlMs}.${randomBytes(12).toString('base64url')}`
  return `${payload}.${sign(payload, secret)}`
}

export function verifySessionToken(token, secret) {
  if (typeof token !== 'string') return false
  const parts = token.split('.')
  if (parts.length !== 3) return false
  const [expires, nonce, signature] = parts
  const expected = sign(`${expires}.${nonce}`, secret)
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false
  return Number(expires) > Date.now()
}

function sign(payload, secret) {
  return createHmac('sha256', secret).update(payload).digest('base64url')
}
