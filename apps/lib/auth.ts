// JWT Token Storage Utilities

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

export function storeAuthData(token: string, user: StoredUser, expiresIn: string = '24h'): void {
  const expiryMs = parseExpiryToMs(expiresIn);
  const expiryTime = Date.now() + expiryMs;
  
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  sessionStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
}

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): StoredUser | null {
  const userJson = sessionStorage.getItem(USER_KEY);
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

export function isTokenExpired(): boolean {
  const expiryStr = sessionStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!expiryStr) return true;
  const expiry = parseInt(expiryStr, 10);
  return Date.now() > (expiry - 5 * 60 * 1000); // 5 min buffer
}

export function shouldRefreshToken(): boolean {
  const expiryStr = sessionStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!expiryStr) return false;
  const expiry = parseInt(expiryStr, 10);
  const oneHourFromNow = Date.now() + (60 * 60 * 1000);
  return expiry < oneHourFromNow && expiry > Date.now();
}

export function clearAuthData(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
  sessionStorage.removeItem('kr_fuels_user_id');
}

export function isAuthenticated(): boolean {
  return !!(getToken() && getStoredUser() && !isTokenExpired());
}

function parseExpiryToMs(expiry: string): number {
  const match = expiry.match(/^(\d+)(h|m|d)$/);
  if (!match) return 24 * 60 * 60 * 1000;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case 'h': return value * 60 * 60 * 1000;
    case 'm': return value * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return 24 * 60 * 60 * 1000;
  }
}

export function getTimeUntilExpiry(): string {
  const expiryStr = sessionStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!expiryStr) return 'Unknown';
  const expiry = parseInt(expiryStr, 10);
  const remaining = expiry - Date.now();
  if (remaining <= 0) return 'Expired';
  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}
