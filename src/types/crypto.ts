export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
export type FeedSource = 'coinbase' | 'binance';
export type ModelType = 'ensemble' | 'lstm' | 'transformer' | 'xgboost';
export type HorizonType = '5m' | '15m' | '1h' | '4h' | '24h';
export type BackendEngine = 'fastapi' | 'onnx';

export interface CryptoPair {
  id: string; // e.g. 'BTC-USD'
  symbol: string; // e.g. 'BTC'
  name: string; // e.g. 'Bitcoin'
  quote: string; // 'USD'
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  category: 'L1' | 'DeFi' | 'Meme' | 'AI' | 'Top';
  icon?: string;
  binanceSymbol: string;
}

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OrderBookEntry {
  price: number;
  size: number;
  total: number;
  depthPercent: number;
}

export interface OrderBookData {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  spread: number;
  spreadPercent: number;
}

export interface TradeItem {
  id: string;
  price: number;
  size: number;
  side: 'buy' | 'sell';
  time: string;
  timestamp: number;
}

export interface MLPrediction {
  pairId: string;
  symbol: string;
  signal: 'STRONG BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG SELL';
  sentimentScore: number;
  confidence: number;
  currentPrice: number;
  predictedTargetPrice: number;
  predictedChangePercent: number;
  timeframeHorizon: string;
  summary: string;
  modelUsed: string;
  inferenceLatencyMs: number;
  backendRuntime: string;
  features: {
    rsi: number;
    rsiStatus: 'Oversold' | 'Neutral' | 'Overbought';
    macdSignal: string;
    movingAverageCross: string;
    orderBookImbalance: number;
    volatilityATR: number;
    supportLevel: number;
    resistanceLevel: number;
    featureImportances: Record<string, number>;
  };
  projectedCandles: CandleData[];
  modelMetrics: {
    backtestAccuracy: number;
    sharpeRatio: number;
    modelType: string;
  };
}

export interface NotificationToast {
  id: string;
  type: 'success' | 'danger' | 'info' | 'warning';
  title: string;
  message: string;
  timestamp: number;
}
