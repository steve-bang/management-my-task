'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/app/store/useAppStore';
import { Priority } from '@/app/lib/types';
import TaskItem from './TaskItem';
import QuickAddTask from '../ui/QuickAddTask';
import { ListTodo, CheckCheck, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { generateId } from '@/app/lib/utils';

export default function TasksView() {
  const { tasks, addTask } = useAppStore();
  const [showDone, setShowDone] = useState(false);
  const [showAddFull, setShowAddFull] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [newDueDate, setNewDueDate] = useState('');

  const todoTasks = useMemo(() => {
    const order = { high: 0, medium: 1, low: 2 };
    return tasks
      .filter((t) => t.status === 'todo')
      .sort((a, b) => {
        if (a.isMainFocus && !b.isMainFocus) return -1;
        if (!a.isMainFocus && b.isMainFocus) return 1;
        return order[a.priority] - order[b.priority];
      });
  }, [tasks]);

  const doneTasks = useMemo(() =>
    tasks.filter((t) => t.status === 'done').sort((a, b) =>
      (b.completedAt ?? '').localeCompare(a.completedAt ?? '')), [tasks]);

  const handleFullAdd = () => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    addTask(trimmed, newPriority, newDueDate || undefined);
    setNewTitle('');
    setNewPriority('medium');
    setNewDueDate('');
    setShowAddFull(false);
  };

  const PRIORITY_CFG = {
    high: { label: 'Cao', color: '#E85D00', bg: '#FFF0E8' },
    medium: { label: 'Trung bình', color: '#B07D12', bg: '#FDF6E3' },
    low: { label: 'Thấp', color: '#5A8A6A', bg: '#EEF6F1' },
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-[#1A1917]">Tasks</h1>
        <p className="text-xs text-[#9E9A94] mt-0.5">
          {todoTasks.length} cần làm · {doneTasks.length} đã xong
        </p>
      </div>

      {/* Quick Add */}
      <QuickAddTask placeholder="Thêm task mới..." />

      {/* Full Add Form */}
      <button
        onClick={() => setShowAddFull(!showAddFull)}
        className="text-xs text-[#9E9A94] hover:text-[#E85D00] font-medium flex items-center gap-1 transition-colors"
      >
        <Calendar size={12} />
        Thêm với ngày hết hạn
        {showAddFull ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {showAddFull && (
        <div className="bg-white border border-[#E8E5DF] rounded-xl p-4 space-y-3 animate-fade-in">
          <input
            autoFocus
            type="text"
            placeholder="Tên task..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleFullAdd(); }}
            className="w-full text-sm border border-[#E8E5DF] rounded-lg px-3 py-2 outline-none focus:border-[#E85D00] transition-colors"
          />
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              {(['high', 'medium', 'low'] as Priority[]).map((p) => {
                const cfg = PRIORITY_CFG[p];
                const active = newPriority === p;
                return (
                  <button
                    key={p}
                    onClick={() => setNewPriority(p)}
                    className="text-xs px-2.5 py-1.5 rounded-lg font-medium border transition-all"
                    style={{
                      backgroundColor: active ? cfg.bg : 'transparent',
                      color: active ? cfg.color : '#9E9A94',
                      borderColor: active ? cfg.color : '#E8E5DF',
                    }}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              min={format(new Date(), 'yyyy-MM-dd')}
              className="text-xs border border-[#E8E5DF] rounded-lg px-2 py-1.5 text-[#6B6760] outline-none focus:border-[#E85D00] transition-colors"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowAddFull(false)}
              className="text-xs text-[#9E9A94] px-3 py-1.5 rounded-lg hover:bg-[#F7F6F2] transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleFullAdd}
              disabled={!newTitle.trim()}
              className="text-xs bg-[#E85D00] text-white px-4 py-1.5 rounded-lg font-semibold hover:bg-[#CC5000] disabled:opacity-40 transition-colors"
            >
              Thêm Task
            </button>
          </div>
        </div>
      )}

      {/* Todo list */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ListTodo size={15} color="#6B6760" />
          <h2 className="text-sm font-semibold text-[#1A1917]">Cần làm ({todoTasks.length})</h2>
          <span className="text-[10px] text-[#9E9A94] ml-1">⭐ = Main Focus</span>
        </div>

        {todoTasks.length === 0 ? (
          <div className="text-center py-8 text-[#9E9A94]">
            <p className="text-2xl mb-2">🎯</p>
            <p className="text-sm">Không có task nào. Thêm task mới!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todoTasks.map((task) => (
              <TaskItem key={task.id} task={task} showFocusStar />
            ))}
          </div>
        )}
      </div>

      {/* Done list */}
      {doneTasks.length > 0 && (
        <div>
          <button
            onClick={() => setShowDone(!showDone)}
            className="flex items-center gap-2 text-sm font-semibold text-[#6B6760] hover:text-[#1A1917] transition-colors mb-3"
          >
            <CheckCheck size={15} />
            Đã hoàn thành ({doneTasks.length})
            {showDone ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showDone && (
            <div className="space-y-2 animate-fade-in">
              {doneTasks.slice(0, 20).map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
