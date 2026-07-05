'use client';
import { createChart, ColorType, CrosshairMode, CandlestickSeries } from 'lightweight-charts';
import React, { useEffect, useRef } from 'react';

interface CandlestickChartProps {
  data?: { time: string; open: number; high: number; low: number; close: number }[];
  height?: number;
}

export default function CandlestickChart({ data = [], height = 400 }: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#161B22' },
        textColor: '#8B949E',
      },
      grid: {
        vertLines: { color: '#30363D' },
        horzLines: { color: '#30363D' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: '#30363D',
      },
      timeScale: {
        borderColor: '#30363D',
        timeVisible: true,
        secondsVisible: false,
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight || height,
    });

    // v5 API: addSeries with CandlestickSeries type
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00C853',
      downColor: '#FF1744',
      borderDownColor: '#FF1744',
      borderUpColor: '#00C853',
      wickDownColor: '#FF1744',
      wickUpColor: '#00C853',
    });

    const chartData = data && data.length > 0 ? data : [
      { time: '2024-01-01', open: 1.0820, high: 1.0855, low: 1.0810, close: 1.0845 },
      { time: '2024-01-02', open: 1.0845, high: 1.0875, low: 1.0835, close: 1.0865 },
      { time: '2024-01-03', open: 1.0865, high: 1.0890, low: 1.0840, close: 1.0852 },
      { time: '2024-01-04', open: 1.0852, high: 1.0880, low: 1.0820, close: 1.0878 },
      { time: '2024-01-05', open: 1.0878, high: 1.0920, low: 1.0870, close: 1.0910 },
      { time: '2024-01-08', open: 1.0910, high: 1.0935, low: 1.0890, close: 1.0895 },
      { time: '2024-01-09', open: 1.0895, high: 1.0915, low: 1.0860, close: 1.0870 },
      { time: '2024-01-10', open: 1.0870, high: 1.0885, low: 1.0840, close: 1.0855 },
    ];

    candleSeries.setData(chartData as any);
    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight || height,
        });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [data, height]);

  return (
    <div ref={chartContainerRef} className="w-full h-full min-h-[300px]" />
  );
}
