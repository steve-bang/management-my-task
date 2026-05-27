export type Priority = 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'done';

export interface Task {
  id: string;
  title: string;
  priority: Priority;
  status: TaskStatus;
  dueDate?: string; // ISO date string
  isMainFocus?: boolean;
  createdAt: string;
  completedAt?: string;
}

export interface FocusSession {
  id: string;
  duration: number; // in seconds
  startedAt: string;
  endedAt?: string;
  completed: boolean;
}

export interface BrainDump {
  id: string;
  content: string;
  createdAt: string;
  archived: boolean;
  convertedToTaskId?: string;
}

export type FocusMode = 25 | 50 | 'custom';
export type TimerState = 'idle' | 'running' | 'paused';

export type View = 'dashboard' | 'tasks' | 'focus' | 'brain';
