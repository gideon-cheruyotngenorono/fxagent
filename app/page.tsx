'use client';

import { useAccount, usePositions, useCandles } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Activity, DollarSign, Wallet, Percent } from 'lucide-react';
import CandlestickChart from '@/components/trading/CandlestickChart';

export default function Dashboard() {
  const { data: account } = useAccount();
  const { data: positions } = usePositions();

  return (
    <div className="flex flex-col gap-6">
      {/* Account Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
        <MetricCard title="Balance" value={account?.balance} icon={Wallet} prefix="$" />
        <MetricCard title="Equity" value={account?.equity} icon={DollarSign} prefix="$" />
        <MetricCard title="Free Margin" value={account?.margin_free} icon={Activity} prefix="$" />
        <MetricCard 
          title="Daily P&L" 
          value={account?.daily_pnl} 
          icon={Percent} 
          prefix="$" 
          highlight={account?.daily_pnl && account.daily_pnl !== 0 
            ? (account.daily_pnl > 0 ? "positive" : "negative") 
             : "none"} 
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-280px)] min-h-[500px]">
        {/* Main Chart Area */}
        <div className="lg:w-[60%] flex flex-col h-full bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xl font-bold font-sans">EURUSD</div>
            <div className="flex bg-background border border-border rounded-md px-1 py-1 gap-1">
              {['M5', 'M15', 'M30', 'H1', 'H4', 'D1'].map(t => (
                <button key={t} className={`px-2 py-1 text-xs rounded-sm font-medium ${t === 'H1' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-muted'}`}>{t}</button>
              ))}
            </div>
          </div>
          <div className="flex-1 rounded border border-border flex items-center justify-center overflow-hidden">
             <CandlestickChart data={[]} />
          </div>
        </div>

        {/* Right Stacked Panels */}
        <div className="lg:w-[40%] flex flex-col gap-4">
          <Card className="flex-1 flex flex-col min-h-0 bg-[#161B22] border-[#30363D]">
            <CardHeader className="py-4 border-b border-border/50">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-trading-purple animate-pulse" />
                Latest AI Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto pt-4 space-y-4">
              <div className="p-3 bg-trading-green/10 border-l-2 border-trading-green rounded-r">
                <div className="text-trading-green font-bold text-sm tracking-wide mb-1">BULLISH BIAS</div>
                <div className="text-sm">Strong momentum on H1. RSI oversold on lower frames. Target liquidity at 1.0950.</div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm font-mono mt-4">
                <div className="p-2 bg-background rounded-md">
                   <div className="text-xs text-muted-foreground font-sans">Entry</div>
                   <div>1.0825</div>
                </div>
                <div className="p-2 bg-background rounded-md">
                   <div className="text-xs text-muted-foreground font-sans">Stop Loss</div>
                   <div className="text-trading-red">1.0790</div>
                </div>
                <div className="p-2 bg-background rounded-md col-span-2">
                   <div className="text-xs text-muted-foreground font-sans">Take Profit</div>
                   <div className="text-trading-green">1.0950</div>
                </div>
              </div>
              <Button className="w-full mt-4 bg-trading-purple hover:bg-trading-purple/90">
                Execute Recommended Trade
              </Button>
            </CardContent>
          </Card>

          <Card className="flex-1 flex flex-col min-h-0 bg-[#161B22] border-[#30363D]">
            <CardHeader className="py-4 border-b border-border/50">
              <CardTitle className="text-base">Open Positions</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto pt-4">
              {!positions || positions.count === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  No open positions
                </div>
              ) : (
                <div className="space-y-3">
                   {positions.positions.map((pos: any) => (
                     <div key={pos.ticket} className="p-3 bg-background rounded border border-border flex justify-between items-center">
                        <div>
                          <div className="font-bold flex items-center gap-2">
                            {pos.symbol} <span className={`text-[10px] px-1 rounded uppercase ${pos.type === 'buy' ? 'bg-trading-green/20 text-trading-green' : 'bg-trading-red/20 text-trading-red'}`}>{pos.type}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">Vol: {pos.volume} @ {pos.open_price}</div>
                        </div>
                        <div className={`font-mono font-medium ${pos.profit >= 0 ? 'text-trading-green' : 'text-trading-red'}`}>
                          ${pos.profit.toFixed(2)}
                        </div>
                     </div>
                   ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Button size="icon" className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-trading-purple hover:bg-trading-purple/90" onClick={() => {}}>
        <MessageSquare className="w-6 h-6" />
      </Button>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, prefix = "", highlight = "none" }: any) {
  let colorClass = "text-foreground";
  if (highlight === "positive") colorClass = "text-trading-green";
  if (highlight === "negative") colorClass = "text-trading-red";

  return (
    <Card className="bg-card">
      <CardContent className="p-4 sm:p-6 flex flex-col justify-between h-full">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-muted-foreground tracking-tight">{title}</span>
          <Icon className="w-4 h-4 text-muted-foreground/70" />
        </div>
        <div className="mt-1">
          {value !== undefined ? (
            <span className={`text-xl sm:text-2xl font-bold font-mono tracking-tighter ${colorClass}`}>
              {prefix}{value.toFixed(2)}
            </span>
          ) : (
            <div className="h-8 w-1/2 bg-muted animate-pulse rounded" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
