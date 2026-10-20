import { NavLink } from 'react-router'
import { concerns, routeOf } from '../content/manifest'
import { hasDoc } from '../content/docs'
import { useDone, useProfile } from '../lib/progress'
import { useTrack } from '../lib/track'

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const track = useTrack()
  const [storedProfile] = useProfile()
  const profile = track.profiles ? storedProfile : 'back'
  const { isDone } = useDone(track)

  return (
    <nav className="sidebar" aria-label="Parcours">
      {track.parts.map((part) => {
        const forMe = profile === null || concerns(part.audience, profile)
        return (
          <div key={part.id} className={`sidebar-part ${forMe ? '' : 'dimmed'}`}>
            <div className="sidebar-title">{part.title}</div>
            <ul>
              {part.pages.map((page) => (
                <li key={page.doc}>
                  <NavLink to={routeOf(track, page.doc)} onClick={onNavigate} end>
                    <span className={`check ${isDone(page.doc) ? 'checked' : ''}`} aria-hidden="true">
                      {isDone(page.doc) ? '✓' : ''}
                    </span>
                    <span className="sidebar-label">
                      {page.title}
                      {!hasDoc(page.doc) && <em className="soon"> · bientôt</em>}
                    </span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </nav>
  )
}
