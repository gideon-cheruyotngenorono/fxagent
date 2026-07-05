'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Settings2,
  Play,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Activity,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Copy,
  Check,
} from 'lucide-react';
import {
  useAccount,
  useSymbols,
  postAnalyze,
  postExecute,
  createWebSocket,
  AnalysisResult,
  TraceStep,
} from '@/lib/api';

const TIMEFRAMES = ['M5', 'M15', 'M30', 'H1', 'H4', 'D1'];

// ── Toast (local, simple) ─────────────────────────────────────────────────────

function useToast() {
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  function show(type: 'success' | 'error', msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }
  return { toast, show };
}

// ── Expandable Section ────────────────────────────────────────────────────────

function Expandable({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-[#30363D] rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#0D1117] hover:bg-[#21262D] transition-colors text-left"
      >
        <span className="text-sm font-medium">{title}</span>
        {open ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      {open && (
        <div className="p-4 bg-[#161B22] text-sm text-muted-foreground leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Copy Button ───────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="p-1 rounded hover:bg-[#21262D] text-muted-foreground hover:text-foreground transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-[#00C853]" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AnalysisPage() {
  const { data: account } = useAccount();
  const { data: symbolsData } = useSymbols();
  const symbols = symbolsData?.symbols ?? ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD'];

  const [symbol, setSymbol] = useState('EURUSD');
  const [timeframe, setTimeframe] = useState('H1');
  const [balance, setBalance] = useState<number | null>(null);
  const [riskPct, setRiskPct] = useState(1.0);

  const [analyzing, setAnalyzing] = useState(false);
  const [traceSteps, setTraceSteps] = useState<TraceStep[]>([]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [executing, setExecuting] = useState(false);

  const { toast, show: showToast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Seed balance from account
  useEffect(() => {
    if (account && balance === null) setBalance(account.balance);
  }, [account, balance]);

  const effectiveBalance = balance ?? account?.balance ?? 10000;

  function startTraceWS() {
    try {
      const ws = createWebSocket('/ws/trace');
      wsRef.current = ws;

      ws.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.type === 'step') {
          setTraceSteps((prev) => {
            const exists = prev.findIndex((s) => s.id === data.step.id);
            if (exists >= 0) {
              const next = [...prev];
              next[exists] = data.step;
              return next;
            }
            return [...prev, data.step];
          });
        }
        if (data.type === 'done') {
          ws.close();
        }
      };

      ws.onerror = () => {
        ws.close();
        startTracePoll();
      };
    } catch {
      startTracePoll();
    }
  }

  function startTracePoll() {
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/trace/latest`
        );
        const data = await res.json();
        if (data.steps) setTraceSteps(data.steps);
      } catch {}
      if (attempts > 60) clearInterval(pollRef.current!);
    }, 500);
  }

  async function handleRunAnalysis() {
    setAnalyzing(true);
    setTraceSteps([]);
    setResult(null);
    setAgreed(false);
    startTraceWS();

    try {
      const res = await postAnalyze({
        symbol,
        timeframe,
        account_balance: effectiveBalance,
        risk_percent: riskPct,
      });
      setResult(res);
    } catch (err: any) {
      showToast('error', err.message ?? 'Analysis failed');
    } finally {
      setAnalyzing(false);
      if (pollRef.current) clearInterval(pollRef.current);
      wsRef.current?.close();
    }
  }

  async function handleExecute() {
    if (!result) return;
    setExecuting(true);
    try {
      const res = await postExecute({
        symbol: result.symbol,
        action: result.bias === 'BULLISH' ? 'buy' : 'sell',
        entry: result.entry,
        sl: result.sl,
        tp: result.tp,
        lot_size: result.lot_size,
      });
      if (res.success) {
        showToast('success', `✅ Trade executed! Ticket #${res.ticket}`);
        setResult(null);
        setAgreed(false);
        setTraceSteps([]);
      } else {
        showToast('error', res.message || 'Execution failed');
      }
    } catch (err: any) {
      showToast('error', err.message ?? 'Execution failed');
    } finally {
      setExecuting(false);
    }
  }

  const biasColor =
    result?.bias === 'BULLISH'
      ? { bg: 'bg-[#00C853]/10', border: 'border-[#00C853]', text: 'text-[#00C853]' }
      : result?.bias === 'BEARISH'
      ? { bg: 'bg-[#FF1744]/10', border: 'border-[#FF1744]', text: 'text-[#FF1744]' }
      : { bg: 'bg-muted/20', border: 'border-muted-foreground', text: 'text-muted-foreground' };

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-28">
      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg border text-sm font-medium shadow-2xl ${
              toast.type === 'success'
                ? 'bg-[#00C853]/20 border-[#00C853]/40 text-[#00C853]'
                : 'bg-[#FF1744]/20 border-[#FF1744]/40 text-[#FF1744]'
            }`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Controls ── */}
      <Card className="bg-[#161B22] border-[#30363D]">
        <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row gap-4 items-end flex-wrap">
          {/* Symbol */}
          <div className="flex-1 space-y-1.5 min-w-[160px]">
            <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Symbol</label>
            <div className="flex flex-wrap gap-1">
              {symbols.slice(0, 6).map((s) => (
                <button
                  key={s}
                  onClick={() => setSymbol(s)}
                  className={`px-3 py-1.5 text-xs rounded font-mono font-semibold transition-colors border ${
                    s === symbol
                      ? 'bg-primary/20 text-primary border-primary/40'
                      : 'text-muted-foreground border-[#30363D] hover:bg-[#21262D] hover:text-foreground'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Timeframe */}
          <div className="flex-1 space-y-1.5 min-w-[160px]">
            <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Timeframe</label>
            <div className="flex gap-1">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1.5 text-xs rounded font-mono font-semibold transition-colors border ${
                    tf === timeframe
                      ? 'bg-primary/20 text-primary border-primary/40'
                      : 'text-muted-foreground border-[#30363D] hover:bg-[#21262D] hover:text-foreground'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* Balance + Risk */}
          <div className="flex items-end gap-3 shrink-0">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Balance</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <input
                  type="number"
                  value={effectiveBalance}
                  onChange={(e) => setBalance(Number(e.target.value))}
                  className="w-28 bg-[#0D1117] border border-[#30363D] rounded h-9 pl-6 pr-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Risk {riskPct}%
              </label>
              <input
                type="range"
                min={0.25}
                max={5}
                step={0.25}
                value={riskPct}
                onChange={(e) => setRiskPct(Number(e.target.value))}
                className="w-28 h-9 accent-primary"
              />
            </div>
            <Button
              className="h-9 px-6 bg-primary hover:bg-primary/90 shrink-0"
              onClick={handleRunAnalysis}
              disabled={analyzing}
            >
              {analyzing ? (
                <Activity className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              {analyzing ? 'Analyzing…' : 'Run Analysis'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Trace ── */}
      <AnimatePresence>
        {(analyzing || traceSteps.length > 0) && !result && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="bg-[#161B22] border-[#30363D]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary animate-pulse" />
                  Agent Trace
                </CardTitle>
                {traceSteps.length > 0 && (
                  <div className="w-full h-1.5 bg-[#21262D] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary rounded-full"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(traceSteps.filter((s) => s.status === 'done').length / Math.max(traceSteps.length, 1)) * 100}%`,
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-2 pb-5">
                {traceSteps.length === 0 ? (
                  <div className="flex items-center gap-3 p-3">
                    <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    <span className="text-sm text-muted-foreground">Initializing…</span>
                  </div>
                ) : (
                  traceSteps.map((step) => (
                    <motion.div
                      key={step.id}
                      initial={{ x: 16, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        step.status === 'running'
                          ? 'bg-primary/10 border-primary/40'
                          : step.status === 'done'
                          ? 'bg-[#00C853]/5 border-[#30363D]'
                          : step.status === 'error'
                          ? 'bg-[#FF1744]/10 border-[#FF1744]/40'
                          : 'bg-[#0D1117] border-[#30363D]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {step.status === 'done' ? (
                          <CheckCircle2 className="w-4 h-4 text-[#00C853] shrink-0" />
                        ) : step.status === 'running' ? (
                          <Settings2 className="w-4 h-4 text-primary animate-spin shrink-0" />
                        ) : step.status === 'error' ? (
                          <AlertTriangle className="w-4 h-4 text-[#FF1744] shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-[#30363D] shrink-0" />
                        )}
                        <div>
                          <div className={`text-sm font-medium ${step.status === 'running' ? 'text-primary' : 'text-foreground'}`}>
                            {step.name}
                          </div>
                          {step.detail && (
                            <div className="text-xs text-muted-foreground mt-0.5">{step.detail}</div>
                          )}
                        </div>
                      </div>
                      {step.duration && (
                        <span className="font-mono text-xs text-muted-foreground shrink-0">{step.duration}</span>
                      )}
                    </motion.div>
                  ))
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Results ── */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-5"
          >
            {/* Main setup */}
            <Card className="md:col-span-2 bg-[#161B22] border-[#30363D] overflow-hidden">
              {/* Bias banner */}
              <div className={`p-5 border-b flex items-center justify-between ${biasColor.bg} ${biasColor.border} border-b`}>
                <div className="flex items-center gap-3">
                  {result.bias === 'BULLISH' ? (
                    <TrendingUp className={`w-6 h-6 ${biasColor.text}`} />
                  ) : result.bias === 'BEARISH' ? (
                    <TrendingDown className={`w-6 h-6 ${biasColor.text}`} />
                  ) : (
                    <Minus className={`w-6 h-6 ${biasColor.text}`} />
                  )}
                  <div>
                    <div className={`text-lg font-bold ${biasColor.text}`}>{result.bias} BIAS</div>
                    <div className="text-xs text-muted-foreground">{result.confidence} Confidence</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">{result.symbol}</div>
                  <div className="font-mono font-bold text-sm text-primary">{result.timeframe}</div>
                </div>
              </div>

              <CardContent className="p-5 space-y-5">
                {/* OHLC grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { label: 'Entry Type', val: result.entry_type, col: '' },
                    { label: 'Entry Price', val: result.entry?.toFixed(5), col: '' },
                    { label: 'Stop Loss', val: result.sl?.toFixed(5), sub: `-${result.pips_sl} pips`, col: 'text-[#FF1744]' },
                    { label: 'Take Profit', val: result.tp?.toFixed(5), sub: `+${result.pips_tp} pips`, col: 'text-[#00C853]' },
                  ].map(({ label, val, sub, col }) => (
                    <div key={label} className="p-3 bg-[#0D1117] border border-[#30363D] rounded-lg text-center">
                      <div className="text-xs text-muted-foreground mb-1">{label}</div>
                      <div className={`font-mono font-bold text-sm ${col}`}>{val}</div>
                      {sub && <div className={`text-[10px] mt-0.5 ${col}`}>{sub}</div>}
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="text-sm text-muted-foreground leading-relaxed bg-[#0D1117] border border-[#30363D] rounded-lg p-4">
                  {result.summary}
                </div>

                {/* Expandable sections */}
                <div className="space-y-2">
                  <Expandable title="Trade Management Plan">
                    <p>{result.trade_management}</p>
                  </Expandable>
                  <Expandable title="Risk Assessment">
                    <p>{result.risk_assessment}</p>
                  </Expandable>
                  <Expandable title="Alternative Scenario">
                    <p>{result.alternative_scenario}</p>
                  </Expandable>
                  {result.full_prompt && (
                    <Expandable title="Full AI Prompt">
                      <div className="relative">
                        <div className="absolute top-2 right-2">
                          <CopyButton text={result.full_prompt} />
                        </div>
                        <pre className="text-xs whitespace-pre-wrap break-all pr-8">{result.full_prompt}</pre>
                      </div>
                    </Expandable>
                  )}
                  {Boolean(result.raw_response) && (
                    <Expandable title="Raw AI Response (JSON)">
                      <div className="relative">
                        <div className="absolute top-2 right-2">
                          <CopyButton text={JSON.stringify(result.raw_response, null, 2)} />
                        </div>
                        <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-64 pr-8">
                          {JSON.stringify(result.raw_response, null, 2)}
                        </pre>
                      </div>
                    </Expandable>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Sizing card */}
            <div className="space-y-4">
              <Card className="bg-[#161B22] border-[#30363D]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Position Sizing</CardTitle>
                  <CardDescription>Mathematical sizing based on {riskPct}% risk</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: 'Account Balance', val: `$${result.account_balance?.toFixed(2)}`, cls: '' },
                    { label: `Risk (${riskPct}%)`, val: `$${result.risk_amount?.toFixed(2)}`, cls: 'text-[#FF1744]' },
                    { label: 'SL Distance', val: `${result.pips_sl} pips`, cls: '' },
                    { label: 'Potential Profit', val: `$${result.potential_profit?.toFixed(2)}`, cls: 'text-[#00C853]' },
                    { label: 'R:R Ratio', val: `1 : ${result.rr?.toFixed(2)}`, cls: 'text-primary' },
                  ].map(({ label, val, cls }) => (
                    <div key={label} className="flex items-center justify-between py-1.5 border-b border-[#30363D] last:border-0">
                      <span className="text-xs text-muted-foreground">{label}</span>
                      <span className={`font-mono text-sm font-medium ${cls}`}>{val}</span>
                    </div>
                  ))}
                  <div className="pt-2 text-center">
                    <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Lot Size</div>
                    <div className="text-4xl font-mono font-bold text-primary">
                      {result.lot_size?.toFixed(2)}
                      <span className="text-base text-muted-foreground font-sans ml-1">lots</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Execution Sticky Bar ── */}
      {result && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 md:left-[64px] xl:left-[280px] bg-[#161B22] border-t border-[#30363D] p-4 shadow-2xl z-30"
        >
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-5 h-5 rounded accent-primary border border-[#30363D]"
              />
              <span className="text-sm text-muted-foreground">
                I have reviewed this analysis and accept the{' '}
                <span className="text-[#FF1744] font-mono">{riskPct}%</span> risk exposure.
              </span>
            </label>
            <Button
              onClick={handleExecute}
              disabled={!agreed || executing}
              className="w-full md:w-auto h-12 px-10 text-base font-bold bg-[#00C853] hover:bg-[#00C853]/90 text-white disabled:opacity-40"
            >
              {executing ? (
                <Activity className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              🚀 EXECUTE TRADE
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
