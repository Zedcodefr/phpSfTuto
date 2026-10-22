// Génère les ressources téléchargeables à partir du dépôt :
//   public/downloads/taskboard-projet.zip  projet de départ des stagiaires (sans formateur/ ni dépendances)
//   public/downloads/taskboard-cours.zip   cours Markdown
//   public/downloads/manifest.json         tailles + date de génération
//   protected/guide.md, protected/questions-comprehension(-vue).md, protected/solutions.zip   (servis derrière l'auth)
import { zipSync } from 'fflate'
import { copyFileSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const appDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = join(appDir, '..', '..')
const downloadsDir = join(appDir, 'public', 'downloads')
const protectedDir = join(appDir, 'protected')

// Noms exclus à n'importe quel niveau
const EXCLUDED_NAMES = new Set(['vendor', 'node_modules', 'var', 'dist', '.phpunit.cache', '.DS_Store', '.idea', '.git', '.claude'])
// Chemins exclus (relatifs à la racine du dépôt)
const EXCLUDED_PATHS = new Set(['formateur', 'apps/formation', 'apps/api-symfony/public/bundles'])

function isExcluded(relPath, name) {
  if (EXCLUDED_NAMES.has(name)) return true
  if (EXCLUDED_PATHS.has(relPath)) return true
  if (name.startsWith('.env.local') || /^\.env\..+\.local$/.test(name)) return true
  return false
}

/** Ajoute récursivement un fichier ou dossier du dépôt à l'objet fflate { cheminDansZip: [données, options] } */
function addPath(entries, relPath, zipPrefix, { respectExclusions = true } = {}) {
  const absolute = join(repoRoot, relPath)
  if (!existsSync(absolute)) return
  const stat = lstatSync(absolute)
  if (stat.isSymbolicLink()) return
  if (stat.isDirectory()) {
    for (const name of readdirSync(absolute).sort()) {
      const child = relPath ? `${relPath}/${name}` : name
      if (respectExclusions && isExcluded(child, name)) continue
      if (!respectExclusions && EXCLUDED_NAMES.has(name)) continue
      addPath(entries, child, zipPrefix, { respectExclusions })
    }
    return
  }
  const executable = (stat.mode & 0o111) !== 0
  entries[`${zipPrefix}${relPath}`] = [
    readFileSync(absolute),
    // os: 3 = Unix ; les attributs externes portent les permissions (bin/console exécutable)
    { os: 3, attrs: ((executable ? 0o100755 : 0o100644) << 16) >>> 0, mtime: stat.mtime },
  ]
}

function writeZip(file, entries) {
  const data = zipSync(entries, { level: 9 })
  writeFileSync(file, data)
  return { file: relative(appDir, file), count: Object.keys(entries).length, size: data.length }
}

rmSync(downloadsDir, { recursive: true, force: true })
rmSync(protectedDir, { recursive: true, force: true })
mkdirSync(downloadsDir, { recursive: true })
mkdirSync(protectedDir, { recursive: true })

const report = []

// 1. Projet de départ
const project = {}
for (const path of ['README.md', 'Makefile', 'compose.yaml', '.editorconfig', '.gitattributes', '.gitignore', '.vscode', '.devcontainer', 'docker', 'docs', 'apps/api-php', 'apps/api-symfony', 'apps/front']) {
  addPath(project, path, 'taskboard/')
}
// .env racine : toujours la valeur par défaut (le front appelle l'API PHP pur), quel que soit l'état local
project['taskboard/.env'] = [new TextEncoder().encode('API_TARGET=http://api-php:8000\n'), { os: 3, attrs: (0o100644 << 16) >>> 0 }]
// README : on retire les blocs réservés au formateur (<!-- formateur:start --> … <!-- formateur:end -->)
const readme = project['taskboard/README.md']
readme[0] = new TextEncoder().encode(
  new TextDecoder().decode(readme[0]).replace(/<!-- formateur:start -->[\s\S]*?<!-- formateur:end -->\n*/g, ''),
)
// Garde-fou : rien de ce qui sert au formateur (déploiement, mots de passe, espace protégé) ne doit partir chez les stagiaires
const FORBIDDEN = ['formation-deploy', 'FORMATEUR_PASSWORD', 'serv.zedcode.fr', 'formateur:start', 'formateur:end']
for (const [path, [data]] of Object.entries(project)) {
  if (path.includes('/vendor/') || path.endsWith('.lock') || path.endsWith('package-lock.json')) continue
  const text = new TextDecoder().decode(data)
  const hit = FORBIDDEN.find((word) => text.includes(word))
  if (hit) throw new Error(`${path} contient « ${hit} » : contenu réservé au formateur dans le projet distribué`)
}
report.push(writeZip(join(downloadsDir, 'taskboard-projet.zip'), project))

// 2. Cours seuls
const courses = {}
addPath(courses, 'docs', 'taskboard-cours/')
report.push(writeZip(join(downloadsDir, 'taskboard-cours.zip'), courses))

// 3. Contenu formateur (protégé)
const optionalCopies = [
  ['formateur/README.md', 'guide.md'],
  ['formateur/questions-comprehension.md', 'questions-comprehension.md'],
  ['formateur/questions-comprehension-vue.md', 'questions-comprehension-vue.md'],
]
for (const [source, target] of optionalCopies) {
  if (existsSync(join(repoRoot, source))) {
    copyFileSync(join(repoRoot, source), join(protectedDir, target))
    report.push({ file: `protected/${target}`, count: 1, size: statSync(join(protectedDir, target)).size })
  } else {
    console.warn(`⚠️  ${source} absent : ignoré`)
  }
}
if (existsSync(join(repoRoot, 'formateur'))) {
  const solutions = {}
  addPath(solutions, 'formateur', '', { respectExclusions: false })
  report.push(writeZip(join(protectedDir, 'solutions.zip'), solutions))
}

writeFileSync(
  join(downloadsDir, 'manifest.json'),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      files: report.filter((r) => r.file.startsWith('public/downloads/')).map((r) => ({ file: r.file.replace('public/downloads/', ''), size: r.size })),
    },
    null,
    2,
  ),
)

for (const r of report) {
  console.log(`📦 ${r.file.padEnd(42)} ${String(r.count).padStart(5)} fichier(s)  ${(r.size / 1024).toFixed(0).padStart(7)} Ko`)
}
