const KEYS = {
  USER: 'kr_fuels_user',
  TOKEN: 'kr_fuels_token',
  CURRENT_BUNK: 'kr_fuels_current_bunk',
} as const;

export function getStoredUser<T>(): T | null {
  try {
    const raw = localStorage.getItem(KEYS.USER);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function setStoredUser<T>(user: T): void {
  localStorage.setItem(KEYS.USER, JSON.stringify(user));
}

export function clearStoredUser(): void {
  localStorage.removeItem(KEYS.USER);
  localStorage.removeItem(KEYS.TOKEN);
  localStorage.removeItem(KEYS.CURRENT_BUNK);
}

export function getToken(): string | null {
  return localStorage.getItem(KEYS.TOKEN);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(KEYS.TOKEN, token);
  else localStorage.removeItem(KEYS.TOKEN);
}
