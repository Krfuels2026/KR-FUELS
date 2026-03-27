
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Account } from '../types';
import { 
  Search, 
  ChevronDown, 
  Edit2, 
  Trash2, 
  PlusCircle, 
  Folder, 
  Plus, 
  Layers,
  Users2,
  Pencil,
  X,
  Check
} from 'lucide-react';
import { formatCurrency } from '../utils';
import ConfirmDialog from '../components/ConfirmDialog';

interface AccountsListProps {
  accounts: Account[];
  deleteAccount: (id: string) => void;
  onUpdateAccount?: (account: Account) => void;
}

const AccountsList: React.FC<AccountsListProps> = ({ accounts, deleteAccount, onUpdateAccount }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(accounts.filter(a => !a.parentId).map(a => a.id)));
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const [editingGroup, setEditingGroup] = useState<Account | null>(null);
  const [editName, setEditName] = useState('');

  const toggleGroup = (id: string) => {
    const next = new Set(expandedGroups);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedGroups(next);
  };

  const mainGroups = accounts.filter(a => a.parentId === null).sort((a, b) => a.name.localeCompare(b.name));

  const calculateGroupBalance = (parentId: string) => {
    let total = 0;
    const process = (id: string) => {
      const children = accounts.filter(a => a.parentId === id);
      const acc = accounts.find(a => a.id === id);
      if (acc) total += (acc.openingDebit - acc.openingCredit);
      children.forEach(child => process(child.id));
    };
    process(parentId);
    return total;
  };

  const initiateDelete = (account: Account) => {
    setAccountToDelete(account);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (accountToDelete) {
      deleteAccount(accountToDelete.id);
    }
  };

  const handleRenameGroup = (group: Account) => {
    setEditingGroup(group);
    setEditName(group.name);
  };

  const handleSaveRename = () => {
    if (!editingGroup || !editName.trim() || !onUpdateAccount) return;
    const trimmedName = editName.trim().toUpperCase();
    const duplicate = accounts.find(a => a.parentId === null && a.id !== editingGroup.id && a.name.toUpperCase() === trimmedName);
    if (duplicate) {
      alert(`A parent account group named "${trimmedName}" already exists.`);
      return;
    }
    onUpdateAccount({ ...editingGroup, name: trimmedName });
    setEditingGroup(null);
    setEditName('');
  };

  const stats = useMemo(() => {
    const groupsCount = accounts.filter(a => a.parentId === null).length;
    const ledgersCount = accounts.filter(a => a.parentId !== null).length;
    return { groupsCount, ledgersCount };
  }, [accounts]);

  const renderNestedRows = (parentId: string, depth: number = 0) => {
    const children = accounts
      .filter(a => a.parentId === parentId)
      .filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));

    return children.map((account) => {
      const balance = account.openingDebit - account.openingCredit;
      return (
        <React.Fragment key={account.id}>
          <div className="group flex items-center justify-between py-2.5 px-6 hover:bg-slate-50 transition-all border-b border-slate-50/50 relative">
            {depth > 0 && (
              <div 
                className="absolute top-0 bottom-0 border-l border-slate-100" 
                style={{ left: `${(depth * 1.2) + 1.5}rem` }}
              />
            )}
            
            <div className="flex items-center gap-3 flex-1" style={{ paddingLeft: `${depth * 1.2}rem` }}>
              <div className={`w-1.5 h-1.5 rounded-full ${balance >= 0 ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              <div className="flex flex-col">
                <span className="text-[13px] font-bold text-slate-800 group-hover:text-brand transition-colors leading-tight uppercase tracking-tight">
                  {account.name}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right min-w-[100px]">
                <p className={`text-[12px] font-bold font-mono ${balance >= 0 ? 'text-slate-600' : 'text-rose-600'} tabular-nums`}>
                  {formatCurrency(Math.abs(balance)).replace('₹', '')}
                  <span className="ml-1 text-[9px] font-bold opacity-40 uppercase">{balance >= 0 ? 'DR' : 'CR'}</span>
                </p>
              </div>
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button 
                  onClick={() => navigate(`/account-master/${account.id}`)}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                  title="Edit Account"
                >
                  <Edit2 size={15} />
                </button>
                <button 
                  onClick={() => initiateDelete(account)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  title="Delete Account"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
          {renderNestedRows(account.id, depth + 1)}
        </React.Fragment>
      );
    });
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 max-w-5xl mx-auto pb-10">
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message={`Warning: Permanently delete "${accountToDelete?.name}"? This will affect your financial reports.`}
        confirmLabel="Confirm Delete"
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-3 gap-3">
        <div>
          <h1 className="text-[14px] md:text-[18px] font-black text-slate-900 tracking-tight uppercase">Accounts List</h1>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
            <input
              type="text"
              placeholder="Search..."
              className="pl-9 pr-4 py-1.5 rounded-xl bg-white border border-slate-200 text-[10px] font-bold outline-none focus:border-brand transition-all w-full md:w-56 shadow-sm placeholder:text-slate-400 placeholder:text-[11px] placeholder:normal-case"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => navigate('/account-master')}
            className="px-3 py-1.5 md:px-6 md:py-2 bg-brand text-white rounded-xl font-bold text-[8px] md:text-[10px] flex items-center gap-1.5 md:gap-2 hover:bg-brand-hover transition-all uppercase tracking-widest active:scale-95 shadow-lg shadow-emerald-500/10 whitespace-nowrap"
          >
            <Plus size={12} className="md:w-[14px] md:h-[14px]" strokeWidth={3} /> New Ledger
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 md:gap-4">
        <div className="bg-white p-2 md:p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2 md:gap-4 group hover:border-emerald-200 transition-colors">
          <div className="w-7 h-7 md:w-10 md:h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100 shadow-sm transition-all group-hover:bg-brand group-hover:text-white">
            <Layers size={14} className="md:w-[18px] md:h-[18px]" />
          </div>
          <div>
            <p className="text-[7px] md:text-[9px] font-bold text-slate-600 uppercase tracking-[0.15em] opacity-80 mb-0.5">Primary Groups</p>
            <p className="text-[14px] md:text-xl font-bold text-[#0f172a] leading-none tabular-nums">{stats.groupsCount}</p>
          </div>
        </div>
        <div className="bg-white p-2 md:p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2 md:gap-4 group hover:border-slate-300 transition-colors">
          <div className="w-7 h-7 md:w-10 md:h-10 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center border border-slate-100 shadow-sm">
            <Users2 size={14} className="md:w-[18px] md:h-[18px]" />
          </div>
          <div>
            <p className="text-[7px] md:text-[9px] font-bold text-slate-600 uppercase tracking-[0.15em] opacity-80 mb-0.5">Active Ledgers</p>
            <p className="text-[14px] md:text-xl font-bold text-[#0f172a] leading-none tabular-nums">{stats.ledgersCount}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        {mainGroups.map((group) => {
          const isExpanded = expandedGroups.has(group.id);
          const groupBalance = calculateGroupBalance(group.id);
          const childCount = accounts.filter(a => a.parentId === group.id).length;
          
          return (
            <div key={group.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all">
              <div 
                className={`flex items-center justify-between px-6 py-3.5 cursor-pointer transition-colors ${isExpanded ? 'bg-slate-50/50 border-b border-slate-200' : 'bg-white'}`}
                onClick={() => toggleGroup(group.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isExpanded ? 'bg-brand text-white shadow-lg shadow-green-100' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}>
                    <Folder size={18} strokeWidth={isExpanded ? 2.5 : 2} />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-slate-900 uppercase tracking-tight leading-tight">{group.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                       <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest opacity-80">Root Category</span>
                       <span className="w-1 h-1 bg-slate-300 rounded-full" />
                       <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest opacity-80">{childCount} Linked Accounts</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <p className="text-[14px] font-bold text-[#0f172a] font-mono tracking-tighter uppercase tabular-nums">
                    {formatCurrency(Math.abs(groupBalance)).replace('₹', '')}
                    <span className="ml-1 text-[10px] font-bold opacity-40">{groupBalance >= 0 ? 'DR' : 'CR'}</span>
                  </p>
                  {onUpdateAccount && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRenameGroup(group); }}
                      className="p-1.5 text-slate-300 hover:text-brand hover:bg-emerald-50 rounded-lg transition-all"
                      title="Rename Group"
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                  <ChevronDown size={18} className={`text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {isExpanded && (
                <div className="animate-in slide-in-from-top-1 duration-300">
                  <div className="py-1">
                    {renderNestedRows(group.id)}
                  </div>
                  
                  <div className="px-6 py-2.5 flex justify-center bg-slate-50/20 border-t border-slate-50">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/account-master?parentId=${group.id}`);
                      }}
                      className="flex items-center gap-1.5 px-6 py-1.5 text-[10px] font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl uppercase tracking-widest transition-all"
                    >
                      <PlusCircle size={14} strokeWidth={2.5} /> Register New Account in Group
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {mainGroups.length === 0 && (
          <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
             <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">No master accounts defined in this bunk</p>
          </div>
        )}
      </div>

      {editingGroup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setEditingGroup(null)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-brand text-white rounded-lg flex items-center justify-center shadow-md shadow-emerald-500/10">
                  <Pencil size={14} />
                </div>
                <div>
                  <h2 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">Rename Account</h2>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Edit display name</p>
                </div>
              </div>
              <button onClick={() => setEditingGroup(null)} className="p-1.5 text-slate-400 hover:text-rose-500 transition-all rounded-lg hover:bg-rose-50">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={e => { e.preventDefault(); handleSaveRename(); }} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Account Name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-[14px] text-slate-900 focus:border-brand focus:bg-white transition-all outline-none uppercase h-[44px] placeholder:text-slate-400 placeholder:text-[11px] placeholder:normal-case shadow-inner"
                  placeholder="Enter new name..."
                />
              </div>
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setEditingGroup(null)} className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-brand text-white rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-brand-hover transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2">
                  <Check size={14} strokeWidth={3} /> Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsList;
