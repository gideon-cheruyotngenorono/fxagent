import useSWR from 'swr';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ─── Response Types ──────────────────────────────────────────────────────────

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

// ─── Fetcher ─────────────────────────────────────────────────────────────────

export async function fetchAPI<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${API_BASE}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
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
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
}

export function createWebSocket(endpoint: string): WebSocket {
  const wsUrl = API_BASE.replace('http', 'ws');
  return new WebSocket(`${wsUrl}${endpoint}`);
}

// ─── SWR Hooks ───────────────────────────────────────────────────────────────

const fetcher = (url: string) => fetch(`${API_BASE}${url}`).then(r => r.json());

export function useAccount() {
  return useSWR<AccountData>('/api/account', fetcher, { refreshInterval: 5000 });
}

export function usePositions() {
  return useSWR<PositionsData>('/api/positions', fetcher, { refreshInterval: 5000 });
}

export function usePrices(symbols: string[]) {
  return useSWR(`/api/prices?symbols=${symbols.join(',')}`, fetcher, { refreshInterval: 1000 });
}

export function useSession() {
  return useSWR<SessionData>('/api/session', fetcher, { refreshInterval: 30000 });
}

export function useCandles(symbol: string, timeframe: string, count = 100) {
  return useSWR<CandlesData>(`/api/candles/${symbol}/${timeframe}?count=${count}`, fetcher);
}

export function usePerformance(days = 30) {
  return useSWR<PerformanceData>(`/api/performance?days=${days}`, fetcher);
}

export function useHealth() {
  return useSWR<HealthData>('/api/health', fetcher, { refreshInterval: 10000 });
}
