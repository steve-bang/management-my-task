'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/app/store/useAppStore';
import { Task } from '@/app/lib/types';
import { Star, Flame, CheckCircle2, Clock, TrendingUp, Target } from 'lucide-react';
import { getGreeting, getTodayFocusSeconds, formatFocusDuration } from '@/app/lib/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import TaskItem from '../tasks/TaskItem';
import QuickAddTask from '../ui/QuickAddTask';

export default function Dashboard() {
  const { tasks, sessions, setView, setMainFocus } = useAppStore();

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const todayTasks = useMemo(() =>
    tasks.filter((t) => {
      if (t.status === 'done' && t.completedAt?.startsWith(todayStr)) return true;
      if (t.status === 'todo') return true;
      return false;
    }), [tasks, todayStr]);

  const todoTasks = useMemo(() => todayTasks.filter((t) => t.status === 'todo'), [todayTasks]);
  const doneTasks = useMemo(() => todayTasks.filter((t) => t.status === 'done'), [todayTasks]);
  const mainFocusTask = useMemo(() => tasks.find((t) => t.isMainFocus && t.status === 'todo'), [tasks]);

  const top3 = useMemo(() => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return todoTasks
      .filter((t) => !t.isMainFocus)
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
      .slice(0, 3);
  }, [todoTasks]);

  const todayFocusSeconds = useMemo(() => getTodayFocusSeconds(sessions), [sessions]);
  const todayFocusSessions = useMemo(() =>
    sessions.filter((s) => s.startedAt.startsWith(todayStr) && s.completed).length,
    [sessions, todayStr]);

  const progress = todayTasks.length > 0
    ? Math.round((doneTasks.length / todayTasks.length) * 100)
    : 0;

  const greeting = getGreeting();
  const dateLabel = format(new Date(), "EEEE, d MMMM", { locale: vi });

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[#9E9A94] capitalize">{dateLabel}</p>
          <h1 className="text-2xl font-semibold text-[#1A1917] mt-0.5">{greeting} 👋</h1>
        </div>
        {todayFocusSessions > 0 && (
          <div className="flex items-center gap-1.5 bg-[#FFF0E8] text-[#E85D00] text-xs font-semibold px-2.5 py-1.5 rounded-xl">
            <Flame size={13} />
            {todayFocusSessions} focus session{todayFocusSessions > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={<CheckCircle2 size={16} color="#2D8A4E" />}
          value={`${doneTasks.length}/${todayTasks.length}`}
          label="Tasks xong"
          bg="#E8F7ED"
        />
        <StatCard
          icon={<Clock size={16} color="#E85D00" />}
          value={todayFocusSeconds > 0 ? formatFocusDuration(todayFocusSeconds) : '—'}
          label="Focus hôm nay"
          bg="#FFF0E8"
        />
        <StatCard
          icon={<TrendingUp size={16} color="#B07D12" />}
          value={`${progress}%`}
          label="Hoàn thành"
          bg="#FDF6E3"
        />
      </div>

      {/* Progress bar */}
      {todayTasks.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-[#9E9A94] font-medium">Tiến độ hôm nay</span>
            <span className="text-xs font-semibold text-[#1A1917]">{progress}%</span>
          </div>
          <div className="h-2 bg-[#F0EEE8] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#E85D00] rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Focus */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Target size={15} color="#E85D00" />
          <h2 className="text-sm font-semibold text-[#1A1917]">Main Focus</h2>
        </div>
        {mainFocusTask ? (
          <div className="bg-[#FFFAF7] border border-[#E85D00] rounded-xl p-3.5">
            <p className="text-base font-medium text-[#1A1917] leading-snug">{mainFocusTask.title}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] font-semibold text-[#E85D00] bg-[#FFF0E8] px-1.5 py-0.5 rounded">
                {mainFocusTask.priority === 'high' ? 'Cao' : mainFocusTask.priority === 'medium' ? 'TB' : 'Thấp'}
              </span>
              <button
                onClick={() => setView('focus')}
                className="text-xs text-[#E85D00] font-medium hover:underline"
              >
                Bắt đầu Focus →
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-dashed border-[#E8E5DF] rounded-xl p-3.5 text-center">
            <p className="text-sm text-[#9E9A94]">Chưa có Main Focus</p>
            <p className="text-xs text-[#9E9A94] mt-0.5">Vào Tasks để chọn ⭐</p>
          </div>
        )}
      </div>

      {/* Top 3 Priorities */}
      {top3.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-[#1A1917]">Top ưu tiên</h2>
            <button onClick={() => setView('tasks')} className="text-xs text-[#E85D00] font-medium hover:underline">
              Xem tất cả →
            </button>
          </div>
          <div className="space-y-2">
            {top3.map((task, i) => (
              <div key={task.id} className="flex items-center gap-3 bg-white border border-[#E8E5DF] rounded-xl px-3 py-2.5">
                <span className="text-xs font-bold text-[#D0CCC5] w-4">{i + 1}</span>
                <p className="flex-1 text-sm text-[#1A1917] truncate">{task.title}</p>
                <PriorityDot priority={task.priority} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Add */}
      <div>
        <h2 className="text-sm font-semibold text-[#1A1917] mb-2">Quick Add</h2>
        <QuickAddTask compact />
      </div>

      {/* Empty state */}
      {todoTasks.length === 0 && doneTasks.length === 0 && (
        <div className="bg-white border border-[#E8E5DF] rounded-xl p-6 text-center">
          <p className="text-2xl mb-2">✨</p>
          <p className="text-sm font-medium text-[#1A1917]">Hôm nay chưa có task nào</p>
          <p className="text-xs text-[#9E9A94] mt-1">Thêm task đầu tiên ở trên!</p>
        </div>
      )}

      {/* All done state */}
      {todoTasks.length === 0 && doneTasks.length > 0 && (
        <div className="bg-[#E8F7ED] border border-[#2D8A4E] rounded-xl p-4 text-center">
          <p className="text-2xl mb-1">🎉</p>
          <p className="text-sm font-semibold text-[#2D8A4E]">Xong hết rồi!</p>
          <p className="text-xs text-[#2D8A4E] mt-0.5 opacity-80">Bạn đã hoàn thành {doneTasks.length} task hôm nay.</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, value, label, bg }: { icon: React.ReactNode; value: string; label: string; bg: string }) {
  return (
    <div className="bg-white border border-[#E8E5DF] rounded-xl p-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: bg }}>
          {icon}
        </div>
      </div>
      <p className="text-base font-bold text-[#1A1917] leading-tight">{value}</p>
      <p className="text-[10px] text-[#9E9A94] mt-0.5 leading-tight">{label}</p>
    </div>
  );
}

function PriorityDot({ priority }: { priority: Task['priority'] }) {
  const colors = { high: '#E85D00', medium: '#B07D12', low: '#5A8A6A' };
  return (
    <span
      className="w-2 h-2 rounded-full flex-shrink-0"
      style={{ backgroundColor: colors[priority] }}
    />
  );
}
