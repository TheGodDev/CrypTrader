import React from 'react';
import { MarketWatchlist } from '../components/MarketWatchlist';

export const SymbolsPage: React.FC = () => {
  return (
    <div className="page-content symbols-page">
      <div className="symbols-layout">
        <MarketWatchlist />
      </div>
    </div>
  );
};
