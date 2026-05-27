'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/app/store/useAppStore';
import { BrainDump } from '@/app/lib/types';
import { Send, Archive, Trash2, ArrowRight, Brain, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

import { useToast } from '@/app/hooks/useToast';
import Toast from '@/app/components/ui/Toast';
import { ToastFn } from '@/app/store/useAppStore';

export default function BrainDumpView() {
  const { dumps, addDump, convertDumpToTask, archiveDump, deleteDump } = useAppStore();
  const [input, setInput] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const { toasts, addToast, removeToast, updateToast } = useToast();
  const toast: ToastFn = { show: addToast, update: updateToast, remove: removeToast };

  const activeDumps = useMemo(() =>
    dumps.filter((d) => !d.archived).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [dumps]);

  const archivedDumps = useMemo(() =>
    dumps.filter((d) => d.archived).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [dumps]);

  const handleAdd = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    await addDump(trimmed, toast);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleAdd();
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-[#1A1917]">Brain Dump</h1>
        <p className="text-xs text-[#9E9A94] mt-0.5">Xả hết suy nghĩ. Đừng giữ trong đầu.</p>
      </div>

      {/* Input area */}
      <div className="bg-white border border-[#E8E5DF] rounded-xl overflow-hidden focus-within:border-[#E85D00] focus-within:shadow-[0_0_0_3px_rgba(232,93,0,0.08)] transition-all">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Suy nghĩ gì? Ý tưởng gì? Cần nhớ gì? Viết ngay vào đây..."
          rows={4}
          className="w-full px-4 pt-3 pb-2 text-sm text-[#1A1917] bg-transparent resize-none outline-none placeholder-[#C0BAB2] leading-relaxed"
        />
        <div className="flex items-center justify-between px-3 pb-3 pt-1 border-t border-[#F0EEE8]">
          <span className="text-[10px] text-[#C0BAB2]">
            ⌘+Enter để lưu nhanh
          </span>
          <button
            onClick={handleAdd}
            disabled={!input.trim()}
            className="flex items-center gap-1.5 bg-[#E85D00] text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-[#CC5000] disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            <Send size={12} />
            Lưu
          </button>
        </div>
      </div>

      {/* Active dumps */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Brain size={15} color="#6B6760" />
          <h2 className="text-sm font-semibold text-[#1A1917]">Ghi chú ({activeDumps.length})</h2>
        </div>

        {activeDumps.length === 0 ? (
          <div className="text-center py-8 text-[#9E9A94]">
            <p className="text-3xl mb-2">🧠</p>
            <p className="text-sm">Đầu óc đang trống rỗng.</p>
            <p className="text-xs mt-1">Hãy dump mọi suy nghĩ ra đây!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activeDumps.map((dump) => (
              <DumpCard
                key={dump.id}
                dump={dump}
                onConvert={() => convertDumpToTask(dump.id, toast)}
                onArchive={() => archiveDump(dump.id, toast)}
                onDelete={() => deleteDump(dump.id, toast)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Archived */}
      {archivedDumps.length > 0 && (
        <div>
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-2 text-sm font-semibold text-[#6B6760] hover:text-[#1A1917] transition-colors mb-3"
          >
            <Archive size={14} />
            Đã archive ({archivedDumps.length})
            {showArchived ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {showArchived && (
            <div className="space-y-2 animate-fade-in">
              {archivedDumps.slice(0, 20).map((dump) => (
                <DumpCard
                  key={dump.id}
                  dump={dump}
                  archived
                  onDelete={() => deleteDump(dump.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

interface DumpCardProps {
  dump: BrainDump;
  archived?: boolean;
  onConvert?: () => void;
  onArchive?: () => void;
  onDelete: () => void;
}

function DumpCard({ dump, archived = false, onConvert, onArchive, onDelete }: DumpCardProps) {
  const date = new Date(dump.createdAt);

  return (
    <div
      className={`group bg-white border rounded-xl p-3.5 transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] ${archived ? 'border-[#E8E5DF] opacity-60' : 'border-[#E8E5DF]'
        } ${dump.convertedToTaskId ? 'border-l-2 border-l-[#2D8A4E]' : ''}`}
    >
      <p className={`text-sm text-[#1A1917] leading-relaxed whitespace-pre-wrap ${archived ? 'line-through opacity-70' : ''}`}>
        {dump.content}
      </p>

      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[#F0EEE8]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#C0BAB2]">
            {format(date, 'HH:mm · dd/MM', { locale: vi })}
          </span>
          {dump.convertedToTaskId && (
            <span className="text-[10px] text-[#2D8A4E] font-semibold">→ Đã chuyển task</span>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!archived && onConvert && !dump.convertedToTaskId && (
            <button
              onClick={onConvert}
              className="flex items-center gap-1 text-[10px] font-semibold text-[#E85D00] bg-[#FFF0E8] hover:bg-[#FFE5D0] px-2 py-1 rounded-md transition-colors"
              title="Chuyển thành task"
            >
              <ArrowRight size={10} />
              Task
            </button>
          )}
          {!archived && onArchive && (
            <button
              onClick={onArchive}
              className="p-1.5 rounded-md text-[#9E9A94] hover:text-[#6B6760] hover:bg-[#F7F6F2] transition-colors"
              title="Archive"
            >
              <Archive size={12} />
            </button>
          )}
          <button
            onClick={onDelete}
            className="p-1.5 rounded-md text-[#9E9A94] hover:text-[#C0392B] hover:bg-[#FDECEA] transition-colors"
            title="Xóa"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
