'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/app/store/useAppStore';

export function useTimer() {
  const { timerState, tickTimer } = useAppStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timerState === 'running') {
      intervalRef.current = setInterval(() => {
        tickTimer();
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerState, tickTimer]);
}
