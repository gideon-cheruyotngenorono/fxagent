import useSWR from 'swr';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ─── Response Types ───────────────────────────────────────────────────────────

export interface AccountData {
  balance: number;
  equity: number;
  floating_pnl: number;
  daily_pnl: number;
  daily_pnl_pct: number;
  margin_used: number;
  margin_free: number;
  margin_level: number;
  currency: string;
  leverage: number;
  is_demo: boolean;
  server: string;
}

export interface Position {
  ticket: number;
  symbol: string;
  type: string;
  volume: number;
  open_price: number;
  current_price: number;
  sl: number;
  tp: number;
  profit: number;
  change_pct: number;
  pips_from_entry: number;
  open_time_ago: string;
}

export interface PositionsData {
  positions: Position[];
  count: number;
  total_pnl: number;
}

export interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CandlesData {
  symbol: string;
  timeframe: string;
  candles: Candle[];
  support: number[];
  resistance: number[];
  count: number;
}

export interface SessionData {
  session: {
    name: string;
    quality: string;
    time_remaining: string;
    can_trade: boolean;
  };
  recommendations: string[];
  warnings: string[];
  market_open: boolean;
}

export interface HealthData {
  status: string;
  mt5_connected: boolean;
  market_open: boolean;
  database_ok: boolean;
  groq_configured: boolean;
  gemini_configured: boolean;
}

export interface PerformanceData {
  trading_performance: {
    total_trades: number;
    win_rate: number;
    net_profit: number;
    profit_factor: number;
    avg_win: number;
    avg_loss: number;
    by_symbol: Record<string, unknown>;
  };
  prediction_accuracy: {
    direction_accuracy: number;
    by_timeframe: Record<string, unknown>;
    by_confidence: Record<string, unknown>;
  };
  bot_score: {
    score: number;
    grade: string;
  };
}

export interface EquityCurvePoint {
  date: string;
  balance: number;
  equity?: number;
}

export interface TradeRecord {
  ticket: number;
  symbol: string;
  type: 'buy' | 'sell';
  volume: number;
  open_price: number;
  close_price: number;
  open_time: string;
  close_time: string;
  profit: number;
  pips: number;
  duration: string;
}

export interface TradesData {
  trades: TradeRecord[];
  total: number;
  page: number;
  page_size: number;
}

export interface AnalysisSummary {
  id: string;
  symbol: string;
  timeframe: string;
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  entry: number;
  sl: number;
  tp: number;
  rr: number;
  confidence: number;
  summary: string;
  timestamp: string;
}

export interface AnalysisResult {
  symbol: string;
  timeframe: string;
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  entry_type: string;
  entry: number;
  sl: number;
  tp: number;
  rr: number;
  pips_sl: number;
  pips_tp: number;
  lot_size: number;
  risk_amount: number;
  potential_profit: number;
  confidence: string;
  summary: string;
  trade_management: string;
  risk_assessment: string;
  alternative_scenario: string;
  full_prompt?: string;
  raw_response?: unknown;
  account_balance: number;
  risk_percent: number;
}

export interface AnalysisHistoryItem {
  id: string;
  symbol: string;
  timeframe: string;
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  timestamp: string;
  action_taken?: string;
}

export interface ChatModel {
  id: string;
  name: string;
  provider: string;
  speed: string;
  cost: string;
  description?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  timestamp: string;
}

export interface AppSettings {
  account_balance: number;
  risk_percent: number;
  default_model: string;
  groq_api_key?: string;
  gemini_api_key?: string;
  sound_alerts: boolean;
  desktop_notifications: boolean;
  background_logging: boolean;
}

export interface SearchResult {
  id: string;
  type: 'symbol' | 'trade' | 'analysis' | 'page';
  title: string;
  subtitle?: string;
  href: string;
  meta?: string;
}

export interface SearchData {
  results: SearchResult[];
  total: number;
  query: string;
}

export interface ExecuteRequest {
  symbol: string;
  action: 'buy' | 'sell';
  entry: number;
  sl: number;
  tp: number;
  lot_size: number;
}

export interface ExecuteResult {
  success: boolean;
  ticket?: number;
  message: string;
}

// ─── Core Fetcher ─────────────────────────────────────────────────────────────

const fetcher = (url: string) =>
  fetch(`${API_BASE}${url}`).then((r) => {
    if (!r.ok) throw new Error(`API ${r.status}: ${r.statusText}`);
    return r.json();
  });

