import { Link } from 'react-router'
import { homeOf } from '../content/manifest'
import { useTrack } from '../lib/track'

export function NotFoundPage() {
  const track = useTrack()
  return (
    <main className="page narrow">
      <h1>Page introuvable</h1>
      <p>
        <Link to={homeOf(track)}>← Retour à l’accueil de la formation {track.title}</Link>
      </p>
    </main>
  )
}
