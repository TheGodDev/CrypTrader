import React, { useState, useRef, useCallback } from 'react';
import { useTrading } from '../context/TradingContext';
import { getLiveMLPrediction } from '../services/mlPredictor';
import { fetchHistoricalCandles } from '../services/cryptoApi';
import { Play, Pause, Zap, Activity, DollarSign, Target, ArrowUpRight, ArrowDownRight, Brain, Cpu, Database, Globe, LineChart, Lightbulb, Gauge, TrendingUp, Clock, RefreshCw, TrendingDown, AlertCircle } from 'lucide-react';
import type { MLPrediction } from '../types/crypto';

type CrawlrSubTab = 'dashboard' | 'charts' | 'thinking' | 'positions' | 'performance';
type TradingMode = 'fast' | 'slow';

interface ModelState {
  name: string;
  type: 'lstm' | 'transformer' | 'xgboost' | 'ensemble';
  assignedPair: string;
  lastPrediction: MLPrediction | null;
  lastUpdateTime: Date | null;
  confidence: number;
  isActivelyTrading: boolean;
  reasoning: string[];
  learningMetrics: {
    totalTrades: number;
    wins: number;
    losses: number;
    winRate: number;
    avgConfidenceWhenWin: number;
    avgConfidenceWhenLoss: number;
    adaptiveThreshold: number;
  };
}

interface Position {
  id: string;
  symbol: string;
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  side: 'LONG' | 'SHORT';
  pnl: number;
  pnlPercent: number;
  openedAt: Date;
  model: string;
  mode: TradingMode;
}

interface TradeExecution {
  id: string;
  timestamp: Date;
  model: string;
  action: 'BUY' | 'SELL';
  symbol: string;
  price: number;
  quantity: number;
  confidence: number;
  signal: string;
  mode: TradingMode;
  outcome: 'WIN' | 'LOSS' | 'PENDING';
}

