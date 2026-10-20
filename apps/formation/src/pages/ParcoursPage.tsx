import { useEffect } from 'react'
import { Link } from 'react-router'
import { concerns, routeOf, type Profile } from '../content/manifest'
import { getQuiz } from '../content/quiz'
import { useDone, useProfile, useQuizResults } from '../lib/progress'
import { useTrack } from '../lib/track'

export function ParcoursPage() {
  const track = useTrack()
  const [profile, setProfile] = useProfile()
  const { isDone, toggle } = useDone(track)
  const [results] = useQuizResults(track)
  const current: Profile = track.profiles ? (profile ?? 'back') : 'back'
  const parts = track.parts

  useEffect(() => {
    document.title = `Parcours — ${track.title} — Formation TaskBoard`
  }, [track])

  const myPages = parts.flatMap((p) => p.pages).filter((p) => concerns(p.audience, current))
  const doneCount = myPages.filter((p) => isDone(p.doc)).length
  const percent = myPages.length ? Math.round((doneCount / myPages.length) * 100) : 0

  return (
    <main className="page">
      <h1>Parcours — {track.title}</h1>
      {track.profiles && (
        <div className="segmented" role="group" aria-label="Profil">
          <button type="button" className={current === 'back' ? 'active' : ''} onClick={() => setProfile('back')}>
            ⚙️ Dev back
          </button>
          <button type="button" className={current === 'front' ? 'active' : ''} onClick={() => setProfile('front')}>
            🎨 Dev front
          </button>
        </div>
      )}

      <div className="progress-card">
        <div>
          <strong>{percent} %</strong> du parcours{track.profiles ? (current === 'back' ? ' back' : ' front') : ''} terminé · {doneCount}/{myPages.length} pages
        </div>
        <div className="progress-bar" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
          <span style={{ width: `${percent}%` }} />
        </div>
      </div>

      <p className="muted">
        À votre rythme : ce qui compte est de comprendre, pas d’aller vite ni lentement. IA autorisée (voir la{' '}
        <Link to={routeOf(track, '00-charte-ia.md')}>charte</Link>).{track.profiles ? ' Le front avance en parallèle des étapes back.' : ''}
      </p>

      {parts.map((part) => {
        const forMe = concerns(part.audience, current)
        return (
          <section key={part.id} className={`parcours-part ${forMe ? '' : 'dimmed'}`}>
            <header>
              <h2>{part.title}</h2>
              {!forMe && <span className="muted small">facultatif pour votre profil</span>}
            </header>
            <p className="muted">{part.subtitle}</p>
            <table className="parcours-table">
              <tbody>
                {part.pages.map((page) => {
                  const quiz = page.quiz ? getQuiz(page.quiz) : undefined
                  const result = page.quiz ? results[page.quiz] : undefined
                  return (
                    <tr key={page.doc} className={isDone(page.doc) ? 'done' : ''}>
                      <td className="cell-check">
                        <input type="checkbox" checked={isDone(page.doc)} onChange={() => toggle(page.doc)} aria-label={`${page.title} terminé`} />
                      </td>
                      <td>
                        <Link to={routeOf(track, page.doc)}>{page.title}</Link>
                        {page.note && <div className="muted small">{page.note}</div>}
                      </td>
                      <td className="cell-quiz">
                        {quiz && (result ? <span className="badge">🧠 {result.score}/{result.total}</span> : <span className="muted small">🧠 quiz</span>)}
                      </td>
                    </tr>
                  )
                })}
                {(part.milestones ?? []).map((milestone) => (
                  <tr key={milestone.label} className="milestone">
                    <td className="cell-check">🏁</td>
                    <td>{milestone.label}</td>
                    <td />
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )
      })}
    </main>
  )
}
