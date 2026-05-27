'use client';

import { useEffect } from 'react';
import { CheckCircle2, XCircle, Loader2, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'loading';

export interface ToastData {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastProps {
  toasts: ToastData[];
  onRemove: (id: string) => void;
}

export default function Toast({ toasts, onRemove }: ToastProps) {
  useEffect(() => {
    const timers = toasts
      .filter((t) => t.type !== 'loading')
      .map((t) =>
        setTimeout(() => onRemove(t.id), t.type === 'error' ? 4000 : 2500)
      );
    return () => timers.forEach(clearTimeout);
  }, [toasts, onRemove]);

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-24 md:bottom-6 right-4 z-50 flex flex-col gap-2 max-w-xs w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl shadow-lg border text-sm font-medium animate-slide-up ${
            toast.type === 'success'
              ? 'bg-[#E8F7ED] border-[#2D8A4E] text-[#1A5C32]'
              : toast.type === 'error'
              ? 'bg-[#FDECEA] border-[#C0392B] text-[#7B1E1E]'
              : 'bg-white border-[#E8E5DF] text-[#6B6760]'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 size={15} className="text-[#2D8A4E] flex-shrink-0" />}
          {toast.type === 'error' && <XCircle size={15} className="text-[#C0392B] flex-shrink-0" />}
          {toast.type === 'loading' && <Loader2 size={15} className="animate-spin flex-shrink-0" />}
          <span className="flex-1 leading-snug">{toast.message}</span>
          {toast.type !== 'loading' && (
            <button onClick={() => onRemove(toast.id)} className="p-0.5 rounded hover:opacity-60 transition-opacity">
              <X size={12} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}