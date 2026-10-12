import React from 'react';
import { TradingChart } from '../components/TradingChart';
import { ChartsSidebar } from '../components/ChartsSidebar';

export const ChartsPage: React.FC = () => {
  return (
    <div className="page-content charts-page">
      <div className="charts-layout">
        <div className="charts-main">
          <TradingChart />
        </div>
        <ChartsSidebar />
      </div>
    </div>
  );
};
