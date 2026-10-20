// Serveur de production du support de formation (Node 24, modules natifs uniquement).
//  - sert l'application React compilée (dist/) avec repli SPA sur index.html
//  - /api/formateur/* : authentification par mot de passe + fichiers du dossier protected/
import { createReadStream, existsSync, readdirSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { dirname, extname, join, normalize, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createSessionToken, safeEqual, verifyHash, verifySessionToken } from './auth.mjs'

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const env = process.env

const config = {
  port: Number(env.PORT ?? 3000),
  host: env.HOST ?? '0.0.0.0',
  distDir: resolve(env.DIST_DIR ?? join(appDir, 'dist')),
  protectedDir: resolve(env.PROTECTED_DIR ?? join(appDir, 'protected')),
  password: env.FORMATEUR_PASSWORD ?? '',
  passwordHash: env.FORMATEUR_PASSWORD_HASH ?? '',
  secret: env.SESSION_SECRET ?? '',
  cookieSecure: (env.COOKIE_SECURE ?? 'true') !== 'false',
  trustProxy: env.TRUST_PROXY === 'true',
  sessionTtlMs: 8 * 60 * 60 * 1000,
}

// ------------------------------------------------------------------ Vérifications au démarrage
if (config.secret.length < 32) {
  console.error('❌ SESSION_SECRET doit contenir au moins 32 caractères (ex. : openssl rand -base64 48).')
  process.exit(1)
}
if (!config.password && !config.passwordHash) {
  console.error('❌ Définir FORMATEUR_PASSWORD_HASH (recommandé, voir server/hash-password.mjs) ou FORMATEUR_PASSWORD.')
  process.exit(1)
}
if (config.passwordHash && !config.passwordHash.startsWith('scrypt$')) {
  console.error('❌ FORMATEUR_PASSWORD_HASH invalide : générez-le avec node server/hash-password.mjs')
  process.exit(1)
}

const COOKIE = 'formateur_session'
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.md': 'text/markdown; charset=utf-8',
  '.zip': 'application/zip',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
}

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'same-origin',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy':
    "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
}

// ------------------------------------------------------------------ Limitation des tentatives de connexion
const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 5
const attempts = new Map() // ip -> { count, resetAt }

function clientIp(req) {
  if (config.trustProxy) {
    const forwarded = req.headers['x-forwarded-for']
    if (typeof forwarded === 'string' && forwarded) return forwarded.split(',')[0].trim()
  }
  return req.socket.remoteAddress ?? 'unknown'
}

function isRateLimited(ip) {
  const entry = attempts.get(ip)
  return entry !== undefined && entry.resetAt > Date.now() && entry.count >= MAX_ATTEMPTS
}

function recordFailure(ip) {
  const now = Date.now()
  const entry = attempts.get(ip)
  if (!entry || entry.resetAt <= now) attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
  else entry.count++
}

setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of attempts) if (entry.resetAt <= now) attempts.delete(ip)
}, 60_000).unref()

// ------------------------------------------------------------------ Utilitaires HTTP
function send(res, status, body, headers = {}) {
  res.writeHead(status, { ...SECURITY_HEADERS, ...headers })
  res.end(body)
}

function sendJson(res, status, data, headers = {}) {
  send(res, status, JSON.stringify(data), { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers })
}

function parseCookies(req) {
  const cookies = {}
  for (const part of (req.headers.cookie ?? '').split(';')) {
    const index = part.indexOf('=')
    if (index > 0) cookies[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim())
  }
  return cookies
}

function sessionCookie(value, maxAgeSeconds) {
  const attributes = [`${COOKIE}=${value}`, 'Path=/api/formateur', 'HttpOnly', 'SameSite=Strict', `Max-Age=${maxAgeSeconds}`]
  if (config.cookieSecure) attributes.push('Secure')
  return attributes.join('; ')
}

function isAuthenticated(req) {
  return verifySessionToken(parseCookies(req)[COOKIE], config.secret)
}

function readBody(req, limit = 4096) {
  return new Promise((resolveBody, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > limit) {
        reject(new Error('too large'))
        req.destroy()
      } else {
        chunks.push(chunk)
      }
    })
    req.on('end', () => resolveBody(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

/** Résout un chemin demandé à l'intérieur d'un dossier racine ; null si la cible en sort ou n'est pas un fichier */
function safeFile(root, requested) {
  let decoded
  try {
    decoded = decodeURIComponent(requested)
  } catch {
    return null
  }
  if (decoded.includes('\0')) return null
  const target = resolve(root, '.' + sep + normalize(decoded))
  const rel = relative(root, target)
  if (rel === '' || rel.startsWith('..') || resolve(root, rel) !== target) return null
  try {
    return statSync(target).isFile() ? target : null
  } catch {
    return null
  }
}

function streamFile(req, res, file, headers = {}) {
  const stat = statSync(file)
  const type = MIME[extname(file).toLowerCase()] ?? 'application/octet-stream'
  res.writeHead(200, { ...SECURITY_HEADERS, 'Content-Type': type, 'Content-Length': stat.size, ...headers })
  if (req.method === 'HEAD') return res.end()
  createReadStream(file).pipe(res)
}

function listFiles(dir, base = dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) return listFiles(full, base)
    return entry.isFile() ? [{ path: relative(base, full).split(sep).join('/'), size: statSync(full).size }] : []
  })
}

