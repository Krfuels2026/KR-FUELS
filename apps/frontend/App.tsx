import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import AccountMaster from './pages/AccountMaster';
import AccountsList from './pages/AccountsList';
import DailyVoucher from './pages/DailyVoucher';
import LedgerReport from './pages/LedgerReport';
import CashReport from './pages/CashReport';
import Dashboard from './pages/Dashboard';
import Reminders from './pages/Reminders';
import Login from './pages/Login';
import Administration from './pages/Administration';
import { Account, Voucher, Bunk, User } from './types';
import { getStoredUser, setStoredUser, clearStoredUser } from './lib/storage';
import { useIdleLogout } from './hooks/useIdleLogout';
import { useQuery, useMutation } from 'convex/react';
import { api as convexApi } from '../../convex/_generated/api';

// Convex IDs are opaque strings, not UUIDs
const isValidId = (v?: string) => !!v && v.trim().length > 0;

const App: React.FC = () => {
  // ── Convex Queries (real-time) ─────────────────────────────────────
  const convexBunks = useQuery(convexApi.queries.bunks.getAllBunks);
  const convexAccounts = useQuery(convexApi.queries.accounts.getAllAccounts);
  const convexVouchers = useQuery(convexApi.queries.vouchers.getAllVouchers);
  const convexReminders = useQuery(convexApi.queries.reminders.getAllReminders);

  // ── Convex Mutations ───────────────────────────────────────────────
  const convexCreateAccount = useMutation(convexApi.mutations.accounts.createAccount);
  const convexUpdateAccount = useMutation(convexApi.mutations.accounts.updateAccount);
  const convexDeleteAccount = useMutation(convexApi.mutations.accounts.deleteAccount);
  const convexCreateVoucher = useMutation(convexApi.mutations.vouchers.createVoucher);
  const convexUpdateVoucher = useMutation(convexApi.mutations.vouchers.updateVoucher);
  const convexDeleteVoucher = useMutation(convexApi.mutations.vouchers.deleteVoucher);

  const [bunks, setBunks] = useState<Bunk[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);

  const [currentUser, setCurrentUser] = useState<User | null>(() => getStoredUser<User>());

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    clearStoredUser();
  }, []);

  // 30-minute idle auto-logout
  useIdleLogout(handleLogout);

  const availableBunks = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'super_admin') return bunks;
    if (currentUser.accessibleBunkIds) {
      return bunks.filter(b => currentUser.accessibleBunkIds?.includes(b.id));
    }
    return [bunks[0]];
  }, [currentUser, bunks]);

  const [currentBunkId, setCurrentBunkId] = useState<string>('');

  useEffect(() => {
    if (availableBunks.length > 0 && !availableBunks.some(b => b.id === currentBunkId)) {
      setCurrentBunkId(availableBunks[0].id);
    }
  }, [availableBunks, currentBunkId]);

  const bunkAccounts = useMemo(() => accounts.filter(a => a.bunkId === currentBunkId), [accounts, currentBunkId]);
  const bunkVouchers = useMemo(() => vouchers.filter(v => v.bunkId === currentBunkId), [vouchers, currentBunkId]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setStoredUser(user);
  };

  useEffect(() => {
    if (currentBunkId) localStorage.setItem('kr_fuels_current_bunk', currentBunkId);
  }, [currentBunkId]);

  // Sync Convex bunks → state
  useEffect(() => {
    if (convexBunks) {
      setBunks(convexBunks.map((b: any) => ({
        id: b._id,
        name: b.name,
        code: b.code,
        location: b.location,
      })));
    }
  }, [convexBunks]);

  // Sync Convex accounts → state
  useEffect(() => {
    if (convexAccounts) {
      setAccounts(convexAccounts.map((a: any) => ({
        id: a._id,
        name: a.name,
        parentId: a.parentId ?? null,
        openingDebit: a.openingDebit,
        openingCredit: a.openingCredit,
        createdAt: a.createdAt,
        bunkId: a.bunkId,
      })));
    }
  }, [convexAccounts]);

  // Sync Convex vouchers → state
  useEffect(() => {
    if (convexVouchers) {
      setVouchers(convexVouchers.map((v: any) => ({
        id: v._id,
        date: v.txnDate,
        accountId: v.accountId,
        debit: v.debit,
        credit: v.credit,
        description: v.description,
        createdAt: v.createdAt,
        bunkId: v.bunkId,
      })));
    }
  }, [convexVouchers]);

  const addAccount = async (account: Partial<Account>) => {
    if (!account.name) return;
    try {
      await convexCreateAccount({
        name: account.name,
        parentId: (account.parentId as any) || undefined,
        openingDebit: account.openingDebit || 0,
        openingCredit: account.openingCredit || 0,
        bunkId: currentBunkId as any,
      });
    } catch (err: any) {
      alert('Failed to create account: ' + (err.message || err));
    }
  };

  const updateAccount = async (account: Account) => {
    try {
      await convexUpdateAccount({
        id: account.id as any,
        name: account.name,
        parentId: (account.parentId as any) || undefined,
        openingDebit: account.openingDebit,
        openingCredit: account.openingCredit,
      });
    } catch (err: any) {
      alert('Failed to update account: ' + (err.message || err));
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      await convexDeleteAccount({ id: id as any });
    } catch (err: any) {
      alert(err.message || 'Failed to delete account');
    }
  };

  const addVoucher = async (voucher: Partial<Voucher>) => {
    if (!voucher.accountId || !isValidId(voucher.accountId)) {
      alert('Please select a valid ledger account before posting.');
      return;
    }
    if (!currentBunkId || !isValidId(currentBunkId)) {
      alert('No bunk selected. Please select a bunk before posting.');
      return;
    }
    try {
      await convexCreateVoucher({
        txnDate: voucher.date || new Date().toISOString().split('T')[0],
        accountId: voucher.accountId as any,
        debit: voucher.debit || 0,
        credit: voucher.credit || 0,
        description: voucher.description || '',
        bunkId: currentBunkId as any,
      });
    } catch (err: any) {
      alert('Failed to post voucher: ' + (err.message || err));
    }
  };

  const deleteVoucher = async (id: string) => {
    try {
      await convexDeleteVoucher({ id: id as any });
    } catch (err: any) {
      alert('Failed to delete voucher: ' + (err.message || err));
    }
  };

  const updateVoucher = async (voucher: Voucher) => {
    try {
      await convexUpdateVoucher({
        id: voucher.id as any,
        txnDate: voucher.date,
        accountId: voucher.accountId as any,
        debit: voucher.debit,
        credit: voucher.credit,
        description: voucher.description,
      });
    } catch (err: any) {
      alert('Failed to update voucher: ' + (err.message || err));
    }
  };

  const currentBunk = availableBunks.find(b => b.id === currentBunkId) || availableBunks[0] || bunks[0];

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  // Wait for Convex data to load before rendering
  if (convexBunks === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Layout 
          bunks={availableBunks} 
          currentBunk={currentBunk} 
          onBunkChange={setCurrentBunkId}
          onLogout={handleLogout}
          user={currentUser}
        >
        <Routes>
          <Route 
            path="/" 
            element={
              <Dashboard 
                accounts={bunkAccounts} 
                vouchers={bunkVouchers} 
                locationName={currentBunk?.location || ''} 
                onDeleteVoucher={deleteVoucher}
                reminders={
                  (convexReminders || []).map((r: any) => ({
                    id: r._id,
                    title: r.title,
                    description: r.description,
                    reminderDate: r.reminderDate,
                    dueDate: r.dueDate,
                    createdAt: r.createdAt,
                    createdBy: r.createdBy,
                  }))
                }
              />
            } 
          />
          <Route path="/accounts" element={<AccountsList accounts={bunkAccounts} deleteAccount={deleteAccount} />} />
          <Route path="/account-master" element={<AccountMaster accounts={bunkAccounts} onSave={addAccount} onUpdate={updateAccount} onDelete={deleteAccount} />} />
          <Route path="/account-master/:id" element={<AccountMaster accounts={bunkAccounts} onSave={addAccount} onUpdate={updateAccount} onDelete={deleteAccount} />} />
          <Route path="/vouchers" element={<DailyVoucher accounts={bunkAccounts} vouchers={bunkVouchers} onSave={addVoucher} onUpdateVoucher={updateVoucher} onDeleteVoucher={deleteVoucher} />} />
          <Route path="/ledger" element={<LedgerReport accounts={bunkAccounts} vouchers={bunkVouchers} />} />
          <Route path="/cash-report" element={<CashReport accounts={bunkAccounts} vouchers={bunkVouchers} onDeleteVoucher={deleteVoucher} />} />
          <Route path="/reminders" element={<Reminders />} />
          {currentUser.role === 'super_admin' && (
            <Route path="/administration" element={<Administration />} />
          )}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
