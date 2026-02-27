
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
import Login from './pages/Login';
import Administration from './pages/Administration';
import { Account, Voucher, Bunk, User, Reminder } from './types';

// Realistic initial locations for the application (expanded)
const INITIAL_BUNKS: Bunk[] = [
  { id: 'bunk_udm', name: 'KR FUELS - UDUMELPET', code: 'UDM01', location: 'Udumelpettai' },
  { id: 'bunk_srv', name: 'KR FUELS - SARAVANAMPATTI', code: 'SRV02', location: 'Saravanampatti' },
  { id: 'bunk_mtp', name: 'KR FUELS - METTUPALAYAM', code: 'MTP03', location: 'Mettupalayam' },
  { id: 'bunk_try', name: 'KR FUELS - TIRUCHY', code: 'TRY04', location: 'Tiruchirappalli' },
  { id: 'bunk_pol', name: 'KR FUELS - POLLACHI', code: 'POL05', location: 'Pollachi' },
  { id: 'bunk_kgp', name: 'KR FUELS - KANGAYAM', code: 'KGP06', location: 'Kangayam' },
  { id: 'bunk_coi', name: 'KR FUELS - COIMBATORE', code: 'COI07', location: 'Coimbatore' },
  { id: 'bunk_sal', name: 'KR FUELS - SALEM', code: 'SAL08', location: 'Salem' }
];

