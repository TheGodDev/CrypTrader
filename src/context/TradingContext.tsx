import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type {
  CryptoPair,
  CandleData,
  OrderBookData,
  TradeItem,
  Timeframe,
  FeedSource,
  ModelType,
  HorizonType,
  BackendEngine,
  MLPrediction,
  NotificationToast
} from '../types/crypto';
import {
  SUPPORTED_PAIRS,
  fetchHistoricalCandles,
  fetchAllTickers,
  generateOrderBook
} from '../services/cryptoApi';
import { getLiveMLPrediction } from '../services/mlPredictor';

interface TradingContextType {
  pairs: CryptoPair[];
  activePair: CryptoPair;
  timeframe: Timeframe;
  feedSource: FeedSource;
  modelType: ModelType;
  horizon: HorizonType;
  backendEngine: BackendEngine;
  candles: CandleData[];
  orderBook: OrderBookData;
  recentTrades: TradeItem[];
  mlPrediction: MLPrediction | null;
  isInferring: boolean;
  fastapiConnected: boolean;
  indicators: {
    volume: boolean;
    sma20: boolean;
    ema50: boolean;
    mlForecast: boolean;
  };
  wsConnected: boolean;
  pingMs: number;
  activeBottomTab: 'forecast' | 'features' | 'models' | 'api-bridge' | 'sentiment';
  toasts: NotificationToast[];
  setActivePair: (pairId: string) => void;
  setTimeframe: (tf: Timeframe) => void;
  setFeedSource: (src: FeedSource) => void;
  setModelType: (m: ModelType) => void;
  setHorizon: (h: HorizonType) => void;
  setBackendEngine: (b: BackendEngine) => void;
  toggleIndicator: (key: 'volume' | 'sma20' | 'ema50' | 'mlForecast') => void;
  setActiveBottomTab: (tab: 'forecast' | 'features' | 'models' | 'api-bridge' | 'sentiment') => void;
  triggerManualInference: () => Promise<void>;
  addToast: (type: NotificationToast['type'], title: string, message: string) => void;
  removeToast: (id: string) => void;
}

const TradingContext = createContext<TradingContextType | undefined>(undefined);