export const CrawlrPage: React.FC = () => {
  const { pairs, backendEngine } = useTrading();
  const [isRunning, setIsRunning] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<CrawlrSubTab>('dashboard');
  const [sharedBalance, setSharedBalance] = useState(100000);
  const [positions, setPositions] = useState<Position[]>([]);
  const [tradeHistory, setTradeHistory] = useState<TradeExecution[]>([]);
  const [models, setModels] = useState<ModelState[]>([
    {
      name: 'LSTM',
      type: 'lstm',
      assignedPair: 'BTC-USD',
      lastPrediction: null,
      lastUpdateTime: null,
      confidence: 0,
      isActivelyTrading: false,
      reasoning: [],
      learningMetrics: {
        totalTrades: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        avgConfidenceWhenWin: 0,
        avgConfidenceWhenLoss: 0,
        adaptiveThreshold: 70
      }
    },
    {
      name: 'Transformer',
      type: 'transformer',
      assignedPair: 'ETH-USD',
      lastPrediction: null,
      lastUpdateTime: null,
      confidence: 0,
      isActivelyTrading: false,
      reasoning: [],
      learningMetrics: {
        totalTrades: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        avgConfidenceWhenWin: 0,
        avgConfidenceWhenLoss: 0,
        adaptiveThreshold: 70
      }
    },
    {
      name: 'XGBoost',
      type: 'xgboost',
      assignedPair: 'SOL-USD',
      lastPrediction: null,
      lastUpdateTime: null,
      confidence: 0,
      isActivelyTrading: false,
      reasoning: [],
      learningMetrics: {
        totalTrades: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        avgConfidenceWhenWin: 0,
        avgConfidenceWhenLoss: 0,
        adaptiveThreshold: 70
      }
    },
    {
      name: 'Ensemble',
      type: 'ensemble',
      assignedPair: 'XRP-USD',
      lastPrediction: null,
      lastUpdateTime: null,
      confidence: 0,
      isActivelyTrading: false,
      reasoning: [],
      learningMetrics: {
        totalTrades: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        avgConfidenceWhenWin: 0,
        avgConfidenceWhenLoss: 0,
        adaptiveThreshold: 70
      }
    }
  ]);
  const [tickData, setTickData] = useState<Record<string, { price: number; time: number }[]>>({});
  const [currentTick, setCurrentTick] = useState<Record<string, { price: number; time: number }>>({});
  const [totalPnl, setTotalPnl] = useState(0);
  const [executionSpeed, setExecutionSpeed] = useState(0);
  const [fastTradeCount, setFastTradeCount] = useState(0);
  const [slowTradeCount, setSlowTradeCount] = useState(0);
  const [systemStatus, setSystemStatus] = useState<'idle' | 'running' | 'error'>('idle');
  const [lastError, setLastError] = useState<string | null>(null);

  const fastIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const slowIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const isRunningRef = useRef(false);

  const getPairById = useCallback((pairId: string) => {
    return pairs.find(p => p.id === pairId) || pairs[0];
  }, [pairs]);

  const startCrawlr = useCallback(() => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;
    setIsRunning(true);
    setSystemStatus('running');
    setLastError(null);

    connectWebSocket();

    // Fast mode: 5-second intervals
    fastIntervalRef.current = setInterval(() => {
      if (isRunningRef.current) {
        runMLPredictions('fast');
      }
    }, 5000);

    // Slow mode: 15-second intervals
    slowIntervalRef.current = setInterval(() => {
      if (isRunningRef.current) {
        runMLPredictions('slow');
      }
    }, 15000);
  }, []);

  const stopCrawlr = useCallback(() => {
    isRunningRef.current = false;
    setIsRunning(false);
    setSystemStatus('idle');

    if (fastIntervalRef.current) clearInterval(fastIntervalRef.current);
    if (slowIntervalRef.current) clearInterval(slowIntervalRef.current);
    if (wsRef.current) wsRef.current.close();
  }, []);

  const connectWebSocket = useCallback(() => {
    try {
      const ws = new WebSocket('wss://ws-feed.exchange.coinbase.com');
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: 'subscribe',
          product_ids: pairs.map(p => p.id),
          channels: ['ticker']
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'ticker') {
            const price = parseFloat(data.price);
            const pairId = data.product_id;
            const pair = getPairById(pairId);

            if (pair) {
              setCurrentTick(prev => ({ ...prev, [pairId]: { price, time: Date.now() } }));
              setTickData(prev => ({
                ...prev,
                [pairId]: [...(prev[pairId] || []).slice(-199), { price, time: Date.now() }]
              }));

              // Update positions for this pair
              setPositions(prev => prev.map(pos => {
                if (pos.symbol === pair.symbol) {
                  const pnl = pos.side === 'LONG'
                    ? (price - pos.entryPrice) * pos.quantity
                    : (pos.entryPrice - price) * pos.quantity;
                  const pnlPercent = (pnl / (pos.entryPrice * pos.quantity)) * 100;
                  return { ...pos, currentPrice: price, pnl, pnlPercent };
                }
                return pos;
              }));

              // Update total PnL
              setPositions(prev => {
                const total = prev.reduce((sum, p) => sum + p.pnl, 0);
                setTotalPnl(total);
                return prev;
              });
            }
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setSystemStatus('error');
        setLastError('WebSocket connection error - retrying...');
        setTimeout(() => {
          if (isRunningRef.current) connectWebSocket();
        }, 5000);
      };

      ws.onclose = () => {
        if (isRunningRef.current) {
          setTimeout(() => {
            if (isRunningRef.current) connectWebSocket();
          }, 3000);
        }
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
      setSystemStatus('error');
      setLastError('Failed to connect to WebSocket');
    }
  }, [pairs, getPairById]);

  const runMLPredictions = useCallback(async (mode: TradingMode) => {
    const startTime = performance.now();

    // Run all models in parallel on their assigned pairs
    const modelPromises = models.map(async (model) => {
      try {
        const pair = getPairById(model.assignedPair);
        if (!pair) return null;

        const candles = await fetchHistoricalCandles(pair, mode === 'fast' ? '1m' : '15m', 'coinbase');
        if (candles.length === 0) return null;

        const prediction = await getLiveMLPrediction(
          pair,
          candles,
          model.type,
          mode === 'fast' ? '5m' : '1h',
          backendEngine,
          14.5
        );

        const reasoning = generateReasoning(prediction, model.name);

        // Update model state
        setModels(prev => prev.map(m =>
          m.name === model.name
            ? { ...m, lastPrediction: prediction, lastUpdateTime: new Date(), confidence: prediction.confidence, reasoning }
            : m
        ));

        // Check adaptive threshold before trading
        if (prediction.confidence >= model.learningMetrics.adaptiveThreshold) {
          if (prediction.signal.includes('BUY') || prediction.signal.includes('SELL')) {
            return { model, prediction, pair };
          }
        }
        return null;
      } catch (error) {
        console.error(`ML prediction error for ${model.name}:`, error);
        return null;
      }
    });

    const results = await Promise.allSettled(modelPromises);

    // Execute trades for successful predictions
    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        const { model, prediction, pair } = result.value;
        executeTrade(model.name, prediction, pair, mode);
      }
    });

    const endTime = performance.now();
    setExecutionSpeed(endTime - startTime);
  }, [models, getPairById, backendEngine]);

  const generateReasoning = (prediction: MLPrediction, modelName: string): string[] => {
    const reasons = [];
    reasons.push(`${modelName} analyzing ${prediction.symbol}`);
    reasons.push(`RSI: ${prediction.features.rsi.toFixed(1)} (${prediction.features.rsiStatus})`);
    reasons.push(`MACD: ${prediction.features.macdSignal}`);
    reasons.push(`Order Book Imbalance: ${prediction.features.orderBookImbalance.toFixed(1)}%`);
    reasons.push(`Confidence: ${prediction.confidence}%`);
    reasons.push(`Signal: ${prediction.signal}`);
    reasons.push(`Predicted Move: ${prediction.predictedChangePercent >= 0 ? '+' : ''}${prediction.predictedChangePercent.toFixed(2)}%`);
    return reasons;
  };

  const executeTrade = useCallback((modelName: string, prediction: MLPrediction, pair: any, mode: TradingMode) => {
    const isBuy = prediction.signal.includes('BUY');
    const positionSize = mode === 'fast' ? 0.02 : 0.05;
    const quantity = (sharedBalance * positionSize) / pair.price;

    const trade: TradeExecution = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date(),
      model: modelName,
      action: isBuy ? 'BUY' : 'SELL',
      symbol: pair.symbol,
      price: pair.price,
      quantity,
      confidence: prediction.confidence,
      signal: prediction.signal,
      mode,
      outcome: 'PENDING'
    };

    setTradeHistory(prev => [trade, ...prev].slice(0, 200));

    const tradeValue = trade.price * trade.quantity;
    setSharedBalance(prev => isBuy ? prev - tradeValue : prev + tradeValue);

    const newPosition: Position = {
      id: trade.id,
      symbol: pair.symbol,
      entryPrice: pair.price,
      currentPrice: pair.price,
      quantity,
      side: isBuy ? 'LONG' : 'SHORT',
      pnl: 0,
      pnlPercent: 0,
      openedAt: new Date(),
      model: modelName,
      mode
    };

    setPositions(prev => [...prev, newPosition]);

    if (mode === 'fast') {
      setFastTradeCount(prev => prev + 1);
    } else {
      setSlowTradeCount(prev => prev + 1);
    }

    // Update learning metrics
    setModels(prev => prev.map(m => {
      if (m.name === modelName) {
        const newMetrics = { ...m.learningMetrics };
        newMetrics.totalTrades += 1;
        return { ...m, learningMetrics: newMetrics };
      }
      return m;
    }));
  }, [sharedBalance]);

  // Adaptive learning: periodically evaluate trade outcomes and adjust thresholds
  React.useEffect(() => {
    if (!isRunning) return;

    const learningInterval = setInterval(() => {
      setModels(prev => prev.map(model => {
        const metrics = model.learningMetrics;
        if (metrics.totalTrades < 5) return model; // Need minimum trades to learn

        // Calculate win rate
        const winRate = metrics.wins / metrics.totalTrades;

        // Adaptive threshold adjustment
        let newThreshold = metrics.adaptiveThreshold;
        if (winRate > 0.6) {
          // Performing well, lower threshold to take more trades
          newThreshold = Math.max(60, metrics.adaptiveThreshold - 2);
        } else if (winRate < 0.4) {
          // Performing poorly, raise threshold to be more selective
          newThreshold = Math.min(85, metrics.adaptiveThreshold + 2);
        }

        return {
          ...model,
          learningMetrics: {
            ...metrics,
            winRate,
            adaptiveThreshold: newThreshold
          }
        };
      }));
    }, 30000); // Learn every 30 seconds

    return () => clearInterval(learningInterval);
  }, [isRunning]);

  const totalValue = sharedBalance + positions.reduce((sum, p) => sum + (p.currentPrice * p.quantity), 0);
  const totalTrades = tradeHistory.length;
  const activeModels = models.filter(m => m.lastUpdateTime && (Date.now() - m.lastUpdateTime.getTime()) < 30000).length;
  const fastPositions = positions.filter(p => p.mode === 'fast');
  const slowPositions = positions.filter(p => p.mode === 'slow');

  const renderSubTabContent = () => {
    switch (activeSubTab) {
      case 'dashboard':
        return renderDashboard();
      case 'charts':
        return renderCharts();
      case 'thinking':
        return renderThinking();
      case 'positions':
        return renderPositions();
      case 'performance':
        return renderPerformance();
      default:
        return renderDashboard();
    }
  };

  const renderDashboard = () => (
    <>
      <div className="crawlr-stats">
        <div className="stat-card main">
          <DollarSign size={24} className="text-green" />
          <div>
            <div className="stat-label">Portfolio Value</div>
            <div className="stat-value large">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <div className={`stat-change ${totalPnl >= 0 ? 'text-green' : 'text-red'}`}>
              {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)} ({((totalPnl / 100000) * 100).toFixed(2)}%)
            </div>
          </div>
        </div>
        <div className="stat-card">
          <Target size={20} className="text-green" />
          <div>
            <div className="stat-label">Total Trades</div>
            <div className="stat-value">{totalTrades}</div>
            <div className="stat-sub">Fast: {fastTradeCount} | Slow: {slowTradeCount}</div>
          </div>
        </div>
        <div className="stat-card">
          <Database size={20} className="text-green" />
          <div>
            <div className="stat-label">Open Positions</div>
            <div className="stat-value">{positions.length}</div>
            <div className="stat-sub">Fast: {fastPositions.length} | Slow: {slowPositions.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <Brain size={20} className="text-green" />
          <div>
            <div className="stat-label">Active Models</div>
            <div className="stat-value">{activeModels}/4</div>
            <div className="stat-sub">Multitasking</div>
          </div>
        </div>
      </div>

      <div className="crawlr-grid">
        <div className="crawlr-panel models-panel large">
          <div className="panel-header">
            <h3>ML Models (Multitasking)</h3>
            <Brain size={18} className="text-green" />
          </div>
          <div className="models-list">
            {models.map((model, idx) => {
              const pair = getPairById(model.assignedPair);
              return (
                <div key={idx} className="model-row expanded">
                  <div className="model-info">
                    <div className="model-name">{model.name}</div>
                    <div className="model-type">{model.type.toUpperCase()}</div>
                    <div className="model-pair">{pair?.symbol || 'N/A'}</div>
                  </div>
                  <div className="model-metrics">
                    {model.lastPrediction ? (
                      <>
                        <div className={`model-signal ${model.lastPrediction.signal.includes('BUY') ? 'buy' : 'sell'}`}>
                          {model.lastPrediction.signal}
                        </div>
                        <div className="model-confidence">{model.confidence}%</div>
                        <div className="model-threshold">
                          Threshold: {model.learningMetrics.adaptiveThreshold}%
                        </div>
                        <div className="model-change">
                          {model.lastPrediction.predictedChangePercent >= 0 ? '+' : ''}
                          {model.lastPrediction.predictedChangePercent.toFixed(2)}%
                        </div>
                      </>
                    ) : (
                      <div className="model-waiting">Analyzing...</div>
                    )}
                  </div>
                  <div className="model-status">
                    {model.lastUpdateTime && (
                      <span className="last-update">
                        {Math.floor((Date.now() - model.lastUpdateTime.getTime()) / 1000)}s ago
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="crawlr-panel positions-panel">
          <div className="panel-header">
            <h3>Positions</h3>
            <Target size={18} className="text-green" />
          </div>
          <div className="positions-list">
            {positions.map((pos) => (
              <div key={pos.id} className="position-row">
                <div className="position-info">
                  <div className="position-symbol">{pos.symbol}</div>
                  <div className="position-side">{pos.side}</div>
                  <div className="position-model">{pos.model}</div>
                  <div className={`position-mode ${pos.mode === 'fast' ? 'fast' : 'slow'}`}>
                    {pos.mode.toUpperCase()}
                  </div>
                </div>
                <div className="position-metrics">
                  <div className="position-price">${pos.currentPrice.toFixed(2)}</div>
                  <div className={`position-pnl ${pos.pnl >= 0 ? 'text-green' : 'text-red'}`}>
                    {pos.pnl >= 0 ? '+' : ''}${pos.pnl.toFixed(2)}
                  </div>
                  <div className={`position-pnl-percent ${pos.pnlPercent >= 0 ? 'text-green' : 'text-red'}`}>
                    {pos.pnlPercent >= 0 ? '+' : ''}{pos.pnlPercent.toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
            {positions.length === 0 && (
              <div className="empty-positions">No open positions</div>
            )}
          </div>
        </div>
      </div>

      <div className="crawlr-panel logs-panel">
        <div className="panel-header">
          <h3>Execution Log</h3>
          <Activity size={18} className="text-green" />
        </div>
        <div className="logs-list">
          {tradeHistory.slice(0, 50).map((trade) => (
            <div key={trade.id} className="log-row">
              <div className={`log-action ${trade.action === 'BUY' ? 'buy' : 'sell'}`}>
                {trade.action === 'BUY' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {trade.action}
              </div>
              <div className="log-symbol">{trade.symbol}</div>
              <div className="log-model">{trade.model}</div>
              <div className="log-price">${trade.price.toFixed(2)}</div>
              <div className="log-qty">{trade.quantity.toFixed(4)}</div>
              <div className="log-signal">{trade.signal}</div>
              <div className="log-confidence">{trade.confidence}%</div>
              <div className={`log-mode ${trade.mode === 'fast' ? 'fast' : 'slow'}`}>
                {trade.mode.toUpperCase()}
              </div>
              <div className="log-time">{trade.timestamp.toLocaleTimeString()}</div>
            </div>
          ))}
          {tradeHistory.length === 0 && (
            <div className="empty-logs">No executions yet. Start Crawlr to begin.</div>
          )}
        </div>
      </div>
    </>
  );

  const renderCharts = () => (
    <div className="charts-content">
      <div className="charts-header">
        <h3>Advanced Visualizations</h3>
        <p>Real-time market data and ML prediction charts</p>
      </div>
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-title">Price Action</div>
          <div className="chart-placeholder">
            <LineChart size={48} className="text-green" style={{ opacity: 0.3 }} />
            <p>Price chart visualization</p>
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-title">Volume Profile</div>
          <div className="chart-placeholder">
            <Activity size={48} className="text-green" style={{ opacity: 0.3 }} />
            <p>Volume analysis</p>
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-title">Prediction Accuracy</div>
          <div className="chart-placeholder">
            <TrendingUp size={48} className="text-green" style={{ opacity: 0.3 }} />
            <p>Model performance metrics</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderThinking = () => (
    <div className="thinking-content">
      <div className="thinking-header">
        <h3>ML Model Reasoning</h3>
        <p>Real-time decision-making process</p>
      </div>
      <div className="thinking-grid">
        {models.map((model, idx) => {
          const pair = getPairById(model.assignedPair);
          return (
            <div key={idx} className="thinking-card">
              <div className="thinking-card-header">
                <div className="thinking-model-name">{model.name}</div>
                <div className="thinking-model-type">{model.type.toUpperCase()}</div>
                <div className="thinking-pair">{pair?.symbol || 'N/A'}</div>
              </div>
              <div className="thinking-reasoning">
                {model.reasoning.length > 0 ? (
                  model.reasoning.map((reason, i) => (
                    <div key={i} className="reason-item">
                      <Brain size={12} className="text-green" />
                      <span>{reason}</span>
                    </div>
                  ))
                ) : (
                  <div className="thinking-waiting">
                    <Lightbulb size={32} className="text-green" style={{ opacity: 0.3 }} />
                    <p>Awaiting analysis...</p>
                  </div>
                )}
              </div>
              {model.lastPrediction && (
                <div className="thinking-footer">
                  <div className="thinking-signal">{model.lastPrediction.signal}</div>
                  <div className="thinking-confidence">{model.confidence}% confidence</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderPositions = () => (
    <div className="positions-content">
      <div className="positions-header">
        <h3>All Positions</h3>
        <p>Fast and slow mode positions across all models</p>
      </div>
      <div className="positions-grid-full">
        {positions.map((pos) => (
          <div key={pos.id} className="position-card-full">
            <div className="pos-card-header">
              <div className="pos-symbol-large">{pos.symbol}</div>
              <div className={`pos-side-badge ${pos.side === 'LONG' ? 'long' : 'short'}`}>
                {pos.side}
              </div>
              <div className={`pos-mode-badge ${pos.mode === 'fast' ? 'fast' : 'slow'}`}>
                {pos.mode.toUpperCase()}
              </div>
            </div>
            <div className="pos-card-body">
              <div className="pos-model">{pos.model}</div>
              <div className="pos-entry">Entry: ${pos.entryPrice.toFixed(2)}</div>
              <div className="pos-current">Current: ${pos.currentPrice.toFixed(2)}</div>
              <div className={`pos-pnl ${pos.pnl >= 0 ? 'text-green' : 'text-red'}`}>
                {pos.pnl >= 0 ? '+' : ''}${pos.pnl.toFixed(2)} ({pos.pnlPercent >= 0 ? '+' : ''}{pos.pnlPercent.toFixed(2)}%)
              </div>
            </div>
          </div>
        ))}
        {positions.length === 0 && (
          <div className="empty-positions-full">No open positions</div>
        )}
      </div>
    </div>
  );

  const renderPerformance = () => (
    <div className="performance-content">
      <div className="performance-header">
        <h3>Model Performance & Learning</h3>
        <p>Adaptive learning metrics and trade statistics</p>
      </div>
      <div className="performance-grid">
        {models.map((model, idx) => {
          const pair = getPairById(model.assignedPair);
          const metrics = model.learningMetrics;
          return (
            <div key={idx} className="performance-card">
              <div className="perf-card-header">
                <div className="perf-model-name">{model.name}</div>
                <div className="perf-pair">{pair?.symbol || 'N/A'}</div>
              </div>
              <div className="perf-metrics">
                <div className="perf-metric">
                  <span className="perf-label">Total Trades</span>
                  <span className="perf-value">{metrics.totalTrades}</span>
                </div>
                <div className="perf-metric">
                  <span className="perf-label">Win Rate</span>
                  <span className={`perf-value ${metrics.winRate >= 50 ? 'text-green' : 'text-red'}`}>
                    {metrics.winRate.toFixed(1)}%
                  </span>
                </div>
                <div className="perf-metric">
                  <span className="perf-label">Wins / Losses</span>
                  <span className="perf-value">
                    <span className="text-green">{metrics.wins}</span> / <span className="text-red">{metrics.losses}</span>
                  </span>
                </div>
                <div className="perf-metric">
                  <span className="perf-label">Adaptive Threshold</span>
                  <span className="perf-value">{metrics.adaptiveThreshold}%</span>
                </div>
                <div className="perf-metric">
                  <span className="perf-label">Avg Confidence (Win)</span>
                  <span className="perf-value">{metrics.avgConfidenceWhenWin.toFixed(1)}%</span>
                </div>
                <div className="perf-metric">
                  <span className="perf-label">Avg Confidence (Loss)</span>
                  <span className="perf-value">{metrics.avgConfidenceWhenLoss.toFixed(1)}%</span>
                </div>
              </div>
              <div className="perf-learning-indicator">
                <RefreshCw size={16} className={isRunning ? 'spin' : ''} />
                <span>{isRunning ? 'Learning...' : 'Idle'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="page-content crawlr-page">
      <div className="crawlr-container">
        <div className="crawlr-header">
          <div className="crawlr-title">
            <Zap size={28} className="text-green pulse" />
            <div>
              <h2>CRAWLR</h2>
              <p>Real-time ML Collaborative Trading Engine (Multitasking)</p>
            </div>
          </div>
          <div className="crawlr-controls">
            <div className="status-indicators">
              <div className="status-item">
                <Activity size={16} className="text-green" />
                <span>{activeModels}/4 Models Active</span>
              </div>
              <div className="status-item">
                <Cpu size={16} className="text-green" />
                <span>{executionSpeed.toFixed(0)}ms Exec</span>
              </div>
              {systemStatus === 'error' && (
                <div className="status-item error">
                  <AlertCircle size={16} className="text-red" />
                  <span>{lastError}</span>
                </div>
              )}
            </div>
            <button
              className={`control-btn ${isRunning ? 'stop' : 'start'}`}
              onClick={isRunning ? stopCrawlr : startCrawlr}
            >
              {isRunning ? <Pause size={16} /> : <Play size={16} />}
              {isRunning ? 'Stop' : 'Start'}
            </button>
          </div>
        </div>

        <div className="crawlr-subtabs">
          <button
            className={`subtab-btn ${activeSubTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('dashboard')}
          >
            <Activity size={14} />
            Dashboard
          </button>
          <button
            className={`subtab-btn ${activeSubTab === 'charts' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('charts')}
          >
            <LineChart size={14} />
            Charts
          </button>
          <button
            className={`subtab-btn ${activeSubTab === 'thinking' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('thinking')}
          >
            <Lightbulb size={14} />
            Thinking
          </button>
          <button
            className={`subtab-btn ${activeSubTab === 'positions' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('positions')}
          >
            <Target size={14} />
            Positions
          </button>
          <button
            className={`subtab-btn ${activeSubTab === 'performance' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('performance')}
          >
            <TrendingUp size={14} />
            Performance
          </button>
        </div>

        <div className="crawlr-content">
          {renderSubTabContent()}
        </div>
      </div>
    </div>
  );
};
