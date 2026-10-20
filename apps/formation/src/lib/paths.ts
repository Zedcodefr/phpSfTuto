/** Normalise un chemin "a/b/../c/./d" -> "a/c/d" (null s'il sort de la racine du dépôt) */
export function normalize(path: string): string | null {
  const out: string[] = []
  for (const segment of path.split('/')) {
    if (segment === '' || segment === '.') continue
    if (segment === '..') {
      if (out.length === 0) return null
      out.pop()
    } else {
      out.push(segment)
    }
  }
  return out.join('/')
}

export type ResolvedLink =
  | { kind: 'external'; href: string }
  | { kind: 'anchor'; href: string }
  | { kind: 'doc'; doc: string; hash: string }
  | { kind: 'repo'; path: string }

/**
 * Résout un lien Markdown écrit pour GitHub, relativement au fichier courant.
 * @param href lien tel qu'écrit dans le Markdown
 * @param basePath chemin du fichier courant depuis la racine du dépôt (ex. "docs/01-php/02-grammaire.md")
 */
export function resolveLink(href: string, basePath: string): ResolvedLink {
  if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//')) return { kind: 'external', href }
  if (href.startsWith('#')) return { kind: 'anchor', href }

  const [pathPart, hashPart] = href.split('#', 2)
  const dir = basePath.includes('/') ? basePath.slice(0, basePath.lastIndexOf('/') + 1) : ''
  const target = normalize(dir + decodeURI(pathPart))
  const hash = hashPart ? `#${hashPart}` : ''

  if (target === null) return { kind: 'repo', path: href }
  if (target.startsWith('docs/') && target.endsWith('.md')) {
    return { kind: 'doc', doc: target.slice('docs/'.length), hash }
  }
  if (target === 'docs' || (target.startsWith('docs/') && !target.includes('.'))) {
    // lien vers un dossier de docs : son README
    const folder = target.slice('docs'.length).replace(/^\//, '')
    return { kind: 'doc', doc: folder ? `${folder}/README.md` : 'README.md', hash }
  }
  return { kind: 'repo', path: target + hash }
}
