export type Session = { name: string } | null;

export const AV_USER_KEY = "av_user";
export const AV_SCORES_KEY = "av_scores";

export type SavedScore = { game: string; score: number; name: string; at: number };

const SESSION_EVENT = "av-session-changed";

export function getSession(): Session {
  try {
    return JSON.parse(localStorage.getItem(AV_USER_KEY) || "null");
  } catch {
    return null;
  }
}

export function setSession(session: Session): void {
  try {
    localStorage.setItem(AV_USER_KEY, JSON.stringify(session));
  } catch {
    // localStorage no disponible (p.ej. modo privado); la sesión no persiste.
  }
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function clearSession(): void {
  try {
    localStorage.removeItem(AV_USER_KEY);
  } catch {
    // localStorage no disponible; nada que limpiar.
  }
  window.dispatchEvent(new Event(SESSION_EVENT));
}

/** Permite a componentes (p.ej. Nav) reaccionar a cambios de sesión vía useSyncExternalStore. */
export function subscribeSession(callback: () => void): () => void {
  window.addEventListener(SESSION_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(SESSION_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function appendScore(entry: Omit<SavedScore, "at">): void {
  try {
    const all: SavedScore[] = JSON.parse(localStorage.getItem(AV_SCORES_KEY) || "[]");
    all.push({ ...entry, at: Date.now() });
    localStorage.setItem(AV_SCORES_KEY, JSON.stringify(all));
  } catch {
    // localStorage no disponible o JSON corrupto; la puntuación no persiste.
  }
}
