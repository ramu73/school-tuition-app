import React from 'react';
import { Clock, ShieldAlert, LogOut, RefreshCw } from 'lucide-react';

export default function SessionExpiryModal({ 
  isOpen, 
  secondsLeft = 120, 
  onExtend, 
  onLogout, 
  userRole = 'User' 
}) {
  if (!isOpen) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="session-modal-overlay">
      <div className="session-modal-card">
        <div className="session-modal-icon-wrap">
          <ShieldAlert size={32} className="session-alert-icon" />
        </div>

        <h2 className="session-modal-title">Session Expiring Soon</h2>
        <p className="session-modal-desc">
          Your active <strong>{userRole}</strong> session will expire in <strong className="time-highlight">{formattedTime}</strong> due to inactivity.
        </p>

        <div className="session-countdown-banner">
          <Clock size={16} className="text-amber animate-pulse" />
          <span>Auto-logout in: <strong>{formattedTime}</strong></span>
        </div>

        <div className="session-modal-actions">
          <button 
            type="button" 
            className="btn btn-secondary flex-1"
            onClick={onLogout}
          >
            <LogOut size={16} />
            <span>Logout Now</span>
          </button>
          
          <button 
            type="button" 
            className="btn btn-primary flex-1 session-stay-btn"
            onClick={() => onExtend(60)}
            autoFocus
          >
            <RefreshCw size={16} />
            <span>Stay Logged In</span>
          </button>
        </div>
      </div>

      <style>{`
        .session-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(11, 15, 25, 0.85);
          backdrop-filter: blur(16px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
          animation: fadeIn 0.2s ease-out;
        }

        .session-modal-card {
          width: 100%;
          max-width: 440px;
          background: rgba(17, 24, 39, 0.95);
          border: 1px solid rgba(245, 158, 11, 0.35);
          border-radius: var(--radius-xl, 16px);
          padding: 28px 24px;
          text-align: center;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 35px rgba(245, 158, 11, 0.15);
        }

        .session-modal-icon-wrap {
          width: 60px;
          height: 60px;
          margin: 0 auto 16px;
          border-radius: 50%;
          background: rgba(245, 158, 11, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .session-alert-icon {
          color: #F59E0B;
        }

        .session-modal-title {
          font-family: var(--font-heading, inherit);
          font-size: 1.25rem;
          font-weight: 700;
          color: white;
          margin-bottom: 8px;
        }

        .session-modal-desc {
          font-size: 0.875rem;
          color: var(--text-secondary, #94A3B8);
          line-height: 1.5;
          margin-bottom: 18px;
        }

        .session-countdown-banner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.25);
          border-radius: var(--radius-lg, 12px);
          padding: 10px 16px;
          font-size: 0.9rem;
          color: #FDE68A;
          margin-bottom: 24px;
          font-family: var(--font-mono, monospace);
        }

        .time-highlight {
          color: #FBBF24;
          font-family: var(--font-mono, monospace);
        }

        .session-modal-actions {
          display: flex;
          gap: 12px;
        }

        .session-stay-btn {
          background: linear-gradient(135deg, #4F46E5, #6366F1);
          color: white;
          font-weight: 600;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
