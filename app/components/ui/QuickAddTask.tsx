'use client';

import { useState } from 'react';
import { useAppStore } from '@/app/store/useAppStore';
import { Priority } from '@/app/lib/types';
import { Plus, ChevronDown } from 'lucide-react';

const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: 'high', label: 'Cao', color: '#E85D00' },
  { value: 'medium', label: 'Trung bình', color: '#B07D12' },
  { value: 'low', label: 'Thấp', color: '#5A8A6A' },
];

interface QuickAddTaskProps {
  placeholder?: string;
  compact?: boolean;
}

export default function QuickAddTask({ placeholder = 'Thêm task nhanh...', compact = false }: QuickAddTaskProps) {
  const { addTask } = useAppStore();
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [showOptions, setShowOptions] = useState(false);

  const handleSubmit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    addTask(trimmed, priority);
    setTitle('');
    setShowOptions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') {
      setTitle('');
      setShowOptions(false);
    }
  };

  const activePriority = PRIORITIES.find((p) => p.value === priority)!;

  return (
    <div className="relative">
      <div
        className={`flex items-center gap-2 bg-white border border-[#E8E5DF] rounded-xl transition-all ${
          showOptions || title ? 'border-[#E85D00] shadow-[0_0_0_3px_rgba(232,93,0,0.08)]' : 'hover:border-[#9E9A94]'
        } ${compact ? 'px-3 py-2.5' : 'px-4 py-3'}`}
      >
        <Plus size={16} color="#9E9A94" strokeWidth={2.5} className="flex-shrink-0" />
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setShowOptions(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-[#1A1917] placeholder-[#9E9A94] outline-none"
        />
        {(showOptions || title) && (
          <div className="flex items-center gap-2 animate-fade-in">
            {/* Priority selector */}
            <div className="relative">
              <button
                onClick={() => {
                  const next = PRIORITIES[(PRIORITIES.findIndex((p) => p.value === priority) + 1) % 3];
                  setPriority(next.value);
                }}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors hover:bg-[#F7F6F2]"
                style={{ color: activePriority.color }}
                title="Đổi độ ưu tiên"
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: activePriority.color }}
                />
                {activePriority.label}
              </button>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!title.trim()}
              className="px-3 py-1.5 bg-[#E85D00] text-white text-xs font-semibold rounded-lg hover:bg-[#CC5000] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Thêm
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
