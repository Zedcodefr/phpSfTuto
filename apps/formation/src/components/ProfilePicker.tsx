import type { Profile } from '../content/manifest'

export function ProfilePicker({ onPick }: { onPick: (profile: Profile) => void }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="profile-title">
      <div className="modal">
        <h2 id="profile-title">Bienvenue 👋</h2>
        <p>Quel est votre rôle dans l’équipe ? Le parcours mettra en avant les cours qui vous concernent (les autres restent accessibles).</p>
        <div className="profile-choices">
          <button type="button" className="profile-choice" onClick={() => onPick('back')}>
            <span className="profile-icon">⚙️</span>
            <strong>Dev back</strong>
            <small>PHP, Symfony, Doctrine — 3 devs</small>
          </button>
          <button type="button" className="profile-choice" onClick={() => onPick('front')}>
            <span className="profile-icon">🎨</span>
            <strong>Dev front</strong>
            <small>React + TypeScript — 1 dev</small>
          </button>
        </div>
        <p className="muted small">Modifiable à tout moment depuis la barre du haut.</p>
      </div>
    </div>
  )
}
