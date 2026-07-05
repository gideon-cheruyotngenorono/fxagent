'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Wallet,
  DollarSign,
  Activity,
  Percent,
  TrendingUp,
  TrendingDown,
  X,
  RefreshCw,
  ChevronRight,
  BarChart2,
} from 'lucide-react';
import CandlestickChart, { OHLCVData } from '@/components/trading/CandlestickChart';
import { useAccount, usePositions, useCandles, useLatestAnalysis, postClosePosition } from '@/lib/api';
import { useLivePrices } from '@/hooks/useLivePrices';
import Link from 'next/link';

const WATCHLIST = ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD'];
const TIMEFRAMES = ['M5', 'M15', 'M30', 'H1', 'H4', 'D1'];

export default function Dashboard() {
  const { data: account, isLoading: accountLoading } = useAccount();
  const { data: positions, mutate: mutatePositions } = usePositions();
  const [symbol, setSymbol] = useState('EURUSD');
  const [timeframe, setTimeframe] = useState('H1');
  const { data: candlesData, isLoading: chartLoading } = useCandles(symbol, timeframe, 100);
  const { data: analysis } = useLatestAnalysis(symbol);
  const livePrices = useLivePrices(WATCHLIST);

  const candles: OHLCVData[] = candlesData?.candles?.map((c) => ({
    time: c.time,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
    volume: c.volume,
  })) ?? [];

  async function handleClosePosition(ticket: number) {
    try {
      await postClosePosition(ticket);
      mutatePositions();
    } catch (e) {
      console.error('Close position failed', e);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── Account Overview ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          title="Balance"
          value={account?.balance}
          icon={Wallet}
          prefix="$"
          loading={accountLoading}
        />
        <MetricCard
          title="Equity"
          value={account?.equity}
          icon={DollarSign}
          prefix="$"
          loading={accountLoading}
        />
        <MetricCard
          title="Free Margin"
          value={account?.margin_free}
          icon={Activity}
          prefix="$"
          loading={accountLoading}
        />
        <MetricCard
          title="Daily P&L"
          value={account?.daily_pnl}
          icon={Percent}
          prefix="$"
          loading={accountLoading}
          highlight={
            account?.daily_pnl != null
              ? account.daily_pnl > 0
                ? 'positive'
                : account.daily_pnl < 0
                ? 'negative'
                : 'none'
              : 'none'
          }
        />
      </div>

      {/* ── Watchlist Strip ──────────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {WATCHLIST.map((sym) => {
          const p = livePrices[sym];
          const isActive = sym === symbol;
          return (
            <button
              key={sym}
              onClick={() => setSymbol(sym)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border text-left shrink-0 transition-all ${
                isActive
                  ? 'bg-primary/10 border-primary/40 text-foreground'
                  : 'bg-[#161B22] border-[#30363D] hover:border-[#8B949E] text-muted-foreground hover:text-foreground'
              }`}
            >
              <div>
                <div className="font-mono font-bold text-xs text-foreground">{sym}</div>
                {p ? (
                  <div className="font-mono text-sm font-bold">
                    {p.bid.toFixed(sym.includes('JPY') ? 3 : sym === 'XAUUSD' ? 2 : 5)}
                  </div>
                ) : (
                  <div className="h-4 w-16 bg-muted animate-pulse rounded mt-1" />
                )}
              </div>
              {p && (
                <div
                  className={`text-[10px] font-mono self-end pb-0.5 ${
                    p.spread < 1.5 ? 'text-[#00C853]' : 'text-[#FF1744]'
                  }`}
                >
                  {p.spread.toFixed(1)}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Main Area ────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-310px)] min-h-[480px]">
        {/* Chart */}
        <div className="lg:w-[62%] flex flex-col h-full bg-[#161B22] rounded-lg border border-[#30363D] overflow-hidden">
          {/* Chart header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#30363D] bg-[#0D1117] shrink-0">
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-sm">{symbol}</span>
              {candles.length > 0 && (() => {
                const last = candles[candles.length - 1];
                const isUp = last.close >= last.open;
                return (
                  <span className={`font-mono text-sm font-bold ${isUp ? 'text-[#00C853]' : 'text-[#FF1744]'}`}>
                    {last.close.toFixed(symbol.includes('JPY') ? 3 : 5)}
                  </span>
                );
              })()}
            </div>
            <div className="flex items-center bg-[#21262D] rounded px-1 py-0.5 gap-0.5">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                    tf === timeframe
                      ? 'bg-primary/20 text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <CandlestickChart data={candles} loading={chartLoading} showVolume />
          </div>
        </div>

        {/* Right panels */}
        <div className="lg:w-[38%] flex flex-col gap-4 min-h-0">
          {/* AI Analysis */}
          <div className="flex-1 flex flex-col min-h-0 bg-[#161B22] border border-[#30363D] rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#30363D] bg-[#0D1117] shrink-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                AI Analysis — {symbol}
              </div>
              <Link href="/analysis">
                <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground hover:text-primary gap-1">
                  Run <ChevronRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {analysis ? (
                <div className="space-y-3">
                  {/* Bias */}
                  <div
                    className={`p-3 rounded border-l-2 ${
                      analysis.bias === 'BULLISH'
                        ? 'bg-[#00C853]/10 border-[#00C853]'
                        : analysis.bias === 'BEARISH'
                        ? 'bg-[#FF1744]/10 border-[#FF1744]'
                        : 'bg-muted/20 border-muted-foreground'
                    }`}
                  >
                    <div
                      className={`font-bold text-sm tracking-wide mb-1 flex items-center gap-1.5 ${
                        analysis.bias === 'BULLISH'
                          ? 'text-[#00C853]'
                          : analysis.bias === 'BEARISH'
                          ? 'text-[#FF1744]'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {analysis.bias === 'BULLISH' ? (
                        <TrendingUp className="w-3.5 h-3.5" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5" />
                      )}
                      {analysis.bias} BIAS
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {analysis.summary}
                    </p>
                  </div>

                  {/* Trade levels */}
                  <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                    <div className="p-2.5 bg-[#0D1117] rounded border border-[#30363D]">
                      <div className="text-[10px] text-muted-foreground font-sans mb-0.5">Entry</div>
                      <div className="font-bold">{analysis.entry?.toFixed(5)}</div>
                    </div>
                    <div className="p-2.5 bg-[#0D1117] rounded border border-[#30363D]">
                      <div className="text-[10px] text-muted-foreground font-sans mb-0.5">R:R Ratio</div>
                      <div className="font-bold text-primary">{analysis.rr?.toFixed(2)}</div>
                    </div>
                    <div className="p-2.5 bg-[#0D1117] rounded border border-[#30363D]">
                      <div className="text-[10px] text-muted-foreground font-sans mb-0.5">Stop Loss</div>
                      <div className="font-bold text-[#FF1744]">{analysis.sl?.toFixed(5)}</div>
                    </div>
                    <div className="p-2.5 bg-[#0D1117] rounded border border-[#30363D]">
                      <div className="text-[10px] text-muted-foreground font-sans mb-0.5">Take Profit</div>
                      <div className="font-bold text-[#00C853]">{analysis.tp?.toFixed(5)}</div>
                    </div>
                  </div>

                  <Link href="/analysis" className="block">
                    <Button className="w-full bg-primary hover:bg-primary/90 text-sm">
                      Run New Analysis
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
                  <BarChart2 className="w-8 h-8 text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground">No analysis yet for {symbol}</p>
                  <Link href="/analysis">
                    <Button size="sm" className="bg-primary hover:bg-primary/90">
                      Run Analysis
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Open Positions */}
          <div className="flex-1 flex flex-col min-h-0 bg-[#161B22] border border-[#30363D] rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#30363D] bg-[#0D1117] shrink-0">
              <span className="text-sm font-semibold">Open Positions</span>
              {positions && positions.count > 0 && (
                <span
                  className={`text-xs font-mono font-bold ${
                    positions.total_pnl >= 0 ? 'text-[#00C853]' : 'text-[#FF1744]'
                  }`}
                >
                  {positions.total_pnl >= 0 ? '+' : ''}${positions.total_pnl.toFixed(2)}
                </span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {!positions || positions.count === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
                  No open positions
                </div>
              ) : (
                <div className="space-y-2">
                  {positions.positions.map((pos) => (
                    <div
                      key={pos.ticket}
                      className="p-3 bg-[#0D1117] rounded border border-[#30363D] group"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm">{pos.symbol}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${
                              pos.type === 'buy'
                                ? 'bg-[#00C853]/20 text-[#00C853]'
                                : 'bg-[#FF1744]/20 text-[#FF1744]'
                            }`}
                          >
                            {pos.type}
                          </span>
                        </div>
                        <button
                          onClick={() => handleClosePosition(pos.ticket)}
                          className="opacity-0 group-hover:opacity-100 text-[10px] text-[#FF1744] border border-[#FF1744]/30 rounded px-1.5 py-0.5 hover:bg-[#FF1744]/10 transition-all"
                        >
                          Close
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="text-muted-foreground font-mono">
                          {pos.volume} lots @ {pos.open_price}
                        </div>
                        <div
                          className={`font-mono font-bold ${
                            pos.profit >= 0 ? 'text-[#00C853]' : 'text-[#FF1744]'
                          }`}
                        >
                          {pos.profit >= 0 ? '+' : ''}${pos.profit.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {pos.open_time_ago} · {pos.pips_from_entry > 0 ? '+' : ''}{pos.pips_from_entry} pips
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Metric Card ───────────────────────────────────────────────────────────────

function MetricCard({
  title,
  value,
  icon: Icon,
  prefix = '',
  highlight = 'none',
  loading = false,
}: {
  title: string;
  value?: number;
  icon: React.ElementType;
  prefix?: string;
  highlight?: 'positive' | 'negative' | 'none';
  loading?: boolean;
}) {
  const colorClass =
    highlight === 'positive'
      ? 'text-[#00C853]'
      : highlight === 'negative'
      ? 'text-[#FF1744]'
      : 'text-foreground';

  return (
    <Card className="bg-[#161B22] border-[#30363D]">
      <CardContent className="p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground tracking-tight">{title}</span>
          <Icon className="w-3.5 h-3.5 text-muted-foreground/60" />
        </div>
        {loading || value === undefined ? (
          <div className="h-7 w-3/4 bg-[#21262D] animate-pulse rounded" />
        ) : (
          <span className={`text-xl font-bold font-mono tracking-tighter ${colorClass}`}>
            {prefix}{value.toFixed(2)}
          </span>
        )}
      </CardContent>
    </Card>
  );
}
