'use client';
import { Home, LineChart, BarChart2, Settings, History } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', icon: Home, label: 'Dashboard' },
    { href: '/charts', icon: LineChart, label: 'Charts' },
    { href: '/analysis', icon: BarChart2, label: 'Analysis' },
    { href: '/history', icon: History, label: 'History' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-16 xl:w-[280px] bg-card border-r h-full transition-all duration-300">
      <div className="h-14 flex items-center justify-center xl:justify-start xl:px-4 border-b">
        <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-white font-bold tracking-wider text-xs">
          FX
        </div>
        <span className="hidden xl:block ml-3 font-semibold text-foreground tracking-tight">AI Agent</span>
      </div>
      <nav className="flex-1 py-4 flex flex-col gap-2 relative">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center mx-2 px-2 xl:px-4 py-3 rounded-md transition-colors ${
                isActive 
                  ? 'bg-primary/10 text-primary relative' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-md" />
              )}
              <item.icon className="w-5 h-5 mx-auto xl:mx-0 shrink-0" />
              <span className="hidden xl:block ml-3 text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
