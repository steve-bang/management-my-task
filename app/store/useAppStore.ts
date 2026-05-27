'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Task,
  FocusSession,
  BrainDump,
  Priority,
  View,
  TimerState,
  FocusMode,
} from '@/app/lib/types';
import { generateId } from '@/app/lib/utils';
import { tasksApi, sessionsApi, dumpsApi } from '@/app/lib/api-client';

// ─── Toast callback type ─────────────────────────────────────────────────────
// Truyền vào từ component qua hook useToast, tránh coupling store với UI
export type ToastFn = {
  show: (message: string, type: 'success' | 'error' | 'loading') => string;
  update: (id: string, message: string, type: 'success' | 'error' | 'loading') => void;
  remove: (id: string) => void;
};

// ─── Interface ───────────────────────────────────────────────────────────────
interface AppState {
  // ── Sync state ──
  isLoaded: boolean;         // true sau khi fetch xong từ Firebase lần đầu
  isSyncing: boolean;        // true khi đang có request in-flight
  syncError: string | null;  // lỗi load dữ liệu ban đầu

  // ── Setters dùng cho useFirestoreSync hook ──
  setTasks: (tasks: Task[]) => void;
  setSessions: (sessions: FocusSession[]) => void;
  setDumps: (dumps: BrainDump[]) => void;
  setIsLoaded: (v: boolean) => void;
  setSyncError: (err: string | null) => void;

  // ── Tasks ──
  tasks: Task[];
  addTask: (title: string, priority: Priority, dueDate?: string, toast?: ToastFn) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>, toast?: ToastFn) => Promise<void>;
  completeTask: (id: string, toast?: ToastFn) => Promise<void>;
  deleteTask: (id: string, toast?: ToastFn) => Promise<void>;
  setMainFocus: (id: string, toast?: ToastFn) => Promise<void>;

  // ── Focus Timer ──
  sessions: FocusSession[];
  timerState: TimerState;
  timerSeconds: number;
  activeMode: FocusMode;
  currentSessionId: string | null;
  customMinutes: number;
  startTimer: (toast?: ToastFn) => void;
  pauseTimer: () => void;
  endTimer: (toast?: ToastFn) => Promise<void>;
  setMode: (mode: FocusMode) => void;
  setCustomMinutes: (minutes: number) => void;
  tickTimer: (toast?: ToastFn) => Promise<void>;

  // ── Brain Dump ──
  dumps: BrainDump[];
  addDump: (content: string, toast?: ToastFn) => Promise<void>;
  convertDumpToTask: (id: string, toast?: ToastFn) => Promise<void>;
  archiveDump: (id: string, toast?: ToastFn) => Promise<void>;
  deleteDump: (id: string, toast?: ToastFn) => Promise<void>;

  // ── Navigation ──
  view: View;
  setView: (view: View) => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const MODE_SECONDS: Record<string, number> = {
  '25': 25 * 60,
  '50': 50 * 60,
};

