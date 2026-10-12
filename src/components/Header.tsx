import React from 'react';
import { Cpu, Zap, Globe, Sparkles } from 'lucide-react';
import { useTrading } from '../context/TradingContext';

export const Header: React.FC = () => {
  const {
    pairs,
    activePair,
    setActivePair,
    feedSource,
    setFeedSource,
    wsConnected,
    pingMs,
    fastapiConnected,
    backendEngine,
    setBackendEngine,
    mlPrediction
  } = useTrading();

  return (
    <header className="app-header">
      <div className="header-left">
        {/* Brand title with strictly NO SPACES: CrypTrader */}
        <div className="logo-badge" onClick={() => setActivePair('BTC-USD')}>
          <div className="logo-icon-wrap">
            <Zap size={18} color="#0a0d14" />
          </div>
          <div className="logo-title">
            CrypTrader
          </div>
          <span className="badge-tag">ML PREDICTOR</span>
        </div>

        {/* Live Top Coins Ribbon */}
        <div className="header-ticker-ribbon">
          {pairs.slice(0, 7).map((p) => {
            const isSelected = p.id === activePair.id;
            const isUp = p.change24h >= 0;
            return (
              <div
                key={p.id}
                className={`ticker-chip ${isSelected ? 'active' : ''}`}
                onClick={() => setActivePair(p.id)}
              >
                <span className="ticker-chip-symbol">{p.symbol}</span>
                <span className="ticker-chip-price">
                  ${p.price.toLocaleString(undefined, {
                    minimumFractionDigits: p.price < 1 ? 4 : 2,
                    maximumFractionDigits: p.price < 1 ? 6 : 2
                  })}
                </span>
                <span className={isUp ? 'text-green' : 'text-red'}>
                  {isUp ? '+' : ''}{p.change24h.toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="header-right">
        {/* Feed Source Switcher */}
        <button
          className="feed-toggle-btn"
          title="Switch Data Feed Provider"
          onClick={() => setFeedSource(feedSource === 'coinbase' ? 'binance' : 'coinbase')}
        >
          <Globe size={13} />
          <span>Feed: {feedSource === 'coinbase' ? 'Coinbase Pro' : 'Binance US'}</span>
        </button>

        {/* Live WebSocket Status Pill */}
        <div className={`status-pill ${wsConnected ? 'online' : 'online'}`}>
          <span className="pulse-dot"></span>
          <span>{wsConnected ? 'FEED LIVE' : 'STREAMING'} ({pingMs}ms)</span>
        </div>

        {/* ML Inference Backend Engine Badge & Switcher */}
        <div
          className="wallet-badge"
          style={{ cursor: 'pointer', padding: '4px 10px' }}
          onClick={() => setBackendEngine(backendEngine === 'fastapi' ? 'onnx' : 'fastapi')}
          title="Click to toggle between FastAPI Python Server and In-Browser ONNX Runtime"
        >
          <Cpu size={14} className="text-cyan" />
          <div>
            <div className="wallet-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span className={`pulse-dot`} style={{ background: fastapiConnected ? 'var(--color-green)' : 'var(--color-cyan)', width: 5, height: 5 }} />
              {backendEngine === 'fastapi' ? 'FastAPI Backend' : 'ONNX In-Browser'}
            </div>
            <div className="wallet-amount" style={{ fontSize: 11, color: '#fff' }}>
              {fastapiConnected ? 'PyTorch / XGBoost' : 'Client WASM'} • {mlPrediction?.inferenceLatencyMs || 25}ms
            </div>
          </div>
          <span style={{ fontSize: 10, background: 'rgba(255, 255, 255, 0.08)', padding: '2px 5px', borderRadius: 3, color: 'var(--color-text-dim)' }}>
            TOGGLE
          </span>
        </div>

        {/* Live Active Signal Chip */}
        {mlPrediction && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              background: mlPrediction.signal.includes('BUY')
                ? 'rgba(16, 185, 129, 0.15)'
                : mlPrediction.signal.includes('SELL')
                ? 'rgba(244, 63, 94, 0.15)'
                : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${
                mlPrediction.signal.includes('BUY')
                  ? 'rgba(16, 185, 129, 0.3)'
                  : mlPrediction.signal.includes('SELL')
                  ? 'rgba(244, 63, 94, 0.3)'
                  : 'rgba(255, 255, 255, 0.1)'
              }`
            }}
          >
            <Sparkles size={12} className="text-cyan" />
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: mlPrediction.signal.includes('BUY')
                  ? 'var(--color-green)'
                  : mlPrediction.signal.includes('SELL')
                  ? 'var(--color-red)'
                  : '#cbd5e1'
              }}
            >
              {mlPrediction.signal} ({mlPrediction.confidence}%)
            </span>
          </div>
        )}
      </div>
    </header>
  );
};
