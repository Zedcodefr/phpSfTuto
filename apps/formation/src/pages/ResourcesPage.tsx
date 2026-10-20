import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { routeOf } from '../content/manifest'
import { useTrack } from '../lib/track'

type DownloadInfo = { file: string; size: number }
type DownloadsManifest = { generatedAt: string; files: DownloadInfo[] }

const downloads = [
  {
    file: 'taskboard-projet.zip',
    title: 'Projet de départ',
    description: 'Le dépôt complet : Docker, Makefile, API PHP pur (squelette), API Symfony, front de démo et tous les cours. Décompresser puis `make install`.',
    icon: '📦',
  },
  {
    file: 'taskboard-cours.zip',
    title: 'Cours (Markdown)',
    description: 'Tous les cours au format Markdown, pour une lecture hors ligne ou dans votre IDE.',
    icon: '📚',
  },
]

/** [commande, description, réservée à la formation avec front React] */
const commands: [string, string, boolean?][] = [
  ['make install', 'Première installation complète'],
  ['make up / make down', 'Démarrer / arrêter les conteneurs'],
  ['make help', 'Toutes les commandes disponibles'],
  ['make php-check', 'Vérifier l’API PHP pur contre le contrat'],
  ['make php-sh', 'Shell dans le conteneur PHP pur'],
  ['make sf c="debug:router"', 'Console Symfony'],
  ['make sf-test', 'Tests PHPUnit de l’API Symfony'],
  ['make sf-db-reset', 'Base Symfony : drop + migrations + fixtures'],
  ['make php-check-a / -b / -c', 'Vérifier son lot (API PHP pur)'],
  ['make sf-kata', 'Kata Doctrine & DQL'],
  ['make dql q="SELECT ..."', 'Tester une requête DQL'],
  ['make use-php / make use-symfony', 'Choisir l’API appelée par le front de démo'],
  ['make npm c="install react-router"', 'Lancer npm dans le conteneur Node', true],
  ['make front-lint', 'Lint + types du front', true],
  ['make logs s=api-symfony', 'Suivre les logs d’un service'],
]

const urls: [string, string][] = [
  ['http://localhost:5173', 'Front React (affiche les tâches de l’API choisie)'],
  ['http://localhost:8081/api/health', 'API PHP pur (partie 1)'],
  ['http://localhost:8082/api/health', 'API Symfony (parties 2 à 4)'],
  ['http://localhost:8082/_profiler', 'Profiler Symfony'],
  ['http://localhost:8090', 'Adminer (serveur db, utilisateur app, mot de passe app)'],
]

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`
  return `${(bytes / 1024 / 1024).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Mo`
}

export function ResourcesPage() {
  const track = useTrack()
  const [manifest, setManifest] = useState<DownloadsManifest | null>(null)
  const visibleCommands = commands.filter(([, , reactOnly]) => track.profiles || !reactOnly)

  useEffect(() => {
    document.title = `Ressources — ${track.title} — Formation TaskBoard`
  }, [track])

  useEffect(() => {
    const controller = new AbortController()
    fetch('/downloads/manifest.json', { signal: controller.signal })
      .then((r) => (r.ok ? (r.json() as Promise<DownloadsManifest>) : null))
      .then(setManifest)
      .catch(() => {})
    return () => controller.abort()
  }, [])

  return (
    <main className="page">
      <h1>Ressources</h1>

      <section>
        <h2>Téléchargements</h2>
        <div className="download-grid">
          {downloads.map((d) => {
            const info = manifest?.files.find((f) => f.file === d.file)
            return (
              <a key={d.file} className="download-card" href={`/downloads/${d.file}`} download>
                <span className="download-icon">{d.icon}</span>
                <span>
                  <strong>{d.title}</strong>
                  <span className="muted small">
                    {' '}
                    · {d.file}
                    {info ? ` · ${formatSize(info.size)}` : ''}
                  </span>
                  <span className="download-desc">{d.description}</span>
                </span>
              </a>
            )
          })}
        </div>
        {manifest && (
          <p className="muted small">Version générée le {new Date(manifest.generatedAt).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}.</p>
        )}
        <p className="muted small">
          Prérequis : Docker et make. Sous Windows, décompressez l’archive dans WSL 2 (pas dans <code>/mnt/c</code>). Voir{' '}
          <Link to={routeOf(track, track.parts[0].pages[0].doc)}>l’organisation</Link> pour le dépannage.
        </p>
      </section>

      <section>
        <h2>Mémo des commandes</h2>
        <div className="table-wrapper">
          <table>
            <tbody>
              {visibleCommands.map(([command, label]) => (
                <tr key={command}>
                  <td>
                    <code>{command}</code>
                  </td>
                  <td>{label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2>URLs en local (après <code>make up</code>)</h2>
        <div className="table-wrapper">
          <table>
            <tbody>
              {urls.map(([url, label]) => (
                <tr key={url}>
                  <td>
                    <code>{url}</code>
                  </td>
                  <td>{label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2>Documentation officielle</h2>
        <ul className="link-list">
          <li><a href="https://www.php.net/manual/fr/" target="_blank" rel="noreferrer">Manuel PHP</a></li>
          <li><a href="https://symfony.com/doc/7.4/index.html" target="_blank" rel="noreferrer">Documentation Symfony 7.4</a></li>
          <li><a href="https://www.doctrine-project.org/projects/doctrine-orm/en/current/index.html" target="_blank" rel="noreferrer">Doctrine ORM</a></li>
          <li><a href="https://www.doctrine-project.org/projects/doctrine-orm/en/current/reference/dql-doctrine-query-language.html" target="_blank" rel="noreferrer">Référence DQL</a></li>
          {track.profiles ? (
            <>
              <li><a href="https://react.dev/learn" target="_blank" rel="noreferrer">react.dev — Apprendre React</a></li>
              <li><a href="https://www.typescriptlang.org/docs/handbook/intro.html" target="_blank" rel="noreferrer">Handbook TypeScript</a></li>
            </>
          ) : (
            <>
              <li><a href="https://developer.mozilla.org/fr/docs/Web/HTTP" target="_blank" rel="noreferrer">MDN — HTTP</a></li>
              <li><a href="https://www.postgresql.org/docs/17/tutorial.html" target="_blank" rel="noreferrer">Tutoriel PostgreSQL</a></li>
              <li><a href="https://cheatsheetseries.owasp.org/" target="_blank" rel="noreferrer">OWASP Cheat Sheets (sécurité)</a></li>
            </>
          )}
        </ul>
      </section>
    </main>
  )
}
