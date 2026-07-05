'use client';
import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import MobileNav from './MobileNav';
import CommandPalette from '@/components/search/CommandPalette';
import AIChatPanel from '@/components/chat/AIChatPanel';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-background overflow-hidden relative selection:bg-primary/30">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background pb-16 md:pb-0">
          <div className="container p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto h-full">
            {children}
          </div>
        </main>
      </div>
      <MobileNav />
      <CommandPalette />
      <AIChatPanel />
    </div>
  );
}