export const TradingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pairs, setPairs] = useState<CryptoPair[]>(SUPPORTED_PAIRS);
  const [activePairId, setActivePairId] = useState<string>('BTC-USD');
  const [timeframe, setTimeframe] = useState<Timeframe>('1m');
  const [feedSource, setFeedSource] = useState<FeedSource>('coinbase');
  const [modelType, setModelType] = useState<ModelType>('ensemble');
  const [horizon, setHorizon] = useState<HorizonType>('15m');
  const [backendEngine, setBackendEngine] = useState<BackendEngine>('fastapi');
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [orderBook, setOrderBook] = useState<OrderBookData>(generateOrderBook(83300));
  const [recentTrades, setRecentTrades] = useState<TradeItem[]>([]);
  const [mlPrediction, setMlPrediction] = useState<MLPrediction | null>(null);
  const [isInferring, setIsInferring] = useState<boolean>(false);
  const [fastapiConnected, setFastapiConnected] = useState<boolean>(false);
  const [indicators, setIndicators] = useState({
    volume: true,
    sma20: true,
    ema50: true,
    mlForecast: true
  });
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [pingMs, setPingMs] = useState<number>(34);
  const [activeBottomTab, setActiveBottomTab] = useState<'forecast' | 'features' | 'models' | 'api-bridge' | 'sentiment'>('forecast');
  const [toasts, setToasts] = useState<NotificationToast[]>([]);

  const activePair = pairs.find((p) => p.id === activePairId) || pairs[0];

  const wsRef = useRef<WebSocket | null>(null);

  const addToast = (type: NotificationToast['type'], title: string, message: string) => {
    const toast: NotificationToast = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      title,
      message,
      timestamp: Date.now()
    };
    setToasts((prev) => [toast, ...prev].slice(0, 5));
    setTimeout(() => {
      removeToast(toast.id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Check FastAPI server health
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/health');
        if (res.ok) {
          setFastapiConnected(true);
        } else {
          setFastapiConnected(false);
        }
      } catch {
        setFastapiConnected(false);
      }
    };
    checkBackend();
    const interval = setInterval(checkBackend, 10000);
    return () => clearInterval(interval);
  }, []);

  // Load historical candles when pair or timeframe changes
  useEffect(() => {
    let isMounted = true;
    const loadCandles = async () => {
      const data = await fetchHistoricalCandles(activePair, timeframe, feedSource);
      if (isMounted && data.length > 0) {
        setCandles(data);
        setOrderBook(generateOrderBook(data[data.length - 1].close));
      }
    };
    loadCandles();
    return () => {
      isMounted = false;
    };
  }, [activePairId, timeframe, feedSource]);

  // Periodic batch price update for all watchlist pairs
  useEffect(() => {
    const updateTickers = async () => {
      const data = await fetchAllTickers(pairs);
      if (data && Object.keys(data).length > 0) {
        setPairs((prev) =>
          prev.map((p) => {
            const upd = data[p.id];
            if (!upd) return p;
            return {
              ...p,
              price: upd.price ?? p.price,
              change24h: upd.change24h ?? p.change24h,
              high24h: upd.high24h ?? p.high24h,
              low24h: upd.low24h ?? p.low24h,
              volume24h: upd.volume24h ?? p.volume24h
            };
          })
        );
      }
    };

    updateTickers();
    const interval = setInterval(updateTickers, 8000);
    return () => clearInterval(interval);
  }, []);

  // Real-time WebSocket streaming for active pair
  useEffect(() => {
    let ws: WebSocket | null = null;
    let fallbackInterval: any = null;

    const connectCoinbase = () => {
      try {
        ws = new WebSocket('wss://ws-feed.exchange.coinbase.com');
        wsRef.current = ws;

        ws.onopen = () => {
          setWsConnected(true);
          setPingMs(Math.floor(20 + Math.random() * 15));
          ws?.send(
            JSON.stringify({
              type: 'subscribe',
              product_ids: [activePair.id],
              channels: ['ticker', 'matches']
            })
          );
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'ticker' && data.product_id === activePair.id) {
              const newPrice = parseFloat(data.price);
              if (!isNaN(newPrice)) {
                setPairs((prev) =>
                  prev.map((p) =>
                    p.id === activePair.id
                      ? {
                          ...p,
                          price: newPrice,
                          high24h: data.high_24h ? parseFloat(data.high_24h) : p.high24h,
                          low24h: data.low_24h ? parseFloat(data.low_24h) : p.low24h
                        }
                      : p
                  )
                );

                setCandles((prev) => {
                  if (prev.length === 0) return prev;
                  const last = prev[prev.length - 1];
                  const updatedLast: CandleData = {
                    ...last,
                    close: newPrice,
                    high: Math.max(last.high, newPrice),
                    low: Math.min(last.low, newPrice),
                    volume: last.volume + (data.last_size ? parseFloat(data.last_size) : 0.05)
                  };
                  return [...prev.slice(0, -1), updatedLast];
                });

                setOrderBook(generateOrderBook(newPrice));
              }
            } else if (data.type === 'match' && data.product_id === activePair.id) {
              const trade: TradeItem = {
                id: data.trade_id?.toString() || Math.random().toString(36).substring(2, 7),
                price: parseFloat(data.price),
                size: parseFloat(data.size),
                side: data.side === 'buy' ? 'buy' : 'sell',
                time: new Date(data.time).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                timestamp: Date.now()
              };
              setRecentTrades((prev) => [trade, ...prev].slice(0, 30));
            }
          } catch {
            // Ignore parse errors
          }
        };

        ws.onerror = () => {
          setWsConnected(false);
          startFallback();
        };

        ws.onclose = () => {
          setWsConnected(false);
        };
      } catch {
        startFallback();
      }
    };

    const startFallback = () => {
      if (fallbackInterval) return;
      fallbackInterval = setInterval(() => {
        setPingMs(Math.floor(35 + Math.random() * 20));
        setPairs((prev) =>
          prev.map((p) => {
            if (p.id !== activePair.id) return p;
            const delta = (Math.random() - 0.49) * (p.price * 0.0008);
            const newPrice = Number((p.price + delta).toFixed(p.price < 1 ? 6 : 2));
            return {
              ...p,
              price: newPrice,
              high24h: Math.max(p.high24h, newPrice),
              low24h: Math.min(p.low24h, newPrice)
            };
          })
        );

        const side: 'buy' | 'sell' = Math.random() > 0.48 ? 'buy' : 'sell';
        const simulatedTrade: TradeItem = {
          id: Math.random().toString(36).substring(2, 8),
          price: activePair.price,
          size: Number((activePair.price > 1000 ? Math.random() * 0.4 + 0.01 : Math.random() * 50 + 2).toFixed(4)),
          side,
          time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          timestamp: Date.now()
        };
        setRecentTrades((prev) => [simulatedTrade, ...prev].slice(0, 30));
      }, 1500);
    };

    connectCoinbase();

    return () => {
      if (ws) ws.close();
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, [activePair.id]);

  // Run ML model inference on changes
  useEffect(() => {
    let isMounted = true;
    const runInference = async () => {
      setIsInferring(true);
      const pred = await getLiveMLPrediction(
        activePair,
        candles,
        modelType,
        horizon,
        backendEngine,
        14.5
      );
      if (isMounted) {
        setMlPrediction(pred);
        setIsInferring(false);
      }
    };

    runInference();
    return () => {
      isMounted = false;
    };
  }, [activePair.id, modelType, horizon, backendEngine, candles.length]);

  const triggerManualInference = async () => {
    setIsInferring(true);
    const pred = await getLiveMLPrediction(
      activePair,
      candles,
      modelType,
      horizon,
      backendEngine,
      14.5
    );
    setMlPrediction(pred);
    setIsInferring(false);
    addToast(
      'info',
      'Model Inference Complete',
      `${pred.modelUsed}: ${pred.signal} forecast for ${activePair.symbol} (${pred.predictedChangePercent >= 0 ? '+' : ''}${pred.predictedChangePercent}%) in ${pred.inferenceLatencyMs}ms.`
    );
  };

  const toggleIndicator = (key: 'volume' | 'sma20' | 'ema50' | 'mlForecast') => {
    setIndicators((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <TradingContext.Provider
      value={{
        pairs,
        activePair,
        timeframe,
        feedSource,
        modelType,
        horizon,
        backendEngine,
        candles,
        orderBook,
        recentTrades,
        mlPrediction,
        isInferring,
        fastapiConnected,
        indicators,
        wsConnected,
        pingMs,
        activeBottomTab,
        toasts,
        setActivePair: setActivePairId,
        setTimeframe,
        setFeedSource,
        setModelType,
        setHorizon,
        setBackendEngine,
        toggleIndicator,
        setActiveBottomTab,
        triggerManualInference,
        addToast,
        removeToast
      }}
    >
      {children}
    </TradingContext.Provider>
  );
};

export const useTrading = () => {
  const context = useContext(TradingContext);
  if (!context) {
    throw new Error('useTrading must be used within a TradingProvider');
  }
  return context;
};
