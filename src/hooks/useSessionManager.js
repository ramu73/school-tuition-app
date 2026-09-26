import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  getAuthSession, 
  clearAuthSession, 
  refreshSessionActivity, 
  extendSession, 
  isSessionValid,
  SESSION_DURATIONS 
} from '../lib/auth';

/**
 * useSessionManager Hook
 * Automatically handles:
 * 1. User idle activity tracking (throttled across mouse/touch/keyboard)
 * 2. Real-time session expiration countdown
 * 3. Inactivity warnings (2-minute countdown warning modal)
 * 4. Automatic logout upon session expiration
 * 5. Instantaneous cross-tab session & logout synchronization
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

  // Cross-tab synchronization & custom auth change listener
  useEffect(() => {
    const handleAuthSync = () => {
      const session = getAuthSession();
      if (!session || !isSessionValid(session)) {
        setShowWarningModal(false);
        if (currentUser && onLogout) {
          onLogout();
        }
      } else {
        const now = Date.now();
        const timeRemainingMs = session.expiresAt - now;
        const idleTimeMs = session.lastActiveAt ? (now - session.lastActiveAt) : 0;
        const idleRemainingMs = SESSION_DURATIONS.IDLE_TIMEOUT_MS - idleTimeMs;
        const effectiveRemainingMs = Math.min(timeRemainingMs, idleRemainingMs);

        if (effectiveRemainingMs > SESSION_DURATIONS.WARNING_BEFORE_EXPIRY_MS) {
          setShowWarningModal(false);
        }
      }
    };

    const handleStorage = (e) => {
      if (e.key === 'hayagriva_auth_session_v1') {
        handleAuthSync();
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('hayagriva-auth-changed', handleAuthSync);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('hayagriva-auth-changed', handleAuthSync);
    };
  }, [currentUser, onLogout]);

  // Periodic session checker: runs every 1s when in warning mode, 5s otherwise
  useEffect(() => {
    if (!currentUser) {
      setShowWarningModal(false);
      return;
    }

    const checkSessionState = () => {
      const session = getAuthSession();
      if (!session || !isSessionValid(session)) {
        console.warn('Session invalid, expired or idle timeout reached.');
        handleSessionTimeoutLogout();
        return;
      }

      const now = Date.now();
      const timeRemainingMs = session.expiresAt - now;
      const idleTimeMs = session.lastActiveAt ? (now - session.lastActiveAt) : 0;
      const idleRemainingMs = SESSION_DURATIONS.IDLE_TIMEOUT_MS - idleTimeMs;
      const effectiveRemainingMs = Math.min(timeRemainingMs, idleRemainingMs);

      // 1. Session expired or idle timeout reached
      if (effectiveRemainingMs <= 0) {
        console.warn('Session expired or idle timeout reached.');
        handleSessionTimeoutLogout();
        return;
      }

      // 2. Approaching expiration warning threshold (<= 2 minutes remaining)
      if (effectiveRemainingMs <= SESSION_DURATIONS.WARNING_BEFORE_EXPIRY_MS) {
        setShowWarningModal(true);
        setWarningSecondsLeft(Math.max(1, Math.ceil(effectiveRemainingMs / 1000)));
      } else {
        setShowWarningModal(false);
      }
    };

    // Check immediately on mount/state change
    checkSessionState();

    // Dynamically adjust frequency: 1000ms if warning modal is active for smooth countdown, 5000ms otherwise
    const checkIntervalMs = showWarningModal ? 1000 : 5000;
    const interval = setInterval(checkSessionState, checkIntervalMs);

    return () => clearInterval(interval);
  }, [currentUser, showWarningModal, handleSessionTimeoutLogout]);

  return {
    showWarningModal,
    warningSecondsLeft,
    extendSession: handleExtendSession,
    logout: handleSessionTimeoutLogout
  };
}