export async function fetchAPI<T>(
  endpoint: string,
  params?: Record<string, string>
): Promise<T> {
  const url = new URL(`${API_BASE}${endpoint}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
}

export async function postAPI<T>(endpoint: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? `API Error: ${res.status}`);
  }
  return res.json();
}

export async function putAPI<T>(endpoint: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? `API Error: ${res.status}`);
  }
  return res.json();
}

export function createWebSocket(endpoint: string): WebSocket {
  const wsUrl = API_BASE.replace(/^http/, 'ws');
  return new WebSocket(`${wsUrl}${endpoint}`);
}

// ─── SWR Hooks — Account & Positions ─────────────────────────────────────────

export function useAccount() {
  return useSWR<AccountData>('/api/account', fetcher, { refreshInterval: 5000 });
}

export function usePositions() {
  return useSWR<PositionsData>('/api/positions', fetcher, { refreshInterval: 5000 });
}

// ─── SWR Hooks — Market Data ──────────────────────────────────────────────────

export function usePrices(symbols: string[]) {
  return useSWR(`/api/prices?symbols=${symbols.join(',')}`, fetcher, { refreshInterval: 1000 });
}

export function useSymbols() {
  return useSWR<{ symbols: string[] }>('/api/symbols', fetcher, { revalidateOnFocus: false });
}

export function useSession() {
  return useSWR<SessionData>('/api/session', fetcher, { refreshInterval: 30000 });
}

export function useCandles(symbol: string, timeframe: string, count = 100) {
  return useSWR<CandlesData>(
    symbol && timeframe ? `/api/candles/${symbol}/${timeframe}?count=${count}` : null,
    fetcher
  );
}

export function useHealth() {
  return useSWR<HealthData>('/api/health', fetcher, { refreshInterval: 10000 });
}

// ─── SWR Hooks — Performance & History ───────────────────────────────────────

export function usePerformance(days = 30) {
  return useSWR<PerformanceData>(`/api/performance?days=${days}`, fetcher);
}

export function useEquityCurve(days = 30) {
  return useSWR<{ data: EquityCurvePoint[] }>(
    `/api/performance/equity-curve?days=${days}`,
    fetcher
  );
}

export function useTrades(days = 30, page = 1) {
  return useSWR<TradesData>(`/api/trades?days=${days}&page=${page}`, fetcher);
}

export function useAnalysisHistory() {
  return useSWR<{ analyses: AnalysisHistoryItem[] }>('/api/analysis/history', fetcher);
}

// ─── SWR Hooks — Analysis ────────────────────────────────────────────────────

export function useLatestAnalysis(symbol: string) {
  return useSWR<AnalysisSummary>(
    symbol ? `/api/analysis/latest/${symbol}` : null,
    fetcher,
    { refreshInterval: 60000 }
  );
}

// ─── SWR Hooks — Chat ────────────────────────────────────────────────────────

export function useChatModels() {
  return useSWR<{ models: ChatModel[] }>('/api/chat/models', fetcher, {
    revalidateOnFocus: false,
  });
}

export function useChatHistory() {
  return useSWR<{ messages: ChatMessage[] }>('/api/chat/history', fetcher);
}

// ─── SWR Hooks — Settings ────────────────────────────────────────────────────

export function useSettings() {
  return useSWR<AppSettings>('/api/settings', fetcher, { revalidateOnFocus: false });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export const postAnalyze = (payload: {
  symbol: string;
  timeframe: string;
  account_balance: number;
  risk_percent: number;
}) => postAPI<AnalysisResult>('/api/analyze', payload);

export const postExecute = (trade: ExecuteRequest) =>
  postAPI<ExecuteResult>('/api/execute', trade);

export const postClosePosition = (ticket: number) =>
  postAPI<{ success: boolean; message: string }>('/api/positions/close', { ticket });

export const postChat = (payload: { message: string; model: string }) =>
  postAPI<ChatMessage>('/api/chat', payload);

export const postClearChat = () =>
  postAPI<{ success: boolean }>('/api/chat/clear', {});

export const putSettings = (settings: Partial<AppSettings>) =>
  putAPI<AppSettings>('/api/settings', settings);

export const searchAPI = (q: string) =>
  fetchAPI<SearchData>('/api/search', { q });

export const postTraceLatest = () =>
  fetchAPI<{ steps: TraceStep[] }>('/api/trace/latest');

// ─── Trace Types ──────────────────────────────────────────────────────────────

export interface TraceStep {
  id: number | string;
  name: string;
  status: 'pending' | 'running' | 'done' | 'error';
  duration?: string;
  detail?: string;
}
