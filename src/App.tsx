import React from 'react';
import { TradingProvider } from './context/TradingContext';
import { Header } from './components/Header';
import { MarketWatchlist } from './components/MarketWatchlist';
import { TradingChart } from './components/TradingChart';
import { OrderBook } from './components/OrderBook';
import { MLPredictorConsole } from './components/MLPredictorConsole';
import { PositionsOrdersPanel } from './components/PositionsOrdersPanel';
import { ToastContainer } from './components/ToastContainer';

export const AppContent: React.FC = () => {
  return (
    <div className="cryptrader-app">
      <Header />
      <main className="trading-workspace">
        <MarketWatchlist />
        <TradingChart />
        <PositionsOrdersPanel />
        <div className="workspace-panel right-panel">
          <OrderBook />
          <MLPredictorConsole />
        </div>
      </main>
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <TradingProvider>
      <AppContent />
    </TradingProvider>
  );
}
