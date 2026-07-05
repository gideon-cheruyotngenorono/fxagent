'use client';

import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { Search, History, LineChart, Activity, Settings2, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-start justify-center pt-[20vh]" onClick={() => setOpen(false)}>
      <div 
         className="w-full max-w-2xl bg-card border border-border shadow-2xl rounded-xl overflow-hidden" 
         onClick={e => e.stopPropagation()}
      >
        <Command className="w-full h-full text-foreground bg-transparent" shouldFilter={false}>
          <div className="flex items-center border-b border-border px-3" cmdk-input-wrapper="">
            <Search className="mr-2 shrink-0 opacity-50 h-5 w-5 text-muted-foreground" />
            <Command.Input 
              placeholder="Search pairs, recent trades, settings... (CMD+K)" 
              className="flex h-14 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50" 
              autoFocus
            />
          </div>
          
          <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">No results found.</Command.Empty>
            
            <Command.Group heading="Navigation" className="px-2 text-muted-foreground text-xs font-semibold py-2">
              <Command.Item 
                 onSelect={() => { router.push('/'); setOpen(false); }}
                 className="flex cursor-pointer select-none items-center rounded-sm px-2 py-3 text-sm font-medium outline-none aria-selected:bg-muted aria-selected:text-foreground text-foreground hover:bg-muted"
              >
                <Activity className="mr-2 shrink-0 h-4 w-4" />
                Go to Dashboard
              </Command.Item>
              <Command.Item 
                 onSelect={() => { router.push('/charts'); setOpen(false); }}
                 className="flex cursor-pointer select-none items-center rounded-sm px-2 py-3 text-sm font-medium outline-none aria-selected:bg-muted aria-selected:text-foreground text-foreground hover:bg-muted"
              >
                <LineChart className="mr-2 shrink-0 h-4 w-4" />
                Open Advanced Charts
              </Command.Item>
              <Command.Item 
                 onSelect={() => { router.push('/history'); setOpen(false); }}
                 className="flex cursor-pointer select-none items-center rounded-sm px-2 py-3 text-sm font-medium outline-none aria-selected:bg-muted aria-selected:text-foreground text-foreground hover:bg-muted"
              >
                <History className="mr-2 shrink-0 h-4 w-4" />
                View Trading History
              </Command.Item>
              <Command.Item 
                 onSelect={() => { router.push('/settings'); setOpen(false); }}
                 className="flex cursor-pointer select-none items-center rounded-sm px-2 py-3 text-sm font-medium outline-none aria-selected:bg-muted aria-selected:text-foreground text-foreground hover:bg-muted"
              >
                <Settings2 className="mr-2 shrink-0 h-4 w-4" />
                System Settings
              </Command.Item>
            </Command.Group>

            <Command.Separator className="h-px bg-border my-1" />

            <Command.Group heading="Recent Symbols" className="px-2 text-muted-foreground text-xs font-semibold py-2">
               {['EURUSD', 'GBPUSD', 'XAUUSD'].map((sym) => (
                  <Command.Item 
                    key={sym} 
                    onSelect={() => { router.push(`/charts?symbol=${sym}`); setOpen(false); }}
                    className="flex cursor-pointer select-none items-center rounded-sm px-2 py-3 text-sm font-medium outline-none aria-selected:bg-muted aria-selected:text-foreground text-foreground hover:bg-muted"
                  >
                    <FileText className="mr-2 shrink-0 h-4 w-4 text-trading-purple" />
                    Load {sym} chart
                  </Command.Item>
               ))}
            </Command.Group>

          </Command.List>
        </Command>
      </div>
    </div>
  );
}
