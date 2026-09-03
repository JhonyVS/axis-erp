import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { AiDock } from '@/components/ai/AiDock';
import { CommandPalette } from '@/components/command/CommandPalette';
import { Toaster } from '@/components/ui/toast';
import { useUi } from '@/stores/uiStore';
import { useHotkey } from '@/lib/hooks';
import { primeAudio } from '@/lib/sound';
import { watchSystemTheme } from '@/stores/prefsStore';
import { useAuth } from '@/stores/authStore';
import { pageTransition } from '@/lib/motion';

import { Dashboard } from '@/modules/Dashboard';
import { Inventory } from '@/modules/warehouse/Inventory';
import { Directory } from '@/modules/hr/Directory';
import { Courses } from '@/modules/training/Courses';
import { Components } from '@/modules/Components';
import { Login } from '@/modules/Login';
import { Placeholder } from '@/modules/Placeholder';

function Shell() {
  const location = useLocation();
  const reduced = useReducedMotion();
  const { setCommandOpen, commandOpen, setAiOpen, aiOpen } = useUi();

  useHotkey({ key: 'k', meta: true }, () => setCommandOpen(!commandOpen));
  useHotkey({ key: 'j', meta: true }, () => setAiOpen(!aiOpen));
  useHotkey({ key: '/', meta: false }, () => setCommandOpen(true));

  // Browsers refuse to start audio before a real gesture. Priming on the first one means
  // the very first click that plays a sound actually makes one.
  useEffect(() => {
    const prime = () => primeAudio();
    window.addEventListener('pointerdown', prime, { once: true });
    window.addEventListener('keydown', prime, { once: true });
    return () => {
      window.removeEventListener('pointerdown', prime);
      window.removeEventListener('keydown', prime);
    };
  }, []);

  useEffect(() => watchSystemTheme(), []);

  // Scroll to the top on navigation. Landing mid-page on a fresh route is disorienting,
  // and the browser only restores scroll for history navigation, not for fresh pushes.
  useEffect(() => {
    document.getElementById('main')?.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <div className="flex h-dvh overflow-hidden bg-bg text-fg">
      {/* First thing in the tab order: a way past the navigation. */}
      <a href="#main" className="skip-link">
        Skip to main content
      </a>

      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />

        <main id="main" tabIndex={-1} className="flex-1 overflow-y-auto scroll-smooth p-4 focus:outline-none">
          {/*
            `mode="wait"` so the outgoing page finishes leaving before the next arrives —
            crossfading two full dashboards produces a moment where neither is readable.
          */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              variants={reduced ? undefined : pageTransition}
              initial="hidden"
              animate="show"
              exit="exit"
              className="mx-auto max-w-[1600px]"
            >
              <Routes location={location}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/components" element={<Components />} />

                <Route path="/warehouse" element={<Inventory />} />
                <Route
                  path="/warehouse/movements"
                  element={
                    <Placeholder
                      title="Stock movements"
                      description="Every receipt, issue, transfer and adjustment, with its audit trail."
                      planned={[
                        'Filter by movement type, item, bin and operator',
                        'Reverse an adjustment with a reason code',
                        'Export a date range to CSV',
                      ]}
                      nearest={{ label: 'Go to inventory', to: '/warehouse' }}
                    />
                  }
                />
                <Route
                  path="/warehouse/counts"
                  element={
                    <Placeholder
                      title="Cycle counts"
                      description="Scheduled and ad-hoc counts, with variance review before posting."
                      planned={[
                        'Generate a count sheet by zone or ABC class',
                        'Blind entry with a second-count threshold',
                        'Variance approval before stock is adjusted',
                      ]}
                      nearest={{ label: 'Go to inventory', to: '/warehouse' }}
                    />
                  }
                />

                <Route path="/hr" element={<Directory />} />
                <Route
                  path="/hr/compliance"
                  element={
                    <Placeholder
                      title="Training compliance"
                      description="Who is certified for what, and what lapses next."
                      planned={[
                        'Compliance matrix by role and required certification',
                        'Automatic reminders ahead of expiry',
                        'Evidence upload against each certification',
                      ]}
                      nearest={{ label: 'Go to directory', to: '/hr' }}
                    />
                  }
                />
                <Route
                  path="/hr/roles"
                  element={
                    <Placeholder
                      title="Roles and permissions"
                      description="What each role can see and do across the modules."
                      planned={[
                        'Role definitions with the certifications they require',
                        'Per-module permission matrix',
                        'Change history with who granted what, and when',
                      ]}
                      nearest={{ label: 'Go to directory', to: '/hr' }}
                    />
                  }
                />

                <Route path="/training" element={<Courses />} />
                <Route
                  path="/training/paths"
                  element={
                    <Placeholder
                      title="Learning paths"
                      description="Ordered course sequences that qualify a person for a role."
                      planned={[
                        'Build a path from courses with prerequisites',
                        'Assign a path to a role so new hires are enrolled automatically',
                        'Progress per person with the next required step',
                      ]}
                      nearest={{ label: 'Go to courses', to: '/training' }}
                    />
                  }
                />

                <Route
                  path="*"
                  element={
                    <Placeholder
                      title="Page not found"
                      description="That route does not exist in this prototype."
                      planned={['Check the address, or use the command palette to jump somewhere real']}
                      nearest={{ label: 'Go to dashboard', to: '/' }}
                    />
                  }
                />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <AiDock />
      <CommandPalette />
    </div>
  );
}

/**
 * Route guard.
 *
 * Remembers where the user was heading so the redirect after sign-in lands them there
 * rather than dumping everyone on the dashboard — a deep link that survives the login is
 * the difference between a shareable URL and a decorative one.
 *
 * `replace` on the way out keeps the guarded URL out of history, so Back from the login
 * screen does not bounce straight back into the guard.
 */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = useAuth((s) => s.user);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <TooltipProvider delayDuration={250} skipDelayDuration={300}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <RequireAuth>
              <Shell />
            </RequireAuth>
          }
        />
      </Routes>
      {/* Above the guard: the sign-in screen needs to be able to raise a toast too. */}
      <Toaster />
    </TooltipProvider>
  );
}
