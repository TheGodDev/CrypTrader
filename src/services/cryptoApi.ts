import type { CryptoPair, CandleData, OrderBookData, Timeframe, FeedSource } from '../types/crypto';

export const SUPPORTED_PAIRS: CryptoPair[] = [
  {
    id: 'BTC-USD',
    symbol: 'BTC',
    name: 'Bitcoin',
    quote: 'USD',
    price: 83300,
    change24h: 2.45,
    high24h: 84200,
    low24h: 82100,
    volume24h: 2845012300,
    category: 'Top',
    binanceSymbol: 'BTCUSDT'
  },
  {
    id: 'ETH-USD',
    symbol: 'ETH',
    name: 'Ethereum',
    quote: 'USD',
    price: 3250.80,
    change24h: 3.12,
    high24h: 3310.00,
    low24h: 3140.50,
    volume24h: 1420550000,
    category: 'Top',
    binanceSymbol: 'ETHUSDT'
  },
  {
    id: 'SOL-USD',
    symbol: 'SOL',
    name: 'Solana',
    quote: 'USD',
    price: 178.45,
    change24h: 6.84,
    high24h: 182.20,
    low24h: 166.10,
    volume24h: 980120000,
    category: 'L1',
    binanceSymbol: 'SOLUSDT'
  },
  {
    id: 'XRP-USD',
    symbol: 'XRP',
    name: 'Ripple',
    quote: 'USD',
    price: 1.48,
    change24h: -1.25,
    high24h: 1.55,
    low24h: 1.42,
    volume24h: 620400000,
    category: 'Top',
    binanceSymbol: 'XRPUSDT'
  },
  {
    id: 'DOGE-USD',
    symbol: 'DOGE',
    name: 'Dogecoin',
    quote: 'USD',
    price: 0.185,
    change24h: 8.75,
    high24h: 0.198,
    low24h: 0.169,
    volume24h: 530200000,
    category: 'Meme',
    binanceSymbol: 'DOGEUSDT'
  },
  {
    id: 'AVAX-USD',
    symbol: 'AVAX',
    name: 'Avalanche',
    quote: 'USD',
    price: 31.90,
    change24h: 4.20,
    high24h: 32.85,
    low24h: 30.10,
    volume24h: 210400000,
    category: 'L1',
    binanceSymbol: 'AVAXUSDT'
  },
  {
    id: 'ADA-USD',
    symbol: 'ADA',
    name: 'Cardano',
    quote: 'USD',
    price: 0.725,
    change24h: 1.80,
    high24h: 0.752,
    low24h: 0.701,
    volume24h: 195800000,
    category: 'L1',
    binanceSymbol: 'ADAUSDT'
  },
  {
    id: 'LINK-USD',
    symbol: 'LINK',
    name: 'Chainlink',
    quote: 'USD',
    price: 18.25,
    change24h: 5.40,
    high24h: 18.90,
    low24h: 17.15,
    volume24h: 165000000,
    category: 'DeFi',
    binanceSymbol: 'LINKUSDT'
  },
  {
    id: 'SUI-USD',
    symbol: 'SUI',
    name: 'Sui Network',
    quote: 'USD',
    price: 2.85,
    change24h: 9.60,
    high24h: 3.02,
    low24h: 2.58,
    volume24h: 340900000,
    category: 'L1',
    binanceSymbol: 'SUIUSDT'
  },
  {
    id: 'NEAR-USD',
    symbol: 'NEAR',
    name: 'NEAR Protocol',
    quote: 'USD',
    price: 5.42,
    change24h: 4.88,
    high24h: 5.65,
    low24h: 5.12,
    volume24h: 180200000,
    category: 'AI',
    binanceSymbol: 'NEARUSDT'
  },
  {
    id: 'DOT-USD',
    symbol: 'DOT',
    name: 'Polkadot',
    quote: 'USD',
    price: 7.65,
    change24h: -0.85,
    high24h: 7.92,
    low24h: 7.48,
    volume24h: 110400000,
    category: 'L1',
    binanceSymbol: 'DOTUSDT'
  },
  {
    id: 'SHIB-USD',
    symbol: 'SHIB',
    name: 'Shiba Inu',
    quote: 'USD',
    price: 0.0000214,
    change24h: 6.15,
    high24h: 0.0000228,
    low24h: 0.0000198,
    volume24h: 280000000,
    category: 'Meme',
    binanceSymbol: 'SHIBUSDT'
  }
];

export const TIMEFRAME_SECONDS: Record<Timeframe, number> = {
  '1m': 60,
  '5m': 300,
  '15m': 900,
  '1h': 3600,
  '4h': 14400,
  '1d': 86400
};

export const BINANCE_INTERVALS: Record<Timeframe, string> = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '1h': '1h',
  '4h': '4h',
  '1d': '1d'
};

export function generateMockCandles(basePrice: number, count: number = 100, intervalSec: number = 60): CandleData[] {
  const candles: CandleData[] = [];
  const now = Math.floor(Date.now() / 1000);
  let currentPrice = basePrice * 0.96;
  const startTime = now - count * intervalSec;

  for (let i = 0; i < count; i++) {
    const time = startTime + i * intervalSec;
    const volatility = currentPrice * 0.0035;
    const change = (Math.random() - 0.485) * volatility;
    const open = currentPrice;
    const close = Math.max(open * 0.7, open + change);
    const high = Math.max(open, close) + Math.random() * volatility * 0.7;
    const low = Math.min(open, close) - Math.random() * volatility * 0.7;
    const volume = Math.floor((Math.random() * 50 + 10) * (currentPrice > 1000 ? 1 : 100));

    candles.push({
      time,
      open: Number(open.toFixed(basePrice < 1 ? 6 : 2)),
      high: Number(high.toFixed(basePrice < 1 ? 6 : 2)),
      low: Number(low.toFixed(basePrice < 1 ? 6 : 2)),
      close: Number(close.toFixed(basePrice < 1 ? 6 : 2)),
      volume
    });

    currentPrice = close;
  }

  return candles;
}

