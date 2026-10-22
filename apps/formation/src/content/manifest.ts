// Formations et parcours : ordre des étapes et public de chaque page.
// Deux formations partagent le même projet TaskBoard : « C# → PHP · Symfony · React » et « Vue → PHP · Symfony ».
// Le parcours se fait à son rythme : aucune notion de durée n'est affichée aux stagiaires.
// Les fichiers référencés sont dans docs/ à la racine du dépôt.

export type Audience = 'back' | 'front' | 'tous'
export type Profile = 'back' | 'front'

export type PageEntry = {
  /** Chemin du fichier Markdown relatif à docs/ */
  doc: string
  title: string
  audience: Audience
  quiz?: string
  note?: string
}

export type Part = {
  id: string
  title: string
  subtitle: string
  audience: Audience
  pages: PageEntry[]
  /** Étapes sans support écrit (démo, rétro...) */
  milestones?: { label: string; audience: Audience }[]
}

const csharpParts: Part[] = [
  {
    id: 'demarrage',
    title: 'Démarrage',
    subtitle: 'Organisation, règles du jeu et contrat d’API',
    audience: 'tous',
    pages: [
      { doc: '00-organisation.md', title: 'Organisation', audience: 'tous' },
      { doc: '00-charte-ia.md', title: 'Charte IA', audience: 'tous' },
      { doc: 'api-contract.md', title: 'Contrat d’API', audience: 'tous' },
    ],
  },
  {
    id: 'php',
    title: 'Étape 1 — PHP',
    subtitle: 'Le langage, puis une API REST écrite en PHP pur, à trois',
    audience: 'back',
    pages: [
      { doc: '01-php/README.md', title: 'Présentation de la partie', audience: 'back' },
      { doc: '01-php/01-principes.md', title: 'Principes de PHP', audience: 'back', quiz: 'php-principes' },
      { doc: '01-php/02-grammaire.md', title: 'La grammaire PHP', audience: 'back', quiz: 'php-grammaire' },
      { doc: '01-php/03-php-et-http.md', title: 'PHP & HTTP', audience: 'back', quiz: 'php-http' },
      {
        doc: '01-php/04-exercices-api-php-pur.md',
        title: 'Exercices : API en PHP pur',
        audience: 'back',
        note: 'Mob programming · lots A/B/C en parallèle · intégration',
      },
    ],
    milestones: [{ label: 'Revue orale des lots & débrief', audience: 'back' }],
  },
  {
    id: 'symfony',
    title: 'Étape 2 — Symfony',
    subtitle: 'Le framework, comparé à ASP.NET Core',
    audience: 'back',
    pages: [
      { doc: '02-symfony/README.md', title: 'Présentation de la partie', audience: 'back' },
      { doc: '02-symfony/01-principes.md', title: 'Principes de Symfony', audience: 'back', quiz: 'symfony-principes' },
      { doc: '02-symfony/02-particularites.md', title: 'Particularités', audience: 'back', quiz: 'symfony-particularites' },
      { doc: '02-symfony/03-visite-du-projet.md', title: 'Visite du projet', audience: 'back' },
      {
        doc: '02-symfony/05-atelier-pratique.md',
        title: 'Atelier pratique',
        audience: 'back',
        note: '5 exercices avec tests · make sf-atelier · débrief',
      },
    ],
  },
  {
    id: 'doctrine',
    title: 'Étape 3 — Doctrine & DQL',
    subtitle: 'L’ORM en profondeur, comparé à Entity Framework',
    audience: 'back',
    pages: [
      { doc: '03-doctrine/README.md', title: 'Présentation de la partie', audience: 'back' },
      { doc: '03-doctrine/01-orm-et-mapping.md', title: 'ORM & mapping', audience: 'back', quiz: 'doctrine-orm' },
      { doc: '03-doctrine/02-relations.md', title: 'Relations', audience: 'back', quiz: 'doctrine-relations' },
      { doc: '03-doctrine/03-dql-et-query-builder.md', title: 'DQL & QueryBuilder', audience: 'back', quiz: 'doctrine-dql' },
      { doc: '03-doctrine/04-kata-doctrine.md', title: 'Kata Doctrine', audience: 'back' },
    ],
  },
  {
    id: 'projet',
    title: 'Étape 4 — Projet Symfony',
    subtitle: 'Le backlog à trois devs back : socle obligatoire, puis bonus',
    audience: 'back',
    pages: [
      {
        doc: '02-symfony/04-backlog-back.md',
        title: 'Backlog back',
        audience: 'back',
        note: 'Socle obligatoire d’abord, puis bonus',
      },
    ],
    milestones: [{ label: 'Intégration, démo, oraux & rétrospective', audience: 'tous' }],
  },
  {
    id: 'react',
    title: 'Front — React',
    subtitle: 'React + TypeScript pour un dev C#, en parallèle des étapes back',
    audience: 'front',
    pages: [
      { doc: '04-react/README.md', title: 'Présentation de la partie', audience: 'front' },
      { doc: '04-react/01-principes.md', title: 'Principes de React', audience: 'front', quiz: 'react-principes' },
      { doc: '04-react/02-particularites.md', title: 'Particularités & pièges', audience: 'front', quiz: 'react-particularites' },
      {
        doc: '04-react/03-exercices-front.md',
        title: 'Exercices front',
        audience: 'front',
        note: 'F1-F4 pendant l’étape PHP · F5-F7 pendant Symfony/Doctrine · F8-F10 pendant le projet (F11 en bonus)',
      },
    ],
  },
]


