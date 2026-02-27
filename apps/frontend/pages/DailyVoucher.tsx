
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Account, Voucher } from '../types';
import { formatDateToDDMMYYYY, formatCurrency } from '../utils';
import { 
  AlertCircle, 
  Trash2, 
  Calendar, 
  Plus, 
  RotateCcw,
  Calculator,
  ArrowDownCircle,
  ArrowUpCircle
} from 'lucide-react';
import LedgerModalSelector from '../components/LedgerModalSelector';

interface BatchRow {
  id: string;
  accountId: string;
  description: string;
  debit: number;
  credit: number;
}

interface DailyVoucherProps {
  accounts: Account[];
  vouchers?: Voucher[];
  onSave: (voucher: Partial<Voucher>) => void;
  onUpdateVoucher?: (voucher: Voucher) => void;
  onDeleteVoucher?: (id: string) => void;
}

const DailyVoucher: React.FC<DailyVoucherProps> = ({ accounts, vouchers = [], onSave, onUpdateVoucher, onDeleteVoucher }) => {
  const navigate = useNavigate();
  const dateInputRef = useRef<HTMLInputElement>(null);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [rows, setRows] = useState<BatchRow[]>([
    { id: Math.random().toString(36).substr(2, 9), accountId: '', description: '', debit: 0, credit: 0 }
  ]);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const prevHashRef = useRef<string>(window.location.hash);
  const ignoreHashChangeRef = useRef(false);

  const openingBalance = useMemo(() => {
    return accounts.reduce((sum, a) => sum + (a.openingDebit - a.openingCredit), 0);
  }, [accounts]);

  const totals = useMemo(() => {
    return rows.reduce((acc, row) => ({
      debit: acc.debit + (row.debit || 0),
      credit: acc.credit + (row.credit || 0)
    }), { debit: 0, credit: 0 });
  }, [rows]);

  // Tally standard: Cash is an asset (DR balance).
  // CR column entries = contra account credited → Cash DEBITED → cash IN (inflow)
  // DR column entries = contra account debited  → Cash CREDITED → cash OUT (outflow)
  // Closing = Opening + CR(inflows) − DR(outflows)
  const closingBalance = openingBalance + totals.credit - totals.debit;

  const handleAddRow = () => {
    setRows([...rows, { id: Math.random().toString(36).substr(2, 9), accountId: '', description: '', debit: 0, credit: 0 }]);
    setIsDirty(true);
  };

  const handleRemoveRow = (id: string) => {
    const isPosted = vouchers.some(v => v.id === id);
    if (isPosted) {
      if (onDeleteVoucher) {
        if (!confirm('Delete this posted transaction?')) return;
        onDeleteVoucher(id);
      }
      setRows(prev => prev.filter(r => r.id !== id));
      setIsDirty(false);
      return;
    }

    if (rows.length > 1) {
      setRows(rows.filter(r => r.id !== id));
      setIsDirty(true);
    } else {
      setRows([{ id: Math.random().toString(36).substr(2, 9), accountId: '', description: '', debit: 0, credit: 0 }]);
    }
  };

  const updateRow = (id: string, field: keyof BatchRow, value: any) => {
    setRows(rows.map(r => {
      if (r.id === id) {
        const updated = { ...r, [field]: value };
        if (field === 'debit' && value > 0) updated.credit = 0;
        if (field === 'credit' && value > 0) updated.debit = 0;
        setIsDirty(true);
        return updated;
      }
      return r;
    }));
  };

  const handleReset = () => {
    // Revert to posted vouchers for the selected date and clear unsaved entries
    const dayVouchers = (vouchers || []).filter(v => v.date === date);
    const mapped: BatchRow[] = dayVouchers.map(v => ({ id: v.id, accountId: v.accountId, description: v.description, debit: v.debit, credit: v.credit }));
    setRows([...mapped, { id: Math.random().toString(36).substr(2, 9), accountId: '', description: '', debit: 0, credit: 0 }]);
    setError(null);
    setIsDirty(false);
  };

  const handlePost = () => {
    setError(null);
    const validRows = rows.filter(r => r.accountId && (r.debit > 0 || r.credit > 0));
    if (validRows.length === 0) {
      setError("Please provide valid transaction data before posting.");
      return;
    }
    validRows.forEach(row => {
      const isExisting = vouchers.some(v => v.id === row.id);
      if (isExisting) {
        const existing = vouchers.find(v => v.id === row.id)!;
        const updated: Voucher = {
          id: row.id,
          date,
          accountId: row.accountId,
          debit: row.debit,
          credit: row.credit,
          description: row.description,
          createdAt: existing.createdAt || Date.now(),
          bunkId: existing.bunkId || ''
        };
        if (onUpdateVoucher) onUpdateVoucher(updated);
        setIsDirty(false);
      } else {
        onSave({
          id: Math.random().toString(36).substr(2, 9),
          date,
          accountId: row.accountId,
          debit: row.debit,
          credit: row.credit,
          description: row.description,
          createdAt: Date.now(),
          bunkId: '' 
        });
        setIsDirty(false);
      }
    });
    handleReset();
    alert("TRANSACTIONS POSTED SUCCESSFULLY!");
  };

  // Load existing vouchers for selected date into rows so they are visible/editable
  useEffect(() => {
    const dayVouchers = (vouchers || []).filter(v => v.date === date);
    const mapped: BatchRow[] = dayVouchers.map(v => ({ id: v.id, accountId: v.accountId, description: v.description, debit: v.debit, credit: v.credit }));
    // Always leave one empty line for new entries
    setRows([...mapped, { id: Math.random().toString(36).substr(2, 9), accountId: '', description: '', debit: 0, credit: 0 }]);
    setIsDirty(false);
  }, [date, vouchers]);

  // keep a stable ref to handlePost for hashchange listener
  const handlePostRef = useRef(handlePost);
  useEffect(() => { handlePostRef.current = handlePost; }, [handlePost]);

  useEffect(() => {
    const onHashChange = () => {
      if (ignoreHashChangeRef.current) {
        ignoreHashChangeRef.current = false;
        prevHashRef.current = window.location.hash;
        return;
      }
      const newHash = window.location.hash;
      if (isDirty) {
        const save = confirm('You have unsaved changes. Save before leaving? Click OK to save, Cancel to stay on this page.');
        if (save) {
          // save then allow navigation
          handlePostRef.current();
          prevHashRef.current = newHash;
        } else {
          // revert navigation
          ignoreHashChangeRef.current = true;
          window.location.hash = prevHashRef.current || '#/';
        }
      } else {
        prevHashRef.current = newHash;
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [isDirty]);

  return (
    <div className="animate-in fade-in duration-500 max-w-[1000px] mx-auto flex flex-col gap-6 h-full min-h-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-6">
        <h1 className="text-[18px] font-black text-slate-900 tracking-tight uppercase leading-none">Daily Voucher</h1>
        <div className="hidden md:flex items-center gap-3">
          {/* controls reserved */}
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-stretch gap-4">
        {/* Date Picker */}
        <div className="flex flex-col justify-center space-y-1.5 flex-shrink-0">
          <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest block">Transaction Date</label>
          <div
            className="flex items-center gap-2.5 cursor-pointer bg-white border border-slate-200 px-4 py-2 rounded-lg hover:border-brand transition-all shadow-sm group"
            onClick={() => dateInputRef.current?.showPicker()}
          >
            <Calendar size={14} className="text-slate-400 group-hover:text-brand transition-colors" />
            <span className="text-[13px] font-bold text-slate-900 tabular-nums tracking-tight">{formatDateToDDMMYYYY(date)}</span>
            <input ref={dateInputRef} type="date" className="absolute opacity-0 w-0 h-0" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm flex flex-col justify-between border-l-4 border-l-slate-400">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Opening Balance</p>
            <p className="text-[15px] font-black text-slate-900 font-mono tabular-nums tracking-tighter leading-none">
              {formatCurrency(Math.abs(openingBalance))}
              <span className="text-[9px] ml-1 font-bold text-slate-400">{openingBalance >= 0 ? 'DR' : 'CR'}</span>
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm flex flex-col justify-between border-l-4 border-l-emerald-500">
            <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mb-1 flex items-center gap-1"><ArrowUpCircle size={10} /> Total Inflows (CR)</p>
            <p className="text-[15px] font-black text-emerald-600 font-mono tabular-nums tracking-tighter leading-none">{formatCurrency(totals.credit)}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm flex flex-col justify-between border-l-4 border-l-rose-500">
            <p className="text-[9px] font-bold text-rose-500 uppercase tracking-widest mb-1 flex items-center gap-1"><ArrowDownCircle size={10} /> Total Outflows (DR)</p>
            <p className="text-[15px] font-black text-rose-600 font-mono tabular-nums tracking-tighter leading-none">{formatCurrency(totals.debit)}</p>
          </div>
          <div className={`bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm flex flex-col justify-between border-l-4 ${closingBalance >= 0 ? 'border-l-brand' : 'border-l-rose-500'}`}>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Calculator size={10} /> Closing Balance</p>
            <p className={`text-[15px] font-black font-mono tabular-nums tracking-tighter leading-none ${closingBalance >= 0 ? 'text-brand' : 'text-rose-600'}`}>
              {formatCurrency(Math.abs(closingBalance))}
              <span className="text-[9px] ml-1 font-bold text-slate-400">{closingBalance >= 0 ? 'DR' : 'CR'}</span>
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg flex items-center gap-3 text-rose-700 text-[10px] font-bold uppercase tracking-widest">
           <AlertCircle size={15} /> {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="overflow-auto flex-1 min-h-0 custom-scrollbar">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-600 uppercase tracking-widest w-[280px]">Ledger Account</th>
                <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-600 uppercase tracking-widest">Description</th>
                <th className="px-5 py-3 text-right text-[11px] font-bold text-slate-600 uppercase tracking-widest w-[150px]">Credit (CR)</th>
                <th className="px-5 py-3 text-right text-[11px] font-bold text-slate-600 uppercase tracking-widest w-[150px]">Debit (DR)</th>
                <th className="px-2 py-3 w-[44px]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map((row) => (
                <tr key={row.id} className="group hover:bg-slate-50/20 transition-colors">
                  <td className="px-3 py-2">
                    <LedgerModalSelector
                      label="" accounts={accounts} selectedId={row.accountId}
                      onChange={id => updateRow(row.id, 'accountId', id)}
                      placeholder="Search ledger account..." compact={true} triggerHeight="h-[36px]"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text" value={row.description}
                      onChange={e => updateRow(row.id, 'description', e.target.value)}
                      placeholder="Enter transaction details..."
                      className="w-full px-3 py-1.5 bg-slate-50/50 border border-slate-100 rounded-lg text-[13px] font-medium text-slate-800 outline-none focus:border-brand focus:bg-white transition-all uppercase h-[36px] placeholder:text-slate-400 placeholder:text-[11px] placeholder:normal-case"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-green-700 font-bold text-[10px]">₹</span>
                      <input
                        type="number" value={row.credit || ''}
                        onChange={e => updateRow(row.id, 'credit', Number(e.target.value))}
                        placeholder="0.00"
                        className="w-full pl-6 pr-3 py-1.5 bg-slate-50/50 border border-slate-100 rounded-lg font-bold text-[13px] text-green-800 text-right outline-none focus:border-brand focus:bg-white transition-all h-[36px] font-mono placeholder:text-slate-400 placeholder:text-[11px]"
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-rose-500 font-bold text-[10px]">₹</span>
                      <input
                        type="number" value={row.debit || ''}
                        onChange={e => updateRow(row.id, 'debit', Number(e.target.value))}
                        placeholder="0.00"
                        className="w-full pl-6 pr-3 py-1.5 bg-slate-50/50 border border-slate-100 rounded-lg font-bold text-[13px] text-rose-600 text-right outline-none focus:border-rose-400 focus:bg-white transition-all h-[36px] font-mono placeholder:text-slate-400 placeholder:text-[11px]"
                      />
                    </div>
                  </td>
                  <td className="px-2 py-2 text-center">
                    <button onClick={() => handleRemoveRow(row.id)} className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={5} className="px-5 py-3 border-t border-slate-50">
                  <button onClick={handleAddRow} className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-brand rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all"><Plus size={12} strokeWidth={3} /> Add Entry Line</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>


      </div>

      <div className="pt-2 pb-4 flex items-center justify-center gap-8 no-print flex-shrink-0">
        <button onClick={handleReset} className="flex items-center gap-2 px-6 py-2 text-[12px] font-bold text-slate-400 hover:text-rose-600 uppercase tracking-widest rounded-lg transition-all group"><RotateCcw size={16} className="group-hover:-rotate-90 transition-transform" /> Reset Form</button>
        <button
          onClick={handlePost}
          disabled={!isDirty}
          className={`px-8 py-3.5 rounded-xl font-bold text-[14px] uppercase tracking-widest transition-all active:scale-95 ${isDirty ? 'bg-brand text-white hover:bg-brand-hover shadow-xl shadow-green-900/10' : 'bg-slate-200 text-slate-500 cursor-not-allowed'}`}
        >
          Post Transactions
        </button>
      </div>
    </div>
  );
};

export default DailyVoucher;