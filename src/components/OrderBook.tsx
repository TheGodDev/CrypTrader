import React, { useState } from 'react';
import { BookOpen, Radio, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useTrading } from '../context/TradingContext';

export const OrderBook: React.FC = () => {
  const { orderBook, recentTrades, activePair } = useTrading();
  const [activeTab, setActiveTab] = useState<'book' | 'trades'>('book');

  const { bids, asks, spread, spreadPercent } = orderBook;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Tab Switcher */}
      <div className="right-tabs-header">
        <button
          className={`right-tab-btn ${activeTab === 'book' ? 'active' : ''}`}
          onClick={() => setActiveTab('book')}
        >
          <BookOpen size={12} style={{ display: 'inline', marginRight: 4 }} />
          Order Book
        </button>
        <button
          className={`right-tab-btn ${activeTab === 'trades' ? 'active' : ''}`}
          onClick={() => setActiveTab('trades')}
        >
          <Radio size={12} style={{ display: 'inline', marginRight: 4 }} />
          Live Trades
        </button>
      </div>

      {activeTab === 'book' ? (
        <div className="orderbook-view">
          <div className="ob-table-header">
            <span>Price (USD)</span>
            <span>Size ({activePair.symbol})</span>
            <span>Total</span>
          </div>

          {/* Asks (Sells) Ladder - Reverse to show highest ask at top down to lowest ask at bottom */}
          <div className="ob-ladder-section" style={{ height: '44%' }}>
            {asks.slice(0, 9).reverse().map((ask, idx) => (
              <div key={`ask-${idx}`} className="ob-row">
                <div
                  className="ob-depth-bar ask"
                  style={{ width: `${ask.depthPercent}%` }}
                />
                <span className="text-red">
                  ${ask.price.toLocaleString(undefined, {
                    minimumFractionDigits: activePair.price < 1 ? 4 : 2
                  })}
                </span>
                <span style={{ color: 'var(--color-text-main)' }}>{ask.size}</span>
                <span style={{ color: 'var(--color-text-dim)' }}>{ask.total}</span>
              </div>
            ))}
          </div>

          {/* Mid Market Spread Bar */}
          <div className="ob-spread-bar">
            <span style={{ color: 'var(--color-text-dim)', fontSize: 10 }}>
              Spread: <strong style={{ color: '#fff' }}>${spread}</strong> ({spreadPercent}%)
            </span>
            <span
              className={`font-mono ${activePair.change24h >= 0 ? 'text-green' : 'text-red'}`}
              style={{ fontWeight: 700, fontSize: 12 }}
            >
              ${activePair.price.toLocaleString(undefined, {
                minimumFractionDigits: activePair.price < 1 ? 4 : 2
              })}
            </span>
          </div>

          {/* Bids (Buys) Ladder */}
          <div className="ob-ladder-section" style={{ height: '44%', justifyContent: 'flex-start' }}>
            {bids.slice(0, 9).map((bid, idx) => (
              <div key={`bid-${idx}`} className="ob-row">
                <div
                  className="ob-depth-bar bid"
                  style={{ width: `${bid.depthPercent}%` }}
                />
                <span className="text-green">
                  ${bid.price.toLocaleString(undefined, {
                    minimumFractionDigits: activePair.price < 1 ? 4 : 2
                  })}
                </span>
                <span style={{ color: 'var(--color-text-main)' }}>{bid.size}</span>
                <span style={{ color: 'var(--color-text-dim)' }}>{bid.total}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Real-Time Market Trades Tape */
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
          <div className="ob-table-header" style={{ marginBottom: 6 }}>
            <span>Price (USD)</span>
            <span>Size ({activePair.symbol})</span>
            <span>Time</span>
          </div>

          {recentTrades.map((trade) => {
            const isBuy = trade.side === 'buy';
            return (
              <div
                key={trade.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '3px 0',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.02)'
                }}
              >
                <span className={isBuy ? 'text-green' : 'text-red'} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {isBuy ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                  ${trade.price.toLocaleString(undefined, {
                    minimumFractionDigits: activePair.price < 1 ? 4 : 2
                  })}
                </span>
                <span style={{ color: '#fff' }}>{trade.size}</span>
                <span style={{ color: 'var(--color-text-dim)', fontSize: 10 }}>{trade.time}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