const vueParts: Part[] = [
  {
    id: 'demarrage',
    title: 'Démarrage',
    subtitle: 'Organisation, règles du jeu et contrat d’API',
    audience: 'tous',
    pages: [
      { doc: 'vue/00-organisation.md', title: 'Organisation', audience: 'tous' },
      { doc: '00-charte-ia.md', title: 'Charte IA', audience: 'tous' },
      { doc: 'api-contract.md', title: 'Contrat d’API', audience: 'tous' },
    ],
  },
  {
    id: 'fondamentaux',
    title: 'Étape 1 — Fondamentaux back-end',
    subtitle: 'Ce qui se passe de l’autre côté de vos appels fetch / axios',
    audience: 'back',
    pages: [
      { doc: 'vue/01-fondamentaux/README.md', title: 'Présentation de la partie', audience: 'back' },
      { doc: 'vue/01-fondamentaux/01-le-back-end-et-http.md', title: 'Le back-end et HTTP', audience: 'back', quiz: 'vue-back-http' },
      { doc: 'vue/01-fondamentaux/02-sql-et-bases-relationnelles.md', title: 'SQL & bases relationnelles', audience: 'back', quiz: 'vue-back-sql' },
      { doc: 'vue/01-fondamentaux/03-securite-cote-serveur.md', title: 'Sécurité côté serveur', audience: 'back', quiz: 'vue-back-securite' },
    ],
  },
  {
    id: 'php',
    title: 'Étape 2 — PHP',
    subtitle: 'Le langage, comparé à JavaScript / TypeScript, puis une API REST en PHP pur, à trois',
    audience: 'back',
    pages: [
      { doc: 'vue/02-php/README.md', title: 'Présentation de la partie', audience: 'back' },
      { doc: 'vue/02-php/01-principes.md', title: 'Principes de PHP', audience: 'back', quiz: 'vue-php-principes' },
      { doc: 'vue/02-php/02-grammaire.md', title: 'La grammaire PHP', audience: 'back', quiz: 'vue-php-grammaire' },
      { doc: 'vue/02-php/03-php-et-http.md', title: 'PHP & HTTP', audience: 'back', quiz: 'vue-php-http' },
      {
        doc: 'vue/02-php/04-exercices-api-php-pur.md',
        title: 'Exercices : API en PHP pur',
        audience: 'back',
        note: 'Mob programming · lots A/B/C en parallèle · intégration',
      },
    ],
    milestones: [{ label: 'Revue orale des lots & débrief', audience: 'back' }],
  },
  {
    id: 'symfony',
    title: 'Étape 3 — Symfony',
    subtitle: 'Le framework, comparé à ce que vous connaissez de Vue et de Node',
    audience: 'back',
    pages: [
      { doc: 'vue/03-symfony/README.md', title: 'Présentation de la partie', audience: 'back' },
      { doc: 'vue/03-symfony/01-principes.md', title: 'Principes de Symfony', audience: 'back', quiz: 'vue-symfony-principes' },
      { doc: 'vue/03-symfony/02-particularites.md', title: 'Particularités', audience: 'back', quiz: 'vue-symfony-particularites' },
      { doc: 'vue/03-symfony/03-visite-du-projet.md', title: 'Visite du projet', audience: 'back' },
      {
        doc: 'vue/03-symfony/04-atelier-pratique.md',
        title: 'Atelier pratique',
        audience: 'back',
        note: '5 exercices avec tests · make sf-atelier · débrief',
      },
    ],
  },
  {
    id: 'doctrine',
    title: 'Étape 4 — Doctrine & DQL',
    subtitle: 'L’ORM : du SQL aux objets',
    audience: 'back',
    pages: [
      { doc: 'vue/04-doctrine/README.md', title: 'Présentation de la partie', audience: 'back' },
      { doc: 'vue/04-doctrine/01-orm-et-mapping.md', title: 'ORM & mapping', audience: 'back', quiz: 'vue-doctrine-orm' },
      { doc: 'vue/04-doctrine/02-relations.md', title: 'Relations', audience: 'back', quiz: 'vue-doctrine-relations' },
      { doc: 'vue/04-doctrine/03-dql-et-query-builder.md', title: 'DQL & QueryBuilder', audience: 'back', quiz: 'vue-doctrine-dql' },
      { doc: 'vue/04-doctrine/04-kata-doctrine.md', title: 'Kata Doctrine', audience: 'back' },
    ],
  },
  {
    id: 'projet',
    title: 'Étape 5 — Projet Symfony',
    subtitle: 'Le backlog à trois devs back : socle obligatoire, puis bonus',
    audience: 'back',
    pages: [
      { doc: 'vue/05-projet/backlog-back.md', title: 'Backlog back', audience: 'back', note: 'Socle obligatoire d’abord, puis bonus' },
      { doc: 'vue/05-projet/bonus-front-vue.md', title: 'Bonus : brancher un front Vue', audience: 'back' },
    ],
    milestones: [{ label: 'Intégration, démo, oraux & rétrospective', audience: 'tous' }],
  },
]

