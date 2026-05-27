import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function formatDueDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Hôm nay';
  if (isTomorrow(date)) return 'Ngày mai';
  return format(date, 'dd/MM/yyyy', { locale: vi });
}

export function isDueSoon(dateStr?: string): boolean {
  if (!dateStr) return false;
  const date = parseISO(dateStr);
  return isToday(date) || isTomorrow(date);
}

export function isOverdue(dateStr?: string): boolean {
  if (!dateStr) return false;
  const date = parseISO(dateStr);
  return isPast(date) && !isToday(date);
}

export function formatFocusDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatTimerDisplay(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function getTodayFocusSeconds(sessions: import('./types').FocusSession[]): number {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  return sessions
    .filter((s) => s.startedAt.startsWith(todayStr) && s.completed)
    .reduce((acc, s) => acc + s.duration, 0);
}

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Chào buổi sáng';
  if (h < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}
