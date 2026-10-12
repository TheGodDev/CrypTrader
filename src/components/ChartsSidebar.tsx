import React, { useState } from 'react';
import { OrderBook } from './OrderBook';
import { MLPredictorConsole } from './MLPredictorConsole';

type SidebarTab = 'orderbook' | 'ml';

export const ChartsSidebar: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SidebarTab>('orderbook');

  return (
    <div className="charts-sidebar">
      <div className="sidebar-tabs">
        <button
          className={`sidebar-tab-btn ${activeTab === 'orderbook' ? 'active' : ''}`}
          onClick={() => setActiveTab('orderbook')}
        >
          Order Book
        </button>
        <button
          className={`sidebar-tab-btn ${activeTab === 'ml' ? 'active' : ''}`}
          onClick={() => setActiveTab('ml')}
        >
          ML Predictor
        </button>
      </div>
      <div className="sidebar-content">
        {activeTab === 'orderbook' && <OrderBook />}
        {activeTab === 'ml' && <MLPredictorConsole />}
      </div>
    </div>
  );
};
