
import React, { useState, useMemo, useRef } from 'react';
import { Account, Voucher } from '../types';
import { formatCurrency, formatDateToDDMMYYYY } from '../utils';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Clock,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Zap
} from 'lucide-react';

interface DashboardProps {
  accounts: Account[];
  vouchers: Voucher[];
  locationName: string;
  onDeleteVoucher: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ accounts, vouchers, locationName, onDeleteVoucher }) => {
  const getLocalISODate = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const todayStr = getLocalISODate(new Date());
  const [selectedDate, setSelectedDate] = useState(() => todayStr);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const isToday = selectedDate === todayStr;

  const navigateDay = (direction: 'prev' | 'next') => {
    if (direction === 'next' && isToday) return;
    const current = new Date(selectedDate);
    const newDate = new Date(current);
    newDate.setDate(current.getDate() + (direction === 'prev' ? -1 : 1));
    const newDateStr = getLocalISODate(newDate);
    if (direction === 'next' && newDateStr > todayStr) return;
    setSelectedDate(newDateStr);
  };

  const reportData = useMemo(() => {
    const dayVouchers = vouchers.filter(v => v.date === selectedDate);
    const openingBalancesSum = accounts.reduce((sum, a) => a.parentId !== null ? sum + (a.openingDebit - a.openingCredit) : sum, 0);
    const pastVouchersSum = vouchers.filter(v => v.date < selectedDate).reduce((sum, v) => sum + (v.debit - v.credit), 0);
    const openingBalance = openingBalancesSum + pastVouchersSum;
    const totalDr = dayVouchers.reduce((sum, v) => sum + v.debit, 0);
    const totalCr = dayVouchers.reduce((sum, v) => sum + v.credit, 0);
    const closingBalance = openingBalance + totalDr - totalCr;

    const groupActivity: Record<string, number> = {};
    dayVouchers.forEach(v => {
      const acc = accounts.find(a => a.id === v.accountId);
      if (acc && acc.parentId) {
        const parent = accounts.find(p => p.id === acc.parentId);
        if (parent) groupActivity[parent.name] = (groupActivity[parent.name] || 0) + 1;
      }
    });
    const mostActiveGroup = Object.entries(groupActivity).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Operational';

    return {
      openingBalance,
      dayVouchers: dayVouchers.sort((a, b) => a.createdAt - b.createdAt),
      totalDr,
      totalCr,
      closingBalance,
      inflowCount: dayVouchers.filter(v => v.credit > 0).length,
      outflowCount: dayVouchers.filter(v => v.debit > 0).length,
      totalCount: dayVouchers.length,
      avgValue: dayVouchers.length > 0 ? (totalDr + totalCr) / dayVouchers.length : 0,
      mostActiveGroup
    };
  }, [selectedDate, vouchers, accounts]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-6">
        <h1 className="text-[18px] font-black text-slate-900 tracking-tight uppercase leading-none">
          Dashboard <span className="mx-2 text-slate-300 font-normal">/</span> {locationName}
        </h1>
        
        <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <button onClick={() => navigateDay('prev')} className="p-3 hover:bg-slate-50 text-slate-500 border-r border-slate-100 transition-colors"><ChevronLeft size={18} strokeWidth={2.5} /></button>
          <div className="flex items-center gap-3 py-2 px-6 cursor-pointer group hover:bg-slate-50/50" onClick={() => dateInputRef.current?.showPicker()}>
             <Calendar size={16} className="text-slate-500 group-hover:text-brand" />
             <span className="text-slate-900 font-bold text-[12px] uppercase tracking-widest tabular-nums">{isToday ? 'TODAY - ' : ''}{formatDateToDDMMYYYY(selectedDate)}</span>
          </div>
          <button onClick={() => navigateDay('next')} disabled={isToday} className={`p-3 border-l border-slate-100 text-slate-500 ${isToday ? 'opacity-20 cursor-not-allowed' : 'hover:bg-slate-50'}`}><ChevronRight size={18} strokeWidth={2.5} /></button>
          <input ref={dateInputRef} type="date" className="absolute w-0 h-0 opacity-0" value={selectedDate} max={todayStr} onChange={e => setSelectedDate(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'OPENING CASH', value: reportData.openingBalance, color: 'text-amber-700', bg: 'bg-amber-50/50', border: 'border-l-amber-500' },
          { label: 'DAILY INFLOW', value: reportData.totalCr, color: 'text-green-800', bg: 'bg-green-50/50', border: 'border-l-green-700', prefix: '+' },
          { label: 'DAILY OUTFLOW', value: reportData.totalDr, color: 'text-rose-700', bg: 'bg-rose-50/50', border: 'border-l-rose-500', prefix: '-' },
          { label: 'CLOSING CASH', value: reportData.closingBalance, color: 'text-blue-700', bg: 'bg-blue-50/50', border: 'border-l-blue-600' }
        ].map((stat, idx) => (
          <div key={idx} className={`p-6 rounded-2xl border border-slate-200 border-l-[6px] ${stat.bg} ${stat.border} shadow-sm transition-all hover:shadow-md hover:-translate-y-1`}>
            <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-4 ${stat.color}`}>{stat.label}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-black font-mono tracking-tighter text-slate-900 tabular-nums">{stat.prefix || ''}{formatCurrency(Math.abs(stat.value))}</p>
              <span className={`text-[10px] font-bold uppercase ${stat.color} opacity-60 ml-0.5`}>{stat.value >= 0 ? 'DR' : 'CR'}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-4 bg-slate-50/30">
            <div className="w-9 h-9 bg-brand/10 text-brand rounded-xl flex items-center justify-center shadow-sm"><Clock size={18} /></div>
            <h2 className="text-[14px] font-black text-slate-900 uppercase tracking-widest">Recent Activity</h2>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/80">
                  <th className="px-8 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest">Account Details</th>
                  <th className="px-8 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest text-right">Transaction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.dayVouchers.map(v => (
                  <tr key={v.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <p className="text-[14px] font-black text-slate-800 uppercase group-hover:text-brand transition-colors tracking-tight">{accounts.find(a => a.id === v.accountId)?.name}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1.5 opacity-80">{v.description || 'No narration provided'}</p>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <span className={`text-[15px] font-black font-mono tracking-tight ${v.credit > 0 ? 'text-green-700' : 'text-rose-600'}`}>{v.credit > 0 ? '+' : '-'}{formatCurrency(v.credit || v.debit)}</span>
                    </td>
                  </tr>
                ))}
                {reportData.dayVouchers.length === 0 && (
                  <tr><td colSpan={2} className="py-32 text-center text-[11px] font-bold text-slate-400 uppercase tracking-[0.25em] opacity-60 italic">No transactions recorded for this date</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-8 min-h-[500px]">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-9 h-9 bg-blue-500/10 text-blue-600 rounded-xl flex items-center justify-center shadow-sm"><Activity size={18} /></div>
            <h2 className="text-[14px] font-black text-slate-900 uppercase tracking-widest">Day Intelligence</h2>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm">
               <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 shadow-sm"><Zap size={18} /></div>
               <div><p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest opacity-80 mb-1">Total Entries</p><p className="text-xl font-black text-slate-900 tabular-nums leading-none">{reportData.totalCount}</p></div>
            </div>
            <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm">
               <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 shadow-sm"><BarChart3 size={18} /></div>
               <div><p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest opacity-80 mb-1">Avg Value</p><p className="text-xl font-black text-slate-900 font-mono tracking-tighter leading-none">{formatCurrency(reportData.avgValue)}</p></div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
              <span className="text-green-800 flex items-center gap-2"><TrendingUp size={15} strokeWidth={3} /> {reportData.inflowCount} Credits</span>
              <span className="text-rose-700 flex items-center gap-2">{reportData.outflowCount} Debits <TrendingDown size={15} strokeWidth={3} /></span>
            </div>
            <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
               <div className="h-full bg-green-700 transition-all duration-1000 shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)]" style={{ width: `${(reportData.totalCr / (reportData.totalCr + reportData.totalDr + 0.1)) * 100}%` }} />
               <div className="h-full bg-rose-500 transition-all duration-1000 shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)]" style={{ width: `${(reportData.totalDr / (reportData.totalCr + reportData.totalDr + 0.1)) * 100}%` }} />
            </div>
          </div>
          <div className="pt-8 border-t border-slate-100">
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-4 opacity-80">Dominant Business Category</p>
            <div className="bg-green-50/80 border border-green-200 p-6 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-green-100 transition-all shadow-sm">
              <div>
                <p className="text-[16px] font-black text-green-900 uppercase tracking-tight leading-tight">{reportData.mostActiveGroup}</p>
                <p className="text-[10px] font-bold text-green-700/70 uppercase tracking-widest mt-1.5">Primary High-Volume Sector</p>
              </div>
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand group-hover:translate-x-1 transition-all shadow-sm">
                <ArrowRight size={20} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;