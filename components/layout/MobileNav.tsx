'use client';
import { Home, LineChart, BarChart2, Settings, History } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', icon: Home, label: 'Dash' },
    { href: '/charts', icon: LineChart, label: 'Charts' },
    { href: '/analysis', icon: BarChart2, label: 'AI' },
    { href: '/history', icon: History, label: 'Hist' },
    { href: '/settings', icon: Settings, label: 'Set' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border z-40 px-2 pb-safe flex items-center justify-around">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <item.icon className="w-5 h-5 mx-auto" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
