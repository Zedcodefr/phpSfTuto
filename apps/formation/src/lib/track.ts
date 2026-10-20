import { useLocation } from 'react-router'
import { getTrack, trackFromPath, type Track, type TrackId } from '../content/manifest'
import { useStoredState } from './storage'

/** Dernière formation consultée (utile sur les pages communes, comme /formateur) */
export function useLastTrack(): [TrackId, (id: TrackId) => void] {
  return useStoredState<TrackId>('last-track', 'csharp')
}

/** Formation courante, déduite de l’URL (ou la dernière consultée sur les pages communes) */
export function useTrack(): Track {
  const { pathname } = useLocation()
  const [last] = useLastTrack()
  return trackFromPath(pathname) ?? getTrack(last)
}

/**
 * Clé de stockage propre à une formation. La formation C# garde les clés historiques
 * (« done », « quiz-results ») pour ne pas perdre la progression déjà enregistrée.
 */
export function trackKey(track: Track, key: string): string {
  return track.id === 'csharp' ? key : `${track.id}:${key}`
}