// ------------------------------------------------------------------ API formateur
async function handleFormateurApi(req, res, path) {
  if (path === '/api/formateur/login' && req.method === 'POST') {
    const ip = clientIp(req)
    if (isRateLimited(ip)) return sendJson(res, 429, { error: 'Trop de tentatives, réessayez plus tard.' }, { 'Retry-After': '900' })

    let password = ''
    try {
      const body = JSON.parse(await readBody(req))
      password = typeof body.password === 'string' ? body.password : ''
    } catch {
      return sendJson(res, 400, { error: 'Requête invalide' })
    }

    const valid = config.passwordHash ? verifyHash(password, config.passwordHash) : safeEqual(password, config.password)
    if (!valid || password === '') {
      recordFailure(ip)
      return sendJson(res, 401, { error: 'Mot de passe incorrect' })
    }
    attempts.delete(ip)
    const token = createSessionToken(config.secret, config.sessionTtlMs)
    return sendJson(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie(token, config.sessionTtlMs / 1000) })
  }

  if (path === '/api/formateur/logout' && req.method === 'POST') {
    return sendJson(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie('', 0) })
  }

  if (!['GET', 'HEAD'].includes(req.method ?? '')) return sendJson(res, 405, { error: 'Méthode non autorisée' })

  // Tout ce qui suit exige une session valide
  if (!isAuthenticated(req)) return sendJson(res, 401, { error: 'Authentification requise' })

  if (path === '/api/formateur/me') return sendJson(res, 200, { authenticated: true })
  if (path === '/api/formateur/index.json') return sendJson(res, 200, { files: listFiles(config.protectedDir) })

  if (path.startsWith('/api/formateur/files/')) {
    const file = safeFile(config.protectedDir, path.slice('/api/formateur/files/'.length))
    if (!file) return sendJson(res, 404, { error: 'Fichier introuvable' })
    const name = file.split(sep).pop()
    const headers = { 'Cache-Control': 'private, no-store' }
    if (file.endsWith('.zip')) headers['Content-Disposition'] = `attachment; filename="${name}"`
    return streamFile(req, res, file, headers)
  }

  return sendJson(res, 404, { error: 'Introuvable' })
}

// ------------------------------------------------------------------ Fichiers statiques
function handleStatic(req, res, path) {
  if (!['GET', 'HEAD'].includes(req.method ?? '')) return send(res, 405, 'Method Not Allowed', { 'Content-Type': 'text/plain' })

  if (path === '/healthz') return send(res, 200, 'ok', { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' })

  const file = path === '/' ? null : safeFile(config.distDir, path)
  if (file) {
    let cache = 'no-cache'
    if (path.startsWith('/assets/')) cache = 'public, max-age=31536000, immutable'
    const headers = { 'Cache-Control': cache }
    if (path.startsWith('/downloads/') && file.endsWith('.zip')) headers['Content-Disposition'] = `attachment; filename="${file.split(sep).pop()}"`
    return streamFile(req, res, file, headers)
  }

  // Fichier attendu mais absent (asset, zip...) : vrai 404 plutôt que la page de l'application
  if (path.startsWith('/assets/') || path.startsWith('/downloads/') || extname(path) !== '') {
    return send(res, 404, 'Not Found', { 'Content-Type': 'text/plain' })
  }

  // Route de l'application React (/cours/..., /formateur...) -> index.html
  const index = join(config.distDir, 'index.html')
  if (!existsSync(index)) return send(res, 503, 'Application non compilée (npm run build)', { 'Content-Type': 'text/plain; charset=utf-8' })
  return streamFile(req, res, index, { 'Cache-Control': 'no-cache' })
}

const server = createServer(async (req, res) => {
  try {
    const path = new URL(req.url ?? '/', 'http://localhost').pathname
    if (path.startsWith('/api/formateur/') || path === '/api/formateur') return await handleFormateurApi(req, res, path)
    return handleStatic(req, res, path)
  } catch (error) {
    console.error(error)
    if (!res.headersSent) sendJson(res, 500, { error: 'Erreur interne' })
    else res.destroy()
  }
})

server.listen(config.port, config.host, () => {
  console.log(`✅ Support de formation sur http://${config.host}:${config.port} (auth : ${config.passwordHash ? 'hash scrypt' : 'mot de passe en clair'})`)
})

for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)))