export type TrackId = 'csharp' | 'vue'

export type Track = {
  id: TrackId
  /** Libellé complet (sous-onglet, titre du navigateur) */
  title: string
  shortTitle: string
  /** Préfixe des routes : '' pour la formation historique, '/vue' pour la formation Vue */
  base: string
  /** Préfixe retiré des chemins de docs dans les URL (« vue/ ») */
  docPrefix: string
  /** Public visé (surtitre de l’accueil) */
  audienceNote: string
  headline: string
  headlineAccent: string
  lead: string
  footer: string
  parts: Part[]
  /** true : choix « Dev back / Dev front » ; false : tout le monde suit le parcours back */
  profiles: boolean
}

export const tracks: Track[] = [
  {
    id: 'csharp',
    title: 'C# → PHP · Symfony · React',
    shortTitle: 'C# → PHP',
    base: '',
    docPrefix: '',
    audienceNote: 'Formation pour développeurs C# / .NET',
    headline: 'PHP · Symfony · Doctrine · ',
    headlineAccent: 'React',
    lead:
      'Un projet fil rouge, TaskBoard, construit à 4 : trois devs back écrivent une API REST d’abord en PHP pur, puis avec Symfony et Doctrine ; un dev front la consomme en React. Le fonctionnel est entièrement spécifié : vous vous concentrez sur la technique.',
    footer: 'Formation PHP · Symfony · Doctrine · React pour développeurs C#',
    parts: csharpParts,
    profiles: true,
  },
  {
    id: 'vue',
    title: 'Vue → PHP · Symfony',
    shortTitle: 'Vue → PHP',
    base: '/vue',
    docPrefix: 'vue/',
    audienceNote: 'Formation pour développeurs front Vue.js qui passent au back',
    headline: 'Du front Vue au back ',
    headlineAccent: 'PHP · Symfony',
    lead:
      'Vous consommez des API tous les jours : cette fois, vous les écrivez. Même projet fil rouge, TaskBoard, à trois devs back : les fondamentaux du back-end, puis une API REST en PHP pur, puis Symfony et Doctrine. Le fonctionnel est entièrement spécifié : vous vous concentrez sur la technique.',
    footer: 'Formation PHP · Symfony · Doctrine pour développeurs Vue.js',
    parts: vueParts,
    profiles: false,
  },
]

