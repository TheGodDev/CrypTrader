import React from 'react';
import { TradingProvider } from './context/TradingContext';
import { TabProvider, useTab } from './context/TabContext';
import { Header } from './components/Header';
import { TabNavigation } from './components/TabNavigation';
import { SymbolsPage } from './pages/SymbolsPage';
import { ChartsPage } from './pages/ChartsPage';
import { ScannerPage } from './pages/ScannerPage';
import { CrawlrPage } from './pages/CrawlrPage';
import { ToastContainer } from './components/ToastContainer';

const AppContent: React.FC = () => {
  const { activeTab, setActiveTab } = useTab();

  const renderPage = () => {
    switch (activeTab) {
      case 'symbols':
        return <SymbolsPage />;
      case 'charts':
        return <ChartsPage />;
      case 'scanner':
        return <ScannerPage />;
      case 'crawlr':
        return <CrawlrPage />;
      default:
        return <SymbolsPage />;
    }
  };

  return (
    <div className="cryptrader-app">
      <Header />
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="trading-workspace">
        {renderPage()}
      </main>
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <TradingProvider>
      <TabProvider>
        <AppContent />
      </TabProvider>
    </TradingProvider>
  );
}
