// ==========================================================================
// Centralized Runtime & Exception Logger for Hayagriva Tuition App
// Captures system actions, API/Supabase events, and unhandled exceptions
// ==========================================================================

const LOGS_STORAGE_KEY = 'hayagriva_runtime_logs_v1';
const MAX_LOGS = 250;

export const LOG_LEVELS = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  ACTION: 'ACTION',
  EXCEPTION: 'EXCEPTION'
};

export const LOG_CATEGORIES = {
  AUTH: 'AUTH',
  DATABASE: 'DATABASE',
  SYNC: 'SYNC',
  VALIDATION: 'VALIDATION',
  UI: 'UI',
  RUNTIME: 'RUNTIME',
  NETWORK: 'NETWORK'
};

// Internal in-memory log cache initialized from storage
let inMemoryLogs = null;

function loadStoredLogs() {
  if (inMemoryLogs) return inMemoryLogs;
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(LOGS_STORAGE_KEY);
    if (!raw) return [];
    inMemoryLogs = JSON.parse(raw);
    if (!Array.isArray(inMemoryLogs)) inMemoryLogs = [];
    return inMemoryLogs;
  } catch (err) {
    console.warn('Failed to load logs from localStorage:', err);
    inMemoryLogs = [];
    return inMemoryLogs;
  }
}

function persistLogs(logs) {
  inMemoryLogs = logs;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs.slice(0, MAX_LOGS)));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hayagriva-log-recorded', { detail: logs[0] }));
    }
  } catch (err) {
    console.warn('Failed to persist logs to localStorage:', err);
  }
}

export function addLog(level, category, message, details = null) {
  const currentLogs = loadStoredLogs();
  const now = new Date();
  
  // Safe formatting of details/error
  let serializedDetails = null;
  if (details) {
    if (details instanceof Error) {
      serializedDetails = {
        name: details.name,
        message: details.message,
        stack: details.stack
      };
    } else if (typeof details === 'object') {
      try {
        serializedDetails = JSON.parse(JSON.stringify(details));
      } catch {
        serializedDetails = String(details);
      }
    } else {
      serializedDetails = String(details);
    }
  }

  // Get active user if available
  let activeUser = 'Anonymous';
  try {
    if (typeof localStorage !== 'undefined') {
      const session = localStorage.getItem('hayagriva_auth_session_v1');
      if (session) {
        const u = JSON.parse(session);
        if (u && u.name) activeUser = `${u.name} (${u.role || 'USER'})`;
      }
    }
  } catch {
    // ignore
  }

  // Sanitize category & user if category was passed as an object (e.g. currentUser)
  let safeCategory = 'GENERAL';
  if (category && typeof category === 'object') {
    if (category.name) {
      activeUser = `${category.name} (${category.role || 'USER'})`;
    } else if (category.username) {
      activeUser = category.username;
    }
    safeCategory = 'ACTION';
  } else if (typeof category === 'string' && category.trim()) {
    safeCategory = category.trim();
  }

  // Sanitize message to guaranteed string
  let safeMessage = 'Unspecified event';
  if (typeof message === 'string') {
    safeMessage = message;
  } else if (message !== null && message !== undefined) {
    try {
      safeMessage = typeof message === 'object' ? JSON.stringify(message) : String(message);
    } catch {
      safeMessage = String(message);
    }
  }

  const logEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: now.toISOString(),
    displayTime: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
    displayDate: now.toLocaleDateString('en-IN'),
    level: String(level || 'INFO'),
    category: safeCategory,
    message: safeMessage,
    details: serializedDetails,
    user: activeUser
  };

  const updatedLogs = [logEntry, ...currentLogs].slice(0, MAX_LOGS);
  persistLogs(updatedLogs);

  // Mirror to console with styling
  const prefix = `[TuitionLogger][${level}][${safeCategory}]`;
  if (level === LOG_LEVELS.ERROR || level === LOG_LEVELS.EXCEPTION) {
    console.error(prefix, safeMessage, details || '');
  } else if (level === LOG_LEVELS.WARN) {
    console.warn(prefix, safeMessage, details || '');
  } else {
    console.log(prefix, safeMessage, details || '');
  }

  return logEntry;
}

// Convenient helper methods
export const logger = {
  info: (category, message, details) => addLog(LOG_LEVELS.INFO, category, message, details),
  warn: (category, message, details) => addLog(LOG_LEVELS.WARN, category, message, details),
  error: (category, message, details) => addLog(LOG_LEVELS.ERROR, category, message, details),
  exception: (category, message, error) => addLog(LOG_LEVELS.EXCEPTION, category, message, error),
  action: (categoryOrUser, message, details) => {
    if (categoryOrUser && typeof categoryOrUser === 'object') {
      const u = categoryOrUser.name ? `${categoryOrUser.name} (${categoryOrUser.role || 'USER'})` : (categoryOrUser.username || 'User');
      return addLog(LOG_LEVELS.ACTION, 'ACTION', message, { ...(details || {}), actor: u });
    }
    return addLog(LOG_LEVELS.ACTION, categoryOrUser || 'ACTION', message, details);
  },
  
  getLogs: () => [...loadStoredLogs()],
  
  clearLogs: () => {
    inMemoryLogs = [];
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(LOGS_STORAGE_KEY);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hayagriva-log-recorded', { detail: null }));
    }
  },

  exportLogsJson: () => {
    return JSON.stringify(loadStoredLogs(), null, 2);
  },

  exportLogsText: () => {
    const logs = loadStoredLogs();
    if (logs.length === 0) return 'No logs recorded.';
    return logs.map(l => {
      let line = `[${l.timestamp}] [${l.level}] [${l.category}] [User: ${l.user}] ${l.message}`;
      if (l.details) {
        line += `\n  Details: ${JSON.stringify(l.details, null, 2)}`;
      }
      return line;
    }).join('\n\n');
  }
};

// Initialize global browser exception & unhandled promise rejection listeners
if (typeof window !== 'undefined' && !window.__hayagriva_logger_installed__) {
  window.__hayagriva_logger_installed__ = true;

  // Window error event (runtime exceptions)
  window.addEventListener('error', (event) => {
    try {
      const errMsg = event.message || 'Unhandled Runtime Error';
      const fileInfo = event.filename ? ` at ${event.filename.split('/').pop()}:${event.lineno}:${event.colno}` : '';
      logger.exception(LOG_CATEGORIES.RUNTIME, `${errMsg}${fileInfo}`, {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack || null
      });
    } catch {
      // prevent recursive logger errors
    }
  });

  // Unhandled promise rejection
  window.addEventListener('unhandledrejection', (event) => {
    try {
      const reason = event.reason;
      const msg = reason?.message || (typeof reason === 'string' ? reason : 'Unhandled Promise Rejection');
      logger.exception(LOG_CATEGORIES.RUNTIME, `Unhandled Promise: ${msg}`, {
        reason: reason?.stack || reason || 'No details'
      });
    } catch {
      // prevent recursive logger errors
    }
  });

  // Attach to window for easy developer inspection in DevTools
  window.TuitionLogs = {
    get: () => logger.getLogs(),
    clear: () => logger.clearLogs(),
    exportJson: () => logger.exportLogsJson(),
    exportText: () => logger.exportLogsText(),
    testError: () => {
      logger.error(LOG_CATEGORIES.RUNTIME, 'Test manual error generated for diagnostics', { test: true });
    },
    testException: () => {
      setTimeout(() => {
        throw new Error('Test unhandled runtime exception triggered for diagnostics testing');
      }, 50);
    }
  };
}

export default logger;
