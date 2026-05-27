'use client';

import { useState, useCallback } from 'react';
import { ToastData, ToastType } from '@/app/components/ui/Toast';
import { generateId } from '@/app/lib/utils';

export function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((message: string, type: ToastType): string => {
    const id = generateId();
    setToasts((prev) => [...prev, { id, message, type }]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateToast = useCallback((id: string, message: string, type: ToastType) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, message, type } : t))
    );
  }, []);

  return { toasts, addToast, removeToast, updateToast };
}