export async function fetchHistoricalCandles(
  pair: CryptoPair,
  timeframe: Timeframe,
  source: FeedSource = 'coinbase'
): Promise<CandleData[]> {
  const granularity = TIMEFRAME_SECONDS[timeframe];

  if (source === 'coinbase') {
    try {
      // Coinbase API returns up to 300 candles by default
      const url = `https://api.exchange.coinbase.com/products/${pair.id}/candles?granularity=${granularity}`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'CrypTrader/1.0' }
      });

      if (res.ok) {
        const data: [number, number, number, number, number, number][] = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const candles: CandleData[] = data
            .map(([time, low, high, open, close, volume]) => ({
              time,
              open,
              high,
              low,
              close,
              volume
            }))
            .sort((a, b) => a.time - b.time);

          const deduped: CandleData[] = [];
          for (const c of candles) {
            if (!deduped.length || deduped[deduped.length - 1].time !== c.time) {
              deduped.push(c);
            }
          }
          if (deduped.length > 0) return deduped;
        }
      }
    } catch {
      // Fallback
    }
  }

  try {
    const binanceInterval = BINANCE_INTERVALS[timeframe];
    const url = `https://api.binance.us/api/v3/klines?symbol=${pair.binanceSymbol}&interval=${binanceInterval}&limit=1000`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const candles: CandleData[] = data.map((item: any) => ({
          time: Math.floor(item[0] / 1000),
          open: parseFloat(item[1]),
          high: parseFloat(item[2]),
          low: parseFloat(item[3]),
          close: parseFloat(item[4]),
          volume: parseFloat(item[5])
        }));
        return candles;
      }
    }
  } catch {
    // Fallback
  }

  return generateMockCandles(pair.price, 500, granularity);
}

export async function fetchAllTickers(pairs: CryptoPair[]): Promise<Partial<Record<string, { price: number; change24h: number; high24h: number; low24h: number; volume24h: number }>>> {
  const result: Record<string, any> = {};

  try {
    const res = await fetch('https://api.binance.us/api/v3/ticker/24hr');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        const map = new Map(data.map((d: any) => [d.symbol, d]));
        for (const p of pairs) {
          const item: any = map.get(p.binanceSymbol);
          if (item) {
            result[p.id] = {
              price: parseFloat(item.lastPrice),
              change24h: parseFloat(item.priceChangePercent),
              high24h: parseFloat(item.highPrice),
              low24h: parseFloat(item.lowPrice),
              volume24h: parseFloat(item.quoteVolume)
            };
          }
        }
        if (Object.keys(result).length > 0) return result;
      }
    }
  } catch {
    // Fallback
  }

  const promises = pairs.slice(0, 5).map(async (p) => {
    try {
      const res = await fetch(`https://api.exchange.coinbase.com/products/${p.id}/ticker`, {
        headers: { 'User-Agent': 'CrypTrader/1.0' }
      });
      if (res.ok) {
        const d = await res.json();
        const price = parseFloat(d.price);
        result[p.id] = {
          price,
          change24h: p.change24h,
          high24h: parseFloat(d.high_24h || `${price * 1.02}`),
          low24h: parseFloat(d.low_24h || `${price * 0.98}`),
          volume24h: parseFloat(d.volume_24h || '1000') * price
        };
      }
    } catch {
      // Ignored
    }
  });

  await Promise.allSettled(promises);
  return result;
}

export function generateOrderBook(midPrice: number, spreadFactor: number = 0.0003): OrderBookData {
  const bids: OrderBookData['bids'] = [];
  const asks: OrderBookData['asks'] = [];
  const step = midPrice * spreadFactor;
  let cumBidTotal = 0;
  let cumAskTotal = 0;

  for (let i = 1; i <= 12; i++) {
    const price = midPrice + step * i;
    const baseSize = midPrice > 1000 ? (Math.random() * 1.5 + 0.1) : (Math.random() * 250 + 20);
    const size = Number((baseSize * (1 + i * 0.15)).toFixed(midPrice < 1 ? 2 : 4));
    cumAskTotal += size;
    asks.push({
      price: Number(price.toFixed(midPrice < 1 ? 6 : 2)),
      size,
      total: Number(cumAskTotal.toFixed(4)),
      depthPercent: 0
    });
  }

  for (let i = 1; i <= 12; i++) {
    const price = midPrice - step * i;
    const baseSize = midPrice > 1000 ? (Math.random() * 1.5 + 0.1) : (Math.random() * 250 + 20);
    const size = Number((baseSize * (1 + i * 0.15)).toFixed(midPrice < 1 ? 2 : 4));
    cumBidTotal += size;
    bids.push({
      price: Number(price.toFixed(midPrice < 1 ? 6 : 2)),
      size,
      total: Number(cumBidTotal.toFixed(4)),
      depthPercent: 0
    });
  }

  const maxTotal = Math.max(cumBidTotal, cumAskTotal);
  asks.forEach(a => a.depthPercent = Math.min(100, Math.round((a.total / maxTotal) * 100)));
  bids.forEach(b => b.depthPercent = Math.min(100, Math.round((b.total / maxTotal) * 100)));

  const bestAsk = asks[0]?.price || midPrice * 1.0001;
  const bestBid = bids[0]?.price || midPrice * 0.9999;
  const spread = Number((bestAsk - bestBid).toFixed(midPrice < 1 ? 6 : 2));
  const spreadPercent = Number(((spread / midPrice) * 100).toFixed(4));

  return { bids, asks, spread, spreadPercent };
}
