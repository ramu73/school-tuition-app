import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  getAuthSession, 
  clearAuthSession, 
  refreshSessionActivity, 
  extendSession, 
  SESSION_DURATIONS 
} from '../lib/auth';

/**
 * useSessionManager Hook
 * Automatically handles:
 * 1. User idle activity tracking
 * 2. Session expiration countdown
 * 3. Inactivity warnings (e.g. 2 minutes before expiry)
 * 4. Automatic logout upon session expiration
 */
export function useSessionManager({ currentUser, onLogout }) {
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningSecondsLeft, setWarningSecondsLeft] = useState(120);
  const lastRefreshRef = useRef(Date.now());

  // Throttled activity refresh (once every 30 seconds on user events)
  const handleUserActivity = useCallback(() => {
    if (!currentUser) return;
    const now = Date.now();
    if (now - lastRefreshRef.current > 30000) {
      lastRefreshRef.current = now;
      refreshSessionActivity();
    }
  }, [currentUser]);

  // Extend session handler (called when user clicks "Stay Logged In")
  const handleExtendSession = useCallback((minutes = 60) => {
    const updated = extendSession(minutes);
    setShowWarningModal(false);
    lastRefreshRef.current = Date.now();
    return updated;
  }, []);

  // Immediate logout from modal or timeout
  const handleSessionTimeoutLogout = useCallback(() => {
    setShowWarningModal(false);
    clearAuthSession();
    if (onLogout) {
      onLogout();
    }
  }, [onLogout]);

  // Activity listeners
  useEffect(() => {
    if (!currentUser) return;

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    const onEvent = () => handleUserActivity();

    events.forEach(evt => window.addEventListener(evt, onEvent, { passive: true }));
    return () => {
      events.forEach(evt => window.removeEventListener(evt, onEvent));
    };
  }, [currentUser, handleUserActivity]);

  // Periodic session checker (every 5 seconds)
  useEffect(() => {
    if (!currentUser) {
      setShowWarningModal(false);
      return;
    }

    const interval = setInterval(() => {
      const session = getAuthSession();
      if (!session || !session.expiresAt) {
        // Session invalid or cleared
        handleSessionTimeoutLogout();
        return;
      }

      const now = Date.now();
      const timeRemainingMs = session.expiresAt - now;
      const idleTimeMs = session.lastActiveAt ? (now - session.lastActiveAt) : 0;
      const idleRemainingMs = SESSION_DURATIONS.IDLE_TIMEOUT_MS - idleTimeMs;

      const effectiveRemainingMs = Math.min(timeRemainingMs, idleRemainingMs);

      // 1. Session completely expired
      if (effectiveRemainingMs <= 0) {
        console.warn('Session expired or idle timeout reached.');
        handleSessionTimeoutLogout();
        return;
      }

      // 2. Approaching expiration warning threshold (2 minutes before expiry)
      if (effectiveRemainingMs <= SESSION_DURATIONS.WARNING_BEFORE_EXPIRY_MS) {
        setShowWarningModal(true);
        setWarningSecondsLeft(Math.max(1, Math.ceil(effectiveRemainingMs / 1000)));
      } else {
        setShowWarningModal(false);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentUser, handleSessionTimeoutLogout]);

  return {
    showWarningModal,
    warningSecondsLeft,
    extendSession: handleExtendSession,
    logout: handleSessionTimeoutLogout
  };
}
