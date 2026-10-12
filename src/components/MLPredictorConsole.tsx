import React from 'react';
import {
  Cpu,
  RefreshCw
} from 'lucide-react';
import { useTrading } from '../context/TradingContext';
import type { ModelType, HorizonType } from '../types/crypto';

export const MLPredictorConsole: React.FC = () => {
  const {
    activePair,
    modelType,
    setModelType,
    horizon,
    setHorizon,
    backendEngine,
    mlPrediction,
    isInferring,
    fastapiConnected,
    triggerManualInference
  } = useTrading();

  const models: { id: ModelType; name: string; tag: string }[] = [
    { id: 'ensemble', name: 'Consensus Ensemble', tag: '81.2% Acc' },
    { id: 'lstm', name: 'PyTorch LSTM', tag: 'Micro-Trends' },
    { id: 'transformer', name: 'Transformer Time-Series', tag: 'Multi-Head Attn' },
    { id: 'xgboost', name: 'XGBoost Regressor', tag: 'Gradient Trees' }
  ];

  const horizons: { id: HorizonType; label: string }[] = [
    { id: '5m', label: '5 Min' },
    { id: '15m', label: '15 Min' },
    { id: '1h', label: '1 Hour' },
    { id: '4h', label: '4 Hour' },
    { id: '24h', label: '24 Hour' }
  ];

  const signal = mlPrediction?.signal || 'NEUTRAL';
  const isBuy = signal.includes('BUY');
  const isSell = signal.includes('SELL');

  return (
    <div className="order-form-panel" style={{ gap: 12 }}>
      {/* Console Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13, color: '#fff' }}>
          <Cpu size={15} className="text-cyan" />
          <span>ML Price Predictor Console</span>
        </div>
        <span
          className="badge-tag"
          style={{
            background: fastapiConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0, 212, 255, 0.15)',
            borderColor: fastapiConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(0, 212, 255, 0.3)',
            color: fastapiConnected ? 'var(--color-green)' : 'var(--color-cyan)'
          }}
        >
          {backendEngine === 'fastapi' && fastapiConnected ? 'FASTAPI LIVE' : 'ONNX ENGINE'}
        </span>
      </div>

      {/* Model Architecture Selector */}
      <div className="input-field-group">
        <div className="input-label">
          <span>Active Predictive Model</span>
          <span style={{ fontSize: 10, color: 'var(--color-cyan)' }}>PyTorch / XGBoost</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {models.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`cat-pill ${modelType === m.id ? 'active' : ''}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '6px 8px',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'left',
                border: modelType === m.id ? '1px solid var(--color-cyan)' : '1px solid var(--border-subtle)',
                background: modelType === m.id ? 'rgba(0, 212, 255, 0.1)' : 'var(--bg-primary)'
              }}
              onClick={() => setModelType(m.id)}
            >
              <span style={{ fontWeight: 600, fontSize: 11, color: modelType === m.id ? '#fff' : 'var(--color-text-main)' }}>
                {m.name}
              </span>
              <span style={{ fontSize: 9, color: 'var(--color-text-dim)' }}>
                {m.tag}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Forecast Horizon Selector */}
      <div className="input-field-group">
        <div className="input-label">
          <span>Prediction Horizon</span>
          <span style={{ fontSize: 10, color: 'var(--color-text-dim)' }}>Window Step</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {horizons.map((h) => (
            <button
              key={h.id}
              type="button"
              className={`pct-btn ${horizon === h.id ? 'active' : ''}`}
              style={{
                flex: 1,
                padding: '5px 0',
                background: horizon === h.id ? 'rgba(0, 212, 255, 0.15)' : 'var(--bg-tertiary)',
                color: horizon === h.id ? 'var(--color-cyan)' : 'var(--color-text-dim)',
                borderColor: horizon === h.id ? 'rgba(0, 212, 255, 0.4)' : 'var(--border-subtle)'
              }}
              onClick={() => setHorizon(h.id)}
            >
              {h.label}
            </button>
          ))}
        </div>
      </div>

      {/* Live Model Output Card */}
      {mlPrediction && (
        <div
          style={{
            background: 'var(--bg-primary)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            padding: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 8
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: 'var(--color-text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
              Forecast Signal ({activePair.symbol})
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 4,
                letterSpacing: 0.5,
                background: isBuy
                  ? 'rgba(16, 185, 129, 0.2)'
                  : isSell
                  ? 'rgba(244, 63, 94, 0.2)'
                  : 'rgba(255, 255, 255, 0.1)',
                color: isBuy
                  ? 'var(--color-green)'
                  : isSell
                  ? 'var(--color-red)'
                  : '#cbd5e1'
              }}
            >
              {signal}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--color-text-dim)' }}>Predicted Target Price</div>
              <div className="font-mono" style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginTop: 1 }}>
                ${mlPrediction.predictedTargetPrice.toLocaleString(undefined, {
                  minimumFractionDigits: activePair.price < 1 ? 4 : 2,
                  maximumFractionDigits: activePair.price < 1 ? 6 : 2
                })}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: 'var(--color-text-dim)' }}>Expected Return</div>
              <div
                className={`font-mono ${mlPrediction.predictedChangePercent >= 0 ? 'text-green' : 'text-red'}`}
                style={{ fontSize: 15, fontWeight: 700 }}
              >
                {mlPrediction.predictedChangePercent >= 0 ? '+' : ''}{mlPrediction.predictedChangePercent}%
              </div>
            </div>
          </div>

          {/* Confidence Bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--color-text-dim)', marginBottom: 3 }}>
              <span>Confidence Metric</span>
              <span className="font-mono text-cyan" style={{ fontWeight: 700 }}>{mlPrediction.confidence}%</span>
            </div>
            <div style={{ width: '100%', height: 5, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 3, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${mlPrediction.confidence}%`,
                  height: '100%',
                  background: isBuy
                    ? 'linear-gradient(90deg, #10b981, #00d4ff)'
                    : isSell
                    ? 'linear-gradient(90deg, #f43f5e, #fb7185)'
                    : '#94a3b8',
                  borderRadius: 3
                }}
              />
            </div>
          </div>

          {/* Model Uncertainty Bounds */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--color-text-dim)', paddingTop: 2 }}>
            <span>Uncertainty VaR: <strong style={{ color: '#fff' }}>±0.65%</strong></span>
            <span>Latency: <strong className="text-cyan">{mlPrediction.inferenceLatencyMs}ms</strong></span>
          </div>
        </div>
      )}

      {/* Live Feature Vector Inspector */}
      {mlPrediction && (
        <div
          style={{
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 10px',
            fontSize: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            border: '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ fontWeight: 700, color: 'var(--color-text-main)', fontSize: 10, marginBottom: 2 }}>
            Live Input Features (Normalized)
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-dim)' }}>
            <span>RSI(14) Momentum:</span>
            <span className="font-mono" style={{ color: '#fff' }}>{mlPrediction.features.rsi} ({mlPrediction.features.rsiStatus})</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-dim)' }}>
            <span>Order Book Depth Skew:</span>
            <span className="font-mono" style={{ color: mlPrediction.features.orderBookImbalance >= 0 ? 'var(--color-green)' : 'var(--color-red)' }}>
              {mlPrediction.features.orderBookImbalance > 0 ? '+' : ''}{mlPrediction.features.orderBookImbalance}%
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-dim)' }}>
            <span>Volatility ATR:</span>
            <span className="font-mono" style={{ color: '#fff' }}>${mlPrediction.features.volatilityATR}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-dim)' }}>
            <span>Backend Runtime:</span>
            <span className="font-mono text-cyan">{mlPrediction.backendRuntime}</span>
          </div>
        </div>
      )}

      {/* Manual Inference Trigger Button */}
      <button
        type="button"
        className="order-submit-btn"
        style={{
          background: 'linear-gradient(135deg, #00d4ff, #0284c7)',
          color: '#ffffff',
          boxShadow: '0 4px 14px var(--color-cyan-glow)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8
        }}
        disabled={isInferring}
        onClick={triggerManualInference}
      >
        <RefreshCw size={14} className={isInferring ? 'spin' : ''} />
        {isInferring ? 'Computing Neural Inference...' : `Run ${models.find(m => m.id === modelType)?.name} Inference`}
      </button>
    </div>
  );
};
