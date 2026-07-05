'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import CandlestickChart, { OHLCVData } from '@/components/trading/CandlestickChart';
import { Button } from '@/components/ui/button';
import {
  Maximize2,
  LayoutGrid,
  Crosshair,
  TrendingUp,
  RefreshCw,
  ChevronDown,
  Activity,
  Wifi,
  WifiOff,
  BarChart2,
  PlusSquare,
  X,
} from 'lucide-react';
import { useCandles } from '@/lib/api';

// ─── Types ─────────────────────────────────────────────────────────────────

const SYMBOLS = ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'USDCAD', 'AUDUSD', 'NZDUSD', 'USDCHF'];
const TIMEFRAMES = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1'];

interface ChartSlot {
  id: number;
  symbol: string;
  timeframe: string;
}

type LayoutCount = 1 | 2 | 4;

// ─── Price Ticker (WebSocket + REST fallback) ───────────────────────────────

function useLivePrice(symbol: string) {
  const [priceInfo, setPriceInfo] = useState<{
    bid: number;
    ask: number;
    spread: number;
    change: number;
    changePct: number;
  } | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const wsBase = API_BASE.replace(/^http/, 'ws');

    function connect() {
      try {
        const ws = new WebSocket(`${wsBase}/ws/live-prices`);
        wsRef.current = ws;

        ws.onopen = () => ws.send(JSON.stringify({ subscribe: [symbol] }));

        ws.onmessage = (e) => {
          const d = JSON.parse(e.data);
          if (d.type === 'price_update' && d.prices?.[symbol]) {
            const p = d.prices[symbol];
            setPriceInfo({
              bid: p.bid,
              ask: p.ask,
              spread: p.spread,
              change: p.change ?? 0,
              changePct: p.change_pct ?? 0,
            });
          }
        };

        ws.onerror = () => {
          ws.close();
        };

        ws.onclose = () => {
          reconnectTimer.current = setTimeout(connect, 3000);
        };
      } catch (_) {}
    }

    connect();

    return () => {
      wsRef.current?.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [symbol]);

  return priceInfo;
}

// ─── Individual Chart Panel ─────────────────────────────────────────────────

