import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useTrading } from '../context/TradingContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useTrading();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => {
        const getIcon = () => {
          switch (toast.type) {
            case 'success':
              return <CheckCircle2 size={18} className="text-green" />;
            case 'danger':
              return <AlertCircle size={18} className="text-red" />;
            case 'warning':
              return <AlertTriangle size={18} className="text-amber" />;
            default:
              return <Info size={18} className="text-cyan" />;
          }
        };

        return (
          <div key={toast.id} className={`toast-item ${toast.type}`}>
            {getIcon()}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: '#fff' }}>{toast.title}</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>{toast.message}</div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-dim)',
                cursor: 'pointer',
                padding: 2
              }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
