'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  usePerformance,
  useEquityCurve,
  useTrades,
  useAnalysisHistory,
} from '@/lib/api';
import { Download, TrendingUp, TrendingDown, Minus } from 'lucide-react';

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`bg-[#21262D] animate-pulse rounded ${className}`} style={style} />;
}

// ── Stats Card ────────────────────────────────────────────────────────────────
function StatsCard({
  title,
  value,
  loading,
  positive,
}: {
  title: string;
  value?: string;
  loading?: boolean;
  positive?: boolean;
}) {
  return (
    <Card className="bg-[#161B22] border-[#30363D]">
      <CardContent className="p-4 sm:p-5">
        <p className="text-xs font-medium text-muted-foreground tracking-tight mb-2 uppercase">{title}</p>
        {loading || !value ? (
          <Skeleton className="h-8 w-3/4" />
        ) : (
          <p
            className={`text-2xl font-bold font-mono tracking-tighter ${
              positive === true
                ? 'text-[#00C853]'
                : positive === false
                ? 'text-[#FF1744]'
                : 'text-foreground'
            }`}
          >
            {value}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#161B22] border border-[#30363D] rounded-lg px-3 py-2 text-xs shadow-xl">
      <div className="text-muted-foreground mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="font-medium" style={{ color: p.color }}>
            {p.name}:
          </span>
          <span className="font-mono font-bold text-foreground">
            ${Number(p.value).toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const [days, setDays] = useState(30);
  const [page, setPage] = useState(1);

  const { data: performance, isLoading: perfLoading } = usePerformance(days);
  const { data: equityCurveData, isLoading: curveLoading } = useEquityCurve(days);
  const { data: tradesData, isLoading: tradesLoading } = useTrades(days, page);
  const { data: analysisHistoryData, isLoading: analysisLoading } = useAnalysisHistory();

  const perf = performance?.trading_performance;
  const equityCurve = equityCurveData?.data ?? [];
  const trades = tradesData?.trades ?? [];
  const analyses = analysisHistoryData?.analyses ?? [];

  function exportCSV() {
    if (!trades.length) return;
    const header = 'Ticket,Symbol,Type,Volume,Open,Close,Profit,Pips\n';
    const rows = trades
      .map(
        (t) =>
          `${t.ticket},${t.symbol},${t.type},${t.volume},${t.open_price},${t.close_price},${t.profit},${t.pips}`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trades_${days}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const DAYS_OPTIONS = [7, 14, 30, 60, 90];

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Trading History & Analytics</h1>
        <div className="flex items-center gap-1 bg-[#161B22] border border-[#30363D] rounded-lg p-1">
          {DAYS_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => { setDays(d); setPage(1); }}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                d === days
                  ? 'bg-primary/20 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-3 bg-[#161B22] border border-[#30363D]">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="trades">Trades</TabsTrigger>
          <TabsTrigger value="analyses">AI Analyses</TabsTrigger>
        </TabsList>

        {/* ── Performance Tab ── */}
        <TabsContent value="performance" className="mt-5 space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatsCard
              title="Total Trades"
              value={perf?.total_trades?.toString()}
              loading={perfLoading}
            />
            <StatsCard
              title="Win Rate"
              value={perf ? `${(perf.win_rate * 100).toFixed(1)}%` : undefined}
              loading={perfLoading}
              positive={perf ? perf.win_rate > 0.5 : undefined}
            />
            <StatsCard
              title="Net P&L"
              value={perf ? `${perf.net_profit >= 0 ? '+' : ''}$${perf.net_profit.toFixed(2)}` : undefined}
              loading={perfLoading}
              positive={perf ? perf.net_profit > 0 : undefined}
            />
            <StatsCard
              title="Profit Factor"
              value={perf?.profit_factor?.toFixed(2)}
              loading={perfLoading}
              positive={perf ? perf.profit_factor > 1 : undefined}
            />
          </div>

          {/* Equity Curve */}
          <Card className="bg-[#161B22] border-[#30363D]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Equity Curve</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] w-full">
                {curveLoading ? (
                  <div className="h-full flex flex-col gap-2 justify-end pb-4">
                    {[40, 60, 80, 55, 70, 85, 65].map((h, i) => (
                      <Skeleton key={i} className={`w-full`} style={{ height: `${h}%` } as any} />
                    ))}
                  </div>
                ) : equityCurve.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={equityCurve} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#21262D" vertical={false} />
                      <XAxis
                        dataKey="date"
                        stroke="#30363D"
                        tick={{ fill: '#8B949E', fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#30363D"
                        tick={{ fill: '#8B949E', fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `$${v}`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      {equityCurve[0]?.balance && (
                        <ReferenceLine
                          y={equityCurve[0].balance}
                          stroke="#30363D"
                          strokeDasharray="4 4"
                        />
                      )}
                      <Line
                        type="monotone"
                        dataKey="balance"
                        name="Balance"
                        stroke="#7C4DFF"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: '#7C4DFF' }}
                      />
                      {equityCurve[0]?.equity !== undefined && (
                        <Line
                          type="monotone"
                          dataKey="equity"
                          name="Equity"
                          stroke="#2196F3"
                          strokeWidth={1.5}
                          dot={false}
                          strokeDasharray="4 2"
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                    No equity data for selected period
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Win/Loss breakdown */}
          {perf && (
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-[#161B22] border-[#30363D]">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Avg Win</p>
                  <p className="font-mono font-bold text-[#00C853] text-xl">
                    +${perf.avg_win?.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-[#161B22] border-[#30363D]">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Avg Loss</p>
                  <p className="font-mono font-bold text-[#FF1744] text-xl">
                    -${Math.abs(perf.avg_loss ?? 0).toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* ── Trades Tab ── */}
        <TabsContent value="trades" className="mt-5">
          <Card className="bg-[#161B22] border-[#30363D]">
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <CardTitle className="text-sm font-semibold">
                Trade Log
                {tradesData?.total != null && (
                  <span className="ml-2 text-muted-foreground font-normal">
                    ({tradesData.total} trades)
                  </span>
                )}
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1.5"
                onClick={exportCSV}
                disabled={!trades.length}
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-[#0D1117] border-b border-[#30363D]">
                    <tr>
                      <th className="px-4 py-3">Ticket / Date</th>
                      <th className="px-4 py-3">Symbol</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3 text-right">Volume</th>
                      <th className="px-4 py-3 text-right">Pips</th>
                      <th className="px-4 py-3 text-right">P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tradesLoading
                      ? Array.from({ length: 8 }).map((_, i) => (
                          <tr key={i} className="border-b border-[#30363D]/50">
                            {Array.from({ length: 6 }).map((__, j) => (
                              <td key={j} className="px-4 py-3">
                                <Skeleton className="h-4 w-full" />
                              </td>
                            ))}
                          </tr>
                        ))
                      : trades.length === 0
                      ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground text-xs">
                            No trades in the selected period
                          </td>
                        </tr>
                      )
                      : trades.map((trade) => (
                          <tr key={trade.ticket} className="border-b border-[#30363D]/30 hover:bg-[#21262D]/40 transition-colors">
                            <td className="px-4 py-3 font-mono">
                              <div className="text-foreground text-xs">#{trade.ticket}</div>
                              <div className="text-muted-foreground text-[10px]">{trade.close_time?.slice(0, 10)}</div>
                            </td>
                            <td className="px-4 py-3 font-bold font-mono text-xs">{trade.symbol}</td>
                            <td className="px-4 py-3">
                              <Badge variant={trade.type === 'buy' ? 'bullish' : 'bearish'} className="rounded text-[10px]">
                                {trade.type.toUpperCase()}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-xs">{trade.volume}</td>
                            <td
                              className={`px-4 py-3 text-right font-mono text-xs font-medium ${
                                trade.pips >= 0 ? 'text-[#00C853]' : 'text-[#FF1744]'
                              }`}
                            >
                              {trade.pips >= 0 ? '+' : ''}{trade.pips}
                            </td>
                            <td
                              className={`px-4 py-3 text-right font-mono text-sm font-bold ${
                                trade.profit >= 0 ? 'text-[#00C853]' : 'text-[#FF1744]'
                              }`}
                            >
                              {trade.profit >= 0 ? '+' : ''}${trade.profit.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {tradesData && tradesData.total > tradesData.page_size && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-[#30363D]">
                  <span className="text-xs text-muted-foreground">
                    Page {page} of {Math.ceil(tradesData.total / tradesData.page_size)}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Prev
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page * (tradesData.page_size ?? 20) >= tradesData.total}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── AI Analyses Tab ── */}
        <TabsContent value="analyses" className="mt-5 space-y-3">
          {analysisLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 bg-[#161B22] border border-[#30363D] rounded-lg">
                  <Skeleton className="h-5 w-1/3 mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))
            : analyses.length === 0
            ? (
              <div className="py-16 text-center text-muted-foreground text-sm">
                No analyses yet. Run your first analysis on the Analysis page.
              </div>
            )
            : analyses.map((item) => (
                <Card
                  key={item.id}
                  className="bg-[#161B22] border-[#30363D] hover:border-primary/40 transition-colors cursor-pointer"
                >
                  <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-bold font-mono">{item.symbol}</span>
                        <Badge variant="outline" className="font-mono text-[10px]">{item.timeframe}</Badge>
                        <span className="text-muted-foreground text-xs font-mono">
                          {item.timestamp?.slice(0, 16).replace('T', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={item.bias === 'BULLISH' ? 'bullish' : item.bias === 'BEARISH' ? 'bearish' : 'secondary'}>
                          {item.bias === 'BULLISH' ? (
                            <TrendingUp className="w-3 h-3 mr-1" />
                          ) : item.bias === 'BEARISH' ? (
                            <TrendingDown className="w-3 h-3 mr-1" />
                          ) : (
                            <Minus className="w-3 h-3 mr-1" />
                          )}
                          {item.bias}
                        </Badge>
                        {item.action_taken && (
                          <span className="text-xs text-muted-foreground">{item.action_taken}</span>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-primary/10 text-primary self-start md:self-auto text-xs">
                      View Trace
                    </Badge>
                  </CardContent>
                </Card>
              ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
