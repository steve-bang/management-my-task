'use client';

import { useAppStore } from '@/app/store/useAppStore';
import { View } from '@/app/lib/types';
import { LayoutDashboard, CheckSquare, Timer, Brain } from 'lucide-react';

const NAV_ITEMS: { view: View; icon: React.ElementType; label: string }[] = [
  { view: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { view: 'tasks', icon: CheckSquare, label: 'Tasks' },
  { view: 'focus', icon: Timer, label: 'Focus' },
  { view: 'brain', icon: Brain, label: 'Brain Dump' },
];

export default function Sidebar() {
  const { view, setView } = useAppStore();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 min-h-dvh border-r border-[#E8E5DF] bg-white p-4 fixed left-0 top-0 bottom-0 z-20">
        {/* Logo */}
        <div className="mb-8 px-2 pt-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#E85D00] flex items-center justify-center">
              <Timer size={15} color="white" strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-[#1A1917] text-sm tracking-tight">FocusFlow</span>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ view: v, icon: Icon, label }) => {
            const active = view === v;
            return (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 w-full text-left ${
                  active
                    ? 'bg-[#FFF0E8] text-[#E85D00]'
                    : 'text-[#6B6760] hover:bg-[#F7F6F2] hover:text-[#1A1917]'
                }`}
              >
                <Icon size={17} strokeWidth={active ? 2.5 : 2} />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Bottom hint */}
        <div className="mt-auto pt-4 border-t border-[#E8E5DF]">
          <p className="text-xs text-[#9E9A94] px-2 leading-relaxed">
            Mọi dữ liệu được lưu trên trình duyệt của bạn.
          </p>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#E8E5DF] flex">
        {NAV_ITEMS.map(({ view: v, icon: Icon, label }) => {
          const active = view === v;
          return (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors ${
                active ? 'text-[#E85D00]' : 'text-[#9E9A94]'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              {label}
            </button>
          );
        })}
      </nav>
    </>
  );
}
