import { useEffect, useState, useRef } from 'react';

interface PriceData {
  [symbol: string]: { bid: number; ask: number; spread: number };
}

export function useLivePrices(symbols: string[]) {
  const [prices, setPrices] = useState<PriceData>({});
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const wsUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
      .replace('http', 'ws') + '/ws/live-prices';
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ subscribe: symbols }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'price_update') {
        setPrices(data.prices);
      }
    };

    ws.onerror = (error) => console.error('WebSocket error:', error);

    return () => {
      ws.close();
    };
  }, [symbols.join(',')]);

  return prices;
}
