import { useCallback } from 'react'
import type { Profile, Track } from '../content/manifest'
import { trackKey } from './track'
import { useStoredState } from './storage'

export type QuizResult = { score: number; total: number; date: string }

export function useProfile(): [Profile | null, (profile: Profile | null) => void] {
  return useStoredState<Profile | null>('profile', null)
}

/** Pages terminées, par formation */
export function useDone(track: Track): { done: string[]; isDone: (doc: string) => boolean; toggle: (doc: string) => void } {
  const [done, setDone] = useStoredState<string[]>(trackKey(track, 'done'), [])
  const isDone = useCallback((doc: string) => done.includes(doc), [done])
  const toggle = useCallback(
    (doc: string) => setDone(done.includes(doc) ? done.filter((d) => d !== doc) : [...done, doc]),
    [done, setDone],
  )
  return { done, isDone, toggle }
}

/** Résultats des quiz, par formation */
export function useQuizResults(track: Track): [Record<string, QuizResult>, (id: string, result: QuizResult) => void] {
  const [results, setResults] = useStoredState<Record<string, QuizResult>>(trackKey(track, 'quiz-results'), {})
  const save = useCallback((id: string, result: QuizResult) => setResults({ ...results, [id]: result }), [results, setResults])
  return [results, save]
}

export type Theme = 'light' | 'dark' | 'system'

export function useTheme(): [Theme, (theme: Theme) => void] {
  return useStoredState<Theme>('theme', 'dark') // sombre = charte zedcode.fr
}
