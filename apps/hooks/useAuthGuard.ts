import { useCallback, useEffect, useRef } from 'react';
import { useVerifyAuth } from '../convex-api';
import { getToken, clearAuthData, isTokenExpired } from '../lib/auth';

// Verifies JWT with backend on mount and every 5 minutes
export function useAuthGuard(onAuthFail: () => void) {
  const verifyAuth = useVerifyAuth();
  const isVerifying = useRef(false);

  const verifyServerSide = useCallback(async () => {
    if (isVerifying.current) return;
    
    const token = getToken();
    if (!token) {
      onAuthFail();
      return;
    }

    if (isTokenExpired()) {
      clearAuthData();
      onAuthFail();
      return;
    }

    isVerifying.current = true;
    try {
      const result = await verifyAuth({ token });
      if (!result.valid) {
        clearAuthData();
        onAuthFail();
      }
    } catch (error) {
      // Don't logout on network errors
    } finally {
      isVerifying.current = false;
    }
  }, [verifyAuth, onAuthFail]);

  useEffect(() => {
    if (getToken()) verifyServerSide();
  }, [verifyServerSide]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (getToken()) verifyServerSide();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [verifyServerSide]);

  return { verifyServerSide };
}
