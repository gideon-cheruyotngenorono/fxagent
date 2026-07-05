'use client';

import {
  createChart,
  ColorType,
  CrosshairMode,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  IChartApi,
  ISeriesApi,
} from 'lightweight-charts';
import React, { useEffect, useRef, useCallback } from 'react';

export interface OHLCVData {
  time: string | number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface EMALine {
  period: number;
  color: string;
  data: { time: string | number; value: number }[];
}

interface CandlestickChartProps {
  data?: OHLCVData[];
  emaLines?: EMALine[];
  showVolume?: boolean;
  loading?: boolean;
  /** Compact mode hides secondary elements for small chart slots */
  compact?: boolean;
}

const CHART_THEME = {
  bg: '#161B22',
  bgSecondary: '#0D1117',
  grid: '#21262D',
  border: '#30363D',
  text: '#8B949E',
  textPrimary: '#E6EDF3',
  up: '#00C853',
  down: '#FF1744',
  upAlpha: 'rgba(0,200,83,0.15)',
  downAlpha: 'rgba(255,23,68,0.15)',
  purple: '#7C4DFF',
  blue: '#2196F3',
};

export default function CandlestickChart({
  data = [],
  emaLines = [],
  showVolume = true,
  loading = false,
  compact = false,
}: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const emaSeriesRefs = useRef<ISeriesApi<'Line'>[]>([]);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const destroyChart = useCallback(() => {
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }
    candleSeriesRef.current = null;
    volumeSeriesRef.current = null;
    emaSeriesRefs.current = [];
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    destroyChart();

    const container = containerRef.current;

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: CHART_THEME.bg },
        textColor: CHART_THEME.text,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: compact ? 10 : 11,
      },
      grid: {
        vertLines: { color: CHART_THEME.grid, style: 1 },
        horzLines: { color: CHART_THEME.grid, style: 1 },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: CHART_THEME.border,
          labelBackgroundColor: CHART_THEME.purple,
          width: 1,
          style: 1,
        },
        horzLine: {
          color: CHART_THEME.border,
          labelBackgroundColor: CHART_THEME.purple,
          width: 1,
          style: 1,
        },
      },
      rightPriceScale: {
        borderColor: CHART_THEME.border,
        textColor: CHART_THEME.text,
        autoScale: true,
        scaleMargins: showVolume ? { top: 0.08, bottom: 0.22 } : { top: 0.08, bottom: 0.04 },
      },
      timeScale: {
        borderColor: CHART_THEME.border,
        timeVisible: true,
        secondsVisible: false,
        fixLeftEdge: false,
        fixRightEdge: false,
        rightOffset: 8,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: false,
      },
      handleScale: {
        mouseWheel: true,
        pinch: true,
        axisPressedMouseMove: { time: true, price: false },
      },
      width: container.clientWidth,
      height: container.clientHeight || 400,
    });

    chartRef.current = chart;

    // ── Candlestick Series ──────────────────────────────────────────────────
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: CHART_THEME.up,
      downColor: CHART_THEME.down,
      borderUpColor: CHART_THEME.up,
      borderDownColor: CHART_THEME.down,
      wickUpColor: CHART_THEME.up,
      wickDownColor: CHART_THEME.down,
    });
    candleSeriesRef.current = candleSeries;

    // ── Volume Series ───────────────────────────────────────────────────────
    if (showVolume) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
      });
      chart.priceScale('volume').applyOptions({
        scaleMargins: { top: 0.82, bottom: 0 },
        visible: false,
      });
      volumeSeriesRef.current = volumeSeries;
    }

    // ── EMA Lines ───────────────────────────────────────────────────────────
    emaSeriesRefs.current = emaLines.map((ema) => {
      const series = chart.addSeries(LineSeries, {
        color: ema.color,
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: !compact,
        crosshairMarkerVisible: false,
      });
      if (ema.data.length > 0) series.setData(ema.data as any);
      return series;
    });

    // ── Resize Observer ─────────────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
      if (!container || !chart) return;
      chart.applyOptions({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    });
    ro.observe(container);
    resizeObserverRef.current = ro;

    return destroyChart;
  }, [showVolume, compact, destroyChart]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update data without recreating the chart
  useEffect(() => {
    if (!candleSeriesRef.current) return;

    const hasData = data.length > 0;

    const chartData = hasData
      ? data
      : generatePlaceholderData();

    // Candlestick data
    candleSeriesRef.current.setData(chartData as any);

    // Volume data
    if (volumeSeriesRef.current) {
      const volumeData = chartData.map((d) => ({
        time: d.time,
        value: (d as OHLCVData).volume ?? Math.abs(d.close - d.open) * 10000,
        color: d.close >= d.open ? 'rgba(0,200,83,0.4)' : 'rgba(255,23,68,0.4)',
      }));
      volumeSeriesRef.current.setData(volumeData as any);
    }

    // EMA lines
    emaLines.forEach((ema, i) => {
      if (emaSeriesRefs.current[i] && ema.data.length > 0) {
        emaSeriesRefs.current[i].setData(ema.data as any);
      }
    });

    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, JSON.stringify(emaLines)]);

  return (
    <div className="relative w-full h-full">
      {/* Loading Skeleton */}
      {loading && (
        <div className="absolute inset-0 z-10 flex flex-col gap-2 p-4 bg-[#161B22]">
          <div className="flex items-end gap-[3px] flex-1">
            {Array.from({ length: 40 }).map((_, i) => {
              const h = 20 + Math.random() * 60;
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end gap-[2px]">
                  <div
                    className="w-full rounded-sm animate-pulse"
                    style={{
                      height: `${h}%`,
                      backgroundColor: i % 3 === 0 ? 'rgba(255,23,68,0.2)' : 'rgba(0,200,83,0.2)',
                      animationDelay: `${i * 30}ms`,
                    }}
                  />
                </div>
              );
            })}
          </div>
          <div className="h-3 w-full bg-[#21262D] rounded animate-pulse" />
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}

// ── Placeholder candles shown when no real data yet ─────────────────────────
function generatePlaceholderData() {
  const candles = [];
  let price = 1.0820;
  const start = new Date('2024-01-01');

  for (let i = 0; i < 60; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const change = (Math.random() - 0.48) * 0.005;
    const open = price;
    const close = +(price + change).toFixed(5);
    const high = +(Math.max(open, close) + Math.random() * 0.002).toFixed(5);
    const low = +(Math.min(open, close) - Math.random() * 0.002).toFixed(5);
    const vol = Math.floor(500 + Math.random() * 2000);
    candles.push({
      time: date.toISOString().split('T')[0],
      open,
      high,
      low,
      close,
      volume: vol,
    });
    price = close;
  }
  return candles;
}
