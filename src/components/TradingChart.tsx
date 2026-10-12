import React, { useEffect, useRef, useState } from 'react';
import {
  createChart,
  ColorType,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  LineStyle,
  CrosshairMode
} from 'lightweight-charts';
import type { IChartApi, ISeriesApi, Time } from 'lightweight-charts';
import {
  TrendingUp,
  TrendingDown,
  Maximize2,
  Sparkles
} from 'lucide-react';
import { useTrading } from '../context/TradingContext';
import type { Timeframe } from '../types/crypto';

export const TradingChart: React.FC = () => {
  const {
    activePair,
    candles,
    timeframe,
    setTimeframe,
    indicators,
    toggleIndicator,
    mlPrediction
  } = useTrading();

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const smaSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const emaSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const mlSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  const [hoveredCandle, setHoveredCandle] = useState<{
    time?: string;
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    volume?: number;
  } | null>(null);

  const timeframes: Timeframe[] = ['1m', '5m', '15m', '1h', '4h', '1d'];

  useEffect(() => {
    if (!chartContainerRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove();
      chartInstanceRef.current = null;
    }

    const container = chartContainerRef.current;
    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: '#0a0d14' },
        textColor: '#94a3b8',
        fontSize: 11,
        fontFamily: 'Inter, sans-serif'
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.035)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.035)' }
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: 'rgba(0, 212, 255, 0.4)',
          width: 1,
          style: LineStyle.Dashed
        },
        horzLine: {
          color: 'rgba(0, 212, 255, 0.4)',
          width: 1,
          style: LineStyle.Dashed
        }
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.08)',
        scaleMargins: {
          top: 0.12,
          bottom: 0.22
        }
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.08)',
        timeVisible: true,
        secondsVisible: false
      }
    });

    chartInstanceRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#f43f5e',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#f43f5e'
    });
    candleSeriesRef.current = candleSeries;

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: ''
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.82,
        bottom: 0
      }
    });
    volumeSeriesRef.current = volumeSeries;

    const smaSeries = chart.addSeries(LineSeries, {
      color: '#f59e0b',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      title: 'SMA 20'
    });
    smaSeriesRef.current = smaSeries;

    const emaSeries = chart.addSeries(LineSeries, {
      color: '#00d4ff',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      title: 'EMA 50'
    });
    emaSeriesRef.current = emaSeries;

    const mlSeries = chart.addSeries(LineSeries, {
      color: '#a78bfa',
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: true,
      title: 'AI Forecast'
    });
    mlSeriesRef.current = mlSeries;

    chart.subscribeCrosshairMove((param) => {
      if (
        param.point === undefined ||
        !param.time ||
        param.point.x < 0 ||
        param.point.x > container.clientWidth ||
        param.point.y < 0 ||
        param.point.y > container.clientHeight
      ) {
        setHoveredCandle(null);
      } else {
        const data = param.seriesData.get(candleSeries) as any;
        if (data) {
          setHoveredCandle({
            time: typeof param.time === 'number' ? new Date(param.time * 1000).toLocaleTimeString() : String(param.time),
            open: data.open,
            high: data.high,
            low: data.low,
            close: data.close,
            volume: (param.seriesData.get(volumeSeries) as any)?.value
          });
        }
      }
    });

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0 || !chartInstanceRef.current) return;
      const { width, height } = entries[0].contentRect;
      chartInstanceRef.current.applyOptions({ width, height });
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartInstanceRef.current = null;
    };
  }, [activePair.id]);

  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current || candles.length === 0) return;

    const formattedCandles = candles.map((c) => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close
    }));
    candleSeriesRef.current.setData(formattedCandles);

    if (indicators.volume) {
      const formattedVolume = candles.map((c) => ({
        time: c.time as Time,
        value: c.volume,
        color: c.close >= c.open ? 'rgba(16, 185, 129, 0.35)' : 'rgba(244, 63, 94, 0.35)'
      }));
      volumeSeriesRef.current.setData(formattedVolume);
    } else {
      volumeSeriesRef.current.setData([]);
    }

    if (indicators.sma20 && smaSeriesRef.current && candles.length >= 20) {
      const smaData: { time: Time; value: number }[] = [];
      for (let i = 19; i < candles.length; i++) {
        let sum = 0;
        for (let j = 0; j < 20; j++) sum += candles[i - j].close;
        smaData.push({
          time: candles[i].time as Time,
          value: Number((sum / 20).toFixed(2))
        });
      }
      smaSeriesRef.current.setData(smaData);
    } else if (smaSeriesRef.current) {
      smaSeriesRef.current.setData([]);
    }

    if (indicators.ema50 && emaSeriesRef.current && candles.length >= 25) {
      const emaData: { time: Time; value: number }[] = [];
      const period = 50;
      const k = 2 / (period + 1);
      let prevEma = candles[0].close;

      for (let i = 0; i < candles.length; i++) {
        prevEma = candles[i].close * k + prevEma * (1 - k);
        if (i >= 20) {
          emaData.push({
            time: candles[i].time as Time,
            value: Number(prevEma.toFixed(2))
          });
        }
      }
      emaSeriesRef.current.setData(emaData);
    } else if (emaSeriesRef.current) {
      emaSeriesRef.current.setData([]);
    }

    if (indicators.mlForecast && mlSeriesRef.current && mlPrediction && mlPrediction.projectedCandles.length > 0) {
      const lastCandle = candles[candles.length - 1];
      const mlData = [
        { time: lastCandle.time as Time, value: lastCandle.close },
        ...mlPrediction.projectedCandles.map((p) => ({
          time: p.time as Time,
          value: p.close
        }))
      ];
      mlSeriesRef.current.setData(mlData);
    } else if (mlSeriesRef.current) {
      mlSeriesRef.current.setData([]);
    }
  }, [candles, indicators, mlPrediction]);

  const fitChart = () => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.timeScale().fitContent();
    }
  };

  const isUp = activePair.change24h >= 0;
  const lastCandle = candles[candles.length - 1];
  const displayCandle = hoveredCandle || lastCandle;

  return (
    <div className="workspace-panel chart-panel">
      <div className="chart-header-bar">
        <div className="chart-title-group">
          <div>
            <span className="active-pair-name">{activePair.symbol}</span>
            <span style={{ fontSize: 12, color: 'var(--color-text-dim)', marginLeft: 4 }}>
              / {activePair.quote}
            </span>
          </div>

          <div
            className={`active-price-pill ${isUp ? 'text-green' : 'text-red'}`}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {isUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            ${activePair.price.toLocaleString(undefined, {
              minimumFractionDigits: activePair.price < 1 ? 4 : 2,
              maximumFractionDigits: activePair.price < 1 ? 6 : 2
            })}
          </div>

          <div className="stat-item">
            <span className="stat-label">24h Change</span>
            <span className={`stat-val ${isUp ? 'text-green' : 'text-red'}`}>
              {isUp ? '+' : ''}{activePair.change24h.toFixed(2)}%
            </span>
          </div>

          <div className="stat-item">
            <span className="stat-label">24h High</span>
            <span className="stat-val">
              ${activePair.high24h.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="stat-item">
            <span className="stat-label">24h Low</span>
            <span className="stat-val">
              ${activePair.low24h.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="stat-item">
            <span className="stat-label">24h Vol</span>
            <span className="stat-val">
              ${(activePair.volume24h / 1e6).toFixed(1)}M
            </span>
          </div>
        </div>

        <div className="chart-controls-group">
          <div className="timeframe-group">
            {timeframes.map((tf) => (
              <button
                key={tf}
                className={`tf-btn ${timeframe === tf ? 'active' : ''}`}
                onClick={() => setTimeframe(tf)}
              >
                {tf.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="indicator-pills">
            <button
              className={`ind-pill ${indicators.volume ? 'active' : ''}`}
              onClick={() => toggleIndicator('volume')}
            >
              VOL
            </button>
            <button
              className={`ind-pill ${indicators.sma20 ? 'active' : ''}`}
              style={indicators.sma20 ? { borderColor: '#f59e0b', color: '#f59e0b' } : {}}
              onClick={() => toggleIndicator('sma20')}
            >
              SMA 20
            </button>
            <button
              className={`ind-pill ${indicators.ema50 ? 'active' : ''}`}
              onClick={() => toggleIndicator('ema50')}
            >
              EMA 50
            </button>
            <button
              className={`ind-pill ${indicators.mlForecast ? 'ml-active' : ''}`}
              title="Machine Learning Projected Price Path"
              onClick={() => toggleIndicator('mlForecast')}
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Sparkles size={11} />
              AI FORECAST
            </button>
          </div>

          <button
            className="tf-btn"
            title="Fit Chart to Screen"
            onClick={fitChart}
            style={{ padding: '4px 6px', display: 'flex', alignItems: 'center' }}
          >
            <Maximize2 size={13} />
          </button>
        </div>
      </div>

      {displayCandle && (
        <div
          style={{
            position: 'absolute',
            top: 48,
            left: 14,
            zIndex: 10,
            display: 'flex',
            gap: 12,
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            background: 'rgba(10, 13, 20, 0.75)',
            backdropFilter: 'blur(4px)',
            padding: '3px 8px',
            borderRadius: 4,
            border: '1px solid var(--border-subtle)',
            pointerEvents: 'none'
          }}
        >
          <span style={{ color: 'var(--color-text-dim)' }}>O: <strong style={{ color: '#fff' }}>{displayCandle.open}</strong></span>
          <span style={{ color: 'var(--color-text-dim)' }}>H: <strong style={{ color: 'var(--color-green)' }}>{displayCandle.high}</strong></span>
          <span style={{ color: 'var(--color-text-dim)' }}>L: <strong style={{ color: 'var(--color-red)' }}>{displayCandle.low}</strong></span>
          <span style={{ color: 'var(--color-text-dim)' }}>C: <strong style={{ color: '#fff' }}>{displayCandle.close}</strong></span>
          {displayCandle.volume !== undefined && (
            <span style={{ color: 'var(--color-text-dim)' }}>Vol: <strong style={{ color: 'var(--color-cyan)' }}>{Math.round(displayCandle.volume)}</strong></span>
          )}
        </div>
      )}

      <div className="chart-viewport" ref={chartContainerRef} />
    </div>
  );
};
