import useSWR from 'swr';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Helper for GET requests
export async function fetchAPI<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${API_BASE}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
}

// Helper for POST requests
export async function postAPI<T>(endpoint: string, body: any): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
}

// WebSocket helper
export function createWebSocket(endpoint: string): WebSocket {
  const wsUrl = API_BASE.replace('http', 'ws');
  return new WebSocket(`${wsUrl}${endpoint}`);
}

// SWR hooks
export function useAccount() {
  return useSWR('/api/account', fetchAPI);
}

export function usePositions() {
  return useSWR('/api/positions', fetchAPI, { refreshInterval: 5000 });
}

export function usePrices(symbols: string[]) {
  return useSWR(`/api/prices?symbols=${symbols.join(',')}`, fetchAPI, { refreshInterval: 1000 });
}

export function useSession() {
  return useSWR('/api/session', fetchAPI, { refreshInterval: 30000 });
}

export function useCandles(symbol: string, timeframe: string, count = 100) {
  return useSWR(`/api/candles/${symbol}/${timeframe}?count=${count}`, fetchAPI);
}

export function usePerformance(days = 30) {
  return useSWR(`/api/performance?days=${days}`, fetchAPI);
}
