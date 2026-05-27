// Wrapper fetch với typed error handling
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error ?? `HTTP ${res.status}`);
  }
  return json.data as T;
}

import { Task, FocusSession, BrainDump } from './types';

// Tasks
export const tasksApi = {
  list: () => apiFetch<Task[]>('/api/tasks'),
  create: (task: Task) =>
    apiFetch<Task>('/api/tasks', { method: 'POST', body: JSON.stringify(task) }),
  update: (id: string, updates: Partial<Task>) =>
    apiFetch<Task>(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  delete: (id: string) =>
    apiFetch<{ id: string }>(`/api/tasks/${id}`, { method: 'DELETE' }),
};

// Sessions
export const sessionsApi = {
  list: () => apiFetch<FocusSession[]>('/api/sessions'),
  create: (session: FocusSession) =>
    apiFetch<FocusSession>('/api/sessions', { method: 'POST', body: JSON.stringify(session) }),
  update: (id: string, updates: Partial<FocusSession>) =>
    apiFetch<FocusSession>(`/api/sessions/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
};

// Dumps
export const dumpsApi = {
  list: () => apiFetch<BrainDump[]>('/api/dumps'),
  create: (dump: BrainDump) =>
    apiFetch<BrainDump>('/api/dumps', { method: 'POST', body: JSON.stringify(dump) }),
  patch: (id: string, updates: Partial<BrainDump>) =>
    apiFetch<BrainDump>(`/api/dumps/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),
  delete: (id: string) =>
    apiFetch<{ id: string }>(`/api/dumps/${id}`, { method: 'DELETE' }),
};