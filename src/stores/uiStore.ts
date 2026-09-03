import { create } from 'zustand';

interface UiState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;

  aiOpen: boolean;
  setAiOpen: (open: boolean) => void;
  /** Seeded into the composer when the assistant is opened from a contextual action. */
  aiPrompt: string | null;
  askAi: (prompt: string) => void;
  clearAiPrompt: () => void;
}

export const useUi = create<UiState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  commandOpen: false,
  setCommandOpen: (commandOpen) => set({ commandOpen }),

  aiOpen: false,
  setAiOpen: (aiOpen) => set({ aiOpen }),
  aiPrompt: null,
  askAi: (aiPrompt) => set({ aiPrompt, aiOpen: true }),
  clearAiPrompt: () => set({ aiPrompt: null }),
}));
