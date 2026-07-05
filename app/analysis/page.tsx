'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings2, Play, CheckCircle2, ChevronRight, Activity, Percent, DollarSign } from 'lucide-react';
import { useAccount } from '@/lib/api';

const mockSteps = [
  { id: 1, name: 'Initializing Analysis Engine', duration: '0.2s' },
  { id: 2, name: 'Fetching Mathematical Features (EMA, ATR, RSI)', duration: '0.5s' },
  { id: 3, name: 'Evaluating Market Sessions Context', duration: '0.4s' },
  { id: 4, name: 'Synthesizing Prompts for Quant Model', duration: '0.1s' },
  { id: 5, name: 'Awaiting LLM Response', duration: '12.4s' },
  { id: 6, name: 'Parsing & Validating Trade Setup parameters', duration: '0.3s' },
];

export default function AnalysisPage() {
  const { data: account } = useAccount();
  const [analyzing, setAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const startAnalysis = () => {
    setAnalyzing(true);
    setCurrentStep(0);
    setShowResults(false);
    setAgreed(false);
  };

  useEffect(() => {
    if (!analyzing) return;

    if (currentStep < mockSteps.length) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, currentStep === 4 ? 2000 : 800); // Mock long wait for LLM
      return () => clearTimeout(timer);
    } else {
      setTimeout(() => {
        setAnalyzing(false);
        setShowResults(true);
      }, 500);
    }
  }, [analyzing, currentStep]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24">
      {/* Top Controls */}
      <Card className="bg-[#161B22] border-[#30363D]">
        <CardContent className="p-4 sm:p-6 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-2 w-full">
            <label className="text-sm text-muted-foreground font-medium">Symbol</label>
            <div className="flex bg-background border border-border rounded-md px-1 py-1 gap-1 h-10 w-full sm:w-auto overflow-x-auto">
              {['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD'].map(s => (
                <button key={s} className={`px-4 py-1 text-sm rounded-sm font-semibold transition-colors ${s === 'EURUSD' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-muted'}`}>{s}</button>
              ))}
            </div>
          </div>
          <div className="flex-1 space-y-2 w-full">
            <label className="text-sm text-muted-foreground font-medium">Timeframe</label>
            <div className="flex bg-background border border-border rounded-md px-1 py-1 gap-1 h-10 w-full sm:w-auto overflow-x-auto">
              {['M15', 'M30', 'H1', 'H4'].map(t => (
                <button key={t} className={`px-4 py-1 text-sm rounded-sm font-semibold transition-colors ${t === 'H1' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-muted'}`}>{t}</button>
              ))}
            </div>
          </div>
          <div className="flex-1 space-y-2 w-full">
            <label className="text-sm text-muted-foreground font-medium">Risk %</label>
            <div className="h-10 bg-background border border-border rounded-md px-4 flex items-center justify-between">
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-mono font-bold text-foreground">1.5%</span>
            </div>
          </div>
          <Button 
            className="w-full md:w-auto h-10 px-8 bg-trading-purple hover:bg-trading-purple/90 shrink-0" 
            onClick={startAnalysis}
            disabled={analyzing}
          >
            {analyzing ? <Activity className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
            {analyzing ? 'Analyzing...' : 'Run Analysis'}
          </Button>
        </CardContent>
      </Card>

      {/* Loading Trace Interface */}
      <AnimatePresence>
        {analyzing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col gap-3 py-6"
          >
            <div className="text-lg font-bold flex items-center gap-2">
               <Activity className="w-5 h-5 text-trading-purple animate-pulse" />
               Agent Trace Execution
            </div>
            
            <div className="space-y-3 pl-4 border-l-2 border-border/50 pb-4">
              {mockSteps.slice(0, currentStep + 1).map((step, idx) => {
                const isActive = idx === currentStep;
                const isComplete = idx < currentStep;

                return (
                  <motion.div 
                    key={step.id} 
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className={`relative p-4 rounded-md border ${isActive ? 'bg-trading-purple/10 border-trading-purple shadow-[0_0_12px_rgba(124,77,255,0.15)]' : 'bg-background border-border'} flex items-center justify-between`}
                  >
                    <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-4 h-4 bg-background rounded-full border-[3px] border-border flex items-center justify-center">
                      {isComplete && <div className="w-2 h-2 bg-trading-green rounded-full" />}
                      {isActive && <div className="w-2 h-2 bg-primary animate-ping rounded-full" />}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {isComplete ? (
                        <CheckCircle2 className="w-5 h-5 text-trading-green" />
                      ) : (
                        <Settings2 className={`w-5 h-5 text-trading-purple ${isActive ? 'animate-spin' : ''}`} />
                      )}
                      <span className={`font-semibold tracking-wide text-sm ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                        {step.name}
                      </span>
                    </div>
                    
                    {isComplete && (
                      <span className="font-mono text-xs text-muted-foreground">{step.duration}</span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Display */}
      <AnimatePresence>
        {showResults && (
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="grid grid-cols-1 md:grid-cols-3 gap-6"
           >
             {/* Main Setup Card */}
             <Card className="md:col-span-2 bg-[#161B22] border-[#30363D] overflow-hidden">
                <div className="bg-trading-green/10 border-b border-trading-green/30 p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Badge variant="bullish" className="text-sm px-3 py-1">🟢 BULLISH BIAS</Badge>
                    <span className="font-mono font-medium text-trading-green">+ High Conviction</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-trading-green/80 font-semibold tracking-wider">H1 TIMEFRAME</div>
                  </div>
                </div>
                
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="p-4 bg-background border border-border rounded-lg flex flex-col justify-center items-center">
                      <span className="text-sm text-muted-foreground mb-1 tracking-tight">Entry Type</span>
                      <span className="font-bold text-lg text-trading-blue">LIMIT</span>
                    </div>
                    <div className="p-4 bg-background border border-border rounded-lg flex flex-col justify-center items-center">
                      <span className="text-sm text-muted-foreground mb-1 tracking-tight">Entry Price</span>
                      <span className="font-mono font-bold text-lg">1.0825</span>
                    </div>
                    <div className="p-4 bg-background border border-border/70 border-b-2 border-b-trading-red rounded-lg flex flex-col justify-center items-center">
                      <span className="text-sm text-muted-foreground mb-1 tracking-tight">Stop Loss</span>
                      <span className="font-mono font-bold text-lg text-trading-red">1.0790</span>
                      <span className="text-xs text-trading-red/70 mt-1">-35 pips</span>
                    </div>
                    <div className="p-4 bg-background border border-border/70 border-b-2 border-b-trading-green rounded-lg flex flex-col justify-center items-center">
                      <span className="text-sm text-muted-foreground mb-1 tracking-tight">Take Profit</span>
                      <span className="font-mono font-bold text-lg text-trading-green">1.0950</span>
                      <span className="text-xs text-trading-green/70 mt-1">+125 pips</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-background border border-border rounded-lg flex justify-between items-center cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="font-medium">Trade Management (Breakeven & Partials)</div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="p-4 bg-background border border-border rounded-lg flex justify-between items-center cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="font-medium">AI Risk Assessment & News Impact</div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="p-4 bg-background border border-border rounded-lg flex justify-between items-center cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="font-medium">Mathematical Feature Log</div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
             </Card>

             {/* Sizing & Execution Card */}
             <div className="space-y-6 relative">
               <Card className="bg-[#161B22] border-[#30363D]">
                 <CardHeader>
                   <CardTitle className="text-lg">Position Sizing</CardTitle>
                   <CardDescription>Mathematical sizing based on your risk</CardDescription>
                 </CardHeader>
                 <CardContent className="space-y-4">
                   <div className="flex justify-between items-center border-b border-border/50 pb-2">
                     <span className="text-muted-foreground text-sm">Account Balance</span>
                     <span className="font-mono font-medium">${account?.balance?.toFixed(2) || '10,000.00'}</span>
                   </div>
                   <div className="flex justify-between items-center border-b border-border/50 pb-2">
                     <span className="text-muted-foreground text-sm">Risk Amount (1.5%)</span>
                     <span className="font-mono font-medium text-trading-red">${(account?.balance ? account.balance * 0.015 : 150).toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between items-center border-b border-border/50 pb-2">
                     <span className="text-muted-foreground text-sm">Stop Loss Distance</span>
                     <span className="font-mono font-medium">35 pips</span>
                   </div>
                   <div className="pt-2">
                     <span className="text-muted-foreground text-xs uppercase tracking-widest block mb-1">Recommended Lot Size</span>
                     <div className="text-4xl font-mono font-bold text-trading-purple">
                       0.42 <span className="text-lg text-muted-foreground font-sans lowercase">lots</span>
                     </div>
                   </div>
                 </CardContent>
               </Card>
             </div>
           </motion.div>
        )}
      </AnimatePresence>
      
      {/* Fixed Execution Panel */}
      {showResults && (
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 md:left-[280px] bg-card border-t border-border p-4 shadow-xl z-30"
        >
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                id="agree" 
                className="w-5 h-5 rounded border-input focus:ring-primary accent-primary" 
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <label htmlFor="agree" className="text-sm font-medium select-none text-muted-foreground cursor-pointer">
                I have reviewed this AI analysis and accept the <span className="text-trading-red font-mono">1.5%</span> risk exposure.
              </label>
            </div>
            <Button 
               className="w-full md:w-auto h-12 px-12 text-lg font-bold shadow-lg disabled:opacity-50 transition-all bg-trading-green hover:bg-trading-green/90 text-white" 
               disabled={!agreed}
            >
               🚀 EXECUTE TRADE
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
