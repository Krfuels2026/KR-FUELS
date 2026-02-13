
import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import AccountMaster from './pages/AccountMaster';
import AccountsList from './pages/AccountsList';
import DailyVoucher from './pages/DailyVoucher';
import LedgerReport from './pages/LedgerReport';
import CashReport from './pages/CashReport';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Administration from './pages/Administration';
import { Account, Voucher, Bunk, User } from './types';

const INITIAL_BUNKS: Bunk[] = [
  { id: 'bunk_1', name: 'KR FUELS - UDUMELPET', code: 'UDM01', location: 'UDUMELPET' },
  { id: 'bunk_2', name: 'KR FUELS - SARAVANAMPATTI', code: 'SRV02', location: 'SARAVANAMPATTI' },
  { id: 'bunk_3', name: 'KR FUELS - METTUPALAYAM', code: 'MTP03', location: 'METTUPALAYAM' },
  { id: 'bunk_4', name: 'KR FUELS - TIRUCHY', code: 'TRY04', location: 'TIRUCHY' },
  { id: 'bunk_5', name: 'KR FUELS - POLLACHI', code: 'POL05', location: 'POLLACHI' },
];

// Seed data generator for testing
const generateSeedData = (bunks: Bunk[]) => {
  const accounts: Account[] = [];
  const vouchers: Voucher[] = [];
  
  const getISODate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };

  bunks.forEach((bunk, index) => {
    const assetsId = `assets_${bunk.id}`;
    const incomeId = `income_${bunk.id}`;
    const expenseId = `expense_${bunk.id}`;
    const liabilitiesId = `liab_${bunk.id}`;

    accounts.push(
      { id: assetsId, name: 'CURRENT ASSETS', parentId: null, openingDebit: 0, openingCredit: 0, createdAt: Date.now(), bunkId: bunk.id },
      { id: incomeId, name: 'DIRECT INCOME', parentId: null, openingDebit: 0, openingCredit: 0, createdAt: Date.now(), bunkId: bunk.id },
      { id: expenseId, name: 'OPERATING EXPENSES', parentId: null, openingDebit: 0, openingCredit: 0, createdAt: Date.now(), bunkId: bunk.id },
      { id: liabilitiesId, name: 'CURRENT LIABILITIES', parentId: null, openingDebit: 0, openingCredit: 0, createdAt: Date.now(), bunkId: bunk.id }
    );

    const cashAccId = `cash_${bunk.id}`;
    const bankAccId = `bank_${bunk.id}`;
    const petrolSalesId = `petrol_${bunk.id}`;
    const dieselSalesId = `diesel_${bunk.id}`;
    const salaryId = `salary_${bunk.id}`;
    const electricityId = `elec_${bunk.id}`;
    const supplierId = `supplier_${bunk.id}`;

    const baseBalance = (index + 1) * 25000;

    accounts.push(
      { id: cashAccId, name: 'CASH IN HAND', parentId: assetsId, openingDebit: baseBalance, openingCredit: 0, createdAt: Date.now(), bunkId: bunk.id },
      { id: bankAccId, name: 'HDFC BANK A/C', parentId: assetsId, openingDebit: baseBalance * 5, openingCredit: 0, createdAt: Date.now(), bunkId: bunk.id },
      { id: petrolSalesId, name: 'PETROL SALES', parentId: incomeId, openingDebit: 0, openingCredit: 0, createdAt: Date.now(), bunkId: bunk.id },
      { id: dieselSalesId, name: 'DIESEL SALES', parentId: incomeId, openingDebit: 0, openingCredit: 0, createdAt: Date.now(), bunkId: bunk.id },
      { id: salaryId, name: 'STAFF SALARIES', parentId: expenseId, openingDebit: 0, openingCredit: 0, createdAt: Date.now(), bunkId: bunk.id },
      { id: electricityId, name: 'ELECTRICITY CHARGES', parentId: expenseId, openingDebit: 0, openingCredit: 0, createdAt: Date.now(), bunkId: bunk.id },
      { id: supplierId, name: 'HPCL MAIN SUPPLIER', parentId: liabilitiesId, openingDebit: 0, openingCredit: baseBalance * 10, createdAt: Date.now(), bunkId: bunk.id }
    );

    for (let day = 0; day <= 7; day++) {
      const date = getISODate(day);
      const dayFactor = (8 - day);
      const pSales = 30000 + (Math.random() * 15000) * dayFactor;
      const dSales = 50000 + (Math.random() * 25000) * dayFactor;

      vouchers.push(
        { id: `v_ps_${bunk.id}_${day}`, date, accountId: petrolSalesId, debit: 0, credit: pSales, description: 'Daily Petrol Sales', createdAt: Date.now(), bunkId: bunk.id },
        { id: `v_pc_${bunk.id}_${day}`, date, accountId: cashAccId, debit: pSales, credit: 0, description: 'Cash from Petrol Sales', createdAt: Date.now(), bunkId: bunk.id },
        { id: `v_ds_${bunk.id}_${day}`, date, accountId: dieselSalesId, debit: 0, credit: dSales, description: 'Daily Diesel Sales', createdAt: Date.now(), bunkId: bunk.id },
        { id: `v_dc_${bunk.id}_${day}`, date, accountId: cashAccId, debit: dSales, credit: 0, description: 'Cash from Diesel Sales', createdAt: Date.now(), bunkId: bunk.id }
      );
    }
  });

  return { accounts, vouchers };
};

