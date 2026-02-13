
import React, { useState, useMemo, useRef } from 'react';
import { Account, Voucher } from '../types';
import { formatCurrency, formatDateToDDMMYYYY } from '../utils';
import { Printer, Filter, TrendingUp, History, Calendar, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';

interface CashReportProps {
  accounts: Account[];
  vouchers: Voucher[];
  onDeleteVoucher: (id: string) => void;
}

type FilterType = 'daily' | 'ytd' | 'financial_year' | 'custom';

const CashReport: React.FC<CashReportProps> = ({ accounts, vouchers, onDeleteVoucher }) => {
  const [filterType, setFilterType] = useState<FilterType>('daily');
  
  const [selectedYear, setSelectedYear] = useState(() => {
    const now = new Date();
    return now.getMonth() < 3 ? now.getFullYear() - 1 : now.getFullYear();
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

  const handleOpenPicker = (ref: React.RefObject<HTMLInputElement>) => {
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
    const headers = ['DATE', 'DESCRIPTION', 'LEDGER', 'INFLOW (CR)', 'OUTFLOW (DR)'];
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
              { id: 'ytd', label: 'YTD', icon: TrendingUp },
              { id: 'financial_year', label: 'Financial Year', icon: History },
              { id: 'custom', label: 'Custom', icon: Filter },
            ].map(btn => (
              <button
                key={btn.id}
                onClick={() => setFilterType(btn.id as FilterType)}
                className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${filterType === btn.id ? 'bg-brand text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <btn.icon size={15} /> {btn.label}
              </button>
            ))}
          </div>

          <div className="px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
              {filterType === 'daily' && (
                <div className="space-y-2 flex-1">
                  <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-widest px-1">Statement Date</label>
                  <div className="relative group cursor-pointer h-[48px]" onClick={() => handleOpenPicker(dailyInputRef)}>
                    <div className="absolute inset-0 px-5 bg-white border border-[#e2e8f0] rounded-xl font-bold text-[14px] text-slate-900 flex items-center z-10 transition-all group-hover:border-slate-300 shadow-sm">
                       {formatDateToDDMMYYYY(customRange.from)}
                    </div>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 z-20 pointer-events-none group-hover:text-brand transition-colors">
                       <Calendar size={18} />
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

              {filterType === 'financial_year' && (
                <div className="space-y-2 flex-1">
                  <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-widest px-1">Select Financial Year</label>
                  <div className="relative h-[48px]">
                    <select
                      className="w-full px-5 bg-white border border-[#e2e8f0] rounded-xl text-[14px] font-bold text-slate-900 uppercase outline-none focus:border-brand appearance-none transition-all pr-12 h-full shadow-sm"
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

              {filterType === 'custom' && (
                <>
                  <div className="space-y-2 flex-1">
                    <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-widest px-1">From Date</label>
                    <div className="relative group cursor-pointer h-[48px]" onClick={() => handleOpenPicker(customFromRef)}>
                      <div className="absolute inset-0 px-5 bg-white border border-[#e2e8f0] rounded-xl font-bold text-[14px] text-slate-900 flex items-center z-10 transition-all group-hover:border-slate-300 shadow-sm">
                        {formatDateToDDMMYYYY(customRange.from)}
                      </div>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 z-20 pointer-events-none group-hover:text-brand transition-colors">
                        <Calendar size={18} />
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
                  <div className="space-y-2 flex-1">
                    <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-widest px-1">To Date</label>
                    <div className="relative group cursor-pointer h-[48px]" onClick={() => handleOpenPicker(customToRef)}>
                      <div className="absolute inset-0 px-5 bg-white border border-[#e2e8f0] rounded-xl font-bold text-[14px] text-slate-900 flex items-center z-10 transition-all group-hover:border-slate-300 shadow-sm">
                        {formatDateToDDMMYYYY(customRange.to)}
                      </div>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 z-20 pointer-events-none group-hover:text-brand transition-colors">
                        <Calendar size={18} />
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
                </>
              )}
            </div>
          </div>
        </div>

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
                <th className="px-8 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right w-48">Inflow (CR)</th>
                <th className="px-8 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right w-48">Outflow (DR)</th>
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
