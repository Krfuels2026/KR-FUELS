
import React, { useState, useMemo, useRef } from 'react';
import { Account, Voucher } from '../types';
import { formatCurrency, formatDateToDDMMYYYY } from '../utils';
import { Printer, Filter, TrendingUp, History, Calendar, FileSpreadsheet, FileText, ChevronDown, ChevronLeft, ChevronRight, CalendarDays, X } from 'lucide-react';

interface CashReportProps {
  accounts: Account[];
  vouchers: Voucher[];
  onDeleteVoucher: (id: string) => void;
}

type FilterType = 'daily' | 'monthly' | 'ytd' | 'financial_year' | 'custom';

const CashReport: React.FC<CashReportProps> = ({ accounts, vouchers, onDeleteVoucher }) => {
  const [filterType, setFilterType] = useState<FilterType>('daily');
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  
  const [selectedYear, setSelectedYear] = useState(() => {
    const now = new Date();
    return now.getMonth() < 3 ? now.getFullYear() - 1 : now.getFullYear();
  });

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [customRange, setCustomRange] = useState({
    from: new Date().toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  const dailyInputRef = useRef<HTMLInputElement>(null);
  const customFromRef = useRef<HTMLInputElement>(null);
  const customToRef = useRef<HTMLInputElement>(null);

  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    const fyBase = new Date().getMonth() < 3 ? currentYear - 1 : currentYear;
    for (let i = 0; i < 5; i++) {
      years.push(fyBase - i);
    }
    return years;
  }, []);

  const getEffectiveRange = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    
    switch (filterType) {
      case 'daily':
        return { from: customRange.from, to: customRange.from };
      case 'monthly': {
        const [y, m] = selectedMonth.split('-').map(Number);
        const lastDay = new Date(y, m, 0).getDate();
        return { from: `${y}-${String(m).padStart(2, '0')}-01`, to: `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}` };
      }
      case 'ytd':
        return { from: `${currentYear}-01-01`, to: today.toISOString().split('T')[0] };
      case 'financial_year':
        return { from: `${selectedYear}-04-01`, to: `${selectedYear + 1}-03-31` };
      case 'custom':
        return customRange;
      default:
        return { from: customRange.from, to: customRange.from };
    }
  };

  const range = getEffectiveRange();

  const handleOpenPicker = (ref: React.RefObject<HTMLInputElement | null>) => {
    if (ref.current) {
      try {
        if ('showPicker' in HTMLInputElement.prototype) {
          (ref.current as any).showPicker();
        } else {
          ref.current.focus();
        }
      } catch (e) {
        ref.current.focus();
      }
    }
  };

  const reportData = useMemo(() => {
    const periodVouchers = vouchers.filter(v => v.date >= range.from && v.date <= range.to);
    
    const openingBalancesSum = accounts.reduce((sum, a) => {
        if (a.parentId !== null) {
            return sum + (a.openingDebit - a.openingCredit);
        }
        return sum;
    }, 0);
    const pastVouchers = vouchers.filter(v => v.date < range.from);
    const pastVouchersSum = pastVouchers.reduce((sum, v) => sum + (v.debit - v.credit), 0);
    
    const openingBalance = openingBalancesSum + pastVouchersSum;
    const totalDr = periodVouchers.reduce((sum, v) => sum + v.debit, 0);
    const totalCr = periodVouchers.reduce((sum, v) => sum + v.credit, 0);
    const closingBalance = openingBalance + totalDr - totalCr;

    return {
      openingBalance,
      periodVouchers: periodVouchers.sort((a, b) => a.date.localeCompare(b.date)),
      totalDr,
      totalCr,
      closingBalance
    };
  }, [range, vouchers, accounts]);

  const handleExportExcel = () => {
    const headers = ['DATE', 'DESCRIPTION', 'LEDGER', 'CREDIT (CR)', 'DEBIT (DR)'];
    const rows = reportData.periodVouchers.map(v => [
      formatDateToDDMMYYYY(v.date),
      v.description.toUpperCase().replace(/,/g, ' '),
      (accounts.find(a => a.id === v.accountId)?.name || '').toUpperCase().replace(/,/g, ' '),
      v.credit.toFixed(2),
      v.debit.toFixed(2)
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CASH_STATEMENT_${range.from}_TO_${range.to}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full mx-auto pb-10 max-w-[1400px]">
      {/* Refined Sticky Header Section */}
      <div className="sticky top-0 -mx-5 px-5 pt-0 pb-6 bg-[#f8fafc] z-10 no-print space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-[20px] font-black text-[#0f172a] uppercase tracking-tight">Statement of Cash</h1>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => window.print()}
              className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-full font-bold text-[11px] flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm uppercase tracking-widest active:scale-95"
            >
              <Printer size={16} /> Print
            </button>
            <button 
              onClick={handleExportExcel}
              className="px-6 py-2.5 bg-emerald-700 text-white rounded-full font-bold text-[11px] flex items-center gap-2 hover:bg-emerald-800 transition-all shadow-md shadow-emerald-100 uppercase tracking-widest active:scale-95"
            >
              <FileSpreadsheet size={16} /> Excel
            </button>
            <button 
              onClick={() => window.print()}
              className="px-6 py-2.5 bg-brand text-white rounded-full font-bold text-[11px] flex items-center gap-2 hover:bg-brand-hover transition-all shadow-md shadow-green-100 uppercase tracking-widest active:scale-95"
            >
              <FileText size={16} /> PDF
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-1.5 flex border-b border-slate-100 bg-slate-50/30">
            {[
              { id: 'daily', label: 'Daily', icon: Calendar },
              { id: 'monthly', label: 'Monthly', icon: CalendarDays },
              { id: 'ytd', label: 'YTD', icon: TrendingUp },
              { id: 'financial_year', label: 'Financial Year', icon: History },
              { id: 'custom', label: 'Custom', icon: Filter },
            ].map(btn => (
              <button
                key={btn.id}
                onClick={() => {
                  setFilterType(btn.id as FilterType);
                  if (['daily', 'monthly', 'financial_year', 'custom'].includes(btn.id)) {
                    setShowFilterPopup(true);
                  } else {
                    setShowFilterPopup(false);
                  }
                }}
                className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${filterType === btn.id ? 'bg-brand text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <btn.icon size={15} /> {btn.label}
              </button>
            ))}
          </div>

        </div>

        {/* Popup modal for Monthly / Financial Year / Custom filters */}
        {showFilterPopup && (filterType === 'daily' || filterType === 'monthly' || filterType === 'financial_year' || filterType === 'custom') && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowFilterPopup(false)} />
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-brand text-white rounded-lg flex items-center justify-center shadow-md">
                    {filterType === 'daily' && <Calendar size={16} />}
                    {filterType === 'monthly' && <CalendarDays size={16} />}
                    {filterType === 'financial_year' && <History size={16} />}
                    {filterType === 'custom' && <Filter size={16} />}
                  </div>
                  <h2 className="text-[12px] font-bold text-slate-900 uppercase tracking-widest">
                    {filterType === 'daily' && 'Select Date'}
                    {filterType === 'monthly' && 'Select Month'}
                    {filterType === 'financial_year' && 'Select Financial Year'}
                    {filterType === 'custom' && 'Custom Date Range'}
                  </h2>
                </div>
                <button onClick={() => setShowFilterPopup(false)} className="p-1.5 text-slate-400 hover:text-rose-500 transition-all">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Daily picker */}
                {filterType === 'daily' && (
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest px-0.5">Statement Date</label>
                    <div className="relative group cursor-pointer h-[48px]" onClick={() => handleOpenPicker(dailyInputRef)}>
                      <div className="absolute inset-0 px-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-[13px] text-slate-900 flex items-center z-10 transition-all group-hover:border-slate-300 shadow-inner">
                        {formatDateToDDMMYYYY(customRange.from)}
                      </div>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 z-20 pointer-events-none group-hover:text-brand transition-colors">
                        <Calendar size={16} />
                      </div>
                      <input
                        ref={dailyInputRef}
                        type="date"
                        className="absolute inset-0 w-full h-full opacity-0 z-30 cursor-pointer"
                        value={customRange.from}
                        onChange={e => setCustomRange({ from: e.target.value, to: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* Monthly picker */}
                {filterType === 'monthly' && (
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest px-0.5">Month & Year</label>
                    <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm h-[48px]">
                      <button
                        onClick={() => {
                          const [y, m] = selectedMonth.split('-').map(Number);
                          const prev = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
                          setSelectedMonth(prev);
                        }}
                        className="p-3 hover:bg-slate-50 text-slate-500 border-r border-slate-100 transition-colors"
                      >
                        <ChevronLeft size={18} strokeWidth={2.5} />
                      </button>
                      <div className="flex items-center justify-center gap-2.5 flex-1 px-4 cursor-default">
                        <CalendarDays size={16} className="text-slate-500" />
                        <span className="text-slate-900 font-bold text-[13px] uppercase tracking-widest tabular-nums">
                          {(() => {
                            const [y, m] = selectedMonth.split('-').map(Number);
                            const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
                            return `${monthNames[m - 1]} ${y}`;
                          })()}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          const [y, m] = selectedMonth.split('-').map(Number);
                          const now = new Date();
                          const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                          const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
                          if (next <= currentMonth) setSelectedMonth(next);
                        }}
                        className={`p-3 border-l border-slate-100 text-slate-500 transition-colors ${
                          (() => {
                            const [y, m] = selectedMonth.split('-').map(Number);
                            const now = new Date();
                            const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                            const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
                            return next > currentMonth ? 'opacity-20 cursor-not-allowed' : 'hover:bg-slate-50';
                          })()
                        }`}
                      >
                        <ChevronRight size={18} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Financial Year picker */}
                {filterType === 'financial_year' && (
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest px-0.5">Financial Year</label>
                    <div className="relative h-[48px]">
                      <select
                        className="w-full px-5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-bold text-slate-900 uppercase outline-none focus:border-brand focus:bg-white appearance-none transition-all pr-12 h-full shadow-inner"
                        value={selectedYear}
                        onChange={e => setSelectedYear(Number(e.target.value))}
                      >
                        {availableYears.map(year => (
                          <option key={year} value={year}>FY {year}-{year + 1}</option>
                        ))}
                      </select>
                      <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                )}

                {/* Custom range pickers */}
                {filterType === 'custom' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest px-0.5">From Date</label>
                      <div className="relative group cursor-pointer h-[48px]" onClick={() => handleOpenPicker(customFromRef)}>
                        <div className="absolute inset-0 px-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-[13px] text-slate-900 flex items-center z-10 transition-all group-hover:border-slate-300 shadow-inner">
                          {formatDateToDDMMYYYY(customRange.from)}
                        </div>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 z-20 pointer-events-none group-hover:text-brand transition-colors">
                          <Calendar size={16} />
                        </div>
                        <input
                          ref={customFromRef}
                          type="date"
                          className="absolute inset-0 w-full h-full opacity-0 z-30 cursor-pointer"
                          value={customRange.from}
                          onChange={e => setCustomRange({ ...customRange, from: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest px-0.5">To Date</label>
                      <div className="relative group cursor-pointer h-[48px]" onClick={() => handleOpenPicker(customToRef)}>
                        <div className="absolute inset-0 px-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-[13px] text-slate-900 flex items-center z-10 transition-all group-hover:border-slate-300 shadow-inner">
                          {formatDateToDDMMYYYY(customRange.to)}
                        </div>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 z-20 pointer-events-none group-hover:text-brand transition-colors">
                          <Calendar size={16} />
                        </div>
                        <input
                          ref={customToRef}
                          type="date"
                          className="absolute inset-0 w-full h-full opacity-0 z-30 cursor-pointer"
                          value={customRange.to}
                          onChange={e => setCustomRange({ ...customRange, to: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    onClick={() => setShowFilterPopup(false)}
                    className="w-full px-4 py-2.5 bg-brand text-white rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-brand-hover transition-all shadow-lg shadow-emerald-500/10"
                  >
                    Apply Filter
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-[6px] border-l-amber-500 transition-all hover:shadow-md">
            <p className="text-[11px] font-bold text-amber-600 uppercase tracking-widest mb-2">Opening Balance</p>
            <p className="text-[18px] font-black text-slate-900 font-mono tracking-tight tabular-nums">
              {formatCurrency(Math.abs(reportData.openingBalance))} 
              <span className="ml-2 text-[10px] text-slate-400 font-bold uppercase">{reportData.openingBalance >= 0 ? 'DR' : 'CR'}</span>
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-[6px] border-l-emerald-500 transition-all hover:shadow-md">
            <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest mb-2">Total Inflow</p>
            <p className="text-[18px] font-black text-emerald-600 font-mono tracking-tight tabular-nums">+{formatCurrency(reportData.totalCr)}</p>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-[6px] border-l-rose-500 transition-all hover:shadow-md">
            <p className="text-[11px] font-bold text-rose-600 uppercase tracking-widest mb-2">Total Outflow</p>
            <p className="text-[18px] font-black text-rose-600 font-mono tracking-tight tabular-nums">-{formatCurrency(reportData.totalDr)}</p>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-[6px] border-l-blue-600 transition-all hover:shadow-md">
            <p className="text-[11px] font-bold text-blue-700 uppercase tracking-widest mb-2">Closing Cash</p>
            <p className="text-[18px] font-black text-slate-900 font-mono tracking-tight tabular-nums">
              {formatCurrency(Math.abs(reportData.closingBalance))} 
              <span className="ml-2 text-[10px] text-slate-400 font-bold uppercase">{reportData.closingBalance >= 0 ? 'DR' : 'CR'}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:border-0 print:shadow-none mt-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 print:bg-slate-100">
                <th className="px-8 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest w-40">Date</th>
                <th className="px-8 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Description / Account</th>
                <th className="px-8 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right w-48">Credit (CR)</th>
                <th className="px-8 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right w-48">Debit (DR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="bg-slate-50/50">
                <td className="px-8 py-4 text-[12px] text-slate-400 font-bold tabular-nums whitespace-nowrap uppercase">{formatDateToDDMMYYYY(range.from)}</td>
                <td className="px-8 py-4">
                  <p className="text-[14px] font-black text-slate-900 uppercase tracking-tight">OPENING BALANCE B/F</p>
                </td>
                <td className="px-8 py-4 text-right font-black text-slate-900 tabular-nums text-[14px] font-mono tracking-tight" colSpan={2}>
                  {formatCurrency(Math.abs(reportData.openingBalance))} 
                  <span className="ml-2 text-[10px] font-bold uppercase text-slate-400">
                    {reportData.openingBalance >= 0 ? 'DR' : 'CR'}
                  </span>
                </td>
              </tr>

              {reportData.periodVouchers.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5 text-[12px] text-slate-400 font-bold tabular-nums whitespace-nowrap uppercase">{formatDateToDDMMYYYY(v.date)}</td>
                  <td className="px-8 py-5">
                    <p className="text-[14px] font-black text-slate-800 uppercase tracking-tight leading-tight">{v.description}</p>
                    <p className="text-[10px] text-brand font-bold uppercase mt-1.5 tracking-widest">
                      {accounts.find(a => a.id === v.accountId)?.name}
                    </p>
                  </td>
                  <td className="px-8 py-5 text-right font-black text-emerald-600 tabular-nums text-[14px] font-mono tracking-tight">
                    {v.credit > 0 ? formatCurrency(v.credit) : '—'}
                  </td>
                  <td className="px-8 py-5 text-right font-black text-rose-500 tabular-nums text-[14px] font-mono tracking-tight">
                    {v.debit > 0 ? formatCurrency(v.debit) : '—'}
                  </td>
                </tr>
              ))}
              {reportData.periodVouchers.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-32 text-center text-slate-300 font-bold uppercase text-[12px] tracking-widest">No transaction records found in this period.</td>
                </tr>
              )}
            </tbody>
            {reportData.periodVouchers.length > 0 && (
              <tfoot className="bg-slate-50 font-bold print:bg-slate-100">
                <tr>
                  <td colSpan={2} className="px-8 py-6 text-right text-slate-800 text-[11px] font-bold tracking-widest uppercase">Summary:</td>
                  <td className="px-8 py-6 text-right text-emerald-600 font-black text-[16px] tabular-nums font-mono">{formatCurrency(reportData.totalCr)}</td>
                  <td className="px-8 py-6 text-right text-rose-600 font-black text-[16px] tabular-nums font-mono">{formatCurrency(reportData.totalDr)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default CashReport;