const App: React.FC = () => {
  const [bunks, setBunks] = useState<Bunk[]>(() => {
    const saved = localStorage.getItem('kr_fuels_bunks_db');
    return saved ? JSON.parse(saved) : INITIAL_BUNKS;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('kr_fuels_users_db');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('kr_fuels_user');
    return saved ? JSON.parse(saved) : null;
  });

  const availableBunks = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'super_admin') return bunks;
    if (currentUser.accessibleBunkIds) {
      return bunks.filter(b => currentUser.accessibleBunkIds?.includes(b.id));
    }
    return [bunks[0]];
  }, [currentUser, bunks]);

  const [currentBunkId, setCurrentBunkId] = useState<string>(() => {
    const saved = localStorage.getItem('kr_fuels_current_bunk');
    if (saved && availableBunks.some(b => b.id === saved)) return saved;
    return availableBunks.length > 0 ? availableBunks[0].id : bunks[0].id;
  });

  useEffect(() => {
    if (availableBunks.length > 0 && !availableBunks.some(b => b.id === currentBunkId)) {
      setCurrentBunkId(availableBunks[0].id);
    }
  }, [availableBunks, currentBunkId]);

  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('kr_fuels_accounts');
    if (saved) return JSON.parse(saved);
    const { accounts } = generateSeedData(INITIAL_BUNKS);
    return accounts;
  });

  const [vouchers, setVouchers] = useState<Voucher[]>(() => {
    const saved = localStorage.getItem('kr_fuels_vouchers');
    if (saved) return JSON.parse(saved);
    const { vouchers } = generateSeedData(INITIAL_BUNKS);
    return vouchers;
  });

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
    localStorage.setItem('kr_fuels_current_bunk', currentBunkId);
  }, [currentBunkId]);

  useEffect(() => {
    localStorage.setItem('kr_fuels_accounts', JSON.stringify(accounts));
    localStorage.setItem('kr_fuels_vouchers', JSON.stringify(vouchers));
    localStorage.setItem('kr_fuels_bunks_db', JSON.stringify(bunks));
    localStorage.setItem('kr_fuels_users_db', JSON.stringify(users));
  }, [accounts, vouchers, bunks, users]);

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
    const newVoucher = { ...voucher, bunkId: currentBunkId } as Voucher;
    setVouchers(prev => [...prev, newVoucher]);
  };

  const deleteVoucher = (id: string) => {
    setVouchers(prev => prev.filter(v => v.id !== id));
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
              />
            } 
          />
          <Route path="/accounts" element={<AccountsList accounts={bunkAccounts} deleteAccount={deleteAccount} />} />
          <Route path="/account-master" element={<AccountMaster accounts={bunkAccounts} onSave={addAccount} onUpdate={updateAccount} onDelete={deleteAccount} />} />
          <Route path="/account-master/:id" element={<AccountMaster accounts={bunkAccounts} onSave={addAccount} onUpdate={updateAccount} onDelete={deleteAccount} />} />
          <Route path="/vouchers" element={<DailyVoucher accounts={bunkAccounts} onSave={addVoucher} />} />
          <Route path="/ledger" element={<LedgerReport accounts={bunkAccounts} vouchers={bunkVouchers} />} />
          <Route path="/cash-report" element={<CashReport accounts={bunkAccounts} vouchers={bunkVouchers} onDeleteVoucher={deleteVoucher} />} />
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
