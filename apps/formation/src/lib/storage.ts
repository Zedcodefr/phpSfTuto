import { useCallback, useSyncExternalStore } from 'react'

// localStorage peut être indisponible (navigation privée, stockage bloqué) :
// chaque accès est protégé et l'application fonctionne sans.

const PREFIX = 'taskboard-formation:'
const listeners = new Set<() => void>()
const memory = new Map<string, string>()

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(PREFIX + key)
  } catch {
    return memory.get(key) ?? null
  }
}

function write(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(PREFIX + key)
    else window.localStorage.setItem(PREFIX + key, value)
  } catch {
    if (value === null) memory.delete(key)
    else memory.set(key, value)
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  const onStorage = (event: StorageEvent) => {
    if (event.key?.startsWith(PREFIX)) listener()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

/**
 * État persistant en localStorage, partagé entre composants et onglets.
 * La valeur est stockée en JSON ; on mémorise la chaîne brute pour garder une référence stable.
 */
export function useStoredState<T>(key: string, fallback: T): [T, (value: T) => void] {
  const raw = useSyncExternalStore(subscribe, () => read(key), () => null)
  let value = fallback
  if (raw !== null) {
    try {
      value = JSON.parse(raw) as T
    } catch {
      value = fallback
    }
  }
  const setValue = useCallback((next: T) => write(key, JSON.stringify(next)), [key])
  return [value, setValue]
}
