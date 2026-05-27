'use client';

import { useAppStore } from '@/app/store/useAppStore';
import Sidebar from './ui/Sidebar';
import Dashboard from './dashboard/Dashboard';
import TasksView from './tasks/TasksView';
import FocusView from './focus/FocusView';
import BrainDumpView from './brain/BrainDumpView';

export default function AppShell() {
  const { view } = useAppStore();

  const renderView = () => {
    switch (view) {
      case 'dashboard': return <Dashboard />;
      case 'tasks': return <TasksView />;
      case 'focus': return <FocusView />;
      case 'brain': return <BrainDumpView />;
    }
  };

  return (
    <div className="min-h-dvh bg-[#F7F6F2]">
      <Sidebar />

      {/* Main content */}
      <main className="md:ml-56 pb-24 md:pb-8">
        <div className="max-w-lg mx-auto px-4 py-6">
          {renderView()}
        </div>
      </main>
    </div>
  );
}
