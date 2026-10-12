import React, { useEffect, useState } from 'react';
import { useTrading } from '../context/TradingContext';
import { getLiveMLPrediction } from '../services/mlPredictor';
import type { MLPrediction } from '../types/crypto';
import { TrendingUp, TrendingDown, Sparkles, Loader2 } from 'lucide-react';

interface ScannerResult {
  pairId: string;
  symbol: string;
  prediction: MLPrediction;
  score: number;
}

export const ScannerPage: React.FC = () => {
  const { pairs, modelType, horizon, backendEngine } = useTrading();
  const [results, setResults] = useState<ScannerResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const runScanner = async () => {
    setIsScanning(true);
    const scannerResults: ScannerResult[] = [];

    // Scan only top 5 pairs to avoid overwhelming
    const pairsToScan = pairs.slice(0, 5);

    for (const pair of pairsToScan) {
      try {
        const { fetchHistoricalCandles } = await import('../services/cryptoApi');
        const pairCandles = await fetchHistoricalCandles(pair, '15m', 'coinbase');

        if (pairCandles.length > 0) {
          const prediction = await getLiveMLPrediction(
            pair,
            pairCandles,
            modelType,
            horizon,
            backendEngine,
            14.5
          );

          // Score = absolute predicted change × confidence
          const score = Math.abs(prediction.predictedChangePercent) * prediction.confidence;

          scannerResults.push({
            pairId: pair.id,
            symbol: pair.symbol,
            prediction,
            score
          });
        }
      } catch (error) {
        console.error(`Error scanning ${pair.symbol}:`, error);
      }
    }

    // Sort by score descending
    scannerResults.sort((a, b) => b.score - a.score);
    setResults(scannerResults);
    setLastUpdated(new Date());
    setIsScanning(false);
  };

  useEffect(() => {
    runScanner();
    const interval = setInterval(runScanner, 60000); // Scan every minute
    return () => clearInterval(interval);
  }, [pairs, modelType, horizon, backendEngine]);

  const getSignalColor = (signal: string) => {
    if (signal.includes('BUY')) return 'text-green';
    if (signal.includes('SELL')) return 'text-red';
    return 'text-amber';
  };

  const getSignalBg = (signal: string) => {
    if (signal.includes('BUY')) return 'rgba(16, 185, 129, 0.15)';
    if (signal.includes('SELL')) return 'rgba(239, 68, 68, 0.15)';
    return 'rgba(245, 158, 11, 0.15)';
  };

  return (
    <div className="page-content scanner-page">
      <div className="scanner-container">
        <div className="scanner-header">
          <div className="scanner-title">
            <Sparkles size={20} className="text-green" />
            <h2>ML Opportunity Scanner</h2>
          </div>
          <div className="scanner-controls">
            <button
              className="scan-btn"
              onClick={runScanner}
              disabled={isScanning}
            >
              {isScanning ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
              {isScanning ? 'Scanning...' : 'Rescan Now'}
            </button>
            {lastUpdated && (
              <span className="last-updated">
                Last: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        <div className="scanner-grid">
          {results.map((result, index) => {
            const isUp = result.prediction.predictedChangePercent >= 0;
            const signalColor = getSignalColor(result.prediction.signal);
            const signalBg = getSignalBg(result.prediction.signal);

            return (
              <div key={result.pairId} className="scanner-card">
                <div className="scanner-card-header">
                  <div className="scanner-rank">#{index + 1}</div>
                  <div className="scanner-symbol">{result.symbol}</div>
                  <div
                    className="scanner-signal"
                    style={{ background: signalBg, color: signalColor.replace('text-', '') }}
                  >
                    {result.prediction.signal}
                  </div>
                </div>

                <div className="scanner-metrics">
                  <div className="metric-row">
                    <span className="metric-label">Score</span>
                    <span className="metric-value score-value">
                      {result.score.toFixed(1)}
                    </span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Predicted Move</span>
                    <span className={`metric-value ${isUp ? 'text-green' : 'text-red'}`}>
                      {isUp ? '+' : ''}{result.prediction.predictedChangePercent.toFixed(2)}%
                    </span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Confidence</span>
                    <span className="metric-value">
                      {result.prediction.confidence}%
                    </span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Target Price</span>
                    <span className="metric-value">
                      ${result.prediction.predictedTargetPrice.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Model</span>
                    <span className="metric-value model-value">
                      {result.prediction.modelUsed}
                    </span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Latency</span>
                    <span className="metric-value">
                      {result.prediction.inferenceLatencyMs}ms
                    </span>
                  </div>
                </div>

                <div className="scanner-card-footer">
                  <div className="mini-chart">
                    {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  </div>
                  <div className="horizon-badge">
                    {result.prediction.timeframeHorizon}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {results.length === 0 && (
          <div className="empty-state">
            {isScanning ? (
              <>
                <Loader2 size={48} className="text-green spin" style={{ opacity: 0.5 }} />
                <h3>Scanning Markets...</h3>
                <p>Analyzing ML predictions for top pairs</p>
              </>
            ) : (
              <>
                <Sparkles size={48} className="text-green" style={{ opacity: 0.5 }} />
                <h3>No Results</h3>
                <p>Click "Rescan Now" to analyze opportunities</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