export const defaultTrack: Track = tracks[0]

export function getTrack(id: string | null | undefined): Track {
  return tracks.find((t) => t.id === id) ?? defaultTrack
}

/** Formation correspondant à une URL (« /vue/... » → vue, sinon la formation C#) */
export function trackFromPath(pathname: string): Track | null {
  if (pathname === '/formateur' || pathname.startsWith('/formateur/')) return null
  return tracks.find((t) => t.base !== '' && (pathname === t.base || pathname.startsWith(`${t.base}/`))) ?? defaultTrack
}

export function allPages(track: Track): PageEntry[] {
  return track.parts.flatMap((part) => part.pages)
}

export function hasPage(track: Track, doc: string): boolean {
  return allPages(track).some((page) => page.doc === doc)
}

/** vue/02-php/README.md -> 02-php (formation vue) ; 01-php/02-grammaire.md -> 01-php/02-grammaire */
export function slugOf(track: Track, doc: string): string {
  const relative = track.docPrefix && doc.startsWith(track.docPrefix) ? doc.slice(track.docPrefix.length) : doc
  return relative.replace(/(^|\/)README\.md$/, '').replace(/\.md$/, '') || 'README'
}

export function routeOf(track: Track, doc: string): string {
  return `${track.base}/cours/${slugOf(track, doc)}`
}

export function homeOf(track: Track): string {
  return track.base || '/'
}

export function pathIn(track: Track, path: string): string {
  return `${track.base}${path}`
}

export function pageBySlug(track: Track, slug: string): PageEntry | undefined {
  return allPages(track).find((page) => slugOf(track, page.doc) === slug)
}

/**
 * Route vers un fichier de docs depuis la formation courante : dans la formation courante si la page en fait partie,
 * sinon dans l’autre formation qui la contient, sinon (page hors parcours) dans la formation courante.
 */
export function linkToDoc(current: Track, doc: string): string {
  if (hasPage(current, doc)) return routeOf(current, doc)
  const other = tracks.find((t) => t.id !== current.id && hasPage(t, doc))
  if (other) return routeOf(other, doc)
  if (current.docPrefix && !doc.startsWith(current.docPrefix)) {
    const owner = tracks.find((t) => t.docPrefix === '')
    if (owner) return routeOf(owner, doc)
  }
  return routeOf(current, doc)
}

/** Candidats de fichiers pour un slug hors parcours (ex. un README de dossier non listé) */
export function docCandidates(track: Track, slug: string): string[] {
  const prefixed = track.docPrefix ? [`${track.docPrefix}${slug}.md`, `${track.docPrefix}${slug}/README.md`] : []
  return [...prefixed, `${slug}.md`, `${slug}/README.md`]
}

export function concerns(audience: Audience, profile: Profile): boolean {
  return audience === 'tous' || audience === profile
}
