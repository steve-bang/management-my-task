'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Task, FocusSession, BrainDump, Priority, View, TimerState, FocusMode } from '@/app/lib/types';
import { generateId } from '@/app/lib/utils';
import { format } from 'date-fns';

interface AppState {
  // Tasks
  tasks: Task[];
  addTask: (title: string, priority: Priority, dueDate?: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  completeTask: (id: string) => void;
  deleteTask: (id: string) => void;
  setMainFocus: (id: string) => void;

  // Focus Timer
  sessions: FocusSession[];
  timerState: TimerState;
  timerSeconds: number;
  activeMode: FocusMode;
  currentSessionId: string | null;
  startTimer: () => void;
  pauseTimer: () => void;
  endTimer: () => void;
  setMode: (mode: FocusMode) => void;
  setCustomMinutes: (minutes: number) => void;
  customMinutes: number;
  tickTimer: () => void;

  // Brain Dump
  dumps: BrainDump[];
  addDump: (content: string) => void;
  convertDumpToTask: (id: string) => void;
  archiveDump: (id: string) => void;
  deleteDump: (id: string) => void;

  // Navigation
  view: View;
  setView: (view: View) => void;
}

const MODE_SECONDS: Record<string, number> = {
  '25': 25 * 60,
  '50': 50 * 60,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ─── Tasks ───────────────────────────────────────────────────────────
      tasks: [],
      addTask: (title, priority, dueDate) => {
        const task: Task = {
          id: generateId(),
          title,
          priority,
          status: 'todo',
          dueDate,
          isMainFocus: false,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ tasks: [task, ...s.tasks] }));
      },
      updateTask: (id, updates) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),
      completeTask: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? { ...t, status: t.status === 'done' ? 'todo' : 'done', completedAt: t.status === 'todo' ? new Date().toISOString() : undefined }
              : t
          ),
        })),
      deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
      setMainFocus: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) => ({ ...t, isMainFocus: t.id === id })),
        })),

      // ─── Focus Timer ─────────────────────────────────────────────────────
      sessions: [],
      timerState: 'idle',
      timerSeconds: 25 * 60,
      activeMode: 25,
      currentSessionId: null,
      customMinutes: 45,

      setMode: (mode) => {
        const { customMinutes } = get();
        const secs = mode === 'custom' ? customMinutes * 60 : MODE_SECONDS[String(mode)];
        set({ activeMode: mode, timerSeconds: secs, timerState: 'idle', currentSessionId: null });
      },
      setCustomMinutes: (minutes) => {
        set({ customMinutes: minutes });
        if (get().activeMode === 'custom') {
          set({ timerSeconds: minutes * 60, timerState: 'idle' });
        }
      },
      startTimer: () => {
        const { currentSessionId, timerState } = get();
        if (timerState === 'running') return;
        if (!currentSessionId) {
          const session: FocusSession = {
            id: generateId(),
            duration: 0,
            startedAt: new Date().toISOString(),
            completed: false,
          };
          set((s) => ({ sessions: [session, ...s.sessions], currentSessionId: session.id, timerState: 'running' }));
        } else {
          set({ timerState: 'running' });
        }
      },
      pauseTimer: () => set({ timerState: 'paused' }),
      endTimer: () => {
        const { currentSessionId, sessions, timerSeconds, activeMode, customMinutes } = get();
        const totalSecs = activeMode === 'custom' ? customMinutes * 60 : MODE_SECONDS[String(activeMode)];
        const elapsed = totalSecs - timerSeconds;
        if (currentSessionId && elapsed > 10) {
          set((s) => ({
            sessions: s.sessions.map((sess) =>
              sess.id === currentSessionId
                ? { ...sess, duration: elapsed, endedAt: new Date().toISOString(), completed: timerSeconds === 0 }
                : sess
            ),
          }));
        } else if (currentSessionId) {
          // Remove session if too short
          set((s) => ({ sessions: s.sessions.filter((sess) => sess.id !== currentSessionId) }));
        }
        const resetSecs = activeMode === 'custom' ? customMinutes * 60 : MODE_SECONDS[String(activeMode)];
        set({ timerState: 'idle', currentSessionId: null, timerSeconds: resetSecs });
      },
      tickTimer: () => {
        const { timerSeconds, timerState } = get();
        if (timerState !== 'running') return;
        if (timerSeconds <= 1) {
          // Auto-complete
          const { currentSessionId, activeMode, customMinutes } = get();
          const totalSecs = activeMode === 'custom' ? customMinutes * 60 : MODE_SECONDS[String(activeMode)];
          if (currentSessionId) {
            set((s) => ({
              sessions: s.sessions.map((sess) =>
                sess.id === currentSessionId
                  ? { ...sess, duration: totalSecs, endedAt: new Date().toISOString(), completed: true }
                  : sess
              ),
            }));
          }
          const resetSecs = activeMode === 'custom' ? customMinutes * 60 : MODE_SECONDS[String(activeMode)];
          set({ timerState: 'idle', currentSessionId: null, timerSeconds: resetSecs });
        } else {
          set((s) => ({ timerSeconds: s.timerSeconds - 1 }));
        }
      },

      // ─── Brain Dump ──────────────────────────────────────────────────────
      dumps: [],
      addDump: (content) => {
        const dump: BrainDump = {
          id: generateId(),
          content,
          createdAt: new Date().toISOString(),
          archived: false,
        };
        set((s) => ({ dumps: [dump, ...s.dumps] }));
      },
      convertDumpToTask: (id) => {
        const { dumps, addTask } = get();
        const dump = dumps.find((d) => d.id === id);
        if (!dump) return;
        addTask(dump.content, 'medium');
        const newTaskId = get().tasks[0]?.id;
        set((s) => ({
          dumps: s.dumps.map((d) =>
            d.id === id ? { ...d, archived: true, convertedToTaskId: newTaskId } : d
          ),
        }));
      },
      archiveDump: (id) =>
        set((s) => ({
          dumps: s.dumps.map((d) => (d.id === id ? { ...d, archived: true } : d)),
        })),
      deleteDump: (id) => set((s) => ({ dumps: s.dumps.filter((d) => d.id !== id) })),

      // ─── Navigation ──────────────────────────────────────────────────────
      view: 'dashboard',
      setView: (view) => set({ view }),
    }),
    {
      name: 'focusflow-storage',
      partialize: (state) => ({
        tasks: state.tasks,
        sessions: state.sessions,
        dumps: state.dumps,
        customMinutes: state.customMinutes,
        activeMode: state.activeMode,
      }),
    }
  )
);
