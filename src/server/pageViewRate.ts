/**
 * Frein sur la route de capture du trafic anonyme.
 *
 * Route publique et sans authentification : sans limite, un client fait
 * pourrait la bombarder pour gonfler les statistiques. Même principe que
 * src/server/recoveryRate.ts.
 */

const MAX_CAPTURES = 60;
const WINDOW_MS = 60_000;

interface Window {
  count: number;
  startedAt: number;
}

const windows = new Map<string, Window>();

export const pageViewLimiter = {
  check(ip: string): boolean {
    const entry = windows.get(ip);
    if (!entry) return true;
    if (Date.now() - entry.startedAt > WINDOW_MS) {
      windows.delete(ip);
      return true;
    }
    return entry.count < MAX_CAPTURES;
  },

  register(ip: string): void {
    const entry = windows.get(ip);
    if (!entry || Date.now() - entry.startedAt > WINDOW_MS) {
      windows.set(ip, { count: 1, startedAt: Date.now() });
      return;
    }
    entry.count += 1;
  },
};
