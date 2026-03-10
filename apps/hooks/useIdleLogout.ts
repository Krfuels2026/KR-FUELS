import { useEffect, useRef } from 'react';

const IDLE_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'] as const;

/**
 * Automatically logs out the user after a configurable period of inactivity.
 * @param onLogout - callback invoked when the idle timeout expires
 * @param idleMinutes - inactivity threshold in minutes (default: 30)
 */
export function useIdleLogout(onLogout: () => void, idleMinutes = 30) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const idleLimit = idleMinutes * 60 * 1000;

    const reset = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onLogout();
        alert(`You have been logged out due to ${idleMinutes} minutes of inactivity.`);
      }, idleLimit);
    };

    IDLE_EVENTS.forEach(e => window.addEventListener(e, reset));
    reset();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      IDLE_EVENTS.forEach(e => window.removeEventListener(e, reset));
    };
  }, [onLogout, idleMinutes]);
}
