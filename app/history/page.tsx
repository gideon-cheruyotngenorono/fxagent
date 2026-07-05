'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { usePerformance } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

// Mock Data
const equityData = [
  { date: 'Mon', balance: 10000 },
  { date: 'Tue', balance: 10150 },
  { date: 'Wed', balance: 10080 },
  { date: 'Thu', balance: 10320 },
  { date: 'Fri', balance: 10450 },
];

const tradesData = [
  { ticket: '#1001', date: '2023-12-24', symbol: 'EURUSD', action: 'BUY', pips: '+35', pnl: 45.50, win: true },
  { ticket: '#1002', date: '2023-12-24', symbol: 'GBPUSD', action: 'SELL', pips: '-15', pnl: -22.00, win: false },
  { ticket: '#1003', date: '2023-12-23', symbol: 'XAUUSD', action: 'BUY', pips: '+120', pnl: 150.00, win: true },
];

const analysesData = [
  { id: 1, date: '2023-12-24 08:00', symbol: 'EURUSD', timeframe: 'H1', bias: 'BULLISH', action: 'Took LONG +35 pips' },
  { id: 2, date: '2023-12-23 14:30', symbol: 'GBPUSD', timeframe: 'M30', bias: 'BEARISH', action: 'Took SHORT -15 pips' },
];

export default function HistoryPage() {
  const { data: performance } = usePerformance();

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Trading History & Analytics</h1>
      </div>

      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-3 bg-[#161B22]">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="trades">Trades</TabsTrigger>
          <TabsTrigger value="analyses">AI Analyses</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="mt-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatsCard title="Total Trades" value="48" />
            <StatsCard title="Win Rate" value="68.5%" />
            <StatsCard title="Net P&L" value="+$1,245.50" highlight />
            <StatsCard title="Profit Factor" value="1.84" />
          </div>

          <Card className="bg-[#161B22] border-[#30363D]">
            <CardHeader>
              <CardTitle>Equity Curve</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={equityData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#30363D" vertical={false} />
                    <XAxis dataKey="date" stroke="#8B949E" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#8B949E" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#161B22', border: '1px solid #30363D' }}
                      itemStyle={{ color: '#E6EDF3' }}
                    />
                    <Line type="monotone" dataKey="balance" stroke="#7C4DFF" strokeWidth={3} dot={{ r: 4, fill: '#7C4DFF' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trades" className="mt-6">
          <Card className="bg-[#161B22] border-[#30363D]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Trade Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-background/50 border-b border-border">
                    <tr>
                      <th className="px-4 py-3">Ticket / Date</th>
                      <th className="px-4 py-3">Symbol</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3 text-right">Pips</th>
                      <th className="px-4 py-3 text-right">P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tradesData.map((trade, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-muted/20">
                        <td className="px-4 py-3 font-mono">
                          <div className="text-foreground">{trade.ticket}</div>
                          <div className="text-muted-foreground text-xs">{trade.date}</div>
                        </td>
                        <td className="px-4 py-3 font-bold">{trade.symbol}</td>
                        <td className="px-4 py-3">
                          <Badge variant={trade.action === 'BUY' ? 'bullish' : 'bearish'} className="rounded">
                            {trade.action}
                          </Badge>
                        </td>
                        <td className={`px-4 py-3 text-right font-mono ${trade.win ? 'text-trading-green' : 'text-trading-red'}`}>
                          {trade.pips}
                        </td>
                        <td className={`px-4 py-3 text-right font-mono font-bold ${trade.win ? 'text-trading-green' : 'text-trading-red'}`}>
                          {trade.pnl > 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analyses" className="mt-6 space-y-4">
          {analysesData.map((item, i) => (
             <Card key={i} className="bg-[#161B22] border-[#30363D] hover:border-trading-purple/50 transition-colors cursor-pointer">
               <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                 <div>
                   <div className="flex items-center gap-2 mb-1">
                     <span className="font-bold text-lg">{item.symbol}</span>
                     <Badge variant="outline" className="font-mono">{item.timeframe}</Badge>
                     <span className="text-muted-foreground text-xs ml-2 font-mono">{item.date}</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <Badge variant={item.bias === 'BULLISH' ? 'bullish' : 'bearish'}>{item.bias}</Badge>
                     <span className="text-sm text-muted-foreground">{item.action}</span>
                   </div>
                 </div>
                 <Badge variant="secondary" className="bg-primary/10 text-primary self-start md:self-auto">AI Trace View</Badge>
               </CardContent>
             </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatsCard({ title, value, highlight }: { title: string; value: string; highlight?: boolean }) {
  return (
    <Card className="bg-[#161B22] border-[#30363D]">
      <CardContent className="p-4 sm:p-6">
        <p className="text-sm font-medium text-muted-foreground tracking-tight mb-2">{title}</p>
        <p className={`text-2xl sm:text-3xl font-bold font-mono tracking-tighter ${highlight ? 'text-trading-green' : 'text-foreground'}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
