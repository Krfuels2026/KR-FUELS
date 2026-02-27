const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

const storageKey = 'kr_fuels_token';

export function setToken(token: string | null) {
  if (token) localStorage.setItem(storageKey, token);
  else localStorage.removeItem(storageKey);
}

export function getToken(): string | null {
  return localStorage.getItem(storageKey);
}

async function apiFetch(path: string, opts: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers as Record<string, string> || {}),
  };

  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...opts, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText} - ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  login: (username: string, password: string) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  getProfile: () => apiFetch('/auth/profile'),
  getBunks: () => apiFetch('/bunks'),
  getAccounts: () => apiFetch('/accounts'),
  getVouchers: () => apiFetch('/vouchers'),
  getReminders: () => apiFetch('/reminders'),
  createAccount: (data: any) => apiFetch('/accounts', { method: 'POST', body: JSON.stringify(data) }),
  updateAccount: (id: string, data: any) => apiFetch(`/accounts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  createVoucher: (data: any) => apiFetch('/vouchers', { method: 'POST', body: JSON.stringify(data) }),
  updateVoucher: (id: string, data: any) => apiFetch(`/vouchers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteVoucher: (id: string) => apiFetch(`/vouchers/${id}`, { method: 'DELETE' }),
  createReminder: (data: any) => apiFetch('/reminders', { method: 'POST', body: JSON.stringify(data) }),
  updateReminder: (id: string, data: any) => apiFetch(`/reminders/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteReminder: (id: string) => apiFetch(`/reminders/${id}`, { method: 'DELETE' }),
};

export default api;
