/**
 * JWT Authentication Utilities
 * Handles token storage, retrieval, and expiry checking
 */

const TOKEN_KEY = 'kr_fuels_token';
const USER_KEY = 'kr_fuels_user';
const TOKEN_EXPIRY_KEY = 'kr_fuels_token_expiry';

export interface StoredUser {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'super_admin';
  accessibleBunkIds: string[];
}

/**
 * Store JWT token and user data after login
 */
export function storeAuthData(token: string, user: StoredUser, expiresIn: string = '24h'): void {
  // Calculate expiry time (24h from now)
  const expiryMs = parseExpiryToMs(expiresIn);
  const expiryTime = Date.now() + expiryMs;
  
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
}

/**
 * Get stored JWT token
 */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Get stored user data
 */
export function getStoredUser(): StoredUser | null {
  const userJson = localStorage.getItem(USER_KEY);
  if (!userJson) return null;
  
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

/**
 * Check if token is expired (client-side check)
 */
export function isTokenExpired(): boolean {
  const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!expiryStr) return true;
  
  const expiry = parseInt(expiryStr, 10);
  // Add 5 minute buffer before actual expiry
  return Date.now() > (expiry - 5 * 60 * 1000);
}

/**
 * Check if token needs refresh (within 1 hour of expiry)
 */
export function shouldRefreshToken(): boolean {
  const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!expiryStr) return false;
  
  const expiry = parseInt(expiryStr, 10);
  const oneHourFromNow = Date.now() + (60 * 60 * 1000);
  
  return expiry < oneHourFromNow && expiry > Date.now();
}

/**
 * Clear all auth data (logout)
 */
export function clearAuthData(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
  // Also clear old keys for backward compatibility
  localStorage.removeItem('kr_fuels_user_id');
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const token = getToken();
  const user = getStoredUser();
  
  return !!(token && user && !isTokenExpired());
}

/**
 * Parse expiry string to milliseconds
 */
function parseExpiryToMs(expiry: string): number {
  const match = expiry.match(/^(\d+)(h|m|d)$/);
  if (!match) return 24 * 60 * 60 * 1000; // Default 24h
  
  const value = parseInt(match[1], 10);
  const unit = match[2];
  
  switch (unit) {
    case 'h': return value * 60 * 60 * 1000;
    case 'm': return value * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return 24 * 60 * 60 * 1000;
  }
}

/**
 * Get time until token expires (human readable)
 */
export function getTimeUntilExpiry(): string {
  const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!expiryStr) return 'Unknown';
  
  const expiry = parseInt(expiryStr, 10);
  const remaining = expiry - Date.now();
  
  if (remaining <= 0) return 'Expired';
  
  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
