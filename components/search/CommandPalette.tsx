'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Command } from 'cmdk';
import {
  Search,
  History,
  LineChart,
  Activity,
  Settings2,
  FileText,
  BarChart2,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { searchAPI, SearchResult } from '@/lib/api';

const STATIC_NAV = [
  { label: 'Go to Dashboard', href: '/', icon: Activity },
  { label: 'Open Advanced Charts', href: '/charts', icon: LineChart },
  { label: 'Run AI Analysis', href: '/analysis', icon: BarChart2 },
  { label: 'View Trading History', href: '/history', icon: History },
  { label: 'System Settings', href: '/settings', icon: Settings2 },
];

const ICON_MAP: Record<string, React.ElementType> = {
  symbol: TrendingUp,
  trade: FileText,
  analysis: BarChart2,
  page: Activity,
};

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  // CMD+K toggle
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchAPI(query.trim());
        setResults(data.results ?? []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, [query]);

  const navigate = useCallback(
    (href: string) => {
      router.push(href);
      setOpen(false);
      setQuery('');
      setResults([]);
    },
    [router]
  );

  function close() {
    setOpen(false);
    setQuery('');
    setResults([]);
  }

  if (!open) return null;

  // Group results by type
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    const group = r.type.charAt(0).toUpperCase() + r.type.slice(1) + 's';
    if (!acc[group]) acc[group] = [];
    acc[group].push(r);
    return acc;
  }, {});

  const showSearch = query.trim().length > 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0D1117]/80 backdrop-blur-sm flex items-start justify-center pt-[15vh]"
      onClick={close}
    >
      <div
        className="w-full max-w-2xl bg-[#161B22] border border-[#30363D] shadow-2xl rounded-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <Command className="w-full text-foreground bg-transparent" shouldFilter={false}>
          {/* Search Input */}
          <div className="flex items-center border-b border-[#30363D] px-4" cmdk-input-wrapper="">
            <Search className="mr-3 shrink-0 w-4 h-4 text-muted-foreground" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Search symbols, trades, analyses… (⌘K)"
              className="flex h-14 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
              autoFocus
            />
            {searching && <Loader2 className="w-4 h-4 text-muted-foreground animate-spin shrink-0" />}
            <kbd className="ml-3 hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-[#30363D] bg-[#21262D] px-1.5 font-mono text-[10px] text-muted-foreground">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-[380px] overflow-y-auto overflow-x-hidden p-2">
            <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
              {searching ? 'Searching…' : query ? 'No results found' : ''}
            </Command.Empty>

            {/* Real search results */}
            {showSearch && Object.entries(grouped).map(([group, items]) => (
              <Command.Group
                key={group}
                heading={group}
                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider"
              >
                {items.map((result) => {
                  const Icon = ICON_MAP[result.type] ?? FileText;
                  return (
                    <Command.Item
                      key={result.id}
                      value={result.id}
                      onSelect={() => navigate(result.href)}
                      className="flex cursor-pointer select-none items-center rounded-lg px-3 py-2.5 text-sm outline-none aria-selected:bg-[#21262D] hover:bg-[#21262D] gap-3 group"
                    >
                      <Icon className="w-4 h-4 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground truncate">{result.title}</div>
                        {result.subtitle && (
                          <div className="text-xs text-muted-foreground truncate">{result.subtitle}</div>
                        )}
                      </div>
                      {result.meta && (
                        <span className="text-[10px] font-mono text-muted-foreground shrink-0 ml-auto">
                          {result.meta}
                        </span>
                      )}
                    </Command.Item>
                  );
                })}
              </Command.Group>
            ))}

            {/* Static nav (always shown when no query) */}
            {!showSearch && (
              <>
                <Command.Group
                  heading="Navigation"
                  className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider"
                >
                  {STATIC_NAV.map(({ label, href, icon: Icon }) => (
                    <Command.Item
                      key={href}
                      value={label}
                      onSelect={() => navigate(href)}
                      className="flex cursor-pointer select-none items-center rounded-lg px-3 py-2.5 text-sm font-medium outline-none aria-selected:bg-[#21262D] hover:bg-[#21262D] text-foreground gap-3"
                    >
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      {label}
                    </Command.Item>
                  ))}
                </Command.Group>

                <Command.Separator className="h-px bg-[#30363D] my-1" />

                <Command.Group
                  heading="Quick Symbols"
                  className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider"
                >
                  {['EURUSD', 'GBPUSD', 'XAUUSD', 'USDJPY'].map((sym) => (
                    <Command.Item
                      key={sym}
                      value={sym}
                      onSelect={() => navigate(`/charts?symbol=${sym}`)}
                      className="flex cursor-pointer select-none items-center rounded-lg px-3 py-2.5 text-sm font-medium outline-none aria-selected:bg-[#21262D] hover:bg-[#21262D] text-foreground gap-3"
                    >
                      <TrendingUp className="w-4 h-4 text-primary" />
                      Load {sym} chart
                    </Command.Item>
                  ))}
                </Command.Group>
              </>
            )}
          </Command.List>

          {/* Footer hint */}
          <div className="flex items-center justify-between border-t border-[#30363D] px-4 py-2 text-[10px] text-muted-foreground">
            <span>Type to search across symbols, trades and analyses</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="bg-[#21262D] border border-[#30363D] rounded px-1 font-mono">↑↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="bg-[#21262D] border border-[#30363D] rounded px-1 font-mono">↵</kbd>
                select
              </span>
            </div>
          </div>
        </Command>
      </div>
    </div>
  );
}
