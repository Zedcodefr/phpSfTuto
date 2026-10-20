import { useEffect } from 'react'
import { Link } from 'react-router'
import { pathIn, routeOf } from '../content/manifest'
import { useProfile } from '../lib/progress'
import { useTrack } from '../lib/track'

export function HomePage() {
  const track = useTrack()
  const [profile] = useProfile()
  const organisation = track.parts[0].pages[0].doc
  const start = track.profiles && profile === 'front' ? routeOf(track, '04-react/README.md') : routeOf(track, organisation)

  useEffect(() => {
    document.title = `${track.title} — Formation TaskBoard`
  }, [track])

  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">{track.audienceNote}</p>
        <h1>
          {track.headline}
          <span className="accent">{track.headlineAccent}</span>
        </h1>
        <p className="lead">{track.lead}</p>
        <div className="hero-actions">
          <a className="button primary large" href="/downloads/taskboard-projet.zip" download>
            ⬇️ Télécharger le projet de départ
          </a>
          <Link className="button large" to={start}>
            Commencer le parcours →
          </Link>
        </div>
      </section>

      <section className="steps">
        <h2>Démarrer en 3 étapes</h2>
        <ol className="step-list">
          <li>
            <strong>Installer Docker et make</strong>
            <span>Rien d’autre : PHP, Composer, Node et PostgreSQL tournent dans des conteneurs. Sous Windows, travaillez dans WSL 2.</span>
          </li>
          <li>
            <strong>Télécharger et installer le projet</strong>
            <span>
              Décompressez l’archive puis lancez <code>make install</code>.
            </span>
          </li>
          <li>
            <strong>Suivre le parcours</strong>
            <span>
              Lisez l’<Link to={routeOf(track, organisation)}>organisation</Link>, la <Link to={routeOf(track, '00-charte-ia.md')}>charte IA</Link> et le{' '}
              <Link to={routeOf(track, 'api-contract.md')}>contrat d’API</Link>, puis suivez les étapes{track.profiles ? ' de votre profil' : ' dans l’ordre'}.
            </span>
          </li>
        </ol>
      </section>

      <section className="ai-callout">
        <h2>🤖 L’IA est autorisée… à une condition</h2>
        <p>
          Vous pouvez utiliser un assistant IA pour coder. Mais chaque ligne livrée doit pouvoir être <strong>expliquée sans aide</strong> :
          quiz à la fin de chaque cours, questions à l’oral et revue de code croisée sont là pour le vérifier.
        </p>
        <Link to={routeOf(track, '00-charte-ia.md')}>Lire la charte IA →</Link>
      </section>

      <section>
        <h2>Le parcours en un coup d’œil</h2>
        <p className="muted">
          Le parcours se fait <strong>à votre rythme</strong>, étape par étape{track.profiles ? ', back et front en parallèle' : ''}. Une étape est
          terminée quand vous l’avez comprise : passez alors aux bonus ou à l’étape suivante.{' '}
          <Link to={pathIn(track, '/parcours')}>Voir le détail →</Link>
        </p>
        <div className="part-grid">
          {track.parts.map((part) => (
            <Link key={part.id} to={routeOf(track, part.pages[0].doc)} className={`part-card audience-${part.audience}`}>
              <strong>{part.title}</strong>
              <span>{part.subtitle}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
