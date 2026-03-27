
import { Account, Voucher, LedgerEntry } from './types';

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatDateToDDMMYYYY = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  return `${d}-${m}-${y}`;
};

export const getHierarchyPath = (accounts: Account[], accountId: string): string => {
  const account = accounts.find(a => a.id === accountId);
  if (!account) return '';
  if (!account.parentId) return account.name;
  return `${getHierarchyPath(accounts, account.parentId)} > ${account.name}`;
};

export const calculateLedger = (
  account: Account,
  vouchers: Voucher[],
  fromDate: string,
  toDate: string
): LedgerEntry[] => {
  // Sort vouchers by date
  const sortedVouchers = [...vouchers].sort((a, b) => a.date.localeCompare(b.date));
  
  // Calculate initial opening balance for the ledger period
  let runningBalance = account.openingDebit - account.openingCredit;
  
  const entries: LedgerEntry[] = [];

  // Before fromDate
  sortedVouchers.forEach(v => {
    if (v.date < fromDate) {
      runningBalance += (v.debit - v.credit);
    }
  });

  // During period
  sortedVouchers.forEach(v => {
    if (v.date >= fromDate && v.date <= toDate) {
      runningBalance += (v.debit - v.credit);
      entries.push({
        date: v.date,
        description: v.description,
        debit: v.debit,
        credit: v.credit,
        balance: Math.abs(runningBalance),
        balanceType: runningBalance >= 0 ? 'Dr' : 'Cr',
        accountId: v.accountId
      });
    }
  });

  return entries;
};

export const getChildAccounts = (accounts: Account[], parentId: string | null): Account[] => {
  return accounts.filter(a => a.parentId === parentId);
};
