import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { Markdown } from '../components/Markdown'
import { QuizBlock } from '../components/QuizBlock'
import { Sidebar } from '../components/Sidebar'
import { getDoc } from '../content/docs'
import { allPages, docCandidates, pageBySlug, pathIn, routeOf } from '../content/manifest'
import { useDone } from '../lib/progress'
import { useTrack } from '../lib/track'

type TocEntry = { id: string; text: string; level: number }

export function CoursePage() {
  const slug = (useParams()['*'] ?? '').replace(/\/+$/, '')
  const track = useTrack()
  const page = pageBySlug(track, slug)
  const candidates = docCandidates(track, slug)
  const doc = page?.doc ?? candidates.find((candidate) => getDoc(candidate) !== undefined) ?? candidates[0]
  const content = getDoc(doc)
  const { isDone, toggle } = useDone(track)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const articleRef = useRef<HTMLElement>(null)
  const [toc, setToc] = useState<TocEntry[]>([])

  // Table des matières construite à partir des titres réellement rendus (ids générés par rehype-slug)
  useEffect(() => {
    const headings = articleRef.current?.querySelectorAll<HTMLHeadingElement>('.course-body > .markdown h2, .course-body > .markdown h3') ?? []
    setToc([...headings].filter((h) => h.id).map((h) => ({ id: h.id, text: h.textContent ?? '', level: h.tagName === 'H2' ? 2 : 3 })))
  }, [doc, content])

  const pages = allPages(track)
  const index = page ? pages.indexOf(page) : -1
  const previous = index > 0 ? pages[index - 1] : undefined
  const next = index >= 0 && index < pages.length - 1 ? pages[index + 1] : undefined

  useEffect(() => {
    const title = page?.title ?? slug
    document.title = `${title} — ${track.title} — Formation TaskBoard`
  }, [page, slug, track])

  return (
    <div className="course-layout">
      <aside className={`course-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <button type="button" className="sidebar-toggle" aria-expanded={sidebarOpen} onClick={() => setSidebarOpen(!sidebarOpen)}>
          📚 Sommaire du parcours {sidebarOpen ? '▲' : '▼'}
        </button>
        <Sidebar onNavigate={() => setSidebarOpen(false)} />
      </aside>

      <article className="course-main" ref={articleRef}>
        {page && (
          <div className="course-meta">
            <span className={`badge audience-${page.audience}`}>
              {page.audience === 'tous' ? 'Toute l’équipe' : page.audience === 'back' ? 'Devs back' : 'Dev front'}
            </span>
            {page.note && <span className="muted small">{page.note}</span>}
          </div>
        )}

        <div className="course-body">
          {content !== undefined ? (
            <Markdown basePath={`docs/${doc}`}>{content}</Markdown>
          ) : (
            <div className="placeholder">
              <h1>{page?.title ?? 'Page introuvable'}</h1>
              <p>{page ? '✍️ Ce contenu est en cours de rédaction. Revenez un peu plus tard !' : 'Cette page n’existe pas.'}</p>
              <Link to={pathIn(track, '/parcours')}>← Retour au parcours</Link>
            </div>
          )}
        </div>

        {page?.quiz && content !== undefined && <QuizBlock id={page.quiz} />}

        {page && (
          <div className="course-footer">
            <button type="button" className={`button ${isDone(page.doc) ? '' : 'primary'}`} onClick={() => toggle(page.doc)}>
              {isDone(page.doc) ? '✓ Terminé — annuler' : 'Marquer comme terminé'}
            </button>
            <nav className="pager" aria-label="Pages précédente et suivante">
              {previous ? (
                <Link to={routeOf(track, previous.doc)} className="pager-link">
                  <small>← Précédent</small>
                  {previous.title}
                </Link>
              ) : (
                <span />
              )}
              {next && (
                <Link to={routeOf(track, next.doc)} className="pager-link next">
                  <small>Suivant →</small>
                  {next.title}
                </Link>
              )}
            </nav>
          </div>
        )}
      </article>

      <aside className="course-toc" aria-label="Sur cette page">
        {toc.length > 0 && (
          <>
            <div className="toc-title">Sur cette page</div>
            <ul>
              {toc.map((entry) => (
                <li key={entry.id} className={`toc-level-${entry.level}`}>
                  <a href={`#${entry.id}`}>{entry.text}</a>
                </li>
              ))}
            </ul>
          </>
        )}
      </aside>
    </div>
  )
}
