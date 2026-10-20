import { useEffect, useState } from 'react'
import { LogoMark } from './LogoMark'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { homeOf, pathIn, routeOf, tracks, trackFromPath } from '../content/manifest'
import { useProfile, useTheme, type Theme } from '../lib/progress'
import { useLastTrack, useTrack } from '../lib/track'
import { ProfilePicker } from './ProfilePicker'

const themeLabels: Record<Theme, string> = { system: '🖥️ Auto', light: '☀️ Clair', dark: '🌙 Sombre' }
const nextTheme: Record<Theme, Theme> = { system: 'light', light: 'dark', dark: 'system' }

export function Layout() {
  const [theme, setTheme] = useTheme()
  const [profile, setProfile] = useProfile()
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const track = useTrack()
  const [lastTrack, setLastTrack] = useLastTrack()
  const onFormateur = trackFromPath(location.pathname) === null

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Mémorise la formation consultée (pour les pages communes comme /formateur)
  useEffect(() => {
    const current = trackFromPath(location.pathname)
    if (current && current.id !== lastTrack) setLastTrack(current.id)
  }, [location.pathname, lastTrack, setLastTrack])

  // Défilement : vers l'ancre si présente, sinon en haut de page
  useEffect(() => {
    if (location.hash) {
      const id = decodeURIComponent(location.hash.slice(1))
      window.requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView())
    } else {
      window.scrollTo(0, 0)
    }
  }, [location.pathname, location.hash])

  const showProfiles = track.profiles && !onFormateur

  return (
    <div className="app">
      <header className="topbar">
        <Link to={homeOf(track)} className="brand">
          <span className="brand-mark">
            <LogoMark height={30} />
          </span>
          <span className="brand-name">
            <strong>Formation TaskBoard</strong>
            <small>zedcode</small>
          </span>
        </Link>
        <button type="button" className="menu-button" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
          ☰ Menu
        </button>
        <nav
          className={`topnav ${menuOpen ? 'open' : ''}`}
          // Ferme le menu mobile quand on clique sur un lien
          onClick={(event) => {
            if ((event.target as HTMLElement).closest('a')) setMenuOpen(false)
          }}
        >
          <NavLink to={homeOf(track)} end>
            Accueil
          </NavLink>
          <NavLink to={pathIn(track, '/parcours')}>Parcours</NavLink>
          <NavLink to={routeOf(track, track.parts[0].pages[0].doc)} className={location.pathname.startsWith(pathIn(track, '/cours')) ? 'active' : ''}>
            Cours
          </NavLink>
          <NavLink to={pathIn(track, '/ressources')}>Ressources</NavLink>
          <NavLink to="/formateur">Formateur</NavLink>
          <span className="topnav-sep" />
          {showProfiles && profile && (
            <button type="button" className="chip" onClick={() => setProfile(null)} title="Changer de profil">
              {profile === 'back' ? '⚙️ Dev back' : '🎨 Dev front'}
            </button>
          )}
          <button type="button" className="chip" onClick={() => setTheme(nextTheme[theme])} title="Changer de thème">
            {themeLabels[theme]}
          </button>
        </nav>
      </header>

      <nav className="track-bar" aria-label="Formations">
        <span className="track-bar-label">Formations</span>
        <div className="track-tabs">
          {tracks.map((t) => (
            <Link
              key={t.id}
              to={homeOf(t)}
              className={`track-tab ${!onFormateur && t.id === track.id ? 'active' : ''}`}
              aria-current={!onFormateur && t.id === track.id ? 'page' : undefined}
            >
              {t.title}
            </Link>
          ))}
        </div>
      </nav>

      {showProfiles && profile === null && <ProfilePicker onPick={setProfile} />}
      <Outlet />
      <footer className="footer">zedcode — {track.footer} — projet fil rouge TaskBoard</footer>
    </div>
  )
}
