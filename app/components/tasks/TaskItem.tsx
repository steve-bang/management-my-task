'use client';

import { useState } from 'react';
import { Task, Priority } from '@/app/lib/types';
import { useAppStore } from '@/app/store/useAppStore';
import { Check, Star, Trash2, Pencil, X, Calendar } from 'lucide-react';
import { formatDueDate, isOverdue, isDueSoon } from '@/app/lib/utils';

const PRIORITY_CONFIG = {
  high: { color: '#E85D00', bg: '#FFF0E8', label: 'Cao' },
  medium: { color: '#B07D12', bg: '#FDF6E3', label: 'TB' },
  low: { color: '#5A8A6A', bg: '#EEF6F1', label: 'Thấp' },
};

interface TaskItemProps {
  task: Task;
  showFocusStar?: boolean;
}

export default function TaskItem({ task, showFocusStar = false }: TaskItemProps) {
  const { completeTask, deleteTask, updateTask, setMainFocus } = useAppStore();
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editPriority, setEditPriority] = useState<Priority>(task.priority);

  const isDone = task.status === 'done';
  const pc = PRIORITY_CONFIG[task.priority];

  const handleSaveEdit = () => {
    const trimmed = editTitle.trim();
    if (!trimmed) return;
    updateTask(task.id, { title: trimmed, priority: editPriority });
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveEdit();
    if (e.key === 'Escape') {
      setEditTitle(task.title);
      setEditPriority(task.priority);
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <div className="bg-white border border-[#E85D00] rounded-xl p-3 shadow-[0_0_0_3px_rgba(232,93,0,0.08)] animate-fade-in">
        <input
          autoFocus
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full text-sm text-[#1A1917] bg-transparent outline-none mb-2"
        />
        <div className="flex items-center gap-2 flex-wrap">
          {(['high', 'medium', 'low'] as Priority[]).map((p) => {
            const cfg = PRIORITY_CONFIG[p];
            return (
              <button
                key={p}
                onClick={() => setEditPriority(p)}
                className="text-xs px-2 py-1 rounded-md font-medium border transition-all"
                style={{
                  backgroundColor: editPriority === p ? cfg.bg : 'transparent',
                  color: editPriority === p ? cfg.color : '#9E9A94',
                  borderColor: editPriority === p ? cfg.color : '#E8E5DF',
                }}
              >
                {cfg.label}
              </button>
            );
          })}
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => { setEditTitle(task.title); setEditPriority(task.priority); setEditing(false); }}
              className="text-xs text-[#9E9A94] hover:text-[#1A1917] px-2 py-1 rounded"
            >
              Hủy
            </button>
            <button
              onClick={handleSaveEdit}
              className="text-xs bg-[#E85D00] text-white px-3 py-1 rounded-lg font-medium hover:bg-[#CC5000] transition-colors"
            >
              Lưu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group flex items-start gap-3 bg-white border rounded-xl p-3 transition-all duration-150 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] ${
        task.isMainFocus && !isDone
          ? 'border-[#E85D00] bg-[#FFFDF9]'
          : 'border-[#E8E5DF]'
      } ${isDone ? 'opacity-60' : ''}`}
    >
      {/* Checkbox */}
      <button
        onClick={() => completeTask(task.id)}
        className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
          isDone
            ? 'bg-[#2D8A4E] border-[#2D8A4E]'
            : 'border-[#D0CCC5] hover:border-[#E85D00]'
        }`}
      >
        {isDone && <Check size={11} color="white" strokeWidth={3} className="animate-check-in" />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm text-[#1A1917] leading-snug ${isDone ? 'line-through text-[#9E9A94]' : ''}`}
        >
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {/* Priority */}
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
            style={{ backgroundColor: pc.bg, color: pc.color }}
          >
            {pc.label}
          </span>
          {/* Due date */}
          {task.dueDate && (
            <span
              className={`flex items-center gap-1 text-[10px] font-medium ${
                isOverdue(task.dueDate)
                  ? 'text-[#C0392B]'
                  : isDueSoon(task.dueDate)
                  ? 'text-[#B07D12]'
                  : 'text-[#9E9A94]'
              }`}
            >
              <Calendar size={10} />
              {formatDueDate(task.dueDate)}
            </span>
          )}
          {task.isMainFocus && !isDone && (
            <span className="text-[10px] font-semibold text-[#E85D00] flex items-center gap-0.5">
              <Star size={9} fill="#E85D00" /> Focus
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {showFocusStar && !isDone && (
          <button
            onClick={() => setMainFocus(task.id)}
            className={`p-1.5 rounded-lg transition-colors ${
              task.isMainFocus ? 'text-[#E85D00]' : 'text-[#D0CCC5] hover:text-[#E85D00]'
            }`}
            title="Đặt làm Main Focus"
          >
            <Star size={14} fill={task.isMainFocus ? '#E85D00' : 'none'} strokeWidth={2} />
          </button>
        )}
        <button
          onClick={() => setEditing(true)}
          className="p-1.5 rounded-lg text-[#9E9A94] hover:text-[#1A1917] hover:bg-[#F7F6F2] transition-colors"
          title="Sửa"
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={() => deleteTask(task.id)}
          className="p-1.5 rounded-lg text-[#9E9A94] hover:text-[#C0392B] hover:bg-[#FDECEA] transition-colors"
          title="Xóa"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
