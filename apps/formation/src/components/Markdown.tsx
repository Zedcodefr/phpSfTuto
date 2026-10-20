import { common } from 'lowlight'
import nginx from 'highlight.js/lib/languages/nginx'
import dockerfile from 'highlight.js/lib/languages/dockerfile'
import { useRef, useState, type ComponentProps, type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import { Link } from 'react-router'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import { linkToDoc } from '../content/manifest'
import { useTrack } from '../lib/track'
import { resolveLink } from '../lib/paths'

const languages = { ...common, nginx, dockerfile }

type Props = {
  children: string
  /** Chemin du fichier depuis la racine du dépôt, pour résoudre les liens relatifs */
  basePath: string
}

export function Markdown({ children, basePath }: Props) {
  return (
    <div className="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSlug, [rehypeHighlight, { languages, detect: false }]]}
        components={{
          a: ({ href, children: label, node: _node, ...rest }) => (
            <SmartLink href={href ?? ''} basePath={basePath} {...rest}>
              {label}
            </SmartLink>
          ),
          pre: Pre,
          table: ({ node: _node, ...rest }) => (
            <div className="table-wrapper">
              <table {...rest} />
            </div>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}

function SmartLink({ href, basePath, children, ...rest }: { href: string; basePath: string; children: ReactNode } & ComponentProps<'a'>) {
  const track = useTrack()
  const link = resolveLink(href, basePath)
  switch (link.kind) {
    case 'external':
      return (
        <a href={link.href} target="_blank" rel="noreferrer noopener" {...rest}>
          {children}
        </a>
      )
    case 'anchor':
      return (
        <a href={link.href} {...rest}>
          {children}
        </a>
      )
    case 'doc':
      return <Link to={linkToDoc(track, link.doc) + link.hash}>{children}</Link>
    case 'repo':
      return (
        <span className="repo-ref" title={`Fichier du projet téléchargé : ${link.path}`}>
          <span aria-hidden="true">📁 </span>
          {children}
        </span>
      )
  }
}

function Pre({ children, node: _node, ...rest }: ComponentProps<'pre'> & { node?: unknown }) {
  const ref = useRef<HTMLPreElement>(null)
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(ref.current?.textContent ?? '')
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // presse-papiers indisponible (contexte non sécurisé) : rien à faire
    }
  }

  return (
    <div className="code-block">
      <button type="button" className="copy-button" onClick={copy} aria-label="Copier le code">
        {copied ? 'Copié ✓' : 'Copier'}
      </button>
      <pre ref={ref} {...rest}>
        {children}
      </pre>
    </div>
  )
}
