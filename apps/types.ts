
export interface Bunk {
  id: string;
  name: string;
  code: string;
  location: string;
}

export interface User {
  username: string;
  password?: string; // Stored for simulated user management
  role: 'admin' | 'super_admin';
  name: string;
  accessibleBunkIds?: string[];
}

export interface Account {
  id: string;
  name: string;
  parentId: string | null;
  openingDebit: number;
  openingCredit: number;
  createdAt: number;
  bunkId: string;
}

export interface Voucher {
  id: string;
  date: string;
  accountId: string;
  debit: number;
  credit: number;
  description: string;
  createdAt: number;
  bunkId: string;
}

export interface LedgerEntry {
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  balanceType: 'Dr' | 'Cr';
  accountId?: string;
}

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  reminderDate: string; // ISO yyyy-mm-dd
  dueDate: string; // ISO yyyy-mm-dd
  createdAt: number;
  createdBy?: string;
}
