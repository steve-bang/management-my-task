'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/app/store/useAppStore';
import { tasksApi, sessionsApi, dumpsApi } from '@/app/lib/api-client';

export function useFirestoreSync() {
  const { isLoaded, setTasks, setSessions, setDumps, setSyncError } = useAppStore();
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current || isLoaded) return;
    hasFetched.current = true;

    async function loadAll() {
      try {
        const [tasks, sessions, dumps] = await Promise.all([
          tasksApi.list(),
          sessionsApi.list(),
          dumpsApi.list(),
        ]);
        setTasks(tasks);
        setSessions(sessions);
        setDumps(dumps);
      } catch (err) {
        setSyncError('Không thể tải dữ liệu. Kiểm tra kết nối mạng.');
      }
    }

    loadAll();
  }, []);
}