// Comprehensive seed data generator for bunk accounting. Creates realistic accounts, vouchers and reminders.
const generateSeedData = (bunks: Bunk[]) => {
  const accounts: Account[] = [];
  const vouchers: Voucher[] = [];
  const reminders: Reminder[] = [];

  const getISODate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };

  bunks.forEach((bunk, bIndex) => {
    const now = Date.now();
    // Primary account groups
    const assetsId = `assets_${bunk.id}`;
    const incomeId = `income_${bunk.id}`;
    const expenseId = `expense_${bunk.id}`;
    const liabilitiesId = `liab_${bunk.id}`;

    accounts.push(
      { id: assetsId, name: 'CURRENT ASSETS', parentId: null, openingDebit: 0, openingCredit: 0, createdAt: now, bunkId: bunk.id },
      { id: incomeId, name: 'DIRECT INCOME', parentId: null, openingDebit: 0, openingCredit: 0, createdAt: now, bunkId: bunk.id },
      { id: expenseId, name: 'OPERATING EXPENSES', parentId: null, openingDebit: 0, openingCredit: 0, createdAt: now, bunkId: bunk.id },
      { id: liabilitiesId, name: 'CURRENT LIABILITIES', parentId: null, openingDebit: 0, openingCredit: 0, createdAt: now, bunkId: bunk.id }
    );

    // Asset ledger accounts
    const cashAccId = `cash_${bunk.id}`;
    const pettyCashId = `petty_${bunk.id}`;
    const bankAccId = `bank_hdfc_${bunk.id}`;
    const bankSbiId = `bank_sbi_${bunk.id}`;
    const inventoryId = `inventory_${bunk.id}`;
    const receivablesId = `receivables_${bunk.id}`;
    
    // Income ledger accounts
    const petrolSalesId = `petrol_${bunk.id}`;
    const dieselSalesId = `diesel_${bunk.id}`;
    const lpgSalesId = `lpg_${bunk.id}`;
    const lubeSalesId = `lube_${bunk.id}`;
    const serviceChargeId = `service_${bunk.id}`;
    const convStoreId = `convstore_${bunk.id}`;
    
    // Expense ledger accounts
    const salaryId = `salary_${bunk.id}`;
    const electricityId = `elec_${bunk.id}`;
    const waterBillId = `water_${bunk.id}`;
    const telephoneId = `phone_${bunk.id}`;
    const rentId = `rent_${bunk.id}`;
    const maintenanceId = `maint_${bunk.id}`;
    const insuranceId = `insurance_${bunk.id}`;
    const advertisingId = `advertising_${bunk.id}`;
    const officeSuppliesId = `office_${bunk.id}`;
    const securityId = `security_${bunk.id}`;
    const transportId = `transport_${bunk.id}`;
    const miscExpenseId = `misc_${bunk.id}`;
    
    // Liability ledger accounts
    const supplierHpId = `supplier_hp_${bunk.id}`;
    const supplierIocId = `supplier_ioc_${bunk.id}`;
    const loanBankId = `loan_${bunk.id}`;
    const tdsPayableId = `tds_${bunk.id}`;
    const gstPayableId = `gst_${bunk.id}`;

    const baseBalance = 15000 + bIndex * 10000;

    // Add all asset accounts
    accounts.push(
      { id: cashAccId, name: 'CASH IN HAND', parentId: assetsId, openingDebit: baseBalance, openingCredit: 0, createdAt: now, bunkId: bunk.id },
      { id: pettyCashId, name: 'PETTY CASH', parentId: assetsId, openingDebit: 5000, openingCredit: 0, createdAt: now, bunkId: bunk.id },
      { id: bankAccId, name: 'HDFC BANK A/C', parentId: assetsId, openingDebit: baseBalance * 4, openingCredit: 0, createdAt: now, bunkId: bunk.id },
      { id: bankSbiId, name: 'SBI BANK A/C', parentId: assetsId, openingDebit: baseBalance * 2, openingCredit: 0, createdAt: now, bunkId: bunk.id },
      { id: inventoryId, name: 'FUEL INVENTORY', parentId: assetsId, openingDebit: baseBalance * 8, openingCredit: 0, createdAt: now, bunkId: bunk.id },
      { id: receivablesId, name: 'ACCOUNTS RECEIVABLE', parentId: assetsId, openingDebit: baseBalance * 1.5, openingCredit: 0, createdAt: now, bunkId: bunk.id }
    );

    // Add all income accounts
    accounts.push(
      { id: petrolSalesId, name: 'PETROL SALES', parentId: incomeId, openingDebit: 0, openingCredit: 0, createdAt: now, bunkId: bunk.id },
      { id: dieselSalesId, name: 'DIESEL SALES', parentId: incomeId, openingDebit: 0, openingCredit: 0, createdAt: now, bunkId: bunk.id },
      { id: lpgSalesId, name: 'LPG SALES', parentId: incomeId, openingDebit: 0, openingCredit: 0, createdAt: now, bunkId: bunk.id },
      { id: lubeSalesId, name: 'LUBRICANT SALES', parentId: incomeId, openingDebit: 0, openingCredit: 0, createdAt: now, bunkId: bunk.id },
      { id: serviceChargeId, name: 'SERVICE CHARGES', parentId: incomeId, openingDebit: 0, openingCredit: 0, createdAt: now, bunkId: bunk.id },
      { id: convStoreId, name: 'CONVENIENCE STORE SALES', parentId: incomeId, openingDebit: 0, openingCredit: 0, createdAt: now, bunkId: bunk.id }
    );

    // Add all expense accounts
    accounts.push(
      { id: salaryId, name: 'STAFF SALARIES', parentId: expenseId, openingDebit: 0, openingCredit: 0, createdAt: now, bunkId: bunk.id },
      { id: electricityId, name: 'ELECTRICITY CHARGES', parentId: expenseId, openingDebit: 0, openingCredit: 0, createdAt: now, bunkId: bunk.id },
      { id: waterBillId, name: 'WATER CHARGES', parentId: expenseId, openingDebit: 0, openingCredit: 0, createdAt: now, bunkId: bunk.id },
      { id: telephoneId, name: 'TELEPHONE & INTERNET', parentId: expenseId, openingDebit: 0, openingCredit: 0, createdAt: now, bunkId: bunk.id },
      { id: rentId, name: 'RENT EXPENSE', parentId: expenseId, openingDebit: 0, openingCredit: 0, createdAt: now, bunkId: bunk.id },
      { id: maintenanceId, name: 'MAINTENANCE & REPAIRS', parentId: expenseId, openingDebit: 0, openingCredit: 0, createdAt: now, bunkId: bunk.id },
      { id: insuranceId, name: 'INSURANCE PREMIUM', parentId: expenseId, openingDebit: 0, openingCredit: 0, createdAt: now, bunkId: bunk.id },
      { id: advertisingId, name: 'ADVERTISING & PROMOTION', parentId: expenseId, openingDebit: 0, openingCredit: 0, createdAt: now, bunkId: bunk.id },
      { id: officeSuppliesId, name: 'OFFICE SUPPLIES', parentId: expenseId, openingDebit: 0, openingCredit: 0, createdAt: now, bunkId: bunk.id },
      { id: securityId, name: 'SECURITY SERVICES', parentId: expenseId, openingDebit: 0, openingCredit: 0, createdAt: now, bunkId: bunk.id },
      { id: transportId, name: 'TRANSPORT & VEHICLE', parentId: expenseId, openingDebit: 0, openingCredit: 0, createdAt: now, bunkId: bunk.id },
      { id: miscExpenseId, name: 'MISCELLANEOUS EXPENSES', parentId: expenseId, openingDebit: 0, openingCredit: 0, createdAt: now, bunkId: bunk.id }
    );

    // Add all liability accounts
    accounts.push(
      { id: supplierHpId, name: 'HPCL FUEL SUPPLIER', parentId: liabilitiesId, openingDebit: 0, openingCredit: baseBalance * 6, createdAt: now, bunkId: bunk.id },
      { id: supplierIocId, name: 'IOC SUPPLIER', parentId: liabilitiesId, openingDebit: 0, openingCredit: baseBalance * 4, createdAt: now, bunkId: bunk.id },
      { id: loanBankId, name: 'BANK LOAN', parentId: liabilitiesId, openingDebit: 0, openingCredit: baseBalance * 10, createdAt: now, bunkId: bunk.id },
      { id: tdsPayableId, name: 'TDS PAYABLE', parentId: liabilitiesId, openingDebit: 0, openingCredit: 3000, createdAt: now, bunkId: bunk.id },
      { id: gstPayableId, name: 'GST PAYABLE', parentId: liabilitiesId, openingDebit: 0, openingCredit: 8000, createdAt: now, bunkId: bunk.id }
    );

    // Generate comprehensive vouchers for past 30 days
    for (let day = 0; day < 30; day++) {
      const date = getISODate(day);
      
      // Daily fuel sales (main revenue)
      const petrol = Math.round(25000 + Math.random() * 25000);
      const diesel = Math.round(40000 + Math.random() * 35000);
      const lpg = Math.round(6000 + Math.random() * 8000);
      const lube = Math.round(2000 + Math.random() * 4000);
      const service = Math.round(1000 + Math.random() * 2000);
      const convStore = Math.round(3000 + Math.random() * 5000);
      
      vouchers.push(
        // Sales transactions
        { id: `v_pet_${bunk.id}_${day}`, date, accountId: petrolSalesId, debit: 0, credit: petrol, description: 'Petrol sales - retail', createdAt: now - day * 1000, bunkId: bunk.id },
        { id: `v_dsl_${bunk.id}_${day}`, date, accountId: dieselSalesId, debit: 0, credit: diesel, description: 'Diesel sales - retail', createdAt: now - day * 1000, bunkId: bunk.id },
        { id: `v_lpg_${bunk.id}_${day}`, date, accountId: lpgSalesId, debit: 0, credit: lpg, description: 'LPG cylinder sales', createdAt: now - day * 1000, bunkId: bunk.id },
        { id: `v_lube_${bunk.id}_${day}`, date, accountId: lubeSalesId, debit: 0, credit: lube, description: 'Lubricant & oil sales', createdAt: now - day * 1000, bunkId: bunk.id },
        { id: `v_svc_${bunk.id}_${day}`, date, accountId: serviceChargeId, debit: 0, credit: service, description: 'Vehicle service charges', createdAt: now - day * 1000, bunkId: bunk.id },
        { id: `v_conv_${bunk.id}_${day}`, date, accountId: convStoreId, debit: 0, credit: convStore, description: 'Convenience store sales', createdAt: now - day * 1000, bunkId: bunk.id },
        
        // Cash receipts
        { id: `v_cash_${bunk.id}_${day}`, date, accountId: cashAccId, debit: petrol + diesel + lpg + lube + service + convStore, credit: 0, description: 'Daily cash collection', createdAt: now - day * 1000, bunkId: bunk.id }
      );

      // Bank deposits every 3 days
      if (day % 3 === 0) {
        const depositAmt = Math.round(150000 + Math.random() * 100000);
        vouchers.push(
          { id: `v_dep_cash_${bunk.id}_${day}`, date, accountId: cashAccId, debit: 0, credit: depositAmt, description: 'Cash deposited to bank', createdAt: now - day * 1000, bunkId: bunk.id },
          { id: `v_dep_bank_${bunk.id}_${day}`, date, accountId: bankAccId, debit: depositAmt, credit: 0, description: 'Cash deposit received', createdAt: now - day * 1000, bunkId: bunk.id }
        );
      }

      // Supplier payments every 5 days
      if (day % 5 === 0) {
        const payment = Math.round(80000 + Math.random() * 60000);
        vouchers.push(
          { id: `v_sup_pay_${bunk.id}_${day}`, date, accountId: supplierHpId, debit: payment, credit: 0, description: 'Payment to fuel supplier', createdAt: now - day * 1000, bunkId: bunk.id },
          { id: `v_sup_bank_${bunk.id}_${day}`, date, accountId: bankAccId, debit: 0, credit: payment, description: 'Bank transfer to supplier', createdAt: now - day * 1000, bunkId: bunk.id }
        );
      }

      // Daily operating expenses
      const dailyExp = Math.round(1500 + Math.random() * 3500);
      vouchers.push(
        { id: `v_misc_${bunk.id}_${day}`, date, accountId: miscExpenseId, debit: dailyExp, credit: 0, description: 'Daily operational expenses', createdAt: now - day * 1000, bunkId: bunk.id },
        { id: `v_misc_cash_${bunk.id}_${day}`, date, accountId: pettyCashId, debit: 0, credit: dailyExp, description: 'Paid from petty cash', createdAt: now - day * 1000, bunkId: bunk.id }
      );
    }

    // Monthly fixed expenses (around day 5, 15, 25)
    const rentAmt = 25000 + bIndex * 5000;
    const salaryAmt = 45000 + bIndex * 10000;
    const electricityAmt = 8000 + Math.round(Math.random() * 4000);
    const maintenanceAmt = 12000 + Math.round(Math.random() * 8000);
    const insuranceAmt = 15000;

    vouchers.push(
      // Rent payment
      { id: `v_rent_exp_${bunk.id}`, date: getISODate(5), accountId: rentId, debit: rentAmt, credit: 0, description: 'Monthly rent payment', createdAt: now, bunkId: bunk.id },
      { id: `v_rent_bank_${bunk.id}`, date: getISODate(5), accountId: bankAccId, debit: 0, credit: rentAmt, description: 'Rent paid via bank', createdAt: now, bunkId: bunk.id },
      
      // Salary payment
      { id: `v_sal_exp_${bunk.id}`, date: getISODate(2), accountId: salaryId, debit: salaryAmt, credit: 0, description: 'Staff salary disbursement', createdAt: now, bunkId: bunk.id },
      { id: `v_sal_bank_${bunk.id}`, date: getISODate(2), accountId: bankAccId, debit: 0, credit: salaryAmt, description: 'Salary paid via bank', createdAt: now, bunkId: bunk.id },
      
      // Electricity bill
      { id: `v_elec_exp_${bunk.id}`, date: getISODate(10), accountId: electricityId, debit: electricityAmt, credit: 0, description: 'Monthly electricity bill', createdAt: now, bunkId: bunk.id },
      { id: `v_elec_bank_${bunk.id}`, date: getISODate(10), accountId: bankAccId, debit: 0, credit: electricityAmt, description: 'Electricity bill paid', createdAt: now, bunkId: bunk.id },
      
      // Maintenance
      { id: `v_maint_exp_${bunk.id}`, date: getISODate(15), accountId: maintenanceId, debit: maintenanceAmt, credit: 0, description: 'Equipment maintenance & repair', createdAt: now, bunkId: bunk.id },
      { id: `v_maint_cash_${bunk.id}`, date: getISODate(15), accountId: cashAccId, debit: 0, credit: maintenanceAmt, description: 'Maintenance paid in cash', createdAt: now, bunkId: bunk.id },
      
      // Insurance
      { id: `v_ins_exp_${bunk.id}`, date: getISODate(20), accountId: insuranceId, debit: insuranceAmt, credit: 0, description: 'Insurance premium payment', createdAt: now, bunkId: bunk.id },
      { id: `v_ins_bank_${bunk.id}`, date: getISODate(20), accountId: bankSbiId, debit: 0, credit: insuranceAmt, description: 'Insurance paid via bank', createdAt: now, bunkId: bunk.id }
    );

    // Add comprehensive reminders
    reminders.push(
      { id: `r_stock_${bunk.id}`, title: 'Fuel Stock Audit', description: 'Monthly fuel inventory reconciliation and tank dip reading', reminderDate: getISODate(5), dueDate: getISODate(3), createdAt: now, createdBy: 'system' },
      { id: `r_gst_${bunk.id}`, title: 'GST Filing', description: 'Prepare GST returns and file GSTR-3B', reminderDate: getISODate(18), dueDate: getISODate(15), createdAt: now, createdBy: 'system' },
      { id: `r_salary_${bunk.id}`, title: 'Salary Processing', description: 'Process staff salaries and statutory deductions', reminderDate: getISODate(3), dueDate: getISODate(1), createdAt: now, createdBy: 'system' },
      { id: `r_supplier_${bunk.id}`, title: 'Supplier Payment', description: 'Review and clear pending supplier invoices', reminderDate: getISODate(8), dueDate: getISODate(6), createdAt: now, createdBy: 'system' },
      { id: `r_equipment_${bunk.id}`, title: 'Equipment Inspection', description: 'Schedule preventive maintenance for dispensing pumps', reminderDate: getISODate(12), dueDate: getISODate(10), createdAt: now, createdBy: 'system' }
    );
  });

  return { accounts, vouchers, reminders };
};

