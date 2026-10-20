import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Markdown } from '../components/Markdown'

type FileInfo = { path: string; size: number }
type Status = 'checking' | 'anonymous' | 'authenticated'

const textDocs = [
  { path: 'guide.md', label: 'Guide du formateur', basePath: 'formateur/README.md' },
  { path: 'questions-comprehension.md', label: 'Questions — formation C#', basePath: 'formateur/questions-comprehension.md' },
  { path: 'questions-comprehension-vue.md', label: 'Questions — formation Vue', basePath: 'formateur/questions-comprehension-vue.md' },
]

async function fetchText(path: string): Promise<string | null> {
  const response = await fetch(`/api/formateur/files/${path}`, { credentials: 'same-origin' })
  return response.ok ? response.text() : null
}

export function FormateurPage() {
  const [status, setStatus] = useState<Status>('checking')

  useEffect(() => {
    document.title = 'Espace formateur — Formation TaskBoard'
    fetch('/api/formateur/me', { credentials: 'same-origin' })
      .then((r) => setStatus(r.ok ? 'authenticated' : 'anonymous'))
      .catch(() => setStatus('anonymous'))
  }, [])

  if (status === 'checking') return <main className="page narrow">Chargement…</main>
  if (status === 'anonymous') return <LoginForm onSuccess={() => setStatus('authenticated')} />
  return <FormateurSpace onLogout={() => setStatus('anonymous')} />
}

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      const response = await fetch('/api/formateur/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ password }),
      })
      if (response.ok) {
        setPassword('')
        onSuccess()
      } else if (response.status === 429) {
        setError('Trop de tentatives. Réessayez dans quelques minutes.')
      } else {
        setError('Mot de passe incorrect.')
      }
    } catch {
      setError('Serveur injoignable.')
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="page narrow">
      <form className="login-card" onSubmit={submit}>
        <h1>🔒 Espace formateur</h1>
        <p className="muted">Guide d’animation, réponses aux questions de compréhension et solutions des exercices.</p>
        <label htmlFor="password">Mot de passe</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoFocus
        />
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="button primary" disabled={pending || password === ''}>
          {pending ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </main>
  )
}

function FormateurSpace({ onLogout }: { onLogout: () => void }) {
  const [files, setFiles] = useState<FileInfo[]>([])
  const [active, setActive] = useState(textDocs[0].path)
  const [contents, setContents] = useState<Record<string, string | null>>({})

  useEffect(() => {
    fetch('/api/formateur/index.json', { credentials: 'same-origin' })
      .then((r) => (r.ok ? (r.json() as Promise<{ files: FileInfo[] }>) : { files: [] }))
      .then((data) => setFiles(data.files))
      .catch(() => setFiles([]))
  }, [])

  useEffect(() => {
    if (active in contents) return
    let cancelled = false
    fetchText(active)
      .then((text) => {
        if (!cancelled) setContents((current) => ({ ...current, [active]: text }))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [active, contents])

  const logout = useCallback(async () => {
    await fetch('/api/formateur/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => {})
    onLogout()
  }, [onLogout])

  const downloads = files.filter((f) => !f.path.endsWith('.md'))
  const activeDoc = textDocs.find((d) => d.path === active) ?? textDocs[0]
  const content = contents[active]

  return (
    <main className="page">
      <div className="formateur-header">
        <h1>Espace formateur</h1>
        <button type="button" className="button" onClick={logout}>
          Se déconnecter
        </button>
      </div>

      {downloads.length > 0 && (
        <div className="download-grid">
          {downloads.map((file) => (
            <a key={file.path} className="download-card" href={`/api/formateur/files/${file.path}`} download>
              <span className="download-icon">🔐</span>
              <span>
                <strong>{file.path}</strong>
                <span className="muted small"> · {Math.max(1, Math.round(file.size / 1024))} Ko</span>
                <span className="download-desc">
                  {file.path === 'solutions.zip' ? 'Dossier formateur complet (les deux formations) : guide, solutions PHP pur, solutions des katas…' : 'Fichier formateur'}
                </span>
              </span>
            </a>
          ))}
        </div>
      )}

      <div className="tabs" role="tablist">
        {textDocs.map((doc) => (
          <button key={doc.path} type="button" role="tab" aria-selected={active === doc.path} className={active === doc.path ? 'active' : ''} onClick={() => setActive(doc.path)}>
            {doc.label}
          </button>
        ))}
      </div>

      <div className="course-body formateur-doc">
        {content === undefined && <p>Chargement…</p>}
        {content === null && <p className="muted">Ce document n’est pas (encore) disponible.</p>}
        {typeof content === 'string' && <Markdown basePath={activeDoc.basePath}>{content}</Markdown>}
      </div>
    </main>
  )
}
