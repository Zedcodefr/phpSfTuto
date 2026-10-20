// Les cours Markdown sont embarqués dans le bundle au moment du build.
// (Le dossier formateur/ n'est volontairement PAS importé : il est servi par le serveur, derrière l'auth.)
const files = import.meta.glob('../../../../docs/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const docs = new Map<string, string>()
for (const [path, content] of Object.entries(files)) {
  docs.set(path.replace(/^.*?\/docs\//, ''), content)
}

/** Contenu Markdown d'un fichier de docs/ (chemin relatif à docs/), ou undefined s'il n'existe pas encore */
export function getDoc(doc: string): string | undefined {
  return docs.get(doc)
}

export function hasDoc(doc: string): boolean {
  return docs.has(doc)
}
