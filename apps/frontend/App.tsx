
import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import AccountMaster from './pages/AccountMaster';
import AccountsList from './pages/AccountsList';
import DailyVoucher from './pages/DailyVoucher';
import LedgerReport from './pages/LedgerReport';
import CashReport from './pages/CashReport';
import Dashboard from './pages/Dashboard';
import Reminders from './pages/Reminders';
import RemindersConvex from './pages/RemindersConvex'; // PoC: Uses Convex
import Login from './pages/Login';
import Administration from './pages/Administration';
import { Account, Voucher, Bunk, User, Reminder } from './types';
import api, { setToken, getToken } from './api';
import { useQuery } from 'convex/react';
import { api as convexApi } from '../../convex/_generated/api';

// Frontend no longer seeds data locally — load via API

const isUuid = (v?: string) => !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

const App: React.FC = () => {
  // Load bunks from Convex
  const convexBunks = useQuery(convexApi.queries.bunks.getAllBunks);
  
  const [bunks, setBunks] = useState<Bunk[]>(() => {
    return [];
  });

  const [users, setUsers] = useState<User[]>([]);

  const [currentUser, setCurrentUser] = useState<User | null>(null);

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

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('kr_fuels_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('kr_fuels_user');
    localStorage.removeItem('kr_fuels_current_bunk');
  };

  useEffect(() => {
    if (currentBunkId) localStorage.setItem('kr_fuels_current_bunk', currentBunkId);
  }, [currentBunkId]);

  useEffect(() => {
    // Persist minimal UI state only
    localStorage.setItem('kr_fuels_bunks_db', JSON.stringify(bunks));
  }, [bunks]);

  useEffect(() => {
    localStorage.setItem('kr_fuels_reminders', JSON.stringify(reminders));
  }, [reminders]);

  // Convert Convex bunks to frontend format
  useEffect(() => {
    if (convexBunks) {
      const formattedBunks: Bunk[] = convexBunks.map((b: any) => ({
        id: b._id,
        name: b.name,
        code: b.code,
        location: b.location,
      }));
      setBunks(formattedBunks);
    }
  }, [convexBunks]);

  // Load initial data from API when authenticated
  useEffect(() => {
    const t = getToken();
    if (!t) return;

    // Skip NestJS API calls for now since we migrated to Convex
    // Only load accounts and vouchers if NestJS is still running
    console.log('Skipping NestJS API calls - using Convex for bunks and auth');
  }, []);

  const bunkAccounts = useMemo(() => accounts.filter(a => a.bunkId === currentBunkId), [accounts, currentBunkId]);
  const bunkVouchers = useMemo(() => vouchers.filter(v => v.bunkId === currentBunkId), [vouchers, currentBunkId]);

  const addAccount = (account: Partial<Account>) => {
    const newAccount = { ...account, bunkId: currentBunkId } as Account;
    setAccounts(prev => [...prev, newAccount]);
  };

  const updateAccount = (account: Account) => {
    setAccounts(prev => prev.map(a => a.id === account.id ? account : a));
  };

  const deleteAccount = (id: string) => {
    const hasChildren = accounts.some(a => a.parentId === id);
    if (hasChildren) {
      alert("Cannot delete account group with active sub-accounts.");
      return;
    }
    setAccounts(prev => prev.filter(a => a.id !== id));
    setVouchers(prev => prev.filter(v => v.accountId !== id));
  };

  const addVoucher = (voucher: Partial<Voucher>) => {
    (async () => {
      const token = getToken();
      if (token) {
        try {
          if (!voucher.accountId || !isUuid(voucher.accountId)) {
            alert('Please select a valid ledger account before posting (account must be selected).');
            return;
          }
          if (!currentBunkId || !isUuid(currentBunkId)) {
            alert('No bunk selected. Please select a bunk before posting.');
            return;
          }

          const payload = {
            date: voucher.date,
            accountId: String(voucher.accountId),
            debit: voucher.debit || 0,
            credit: voucher.credit || 0,
            description: voucher.description || '',
            bunkId: String(currentBunkId),
          };
          const created = await api.createVoucher(payload);
          setVouchers(prev => [...prev, created]);
        } catch (err: any) {
          alert('Failed to post voucher: ' + (err.message || err));
        }
      } else {
        const newVoucher = { ...voucher, bunkId: currentBunkId } as Voucher;
        setVouchers(prev => [...prev, newVoucher]);
      }
    })();
  };

  const deleteVoucher = (id: string) => {
    (async () => {
      const token = getToken();
      if (token) {
        try {
          await api.deleteVoucher(id);
          setVouchers(prev => prev.filter(v => v.id !== id));
        } catch (err: any) {
          alert('Failed to delete voucher: ' + (err.message || err));
        }
      } else {
        setVouchers(prev => prev.filter(v => v.id !== id));
      }
    })();
  };

  const updateVoucher = (voucher: Voucher) => {
    (async () => {
      const token = getToken();
      if (token) {
        try {
          const payload: any = {
            date: voucher.date,
            accountId: voucher.accountId,
            debit: voucher.debit,
            credit: voucher.credit,
            description: voucher.description,
          };
          const updated = await api.updateVoucher(voucher.id, payload);
          setVouchers(prev => prev.map(v => v.id === voucher.id ? updated : v));
        } catch (err: any) {
          alert('Failed to update voucher: ' + (err.message || err));
        }
      } else {
        setVouchers(prev => prev.map(v => v.id === voucher.id ? voucher : v));
      }
    })();
  };

  const addReminder = (reminder: Partial<Reminder>) => {
    const newReminder: Reminder = {
      id: `r_${Math.random().toString(36).substr(2, 9)}`,
      title: reminder.title || 'Untitled',
      description: reminder.description || '',
      reminderDate: reminder.reminderDate || new Date().toISOString().split('T')[0],
      dueDate: reminder.dueDate || new Date().toISOString().split('T')[0],
      createdAt: Date.now(),
      createdBy: reminder.createdBy || currentUser?.username
    };
    setReminders(prev => [...prev, newReminder]);
  };

  const deleteReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  const updateReminder = (reminder: Reminder) => {
    setReminders(prev => prev.map(r => r.id === reminder.id ? reminder : r));
  };

  const currentBunk = availableBunks.find(b => b.id === currentBunkId) || availableBunks[0] || bunks[0];

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <Layout 
          bunks={availableBunks} 
          currentBunk={currentBunk} 
          onBunkChange={setCurrentBunkId}
          onLogout={handleLogout}
          user={currentUser}
          reminders={reminders}
          onAddReminder={addReminder}
          onDeleteReminder={deleteReminder}
        >
        <Routes>
          <Route 
            path="/" 
            element={
              <Dashboard 
                accounts={bunkAccounts} 
                vouchers={bunkVouchers} 
                locationName={currentBunk.location} 
                onDeleteVoucher={deleteVoucher}
                reminders={[]} // PoC: Reminders now use Convex, Dashboard shows none for now
              />
            } 
          />
          <Route path="/accounts" element={<AccountsList accounts={bunkAccounts} deleteAccount={deleteAccount} />} />
          <Route path="/account-master" element={<AccountMaster accounts={bunkAccounts} onSave={addAccount} onUpdate={updateAccount} onDelete={deleteAccount} />} />
          <Route path="/account-master/:id" element={<AccountMaster accounts={bunkAccounts} onSave={addAccount} onUpdate={updateAccount} onDelete={deleteAccount} />} />
          <Route path="/vouchers" element={<DailyVoucher accounts={bunkAccounts} vouchers={bunkVouchers} onSave={addVoucher} onUpdateVoucher={updateVoucher} onDeleteVoucher={deleteVoucher} />} />
          <Route path="/ledger" element={<LedgerReport accounts={bunkAccounts} vouchers={bunkVouchers} />} />
          <Route path="/cash-report" element={<CashReport accounts={bunkAccounts} vouchers={bunkVouchers} onDeleteVoucher={deleteVoucher} />} />
          <Route path="/reminders" element={<RemindersConvex />} />
          {currentUser.role === 'super_admin' && (
            <Route path="/administration" element={<Administration bunks={bunks} users={users} setBunks={setBunks} setUsers={setUsers} />} />
          )}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