function ChartPanel({
  slot,
  compact,
  onSymbolChange,
  onTimeframeChange,
  onRemove,
  canRemove,
}: {
  slot: ChartSlot;
  compact: boolean;
  onSymbolChange: (id: number, symbol: string) => void;
  onTimeframeChange: (id: number, tf: string) => void;
  onRemove: (id: number) => void;
  canRemove: boolean;
}) {
  const { data: candlesData, isLoading, mutate } = useCandles(slot.symbol, slot.timeframe, 200);
  const livePrice = useLivePrice(slot.symbol);
  const [showSymbolMenu, setShowSymbolMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowSymbolMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const candles: OHLCVData[] = candlesData?.candles?.map((c) => ({
    time: c.time,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
    volume: c.volume,
  })) ?? [];

  const lastCandle = candles[candles.length - 1];
  const isUp = lastCandle ? lastCandle.close >= lastCandle.open : true;

  return (
    <div className="relative flex flex-col h-full bg-[#161B22] border border-[#30363D] rounded-lg overflow-hidden group">
      {/* ── Panel Header ── */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#0D1117] border-b border-[#30363D] shrink-0">
        {/* Symbol Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowSymbolMenu((v) => !v)}
            className="flex items-center gap-1.5 font-mono font-bold text-sm text-foreground hover:text-primary transition-colors"
          >
            {slot.symbol}
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>
          {showSymbolMenu && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-[#161B22] border border-[#30363D] rounded-md shadow-xl py-1 min-w-[120px]">
              {SYMBOLS.map((sym) => (
                <button
                  key={sym}
                  onClick={() => { onSymbolChange(slot.id, sym); setShowSymbolMenu(false); }}
                  className={`w-full text-left px-3 py-2 text-xs font-mono hover:bg-[#21262D] transition-colors ${
                    sym === slot.symbol ? 'text-primary font-bold' : 'text-foreground'
                  }`}
                >
                  {sym}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Timeframe Pills */}
        <div className="flex items-center gap-0.5 bg-[#21262D] rounded px-1 py-0.5">
          {(compact ? ['M15', 'H1', 'H4', 'D1'] : TIMEFRAMES).map((tf) => (
            <button
              key={tf}
              onClick={() => onTimeframeChange(slot.id, tf)}
              className={`px-1.5 py-0.5 text-[10px] rounded font-medium transition-colors ${
                tf === slot.timeframe
                  ? 'bg-primary/20 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Live price */}
        {livePrice ? (
          <div className="flex items-center gap-2 ml-auto">
            <span className={`font-mono text-xs font-bold ${isUp ? 'text-[#00C853]' : 'text-[#FF1744]'}`}>
              {livePrice.bid.toFixed(
                slot.symbol.includes('JPY') ? 3 : slot.symbol === 'XAUUSD' ? 2 : 5
              )}
            </span>
            <span className={`text-[10px] font-mono ${livePrice.changePct >= 0 ? 'text-[#00C853]' : 'text-[#FF1744]'}`}>
              {livePrice.changePct >= 0 ? '+' : ''}{livePrice.changePct.toFixed(2)}%
            </span>
            <Wifi className="w-3 h-3 text-[#00C853]" />
          </div>
        ) : lastCandle ? (
          <div className="flex items-center gap-2 ml-auto">
            <span className={`font-mono text-xs font-bold ${isUp ? 'text-[#00C853]' : 'text-[#FF1744]'}`}>
              {lastCandle.close.toFixed(
                slot.symbol.includes('JPY') ? 3 : slot.symbol === 'XAUUSD' ? 2 : 5
              )}
            </span>
            <WifiOff className="w-3 h-3 text-muted-foreground" />
          </div>
        ) : null}

        {/* Refresh + Remove */}
        <button
          onClick={() => mutate()}
          className="ml-1 p-1 rounded hover:bg-[#21262D] text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
          title="Refresh"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
        {canRemove && (
          <button
            onClick={() => onRemove(slot.id)}
            className="p-1 rounded hover:bg-[#21262D] text-muted-foreground hover:text-[#FF1744] transition-colors opacity-0 group-hover:opacity-100"
            title="Remove chart"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* ── OHLC Bar (when hovered) ── */}
      {!compact && lastCandle && (
        <div className="flex items-center gap-3 px-3 py-1 bg-[#0D1117]/60 text-[10px] font-mono border-b border-[#30363D]/50 shrink-0">
          <span className="text-muted-foreground">O</span>
          <span className={lastCandle.close >= lastCandle.open ? 'text-[#00C853]' : 'text-[#FF1744]'}>
            {lastCandle.open.toFixed(5)}
          </span>
          <span className="text-muted-foreground">H</span>
          <span className="text-[#00C853]">{lastCandle.high.toFixed(5)}</span>
          <span className="text-muted-foreground">L</span>
          <span className="text-[#FF1744]">{lastCandle.low.toFixed(5)}</span>
          <span className="text-muted-foreground">C</span>
          <span className={`font-bold ${lastCandle.close >= lastCandle.open ? 'text-[#00C853]' : 'text-[#FF1744]'}`}>
            {lastCandle.close.toFixed(5)}
          </span>
          {lastCandle.volume !== undefined && (
            <>
              <span className="text-muted-foreground ml-2">Vol</span>
              <span className="text-foreground">{lastCandle.volume.toLocaleString()}</span>
            </>
          )}
        </div>
      )}

      {/* ── Chart Canvas ── */}
      <div className="flex-1 min-h-0">
        <CandlestickChart
          data={candles}
          loading={isLoading}
          showVolume={!compact}
          compact={compact}
        />
      </div>

      {/* Error state */}
      {!isLoading && candles.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#161B22]/80 gap-3 pointer-events-none">
          <BarChart2 className="w-8 h-8 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground">
            Connecting to {slot.symbol}…
          </p>
        </div>
      )}
    </div>
  );
}

// ── Watchlist Sidebar item ──────────────────────────────────────────────────

function WatchlistItem({
  symbol,
  active,
  onClick,
}: {
  symbol: string;
  active: boolean;
  onClick: () => void;
}) {
  const livePrice = useLivePrice(symbol);

  return (
    <button
      onClick={onClick}
      className={`w-full flex flex-col items-start px-3 py-2.5 border-b border-[#21262D] last:border-0 hover:bg-[#21262D] transition-colors text-left ${
        active ? 'bg-primary/10 border-l-2 border-l-primary pl-2.5' : ''
      }`}
    >
      <div className="flex items-center justify-between w-full">
        <span className="font-mono font-bold text-xs text-foreground">{symbol}</span>
        {livePrice ? (
          <span
            className={`font-mono text-xs font-bold ${
              livePrice.changePct >= 0 ? 'text-[#00C853]' : 'text-[#FF1744]'
            }`}
          >
            {livePrice.bid.toFixed(symbol.includes('JPY') ? 3 : symbol === 'XAUUSD' ? 2 : 5)}
          </span>
        ) : (
          <div className="h-3 w-14 bg-[#21262D] rounded animate-pulse" />
        )}
      </div>
      {livePrice && (
        <div className="flex items-center gap-1 mt-0.5">
          <span className={`text-[10px] font-mono ${livePrice.changePct >= 0 ? 'text-[#00C853]' : 'text-[#FF1744]'}`}>
            {livePrice.changePct >= 0 ? '▲' : '▼'}{' '}
            {Math.abs(livePrice.changePct).toFixed(2)}%
          </span>
          <span className="text-[10px] text-muted-foreground">
            Sprd: {livePrice.spread.toFixed(1)}
          </span>
        </div>
      )}
    </button>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function ChartsPage() {
  const [layout, setLayout] = useState<LayoutCount>(1);
  const [showWatchlist, setShowWatchlist] = useState(true);
  const [slots, setSlots] = useState<ChartSlot[]>([
    { id: 1, symbol: 'EURUSD', timeframe: 'H1' },
    { id: 2, symbol: 'GBPUSD', timeframe: 'H1' },
    { id: 3, symbol: 'USDJPY', timeframe: 'H4' },
    { id: 4, symbol: 'XAUUSD', timeframe: 'D1' },
  ]);

  const nextId = useRef(5);

  const visibleSlots = slots.slice(0, layout);

  const handleSymbolChange = useCallback((id: number, symbol: string) => {
    setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, symbol } : s)));
  }, []);

  const handleTimeframeChange = useCallback((id: number, tf: string) => {
    setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, timeframe: tf } : s)));
  }, []);

  const handleRemove = useCallback((id: number) => {
    setSlots((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      if (filtered.length === 0) return prev; // keep at least 1
      return filtered;
    });
    setLayout((l) => Math.max(1, l - 1) as LayoutCount);
  }, []);

  function cycleLayout() {
    setLayout((l) => {
      if (l === 1) return 2;
      if (l === 2) return 4;
      return 1;
    });
    // Ensure we have enough slots
    setSlots((prev) => {
      while (prev.length < 4) {
        const defaults = ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD'];
        prev = [
          ...prev,
          {
            id: nextId.current++,
            symbol: defaults[prev.length] ?? 'EURUSD',
            timeframe: 'H1',
          },
        ];
      }
      return prev;
    });
  }

  const gridClass: Record<LayoutCount, string> = {
    1: 'grid-cols-1 grid-rows-1',
    2: 'grid-cols-2 grid-rows-1',
    4: 'grid-cols-2 grid-rows-2',
  };

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] w-full gap-0 -mx-4 md:-mx-8 -mt-4 md:-mt-6 lg:-mt-8 overflow-hidden">
      {/* ── Top Toolbar ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#0D1117] border-b border-[#30363D] shrink-0 z-20">
        {/* Left tools */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-[#21262D] hover:text-primary text-muted-foreground"
            title="Crosshair"
          >
            <Crosshair className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-[#21262D] hover:text-primary text-muted-foreground"
            title="Trend Line"
          >
            <TrendingUp className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-[#21262D] hover:text-primary text-muted-foreground"
            title="Add Chart"
            onClick={cycleLayout}
          >
            <PlusSquare className="w-4 h-4" />
          </Button>
        </div>

        <div className="h-5 w-px bg-[#30363D] mx-1" />

        {/* Layout button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-[#21262D] gap-1.5"
          onClick={cycleLayout}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          {layout === 1 ? '1 Chart' : layout === 2 ? '2 Charts' : '4 Charts'}
        </Button>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2">
          {/* Live badge */}
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#00C853] bg-[#00C853]/10 border border-[#00C853]/30 rounded px-2 py-1">
            <Activity className="w-3 h-3 animate-pulse" />
            LIVE
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground hover:text-foreground hover:bg-[#21262D]"
            onClick={() => setShowWatchlist((v) => !v)}
          >
            Watchlist
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-[#21262D] text-muted-foreground"
            title="Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* ── Main Area ─────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">
        {/* Chart Grid */}
        <div className={`flex-1 grid gap-0.5 bg-[#0D1117] p-0.5 min-h-0 ${gridClass[layout]}`}>
          {visibleSlots.map((slot) => (
            <ChartPanel
              key={slot.id}
              slot={slot}
              compact={layout === 4}
              onSymbolChange={handleSymbolChange}
              onTimeframeChange={handleTimeframeChange}
              onRemove={handleRemove}
              canRemove={visibleSlots.length > 1}
            />
          ))}
        </div>

        {/* Watchlist Sidebar */}
        {showWatchlist && (
          <div className="w-[160px] xl:w-[180px] border-l border-[#30363D] bg-[#0D1117] flex flex-col shrink-0 overflow-hidden">
            <div className="px-3 py-2 border-b border-[#30363D] text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Watchlist
            </div>
            <div className="flex-1 overflow-y-auto">
              {SYMBOLS.map((sym) => (
                <WatchlistItem
                  key={sym}
                  symbol={sym}
                  active={visibleSlots[0]?.symbol === sym}
                  onClick={() => handleSymbolChange(visibleSlots[0]?.id, sym)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom Status Bar ─────────────────────────────────────────── */}
      <StatusBar slot={visibleSlots[0]} />
    </div>
  );
}

// ── Status Bar ──────────────────────────────────────────────────────────────

function StatusBar({ slot }: { slot: ChartSlot | undefined }) {
  const livePrice = useLivePrice(slot?.symbol ?? 'EURUSD');
  const { data: candlesData } = useCandles(slot?.symbol ?? 'EURUSD', slot?.timeframe ?? 'H1', 14);

  const candles = candlesData?.candles ?? [];
  const lastCandle = candles[candles.length - 1];

  // Simple ATR calculation
  const atr = candles.length >= 14
    ? (
        candles.slice(-14).reduce((sum, c) => sum + (c.high - c.low), 0) / 14 * 10000
      ).toFixed(1)
    : '—';

  return (
    <div className="flex items-center gap-4 px-4 py-1.5 bg-[#0D1117] border-t border-[#30363D] shrink-0 text-[10px] font-mono text-muted-foreground overflow-x-auto">
      {slot && (
        <>
          <div className="flex items-center gap-1.5">
            <span className="text-[#8B949E]">Symbol</span>
            <span className="text-foreground font-bold">{slot.symbol}</span>
            <span className="text-[#30363D]">·</span>
            <span className="text-primary">{slot.timeframe}</span>
          </div>

          {livePrice && (
            <>
              <div className="h-3 w-px bg-[#30363D]" />
              <div className="flex items-center gap-1.5">
                <span>Bid</span>
                <span className="text-[#00C853] font-bold">
                  {livePrice.bid.toFixed(slot.symbol.includes('JPY') ? 3 : 5)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>Ask</span>
                <span className="text-foreground font-bold">
                  {livePrice.ask.toFixed(slot.symbol.includes('JPY') ? 3 : 5)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>Spread</span>
                <span className="text-foreground">{livePrice.spread.toFixed(1)} pts</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>Chg</span>
                <span className={livePrice.changePct >= 0 ? 'text-[#00C853]' : 'text-[#FF1744]'}>
                  {livePrice.changePct >= 0 ? '+' : ''}{livePrice.changePct.toFixed(2)}%
                </span>
              </div>
            </>
          )}

          {lastCandle && (
            <>
              <div className="h-3 w-px bg-[#30363D]" />
              <div className="flex items-center gap-1.5">
                <span>ATR(14)</span>
                <span className="text-foreground">{atr} pts</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>H</span>
                <span className="text-[#00C853]">{lastCandle.high.toFixed(5)}</span>
                <span>L</span>
                <span className="text-[#FF1744]">{lastCandle.low.toFixed(5)}</span>
              </div>
            </>
          )}

          <div className="ml-auto flex items-center gap-1.5 text-[#7C4DFF]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7C4DFF] animate-pulse" />
            <span className="font-sans">Session Active</span>
          </div>
        </>
      )}
    </div>
  );
}
