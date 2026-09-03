import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Session state.
 *
 * There is no backend and no real authentication here — `signIn` accepts anything and the
 * screen says so out loud. That honesty is deliberate: a prototype login that *looks* like
 * it verifies credentials teaches people to type real passwords into a demo.
 *
 * The shape is the part worth keeping. Swapping the fake delay for a fetch means changing
 * `signIn` alone; the guard, the redirect and the pending state already behave correctly.
 */

export interface SessionUser {
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  user: SessionUser | null;
  signIn: (email: string) => Promise<SessionUser>;
  signOut: () => void;
}

/** Derives a presentable name from the address, so the demo does not ask for one. */
function nameFromEmail(email: string) {
  const local = email.split('@')[0] ?? 'user';
  return (
    local
      .split(/[._-]+/)
      .filter(Boolean)
      .map((w) => w[0]!.toUpperCase() + w.slice(1))
      .join(' ') || 'Operator'
  );
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,

      signIn: async (email) => {
        // A deliberate, visible wait. Authentication is the one place users expect a
        // pause, and a login that returns instantly reads as "it did not check anything".
        await new Promise((r) => setTimeout(r, 1900));
        const user: SessionUser = {
          name: nameFromEmail(email),
          email,
          role: 'Warehouse Manager',
        };
        set({ user });
        return user;
      },

      signOut: () => set({ user: null }),
    }),
    { name: 'axis.session' }
  )
);
