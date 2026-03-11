
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
    <div className="animate-in fade-in duration-500 max-w-[1000px] mx-auto flex flex-col h-full min-h-0 pb-6">
      <div className="sticky top-0 bg-[#f8fafc] z-20 space-y-4 md:space-y-6 pt-2 pb-4 md:pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4">
          <h1 className="text-[14px] md:text-[18px] font-black text-slate-900 tracking-tight uppercase">Daily Voucher</h1>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 md:p-5">
          <div className="flex flex-col md:flex-row items-stretch gap-3 md:gap-5">
            <div className="flex flex-col justify-center space-y-1.5 md:space-y-2 flex-shrink-0">
              <label className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Transaction Date</label>
              <div
                className="flex items-center gap-2 md:gap-3 cursor-pointer bg-slate-50 border border-slate-200 px-3 py-2 md:px-5 md:py-3 rounded-xl hover:border-brand transition-all group"
                onClick={() => dateInputRef.current?.showPicker()}
              >
                <Calendar size={14} className="md:w-4 md:h-4 text-slate-400 group-hover:text-brand transition-colors" />
                <span className="text-[12px] md:text-[14px] font-black text-slate-900 tabular-nums tracking-tight">{formatDateToDDMMYYYY(date)}</span>
                <input ref={dateInputRef} type="date" required className="absolute opacity-0 w-0 h-0 [&::-webkit-clear-button]:hidden [&::-webkit-inner-spin-button]:hidden" value={date} onChange={e => setDate(e.target.value)} />
              </div>
            </div>

            <div className="hidden md:block w-px bg-slate-100 self-stretch"></div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 flex-1">
              <div className="bg-white border border-slate-200 border-l-4 border-l-amber-500 rounded-xl px-2 py-2 md:px-4 md:py-3 flex flex-col justify-between shadow-sm">
                <p className="text-[8px] md:text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1 md:mb-2">Opening Balance</p>
                <p className="text-[12px] md:text-[16px] font-black text-slate-900 font-mono tabular-nums tracking-tighter leading-none">
                  {formatCurrency(Math.abs(openingBalance))}
                  <span className="text-[7px] md:text-[9px] ml-0.5 md:ml-1 font-bold text-slate-400">{openingBalance >= 0 ? 'DR' : 'CR'}</span>
                </p>
              </div>
              <div className="bg-white border border-slate-200 border-l-4 border-l-emerald-500 rounded-xl px-2 py-2 md:px-4 md:py-3 flex flex-col justify-between shadow-sm">
                <p className="text-[8px] md:text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1 md:mb-2">Total Inflow</p>
                <p className="text-[12px] md:text-[16px] font-black text-emerald-600 font-mono tabular-nums tracking-tighter leading-none">+{formatCurrency(totals.credit)}</p>
              </div>
              <div className="bg-white border border-slate-200 border-l-4 border-l-rose-500 rounded-xl px-2 py-2 md:px-4 md:py-3 flex flex-col justify-between shadow-sm">
                <p className="text-[8px] md:text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-1 md:mb-2">Total Outflow</p>
                <p className="text-[12px] md:text-[16px] font-black text-rose-500 font-mono tabular-nums tracking-tighter leading-none">-{formatCurrency(totals.debit)}</p>
              </div>
              <div className="bg-white border border-slate-200 border-l-4 border-l-blue-500 rounded-xl px-2 py-2 md:px-4 md:py-3 flex flex-col justify-between shadow-sm">
                <p className="text-[8px] md:text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1 md:mb-2">Closing Cash</p>
                <p className="text-[12px] md:text-[16px] font-black text-slate-900 font-mono tabular-nums tracking-tighter leading-none">
                  {formatCurrency(Math.abs(closingBalance))}
                  <span className="text-[7px] md:text-[9px] ml-0.5 md:ml-1 font-bold text-slate-400">{closingBalance >= 0 ? 'DR' : 'CR'}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg flex items-center gap-3 text-rose-700 text-[10px] font-bold uppercase tracking-widest">
           <AlertCircle size={15} /> {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
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
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.credit === 0 ? '' : row.credit || ''}
                        onChange={e => updateRow(row.id, 'credit', e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)))}
                        placeholder="0.00"
                        className="w-full pl-6 pr-3 py-1.5 bg-slate-50/50 border border-slate-100 rounded-lg font-bold text-[13px] text-green-800 text-right outline-none focus:border-brand focus:bg-white transition-all h-[36px] font-mono placeholder:text-slate-400 placeholder:text-[11px]"
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-rose-500 font-bold text-[10px]">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.debit === 0 ? '' : row.debit || ''}
                        onChange={e => updateRow(row.id, 'debit', e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)))}
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

      <div className="flex items-center justify-center gap-3 md:gap-6 no-print flex-shrink-0 mt-4">
        <button onClick={handleReset} className="flex items-center gap-1.5 md:gap-2 px-3 py-2 md:px-5 md:py-2.5 text-[9px] md:text-[11px] font-bold text-slate-400 hover:text-rose-600 uppercase tracking-widest rounded-xl hover:bg-rose-50 transition-all group"><RotateCcw size={13} className="md:w-[15px] md:h-[15px] group-hover:-rotate-90 transition-transform" /> Reset</button>
        <button
          onClick={handlePost}
          disabled={!isDirty}
          className={`px-6 py-2.5 md:px-10 md:py-3.5 rounded-xl font-bold text-[11px] md:text-[13px] uppercase tracking-widest transition-all active:scale-95 ${isDirty ? 'bg-brand text-white hover:bg-brand-hover shadow-lg shadow-green-900/15' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
        >
          Post Transactions
        </button>
      </div>
    </div>
  );
};

export default DailyVoucher;