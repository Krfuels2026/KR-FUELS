
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Account, Voucher, Reminder } from '../types';
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
  reminders?: Reminder[];
}

const Dashboard: React.FC<DashboardProps> = ({ accounts, vouchers, locationName, onDeleteVoucher, reminders = [] }) => {
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
        <h1 className="text-[18px] font-black text-slate-900 tracking-tight uppercase">
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
          { label: 'OPENING BALANCE', value: reportData.openingBalance, color: 'text-amber-600', border: 'border-l-amber-500' },
          { label: 'TOTAL INFLOW', value: reportData.totalCr, color: 'text-emerald-600', border: 'border-l-emerald-500', prefix: '+' },
          { label: 'TOTAL OUTFLOW', value: reportData.totalDr, color: 'text-rose-500', border: 'border-l-rose-500', prefix: '-' },
          { label: 'CLOSING CASH', value: reportData.closingBalance, color: 'text-blue-600', border: 'border-l-blue-500' }
        ].map((stat, idx) => (
          <div key={idx} className={`p-5 rounded-xl bg-white border border-slate-200 border-l-4 ${stat.border} shadow-sm transition-all hover:shadow-md`}>
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${stat.color}`}>{stat.label}</p>
            <div className="flex items-baseline gap-1.5">
              <p className="text-xl font-black font-mono tracking-tighter tabular-nums text-slate-900">{stat.prefix || ''}{formatCurrency(Math.abs(stat.value))}</p>
              <span className="text-[9px] font-bold uppercase text-slate-400">{stat.value >= 0 ? 'DR' : 'CR'}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[500px]">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-4 bg-slate-50/30 flex-shrink-0">
            <div className="w-9 h-9 bg-brand/10 text-brand rounded-xl flex items-center justify-center shadow-sm"><Clock size={18} /></div>
            <h2 className="text-[14px] font-black text-slate-900 uppercase tracking-widest">Recent Activity</h2>
          </div>
          <div className="overflow-y-auto overflow-x-auto flex-1 custom-scrollbar">
            <table className="w-full text-left">
              <thead className="sticky top-0 z-10">
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

        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[500px] h-[500px]">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-500/10 text-blue-600 rounded-xl flex items-center justify-center shadow-sm"><Activity size={18} /></div>
              <h2 className="text-[14px] font-black text-slate-900 uppercase tracking-widest">Reminders</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                <Zap size={13} className="text-slate-400" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active</span>
                <span className="text-[13px] font-black text-slate-800 tabular-nums ml-1">{(reminders || []).filter(r => r.reminderDate <= todayStr && r.dueDate >= todayStr).length}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 rounded-lg px-3 py-1.5">
                <BarChart3 size={13} className="text-rose-400" />
                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Due Today</span>
                <span className="text-[13px] font-black text-rose-700 tabular-nums ml-1">{(reminders || []).filter(r => r.dueDate === todayStr).length}</span>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
            {(() => {
              const active = (reminders || []).filter(r => r.reminderDate <= todayStr && r.dueDate >= todayStr);
              // Sort: due today first, then urgent (< 24h), then others; within each group by dueDate asc
              const sorted = [...active].sort((a, b) => {
                const aDueToday = a.dueDate === todayStr ? 0 : 1;
                const bDueToday = b.dueDate === todayStr ? 0 : 1;
                if (aDueToday !== bDueToday) return aDueToday - bDueToday;
                return a.dueDate.localeCompare(b.dueDate);
              });
              if (sorted.length === 0) return (
                <p className="text-[11px] text-slate-400 uppercase tracking-wider text-center pt-16">No reminders for this date</p>
              );
              return sorted.map(r => {
                const dueToday = r.dueDate === todayStr;
                const colorClass = dueToday
                  ? 'bg-rose-50/90 border-rose-500'
                  : 'bg-green-50/80 border-green-600';
                const iconClass = dueToday ? 'bg-rose-500 text-white' : 'bg-green-600 text-white';
                const badge = dueToday ? 'DUE TODAY' : 'ACTIVE';
                const badgeClass = dueToday ? 'bg-rose-500 text-white' : 'bg-green-700 text-white';
                const textMain = dueToday ? 'text-rose-900' : 'text-green-900';
                const textSub = dueToday ? 'text-rose-700' : 'text-green-700';
                const textDue = dueToday ? 'text-rose-600' : 'text-green-700';
                return (
                  <div key={r.id} className={`p-4 border-l-4 rounded-xl flex items-start justify-between transition-all hover:shadow-md ${colorClass}`}>
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconClass}`}>
                        <Clock size={15} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${badgeClass}`}>{badge}</span>
                        <p className={`font-bold uppercase text-[12px] mt-1.5 ${textMain}`}>{r.title}</p>
                        <p className={`text-[11px] mt-0.5 ${textSub}`}>{r.description}</p>
                        <p className={`text-[10px] mt-1 uppercase tracking-wider font-bold ${textDue}`}>Due: {formatDateToDDMMYYYY(r.dueDate)}</p>
                      </div>
                    </div>
                    <a href="#/reminders" className={`text-[11px] font-bold hover:underline flex-shrink-0 ml-2 mt-0.5 ${textDue}`}>View</a>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;