// ─── Store ───────────────────────────────────────────────────────────────────
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({

      // ════════════════════════════════════════════════════════════════════════
      // SYNC STATE
      // ════════════════════════════════════════════════════════════════════════
      isLoaded: false,
      isSyncing: false,
      syncError: null,

      setTasks: (tasks) => set({ tasks }),
      setSessions: (sessions) => set({ sessions }),
      setDumps: (dumps) => set({ dumps }),
      setIsLoaded: (v) => set({ isLoaded: v }),
      setSyncError: (err) => set({ syncError: err }),

      // ════════════════════════════════════════════════════════════════════════
      // TASKS
      // ════════════════════════════════════════════════════════════════════════
      tasks: [],

      addTask: async (title, priority, dueDate, toast) => {
        const task: Task = {
          id: generateId(),
          title: title.trim(),
          priority,
          status: 'todo',
          dueDate,
          isMainFocus: false,
          createdAt: new Date().toISOString(),
        };

        // 1. Optimistic update — UI thay đổi ngay
        set((s) => ({ tasks: [task, ...s.tasks] }));

        // 2. Sync Firebase
        const tid = toast?.show('Đang lưu task...', 'loading');
        try {
          await tasksApi.create(task);
          if (tid) toast?.update(tid, 'Đã thêm task ✓', 'success');
        } catch (err) {
          // 3. Rollback nếu lỗi
          set((s) => ({ tasks: s.tasks.filter((t) => t.id !== task.id) }));
          if (tid) toast?.update(tid, `Lỗi: ${(err as Error).message}`, 'error');
        }
      },

      updateTask: async (id, updates, toast) => {
        // Snapshot để rollback
        const prev = get().tasks;

        // 1. Optimistic update
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        }));

        // 2. Sync Firebase
        try {
          await tasksApi.update(id, updates);
        } catch (err) {
          // 3. Rollback
          set({ tasks: prev });
          toast?.show(`Cập nhật thất bại: ${(err as Error).message}`, 'error');
        }
      },

      completeTask: async (id, toast) => {
        const prev = get().tasks;
        const task = prev.find((t) => t.id === id);
        if (!task) return;

        const nowDone = task.status === 'todo';
        const updates: Partial<Task> = {
          status: nowDone ? 'done' : 'todo',
          completedAt: nowDone ? new Date().toISOString() : undefined,
        };

        // 1. Optimistic update
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        }));

        // 2. Sync Firebase — không hiện toast cho action nhanh này
        try {
          await tasksApi.update(id, updates);
        } catch (err) {
          // 3. Rollback
          set({ tasks: prev });
          toast?.show(`Lỗi: ${(err as Error).message}`, 'error');
        }
      },

      deleteTask: async (id, toast) => {
        const prev = get().tasks;

        // 1. Optimistic update
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));

        // 2. Sync Firebase
        const tid = toast?.show('Đang xóa...', 'loading');
        try {
          await tasksApi.delete(id);
          if (tid) toast?.update(tid, 'Đã xóa task ✓', 'success');
        } catch (err) {
          // 3. Rollback
          set({ tasks: prev });
          if (tid) toast?.update(tid, `Xóa thất bại: ${(err as Error).message}`, 'error');
        }
      },

      setMainFocus: async (id, toast) => {
        const prev = get().tasks;

        // 1. Optimistic update — chỉ task được chọn là main focus
        set((s) => ({
          tasks: s.tasks.map((t) => ({ ...t, isMainFocus: t.id === id })),
        }));

        // 2. Sync Firebase — cần update tất cả tasks bị thay đổi
        try {
          const affected = prev.filter(
            (t) => t.isMainFocus !== (t.id === id)
          );
          await Promise.all(
            affected.map((t) =>
              tasksApi.update(t.id, { isMainFocus: t.id === id })
            )
          );
        } catch (err) {
          // 3. Rollback
          set({ tasks: prev });
          toast?.show(`Lỗi: ${(err as Error).message}`, 'error');
        }
      },

      // ════════════════════════════════════════════════════════════════════════
      // FOCUS TIMER
      // ════════════════════════════════════════════════════════════════════════
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

      startTimer: (toast) => {
        const { currentSessionId, timerState } = get();
        if (timerState === 'running') return;

        if (!currentSessionId) {
          // Tạo session mới — chỉ lưu local khi bắt đầu
          // Firebase sync xảy ra khi endTimer() được gọi (session hoàn chỉnh)
          const session: FocusSession = {
            id: generateId(),
            duration: 0,
            startedAt: new Date().toISOString(),
            completed: false,
          };
          set((s) => ({
            sessions: [session, ...s.sessions],
            currentSessionId: session.id,
            timerState: 'running',
          }));
        } else {
          // Resume từ pause
          set({ timerState: 'running' });
        }
      },

      pauseTimer: () => set({ timerState: 'paused' }),

      endTimer: async (toast) => {
        const { currentSessionId, timerSeconds, activeMode, customMinutes } = get();
        const totalSecs = activeMode === 'custom' ? customMinutes * 60 : MODE_SECONDS[String(activeMode)];
        const elapsed = totalSecs - timerSeconds;
        const resetSecs = totalSecs;

        if (!currentSessionId) {
          set({ timerState: 'idle', timerSeconds: resetSecs });
          return;
        }

        if (elapsed <= 10) {
          // Session quá ngắn — xóa local, không sync Firebase
          set((s) => ({
            sessions: s.sessions.filter((sess) => sess.id !== currentSessionId),
            timerState: 'idle',
            currentSessionId: null,
            timerSeconds: resetSecs,
          }));
          return;
        }

        // Cập nhật session local
        const sessionUpdates: Partial<FocusSession> = {
          duration: elapsed,
          endedAt: new Date().toISOString(),
          completed: timerSeconds === 0,
        };

        set((s) => ({
          sessions: s.sessions.map((sess) =>
            sess.id === currentSessionId
              ? { ...sess, ...sessionUpdates }
              : sess
          ),
          timerState: 'idle',
          currentSessionId: null,
          timerSeconds: resetSecs,
        }));

        // Sync Firebase — lưu session hoàn chỉnh
        const sessionSnapshot = get().sessions.find((s) => s.id === currentSessionId);
        if (!sessionSnapshot) return;

        const tid = toast?.show('Đang lưu session...', 'loading');
        try {
          // Thử update trước (session có thể đã được create khi startTimer)
          // Dùng create vì session chưa bao giờ được push lên Firebase
          await sessionsApi.create({
            ...sessionSnapshot,
            ...sessionUpdates,
          } as FocusSession);
          if (tid) toast?.update(tid, `Focus session ${Math.floor(elapsed / 60)}m đã lưu ✓`, 'success');
        } catch (err) {
          // Session vẫn còn local — không rollback vì đây là data lịch sử
          if (tid) toast?.update(tid, `Không thể sync session: ${(err as Error).message}`, 'error');
        }
      },

      tickTimer: async (toast) => {
        const { timerSeconds, timerState } = get();
        if (timerState !== 'running') return;

        if (timerSeconds <= 1) {
          // Auto-complete khi đếm về 0
          const { currentSessionId, activeMode, customMinutes } = get();
          const totalSecs = activeMode === 'custom' ? customMinutes * 60 : MODE_SECONDS[String(activeMode)];

          const sessionUpdates: Partial<FocusSession> = {
            duration: totalSecs,
            endedAt: new Date().toISOString(),
            completed: true,
          };

          set((s) => ({
            sessions: s.sessions.map((sess) =>
              sess.id === currentSessionId
                ? { ...sess, ...sessionUpdates }
                : sess
            ),
            timerState: 'idle',
            currentSessionId: null,
            timerSeconds: totalSecs,
          }));

          // Sync Firebase
          if (currentSessionId) {
            const sessionSnapshot = get().sessions.find((s) => s.id === currentSessionId);
            if (sessionSnapshot) {
              const tid = toast?.show('🎉 Focus hoàn thành! Đang lưu...', 'loading');
              try {
                await sessionsApi.create({
                  ...sessionSnapshot,
                  ...sessionUpdates,
                } as FocusSession);
                if (tid) toast?.update(tid, `🎉 Hoàn thành ${Math.floor(totalSecs / 60)}m focus! ✓`, 'success');
              } catch (err) {
                if (tid) toast?.update(tid, `Session hoàn thành nhưng không sync được`, 'error');
              }
            }
          }
        } else {
          set((s) => ({ timerSeconds: s.timerSeconds - 1 }));
        }
      },

      // ════════════════════════════════════════════════════════════════════════
      // BRAIN DUMP
      // ════════════════════════════════════════════════════════════════════════
      dumps: [],

      addDump: async (content, toast) => {
        const dump: BrainDump = {
          id: generateId(),
          content: content.trim(),
          createdAt: new Date().toISOString(),
          archived: false,
        };

        // 1. Optimistic update
        set((s) => ({ dumps: [dump, ...s.dumps] }));

        // 2. Sync Firebase
        const tid = toast?.show('Đang lưu ghi chú...', 'loading');
        try {
          await dumpsApi.create(dump);
          if (tid) toast?.update(tid, 'Đã lưu ghi chú ✓', 'success');
        } catch (err) {
          // 3. Rollback
          set((s) => ({ dumps: s.dumps.filter((d) => d.id !== dump.id) }));
          if (tid) toast?.update(tid, `Lưu thất bại: ${(err as Error).message}`, 'error');
        }
      },

      convertDumpToTask: async (id, toast) => {
        const { dumps } = get();
        const dump = dumps.find((d) => d.id === id);
        if (!dump) return;

        const newTaskId = generateId();
        const newTask: Task = {
          id: newTaskId,
          title: dump.content,
          priority: 'medium',
          status: 'todo',
          isMainFocus: false,
          createdAt: new Date().toISOString(),
        };
        const dumpUpdates: Partial<BrainDump> = {
          archived: true,
          convertedToTaskId: newTaskId,
        };

        // 1. Optimistic update cả 2
        set((s) => ({
          tasks: [newTask, ...s.tasks],
          dumps: s.dumps.map((d) => (d.id === id ? { ...d, ...dumpUpdates } : d)),
        }));

        // 2. Sync Firebase cả 2 song song
        const tid = toast?.show('Đang chuyển thành task...', 'loading');
        try {
          await Promise.all([
            tasksApi.create(newTask),
            dumpsApi.patch(id, dumpUpdates),
          ]);
          if (tid) toast?.update(tid, 'Đã chuyển thành task ✓', 'success');
        } catch (err) {
          // 3. Rollback cả 2
          set((s) => ({
            tasks: s.tasks.filter((t) => t.id !== newTaskId),
            dumps: s.dumps.map((d) =>
              d.id === id ? { ...d, archived: false, convertedToTaskId: undefined } : d
            ),
          }));
          if (tid) toast?.update(tid, `Chuyển thất bại: ${(err as Error).message}`, 'error');
        }
      },

      archiveDump: async (id, toast) => {
        const prev = get().dumps;

        // 1. Optimistic update
        set((s) => ({
          dumps: s.dumps.map((d) => (d.id === id ? { ...d, archived: true } : d)),
        }));

        // 2. Sync Firebase
        try {
          await dumpsApi.patch(id, { archived: true });
        } catch (err) {
          // 3. Rollback
          set({ dumps: prev });
          toast?.show(`Lỗi: ${(err as Error).message}`, 'error');
        }
      },

      deleteDump: async (id, toast) => {
        const prev = get().dumps;

        // 1. Optimistic update
        set((s) => ({ dumps: s.dumps.filter((d) => d.id !== id) }));

        // 2. Sync Firebase
        try {
          await dumpsApi.delete(id);
        } catch (err) {
          // 3. Rollback
          set({ dumps: prev });
          toast?.show(`Xóa thất bại: ${(err as Error).message}`, 'error');
        }
      },

      // ════════════════════════════════════════════════════════════════════════
      // NAVIGATION
      // ════════════════════════════════════════════════════════════════════════
      view: 'dashboard',
      setView: (view) => set({ view }),
    }),

    {
      name: 'focusflow-storage',
      // Chỉ persist những gì cần thiết cho offline/cache
      // isLoaded = false mỗi lần reload để trigger fetch lại từ Firebase
      partialize: (state) => ({
        tasks: state.tasks,
        sessions: state.sessions,
        dumps: state.dumps,
        customMinutes: state.customMinutes,
        activeMode: state.activeMode,
        // view không persist để luôn về dashboard khi reload
      }),
    }
  )
);