const App: React.FC = () => {
  const [bunks, setBunks] = useState<Bunk[]>(() => {
    const saved = localStorage.getItem('kr_fuels_bunks_db');
    return saved ? JSON.parse(saved) : INITIAL_BUNKS;
  });

  const seedUsers: User[] = [
    { username: 'admin', name: 'System Administrator', role: 'super_admin', accessibleBunkIds: INITIAL_BUNKS.map(b => b.id) },
    { username: 'manager', name: 'Bunk Manager', role: 'admin', accessibleBunkIds: [INITIAL_BUNKS[0].id] }
  ];

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('kr_fuels_users_db');
    return saved ? JSON.parse(saved) : seedUsers;
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

  // Try to load from localStorage; do NOT generate demo seed data anymore
  // (keeps app empty unless user imports or creates data)
  const seed = { accounts: [] as Account[], vouchers: [] as Voucher[], reminders: [] as Reminder[] };

  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('kr_fuels_accounts');
    if (saved) return JSON.parse(saved);
    return seed.accounts;
  });

  const [vouchers, setVouchers] = useState<Voucher[]>(() => {
    const saved = localStorage.getItem('kr_fuels_vouchers');
    if (saved) return JSON.parse(saved);
    return seed.vouchers;
  });

  const [reminders, setReminders] = useState<Reminder[]>(() => {
    const saved = localStorage.getItem('kr_fuels_reminders');
    if (saved) return JSON.parse(saved);
    return seed.reminders || [];
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
    localStorage.setItem('kr_fuels_reminders', JSON.stringify(reminders));
    localStorage.setItem('kr_fuels_bunks_db', JSON.stringify(bunks));
    localStorage.setItem('kr_fuels_users_db', JSON.stringify(users));
  }, [accounts, vouchers, bunks, users]);

  useEffect(() => {
    localStorage.setItem('kr_fuels_reminders', JSON.stringify(reminders));
  }, [reminders]);

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

  const updateVoucher = (voucher: Voucher) => {
    setVouchers(prev => prev.map(v => v.id === voucher.id ? voucher : v));
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
                reminders={reminders}
              />
            } 
          />
          <Route path="/accounts" element={<AccountsList accounts={bunkAccounts} deleteAccount={deleteAccount} />} />
          <Route path="/account-master" element={<AccountMaster accounts={bunkAccounts} onSave={addAccount} onUpdate={updateAccount} onDelete={deleteAccount} />} />
          <Route path="/account-master/:id" element={<AccountMaster accounts={bunkAccounts} onSave={addAccount} onUpdate={updateAccount} onDelete={deleteAccount} />} />
          <Route path="/vouchers" element={<DailyVoucher accounts={bunkAccounts} vouchers={bunkVouchers} onSave={addVoucher} onUpdateVoucher={updateVoucher} onDeleteVoucher={deleteVoucher} />} />
          <Route path="/ledger" element={<LedgerReport accounts={bunkAccounts} vouchers={bunkVouchers} />} />
          <Route path="/cash-report" element={<CashReport accounts={bunkAccounts} vouchers={bunkVouchers} onDeleteVoucher={deleteVoucher} />} />
          <Route path="/reminders" element={<Reminders reminders={reminders} onAddReminder={addReminder} onDeleteReminder={deleteReminder} onUpdateReminder={updateReminder} />} />
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
