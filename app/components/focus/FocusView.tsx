'use client';

import { useMemo, useState } from 'react';
import { useAppStore } from '@/app/store/useAppStore';
import { useTimer } from '@/app/hooks/useTimer';
import { Play, Pause, Square, Clock, Flame, ChevronDown, ChevronUp } from 'lucide-react';
import { formatTimerDisplay, getTodayFocusSeconds, formatFocusDuration } from '@/app/lib/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { FocusMode } from '@/app/lib/types';

const MODES: { value: FocusMode; label: string; desc: string }[] = [
  { value: 25, label: '25 min', desc: 'Pomodoro' },
  { value: 50, label: '50 min', desc: 'Deep Work' },
  { value: 'custom', label: 'Custom', desc: 'Tự chọn' },
];

export default function FocusView() {
  useTimer();

  const {
    timerState, timerSeconds, activeMode, customMinutes,
    startTimer, pauseTimer, endTimer,
    setMode, setCustomMinutes, sessions,
  } = useAppStore();

  const [showHistory, setShowHistory] = useState(false);

  const totalSecs = useMemo(() => {
    if (activeMode === 'custom') return customMinutes * 60;
    return activeMode * 60;
  }, [activeMode, customMinutes]);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayFocusSecs = useMemo(() => getTodayFocusSeconds(sessions), [sessions]);
  const todaySessions = useMemo(() =>
    sessions.filter((s) => s.startedAt.startsWith(todayStr) && s.completed), [sessions, todayStr]);

  const progress = totalSecs > 0 ? (totalSecs - timerSeconds) / totalSecs : 0;
  const circumference = 2 * Math.PI * 80; // r=80
  const strokeDashoffset = circumference * (1 - progress);

  const isRunning = timerState === 'running';
  const isPaused = timerState === 'paused';
  const isIdle = timerState === 'idle';

  const recentSessions = useMemo(() =>
    [...sessions]
      .filter((s) => s.completed)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
      .slice(0, 10),
    [sessions]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-[#1A1917]">Focus Timer</h1>
        <p className="text-xs text-[#9E9A94] mt-0.5">Ngồi xuống và tập trung thật sự</p>
      </div>

      {/* Mode selector */}
      <div className="grid grid-cols-3 gap-2">
        {MODES.map(({ value, label, desc }) => {
          const active = activeMode === value;
          return (
            <button
              key={String(value)}
              onClick={() => { if (!isRunning && !isPaused) setMode(value); }}
              disabled={isRunning || isPaused}
              className={`flex flex-col items-center py-3 px-2 rounded-xl border text-center transition-all ${
                active
                  ? 'border-[#E85D00] bg-[#FFF0E8] text-[#E85D00]'
                  : 'border-[#E8E5DF] bg-white text-[#6B6760] hover:border-[#9E9A94]'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span className="text-sm font-bold">{label}</span>
              <span className="text-[10px] mt-0.5 opacity-70">{desc}</span>
            </button>
          );
        })}
      </div>

      {/* Custom minutes */}
      {activeMode === 'custom' && !isRunning && !isPaused && (
        <div className="bg-white border border-[#E8E5DF] rounded-xl p-3 flex items-center gap-3 animate-fade-in">
          <span className="text-sm text-[#6B6760]">Thời gian:</span>
          <input
            type="number"
            min={5}
            max={120}
            value={customMinutes}
            onChange={(e) => setCustomMinutes(Math.max(5, Math.min(120, Number(e.target.value))))}
            className="w-20 text-center text-base font-bold text-[#1A1917] border border-[#E8E5DF] rounded-lg px-2 py-1.5 outline-none focus:border-[#E85D00] transition-colors"
          />
          <span className="text-sm text-[#6B6760]">phút</span>
        </div>
      )}

      {/* Timer circle */}
      <div className="flex flex-col items-center py-4">
        <div className="relative w-48 h-48">
          <svg className="w-full h-full" viewBox="0 0 200 200">
            {/* Background ring */}
            <circle
              cx="100" cy="100" r="80"
              fill="none"
              stroke="#F0EEE8"
              strokeWidth="8"
            />
            {/* Progress ring */}
            <circle
              cx="100" cy="100" r="80"
              fill="none"
              stroke={isRunning ? '#E85D00' : isPaused ? '#B07D12' : '#D0CCC5'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 100 100)"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>

          {/* Time display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={`text-4xl font-bold tracking-tight font-mono ${
                isRunning ? 'text-[#E85D00] animate-timer-pulse' : 'text-[#1A1917]'
              }`}
            >
              {formatTimerDisplay(timerSeconds)}
            </span>
            <span className="text-xs text-[#9E9A94] mt-1">
              {isRunning ? 'đang chạy...' : isPaused ? 'tạm dừng' : 'sẵn sàng'}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 mt-6">
          {isIdle && (
            <button
              onClick={startTimer}
              className="flex items-center gap-2 bg-[#E85D00] text-white px-8 py-3 rounded-2xl font-semibold text-sm hover:bg-[#CC5000] transition-all active:scale-95 shadow-[0_4px_12px_rgba(232,93,0,0.3)]"
            >
              <Play size={16} fill="white" />
              Bắt đầu
            </button>
          )}

          {isRunning && (
            <>
              <button
                onClick={pauseTimer}
                className="flex items-center gap-2 bg-[#FDF6E3] text-[#B07D12] border border-[#B07D12] px-6 py-3 rounded-2xl font-semibold text-sm hover:bg-[#FAF0D0] transition-all active:scale-95"
              >
                <Pause size={16} />
                Dừng
              </button>
              <button
                onClick={endTimer}
                className="flex items-center gap-2 bg-white text-[#9E9A94] border border-[#E8E5DF] px-6 py-3 rounded-2xl font-semibold text-sm hover:bg-[#F7F6F2] transition-all active:scale-95"
              >
                <Square size={16} />
                Kết thúc
              </button>
            </>
          )}

          {isPaused && (
            <>
              <button
                onClick={startTimer}
                className="flex items-center gap-2 bg-[#E85D00] text-white px-6 py-3 rounded-2xl font-semibold text-sm hover:bg-[#CC5000] transition-all active:scale-95"
              >
                <Play size={16} fill="white" />
                Tiếp tục
              </button>
              <button
                onClick={endTimer}
                className="flex items-center gap-2 bg-white text-[#9E9A94] border border-[#E8E5DF] px-6 py-3 rounded-2xl font-semibold text-sm hover:bg-[#F7F6F2] transition-all active:scale-95"
              >
                <Square size={16} />
                Kết thúc
              </button>
            </>
          )}
        </div>
      </div>

      {/* Today stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-[#E8E5DF] rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Flame size={14} color="#E85D00" />
            <span className="text-xs text-[#9E9A94]">Focus hôm nay</span>
          </div>
          <p className="text-lg font-bold text-[#1A1917]">
            {todayFocusSecs > 0 ? formatFocusDuration(todayFocusSecs) : '—'}
          </p>
        </div>
        <div className="bg-white border border-[#E8E5DF] rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock size={14} color="#6B6760" />
            <span className="text-xs text-[#9E9A94]">Sessions</span>
          </div>
          <p className="text-lg font-bold text-[#1A1917]">{todaySessions.length}</p>
        </div>
      </div>

      {/* Session history */}
      {recentSessions.length > 0 && (
        <div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-sm font-semibold text-[#6B6760] hover:text-[#1A1917] transition-colors mb-3"
          >
            <Clock size={14} />
            Lịch sử sessions
            {showHistory ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {showHistory && (
            <div className="space-y-2 animate-fade-in">
              {recentSessions.map((session) => {
                const date = new Date(session.startedAt);
                return (
                  <div
                    key={session.id}
                    className="bg-white border border-[#E8E5DF] rounded-xl px-3 py-2.5 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#1A1917]">
                        {formatFocusDuration(session.duration)}
                      </p>
                      <p className="text-[10px] text-[#9E9A94] mt-0.5">
                        {format(date, 'HH:mm · dd/MM', { locale: vi })}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-1 rounded-lg ${
                        session.completed
                          ? 'bg-[#E8F7ED] text-[#2D8A4E]'
                          : 'bg-[#F7F6F2] text-[#9E9A94]'
                      }`}
                    >
                      {session.completed ? '✓ Xong' : 'Dừng sớm'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
