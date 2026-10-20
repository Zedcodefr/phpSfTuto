/** Logo zedcode (le « Z »), repris de zedcode.fr. Prend la couleur du texte courant (currentColor). */
export function LogoMark({ height = 28 }: { height?: number }) {
  return (
    <svg viewBox="0 0 33.362 66.05" fill="currentColor" aria-hidden="true" style={{ height, width: 'auto', display: 'block' }}>
      <polygon points="9.311,18.610 32.697,31.412 33.290,31.115 33.362,18.256 33.186,18.353 33.186,18.166 0,0 0.077,13.484" />
      <polygon points="13.870,26.537 0,34.122 0,47.775 27.514,34.006" />
      <polygon points="5.103,50.549 33.362,66.050 33.362,52.378 18.113,44.039" />
    </svg>
  )
}
