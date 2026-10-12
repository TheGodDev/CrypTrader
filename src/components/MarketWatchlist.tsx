import React, { useState } from 'react';
import { Search, Flame, Star, TrendingUp, TrendingDown } from 'lucide-react';
import { useTrading } from '../context/TradingContext';

export const MarketWatchlist: React.FC = () => {
  const { pairs, activePair, setActivePair } = useTrading();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [favorites, setFavorites] = useState<string[]>(['BTC-USD', 'ETH-USD', 'SOL-USD']);

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const categories = ['All', 'Favorites', 'Top', 'L1', 'DeFi', 'Meme', 'AI'];

  const filteredPairs = pairs.filter((p) => {
    const matchesSearch =
      p.symbol.toLowerCase().includes(search.toLowerCase()) ||
      p.name.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (selectedCategory === 'All') return true;
    if (selectedCategory === 'Favorites') return favorites.includes(p.id);
    return p.category === selectedCategory;
  });

  return (
    <div className="workspace-panel watchlist-panel">
      <div className="panel-header">
        <span className="panel-title">
          <Flame size={14} className="text-amber" />
          Markets & Watchlist
        </span>
        <span style={{ fontSize: 11, color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}>
          {filteredPairs.length} Pairs
        </span>
      </div>

      <div className="search-box">
        <Search size={13} className="search-icon" />
        <input
          type="text"
          placeholder="Search coin (e.g. BTC, Solana)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="category-pills">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`cat-pill ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="watchlist-table-wrap">
        {filteredPairs.map((pair) => {
          const isActive = pair.id === activePair.id;
          const isUp = pair.change24h >= 0;
          const isFav = favorites.includes(pair.id);

          return (
            <div
              key={pair.id}
              className={`watchlist-row ${isActive ? 'active' : ''}`}
              onClick={() => setActivePair(pair.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Star
                  size={12}
                  style={{
                    color: isFav ? 'var(--color-amber)' : 'var(--color-text-dim)',
                    cursor: 'pointer',
                    fill: isFav ? 'var(--color-amber)' : 'none'
                  }}
                  onClick={(e) => toggleFavorite(e, pair.id)}
                />
                <div className="coin-identity">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span className="coin-sym">{pair.symbol}</span>
                    <span style={{ fontSize: 10, color: 'var(--color-text-dim)' }}>/USD</span>
                  </div>
                  <span className="coin-name">{pair.name}</span>
                </div>
              </div>

              <div className="coin-data">
                <span className="coin-price">
                  ${pair.price.toLocaleString(undefined, {
                    minimumFractionDigits: pair.price < 1 ? 4 : 2,
                    maximumFractionDigits: pair.price < 1 ? 6 : 2
                  })}
                </span>
                <span className={`coin-change ${isUp ? 'text-green' : 'text-red'}`} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {isUp ? '+' : ''}{pair.change24h.toFixed(2)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
