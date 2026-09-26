import React, { useState, useEffect, useMemo } from 'react';
import { 
  Terminal, 
  AlertOctagon, 
  AlertTriangle, 
  Info, 
  Activity, 
  Trash2, 
  Download, 
  RefreshCw, 
  Search, 
  X, 
  Copy, 
  Check, 
  ChevronRight, 
  ChevronDown,
  Bug,
  Filter
} from 'lucide-react';
import { logger, LOG_LEVELS, LOG_CATEGORIES } from '../lib/logger';

export default function LogsViewerModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [logs, setLogs] = useState(() => logger.getLogs());
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLogIds, setExpandedLogIds] = useState(new Set());
  const [copiedId, setCopiedId] = useState(null);
  const [copiedFull, setCopiedFull] = useState(false);

  // Subscribe to live log events
  useEffect(() => {
    const handleNewLog = () => {
      setLogs(logger.getLogs());
    };
    window.addEventListener('hayagriva-log-recorded', handleNewLog);
    return () => {
      window.removeEventListener('hayagriva-log-recorded', handleNewLog);
    };
  }, []);

  const refreshLogs = () => {
    setLogs(logger.getLogs());
  };

  const handleClearLogs = () => {
    if (window.confirm('Clear all recorded runtime and exception logs?')) {
      logger.clearLogs();
      setLogs([]);
    }
  };

  const handleDownloadTxt = () => {
    const text = logger.exportLogsText();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hayagriva_runtime_logs_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJson = () => {
    const json = logger.exportLogsJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hayagriva_runtime_logs_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyLogDetails = (id, details) => {
    navigator.clipboard.writeText(typeof details === 'object' ? JSON.stringify(details, null, 2) : String(details));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const toggleExpand = (id) => {
    setExpandedLogIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleTestError = () => {
    logger.error(LOG_CATEGORIES.RUNTIME, 'Manually simulated test error for diagnostics', {
      simulatedAt: new Date().toISOString(),
      source: 'LogsViewerModal Diagnostics'
    });
  };

  const handleTestException = () => {
    try {
      // Intentionally cause an exception
      throw new Error('Manually simulated JavaScript runtime exception for diagnostic testing');
    } catch (err) {
      logger.exception(LOG_CATEGORIES.RUNTIME, err.message, err);
    }
  };

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (levelFilter === 'ERRORS' && log.level !== LOG_LEVELS.ERROR && log.level !== LOG_LEVELS.EXCEPTION) return false;
      if (levelFilter === 'WARNINGS' && log.level !== LOG_LEVELS.WARN) return false;
      if (levelFilter === 'ACTIONS' && log.level !== LOG_LEVELS.ACTION) return false;
      if (levelFilter === 'INFO' && log.level !== LOG_LEVELS.INFO) return false;

      if (categoryFilter !== 'ALL' && log.category !== categoryFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesMsg = (log.message || '').toLowerCase().includes(q);
        const matchesUser = (log.user || '').toLowerCase().includes(q);
        const matchesCat = (log.category || '').toLowerCase().includes(q);
        const matchesDetails = log.details ? JSON.stringify(log.details).toLowerCase().includes(q) : false;
        return matchesMsg || matchesUser || matchesCat || matchesDetails;
      }
      return true;
    });
  }, [logs, levelFilter, categoryFilter, searchQuery]);

  const errorCount = logs.filter(l => l.level === LOG_LEVELS.ERROR || l.level === LOG_LEVELS.EXCEPTION).length;
  const warnCount = logs.filter(l => l.level === LOG_LEVELS.WARN).length;
  const actionCount = logs.filter(l => l.level === LOG_LEVELS.ACTION).length;

  return (
    <div className="logs-modal-overlay">
      <div className="logs-modal-card">
        {/* Header */}
        <div className="logs-modal-header">
          <div className="logs-header-left">
            <div className="logs-icon-wrap">
              <Terminal size={22} className="text-primary" />
            </div>
            <div>
              <h2 className="logs-title">System Runtime & Exception Logs</h2>
              <p className="logs-subtitle">Real-time error diagnostics, audit trail, and runtime exception tracking</p>
            </div>
          </div>
          
          <div className="logs-header-actions">
            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              onClick={refreshLogs} 
              title="Refresh log entries"
            >
              <RefreshCw size={14} />
              <span>Refresh</span>
            </button>
            <button 
              type="button" 
              className="logs-close-btn"
              onClick={onClose}
              title="Close Logs Viewer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Top Metric Badges & Simulation Tools */}
        <div className="logs-stats-bar">
          <div className="stat-pill total">
            <span>Total:</span>
            <strong>{logs.length}</strong>
          </div>
          <div className={`stat-pill errors ${errorCount > 0 ? 'has-errors' : ''}`}>
            <AlertOctagon size={13} />
            <span>Errors / Exceptions:</span>
            <strong>{errorCount}</strong>
          </div>
          <div className="stat-pill warnings">
            <AlertTriangle size={13} />
            <span>Warnings:</span>
            <strong>{warnCount}</strong>
          </div>
          <div className="stat-pill actions">
            <Activity size={13} />
            <span>User Actions:</span>
            <strong>{actionCount}</strong>
          </div>

          <div className="sim-buttons-group">
            <button 
              type="button" 
              className="sim-btn" 
              onClick={handleTestError} 
              title="Trigger a simulated test error"
            >
              <Bug size={12} />
              <span>Test Error</span>
            </button>
            <button 
              type="button" 
              className="sim-btn" 
              onClick={handleTestException} 
              title="Trigger a simulated test exception"
            >
              <AlertOctagon size={12} />
              <span>Test Exception</span>
            </button>
          </div>
        </div>

        {/* Controls: Search & Level Filters */}
        <div className="logs-controls-bar">
          <div className="logs-search-wrap">
            <Search size={15} className="logs-search-icon" />
            <input 
              type="text" 
              placeholder="Search logs by message, component, user, or error stack..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="logs-search-input"
            />
            {searchQuery && (
              <button 
                type="button" 
                className="logs-search-clear" 
                onClick={() => setSearchQuery('')}
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="logs-filter-tabs">
            <button 
              type="button" 
              className={`filter-btn ${levelFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setLevelFilter('ALL')}
            >
              All ({logs.length})
            </button>
            <button 
              type="button" 
              className={`filter-btn red ${levelFilter === 'ERRORS' ? 'active' : ''}`}
              onClick={() => setLevelFilter('ERRORS')}
            >
              Errors & Crashes ({errorCount})
            </button>
            <button 
              type="button" 
              className={`filter-btn amber ${levelFilter === 'WARNINGS' ? 'active' : ''}`}
              onClick={() => setLevelFilter('WARNINGS')}
            >
              Warnings ({warnCount})
            </button>
            <button 
              type="button" 
              className={`filter-btn purple ${levelFilter === 'ACTIONS' ? 'active' : ''}`}
              onClick={() => setLevelFilter('ACTIONS')}
            >
              Actions ({actionCount})
            </button>
          </div>
        </div>

        {/* Log Entries Scrollable Area */}
        <div className="logs-list-scroll">
          {filteredLogs.length === 0 ? (
            <div className="empty-logs-placeholder">
              <Terminal size={36} className="text-muted" />
              <p className="empty-title">No matching log records found</p>
              <p className="empty-desc">
                {logs.length === 0 
                  ? 'The system log is clean. Runtime actions and exception traces will be captured here automatically.' 
                  : 'Try clearing your search query or filter to view other log entries.'}
              </p>
            </div>
          ) : (
            filteredLogs.map(log => {
              const isError = log.level === LOG_LEVELS.ERROR || log.level === LOG_LEVELS.EXCEPTION;
              const isWarn = log.level === LOG_LEVELS.WARN;
              const isAction = log.level === LOG_LEVELS.ACTION;
              const isExpanded = expandedLogIds.has(log.id);
              const hasDetails = Boolean(log.details);

              return (
                <div key={log.id} className={`log-entry-row level-${log.level.toLowerCase()}`}>
                  <div className="log-main-line" onClick={() => hasDetails && toggleExpand(log.id)}>
                    <div className="log-expand-toggle">
                      {hasDetails ? (
                        isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                      ) : (
                        <span className="dot-spacer">•</span>
                      )}
                    </div>

                    <div className="log-time-col">
                      <span className="log-time">{log.displayTime}</span>
                      <span className="log-date">{log.displayDate}</span>
                    </div>

                    <div className="log-badge-col">
                      <span className={`badge-level ${log.level.toLowerCase()}`}>
                        {log.level}
                      </span>
                      <span className="badge-cat">{log.category}</span>
                    </div>

                    <div className="log-msg-col">
                      <span className="log-msg-text">{log.message}</span>
                      <span className="log-user-tag">{log.user}</span>
                    </div>
                  </div>

                  {/* Expandable Details / Stack Trace */}
                  {isExpanded && hasDetails && (
                    <div className="log-details-drawer">
                      <div className="details-header">
                        <span className="details-title">Event Payload / Exception Stack:</span>
                        <button 
                          type="button" 
                          className="copy-details-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyLogDetails(log.id, log.details);
                          }}
                        >
                          {copiedId === log.id ? (
                            <>
                              <Check size={12} className="text-emerald" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              <span>Copy JSON</span>
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="details-json-pre">
                        {typeof log.details === 'object' 
                          ? JSON.stringify(log.details, null, 2) 
                          : String(log.details)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="logs-modal-footer">
          <div className="footer-left">
            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              onClick={handleClearLogs}
              disabled={logs.length === 0}
            >
              <Trash2 size={14} />
              <span>Clear Logs</span>
            </button>
          </div>

          <div className="footer-right">
            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              onClick={handleDownloadTxt}
              disabled={logs.length === 0}
            >
              <Download size={14} />
              <span>Download .TXT</span>
            </button>
            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              onClick={handleDownloadJson}
              disabled={logs.length === 0}
            >
              <Download size={14} />
              <span>Export JSON</span>
            </button>
            <button 
              type="button" 
              className="btn btn-primary btn-sm"
              onClick={onClose}
            >
              <span>Close</span>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .logs-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(11, 15, 25, 0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
          animation: fadeIn 0.18s ease-out;
        }
        .logs-modal-card {
          width: 100%;
          max-width: 980px;
          max-height: 90vh;
          background: rgba(17, 24, 39, 0.98);
          border: 1px solid rgba(99, 102, 241, 0.3);
          border-radius: var(--radius-xl, 16px);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.75), 0 0 35px rgba(99, 102, 241, 0.15);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .logs-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 24px;
          border-bottom: 1px solid var(--border-subtle);
          background: rgba(15, 23, 42, 0.6);
        }
        .logs-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .logs-icon-wrap {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-md);
          background: rgba(99, 102, 241, 0.15);
          border: 1px solid rgba(99, 102, 241, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .logs-title {
          font-family: var(--font-heading);
          font-size: 1.15rem;
          font-weight: 700;
          color: white;
          margin-bottom: 2px;
        }
        .logs-subtitle {
          font-size: 0.775rem;
          color: var(--text-secondary);
        }
        .logs-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .logs-close-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px;
          border-radius: var(--radius-sm);
          transition: color 0.2s;
        }
        .logs-close-btn:hover {
          color: white;
        }
        .logs-stats-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 24px;
          background: rgba(15, 23, 42, 0.4);
          border-bottom: 1px solid var(--border-subtle);
          flex-wrap: wrap;
        }
        .stat-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background: rgba(30, 41, 59, 0.6);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-full);
          font-size: 0.725rem;
          color: var(--text-secondary);
        }
        .stat-pill strong {
          color: white;
        }
        .stat-pill.errors.has-errors {
          background: rgba(244, 63, 94, 0.15);
          border-color: rgba(244, 63, 94, 0.4);
          color: #FDA4AF;
        }
        .stat-pill.errors.has-errors strong {
          color: #FB7185;
        }
        .stat-pill.warnings {
          color: #FDE68A;
        }
        .sim-buttons-group {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .sim-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 9px;
          background: rgba(99, 102, 241, 0.12);
          border: 1px dashed rgba(99, 102, 241, 0.35);
          border-radius: var(--radius-md);
          color: #A5B4FC;
          font-size: 0.7rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .sim-btn:hover {
          background: rgba(99, 102, 241, 0.25);
          color: white;
        }
        .logs-controls-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 24px;
          gap: 16px;
          background: rgba(17, 24, 39, 0.6);
          border-bottom: 1px solid var(--border-subtle);
          flex-wrap: wrap;
        }
        .logs-search-wrap {
          position: relative;
          flex: 1;
          min-width: 260px;
        }
        .logs-search-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
        }
        .logs-search-input {
          width: 100%;
          padding: 7px 32px 7px 32px;
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          color: white;
          font-size: 0.8rem;
        }
        .logs-search-input:focus {
          outline: none;
          border-color: var(--primary-500);
        }
        .logs-search-clear {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
        }
        .logs-filter-tabs {
          display: flex;
          align-items: center;
          gap: 6px;
          overflow-x: auto;
        }
        .filter-btn {
          padding: 6px 11px;
          font-size: 0.75rem;
          font-weight: 600;
          border-radius: var(--radius-md);
          background: rgba(30, 41, 59, 0.5);
          border: 1px solid var(--border-subtle);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .filter-btn:hover {
          color: white;
          background: rgba(255, 255, 255, 0.05);
        }
        .filter-btn.active {
          background: var(--primary-600);
          color: white;
          border-color: var(--primary-500);
        }
        .filter-btn.red.active {
          background: #E11D48;
          border-color: #F43F5E;
        }
        .filter-btn.amber.active {
          background: #D97706;
          border-color: #F59E0B;
        }
        .filter-btn.purple.active {
          background: #7C3AED;
          border-color: #8B5CF6;
        }
        .logs-list-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 12px 24px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          background: rgba(11, 15, 25, 0.5);
          min-height: 280px;
          max-height: calc(90vh - 240px);
        }
        .empty-logs-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
        }
        .empty-title {
          font-weight: 600;
          color: white;
          margin: 12px 0 4px;
          font-size: 0.95rem;
        }
        .empty-desc {
          font-size: 0.775rem;
          color: var(--text-muted);
          max-width: 400px;
        }
        .log-entry-row {
          background: rgba(17, 24, 39, 0.7);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          overflow: hidden;
          transition: border-color 0.15s ease;
        }
        .log-entry-row:hover {
          border-color: rgba(99, 102, 241, 0.4);
        }
        .log-entry-row.level-error, .log-entry-row.level-exception {
          border-left: 3px solid #F43F5E;
          background: rgba(244, 63, 94, 0.05);
        }
        .log-entry-row.level-warn {
          border-left: 3px solid #F59E0B;
          background: rgba(245, 158, 11, 0.04);
        }
        .log-entry-row.level-action {
          border-left: 3px solid #8B5CF6;
        }
        .log-main-line {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 9px 12px;
          cursor: pointer;
          user-select: none;
        }
        .log-expand-toggle {
          color: var(--text-muted);
          width: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .dot-spacer {
          opacity: 0.3;
        }
        .log-time-col {
          display: flex;
          flex-direction: column;
          min-width: 80px;
          font-family: var(--font-mono, monospace);
        }
        .log-time {
          font-size: 0.75rem;
          color: white;
          font-weight: 600;
        }
        .log-date {
          font-size: 0.65rem;
          color: var(--text-muted);
        }
        .log-badge-col {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 150px;
        }
        .badge-level {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: var(--radius-sm);
          text-transform: uppercase;
          font-family: var(--font-mono, monospace);
        }
        .badge-level.info { background: rgba(99, 102, 241, 0.2); color: #A5B4FC; }
        .badge-level.warn { background: rgba(245, 158, 11, 0.2); color: #FCD34D; }
        .badge-level.error, .badge-level.exception { background: rgba(244, 63, 94, 0.25); color: #FDA4AF; }
        .badge-level.action { background: rgba(139, 92, 246, 0.2); color: #C4B5FD; }
        .badge-cat {
          font-size: 0.65rem;
          color: var(--text-muted);
          background: rgba(255, 255, 255, 0.05);
          padding: 2px 6px;
          border-radius: var(--radius-sm);
          font-weight: 600;
        }
        .log-msg-col {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex: 1;
          gap: 12px;
          min-width: 0;
        }
        .log-msg-text {
          font-size: 0.8125rem;
          color: #E2E8F0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .log-user-tag {
          font-size: 0.7rem;
          color: var(--text-muted);
          white-space: nowrap;
          background: rgba(0, 0, 0, 0.25);
          padding: 2px 7px;
          border-radius: var(--radius-sm);
        }
        .log-details-drawer {
          background: rgba(11, 15, 25, 0.95);
          border-top: 1px solid var(--border-subtle);
          padding: 12px 16px;
        }
        .details-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .details-title {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .copy-details-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid var(--border-subtle);
          color: var(--text-secondary);
          font-size: 0.7rem;
          padding: 3px 8px;
          border-radius: var(--radius-sm);
          cursor: pointer;
        }
        .copy-details-btn:hover {
          color: white;
          background: rgba(255, 255, 255, 0.1);
        }
        .details-json-pre {
          font-family: var(--font-mono, monospace);
          font-size: 0.75rem;
          color: #93C5FD;
          background: rgba(0, 0, 0, 0.4);
          padding: 10px;
          border-radius: var(--radius-sm);
          overflow-x: auto;
          white-space: pre-wrap;
          word-break: break-all;
          max-height: 220px;
          margin: 0;
        }
        .logs-modal-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 24px;
          border-top: 1px solid var(--border-subtle);
          background: rgba(15, 23, 42, 0.6);
        }
        .footer-left, .footer-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }
      `}</style>
    </div>
  );
}
