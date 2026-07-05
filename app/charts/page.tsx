'use client';

import { useState } from 'react';
import CandlestickChart from '@/components/trading/CandlestickChart';
import { Button } from '@/components/ui/button';
import { Maximize2, LayoutGrid, Search, Crosshair, TrendingUp, Settings2 } from 'lucide-react';

export default function ChartsPage() {
  const [chartsCount, setChartsCount] = useState(1);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full gap-2 -mx-4 md:-mx-8 px-4 md:px-8">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between bg-card border border-border rounded-md px-3 py-2 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-background border border-border px-3 py-1 rounded w-48">
            <Search className="w-4 h-4 text-muted-foreground mr-2" />
            <input type="text" value="EURUSD" readOnly className="bg-transparent border-none text-sm font-semibold outline-none w-full" />
          </div>
          
          <div className="hidden sm:flex bg-background border border-border rounded-md p-1 gap-1">
            {['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1'].map(t => (
              <button key={t} className={`px-2 py-1 text-xs rounded-sm font-medium ${t === 'H1' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-muted'}`}>{t}</button>
            ))}
          </div>

          <div className="h-6 w-[1px] bg-border mx-2 hidden md:block" />

          <div className="hidden md:flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary"><Crosshair className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary"><TrendingUp className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary"><Settings2 className="w-4 h-4" /></Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
           <Button variant="outline" size="sm" onClick={() => setChartsCount(c => c === 4 ? 1 : c === 1 ? 2 : 4)}>
             <LayoutGrid className="w-4 h-4 mr-2" />
             <span className="hidden sm:inline">{chartsCount} Chart{chartsCount > 1 && 's'}</span>
           </Button>
           <Button variant="ghost" size="icon" className="hidden sm:inline-flex h-8 w-8">
             <Maximize2 className="w-4 h-4" />
           </Button>
        </div>
      </div>

      {/* Charts Grid */}
      <div className={`flex-1 grid gap-2 overflow-hidden ${
        chartsCount === 1 ? 'grid-cols-1 grid-rows-1' :
        chartsCount === 2 ? 'grid-cols-2 grid-rows-1' :
        'grid-cols-2 grid-rows-2'
      }`}>
        {Array.from({ length: chartsCount }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-md relative flex items-center justify-center overflow-hidden">
             <div className="absolute top-2 left-2 z-10 flex gap-1">
               <div className="bg-background/80 backdrop-blur border border-border rounded px-2 py-1 text-xs font-bold font-mono">
                 {i === 0 ? 'EURUSD' : i === 1 ? 'GBPUSD' : i === 2 ? 'USDJPY' : 'XAUUSD'} 
               </div>
               <div className="bg-background/80 backdrop-blur border border-border rounded px-2 py-1 text-xs">H1</div>
               {i === 0 && (
                  <div className="bg-trading-purple/20 text-trading-purple border border-trading-purple/50 rounded px-2 py-1 text-xs font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-trading-purple animate-pulse" />
                    AI Overlay Active
                  </div>
               )}
             </div>
             {/* Actual Canvas Container */}
             <CandlestickChart data={[]} />
          </div>
        ))}
      </div>

      {/* Bottom Status Bar */}
      <div className="flex items-center gap-6 bg-card border border-border rounded-md px-4 py-2 shrink-0 text-xs text-muted-foreground font-mono overflow-x-auto">
         <div className="flex items-center gap-2">
           <span className="text-foreground">Current Price:</span>
           <span className="text-trading-green font-bold">1.0845</span>
         </div>
         <div className="flex items-center gap-2">
           <span className="text-foreground">Change:</span>
           <span className="text-trading-green">+0.25%</span>
         </div>
         <div className="flex items-center gap-2">
           <span className="text-foreground">Spread:</span>
           <span>0.4 pips</span>
         </div>
         <div className="flex items-center gap-2">
           <span className="text-foreground">ATR (14):</span>
           <span>12.5 pips</span>
         </div>
         <div className="h-4 w-[1px] bg-border mx-2" />
         <div className="text-trading-purple font-sans font-medium flex items-center gap-1">
           Session: NY / London Overlap
         </div>
      </div>
    </div>
  );
}
