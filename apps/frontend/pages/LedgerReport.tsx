
import React, { useState, useMemo, useRef } from 'react';
import { Account, Voucher } from '../types';
import { calculateLedger, formatCurrency, formatDateToDDMMYYYY } from '../utils';
import LedgerModalSelector from '../components/LedgerModalSelector';
import { Printer, FileSpreadsheet, FileText, Calendar } from 'lucide-react';

interface LedgerReportProps {
  accounts: Account[];
  vouchers: Voucher[];
}

const LedgerReport: React.FC<LedgerReportProps> = ({ accounts, vouchers }) => {
  const fromDateRef = useRef<HTMLInputElement>(null);
  const toDateRef = useRef<HTMLInputElement>(null);

  const [filters, setFilters] = useState({
    accountId: '',
    fromDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
  });

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

  const selectedAccount = accounts.find(a => a.id === filters.accountId);
  
  const reportData = useMemo(() => {
    if (!selectedAccount) return [];

    const getDescendantIds = (accId: string): string[] => {
      let ids = [accId];
      const children = accounts.filter(a => a.parentId === accId);
      children.forEach(child => {
        ids = [...ids, ...getDescendantIds(child.id)];
      });
      return ids;
    };

    const targetAccountIds = getDescendantIds(filters.accountId);
    const targetAccounts = accounts.filter(a => targetAccountIds.includes(a.id));

    const totalOpeningDebit = targetAccounts.reduce((sum, a) => sum + a.openingDebit, 0);
    const totalOpeningCredit = targetAccounts.reduce((sum, a) => sum + a.openingCredit, 0);

    const consolidatedAccount: Account = {
      ...selectedAccount,
      openingDebit: totalOpeningDebit,
      openingCredit: totalOpeningCredit
    };

    const filteredVouchers = vouchers.filter(v => targetAccountIds.includes(v.accountId));
    return calculateLedger(consolidatedAccount, filteredVouchers, filters.fromDate, filters.toDate);
  }, [selectedAccount, vouchers, filters, accounts]);

  const totalDr = reportData.reduce((sum, e) => sum + e.debit, 0);
  const totalCr = reportData.reduce((sum, e) => sum + e.credit, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (reportData.length === 0) return;
    
    const header = ["DATE", "DESCRIPTION", "DEBIT (DR)", "CREDIT (CR)", "BALANCE", "TYPE"];
    const rows = reportData.map(e => [
      formatDateToDDMMYYYY(e.date),
      e.description.replace(/,/g, ' '),
      e.debit.toFixed(2),
      e.credit.toFixed(2),
      e.balance.toFixed(2),
      e.balanceType
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + `LEDGER REPORT: ${selectedAccount?.name}\n`
      + `PERIOD: ${formatDateToDDMMYYYY(filters.fromDate)} TO ${formatDateToDDMMYYYY(filters.toDate)}\n\n`
      + [header, ...rows].map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `LEDGER_${selectedAccount?.name}_${filters.fromDate}_TO_${filters.toDate}.csv`);
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
            <h1 className="text-[20px] font-black text-[#0f172a] uppercase tracking-tight">Ledger Report</h1>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handlePrint}
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
              onClick={handlePrint}
              className="px-6 py-2.5 bg-brand text-white rounded-full font-bold text-[11px] flex items-center gap-2 hover:bg-brand-hover transition-all shadow-md shadow-green-100 uppercase tracking-widest active:scale-95"
            >
              <FileText size={16} /> PDF
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
            <div className="flex flex-col h-full">
               <LedgerModalSelector
                 label="SELECT ACCOUNT"
                 accounts={accounts}
                 selectedId={filters.accountId}
                 onChange={id => setFilters({ ...filters, accountId: id })}
                 placeholder="SEARCH LEDGER..."
                 compact={true}
                 labelClassName="text-[11px] font-bold text-[#64748b] uppercase tracking-widest px-1 mb-2"
                 triggerHeight="h-[48px]"
                 allowGroups={true}
               />
            </div>
            
            <div className="space-y-2 flex-1">
              <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-widest px-1">From Date</label>
              <div className="relative group cursor-pointer h-[48px]" onClick={() => handleOpenPicker(fromDateRef)}>
                <div className="absolute inset-0 px-5 bg-white border border-[#e2e8f0] rounded-xl font-bold text-[14px] text-slate-900 flex items-center z-10 transition-all group-hover:border-slate-300 shadow-sm">
                  {formatDateToDDMMYYYY(filters.fromDate)}
                </div>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 z-20 pointer-events-none group-hover:text-brand transition-colors">
                  <Calendar size={18} />
                </div>
                <input
                  ref={fromDateRef}
                  type="date"
                  className="absolute inset-0 w-full h-full opacity-0 z-30 cursor-pointer"
                  value={filters.fromDate}
                  onChange={e => setFilters({ ...filters, fromDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2 flex-1">
              <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-widest px-1">To Date</label>
              <div className="relative group cursor-pointer h-[48px]" onClick={() => handleOpenPicker(toDateRef)}>
                <div className="absolute inset-0 px-5 bg-white border border-[#e2e8f0] rounded-xl font-bold text-[14px] text-slate-900 flex items-center z-10 transition-all group-hover:border-slate-300 shadow-sm">
                  {formatDateToDDMMYYYY(filters.toDate)}
                </div>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 z-20 pointer-events-none group-hover:text-brand transition-colors">
                  <Calendar size={18} />
                </div>
                <input
                  ref={toDateRef}
                  type="date"
                  className="absolute inset-0 w-full h-full opacity-0 z-30 cursor-pointer"
                  value={filters.toDate}
                  onChange={e => setFilters({ ...filters, toDate: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:border-0 print:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 print:bg-slate-100">
                <th className="px-8 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Date</th>
                <th className="px-8 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Description</th>
                <th className="px-8 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Debit (Dr)</th>
                <th className="px-8 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Credit (Cr)</th>
                <th className="px-8 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportData.map((entry, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-4 text-[14px] font-medium text-slate-600 whitespace-nowrap tabular-nums">{formatDateToDDMMYYYY(entry.date)}</td>
                  <td className="px-8 py-4 text-[14px] font-black text-slate-800 uppercase tracking-tight">
                    {entry.description}
                  </td>
                  <td className="px-8 py-4 text-[14px] text-rose-600 text-right font-black tabular-nums font-mono">
                    {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                  </td>
                  <td className="px-8 py-4 text-[14px] text-emerald-600 text-right font-black tabular-nums font-mono">
                    {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                  </td>
                  <td className="px-8 py-4 text-[14px] text-slate-900 text-right font-black tabular-nums font-mono">
                    {formatCurrency(entry.balance)} <span className="text-[10px] text-slate-400 font-bold ml-1 uppercase">{entry.balanceType}</span>
                  </td>
                </tr>
              ))}
              {reportData.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-24 text-center text-slate-300 font-bold italic uppercase tracking-widest text-[12px]">
                    {filters.accountId ? 'NO TRANSACTION RECORDS FOUND.' : 'SELECT AN ACCOUNT TO VIEW ACTIVITY.'}
                  </td>
                </tr>
              )}
            </tbody>
            {reportData.length > 0 && (
              <tfoot className="bg-slate-50 font-bold print:bg-slate-100 uppercase">
                <tr>
                  <td colSpan={2} className="px-8 py-6 text-right text-slate-800 text-[11px] font-bold tracking-widest uppercase">Movement Summary:</td>
                  <td className="px-8 py-6 text-right text-rose-600 font-black text-[15px] tabular-nums font-mono">{formatCurrency(totalDr)}</td>
                  <td className="px-8 py-6 text-right text-emerald-600 font-black text-[15px] tabular-nums font-mono">{formatCurrency(totalCr)}</td>
                  <td className="px-8 py-6 text-right text-slate-900 font-black text-[15px] tabular-nums tracking-tighter font-mono">
                    <span className="text-[10px] text-slate-400 font-bold mr-2">{reportData[reportData.length - 1].balanceType}</span>
                    {formatCurrency(reportData[reportData.length - 1].balance)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default LedgerReport;
