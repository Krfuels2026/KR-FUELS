
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Account } from '../types';
import { BookOpen, Plus, X, RotateCcw, FolderPlus } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import HierarchyDropdown from '../components/HierarchyDropdown';

interface AccountMasterProps {
  accounts: Account[];
  onSave: (account: Partial<Account>) => void;
  onUpdate: (account: Account) => void;
  onDelete?: (id: string) => void;
}

const AccountMaster: React.FC<AccountMasterProps> = ({ accounts, onSave, onUpdate, onDelete }) => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const preselectedParentId = searchParams.get('parentId');

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const groupInputRef = useRef<HTMLInputElement>(null);

  const getInitialFormData = () => ({ name: '', parentId: '', openingDebit: 0, openingCredit: 0 });
  const [formData, setFormData] = useState<Partial<Account>>(getInitialFormData());

  useEffect(() => {
    if (isEditing) {
      const existing = accounts.find(a => a.id === id);
      if (existing) setFormData(existing);
    } else if (preselectedParentId) {
      setFormData(prev => ({ ...prev, parentId: preselectedParentId }));
    }
  }, [id, accounts, isEditing, preselectedParentId]);

  useEffect(() => {
    if (isGroupModalOpen) {
      setTimeout(() => groupInputRef.current?.focus(), 100);
    }
  }, [isGroupModalOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const accountData: Partial<Account> = { 
      ...formData, 
      id: isEditing ? id : Math.random().toString(36).substr(2, 9), 
      createdAt: isEditing ? (formData.createdAt || Date.now()) : Date.now(), 
      parentId: formData.parentId || null 
    };
    if (isEditing) onUpdate(accountData as Account); else onSave(accountData);
    navigate('/accounts');
  };

  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const groupData: Partial<Account> = {
      id: Math.random().toString(36).substr(2, 9),
      name: newGroupName.trim().toUpperCase(),
      parentId: null,
      openingDebit: 0,
      openingCredit: 0,
      createdAt: Date.now()
    };

    onSave(groupData);
    setFormData(prev => ({ ...prev, parentId: groupData.id }));
    setNewGroupName('');
    setIsGroupModalOpen(false);
  };

  const inputHeight = "h-[44px]";

  return (
    <div className="animate-in fade-in duration-500 max-w-5xl mx-auto space-y-4 pb-12">
      <ConfirmDialog 
        isOpen={isConfirmOpen} 
        onClose={() => setIsConfirmOpen(false)} 
        onConfirm={() => { if(onDelete && id) { onDelete(id); navigate('/accounts'); } }} 
        title="Delete?" 
        message="Remove account record?" 
      />
      
      {/* Group Creation Modal */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsGroupModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-brand text-white rounded-lg flex items-center justify-center shadow-md">
                  <FolderPlus size={16} />
                </div>
                <h2 className="text-[12px] font-bold text-slate-900 uppercase tracking-widest">New Account Group</h2>
              </div>
              <button onClick={() => setIsGroupModalOpen(false)} className="p-1.5 text-slate-400 hover:text-rose-500 transition-all">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleAddGroup} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest px-0.5">Group Name</label>
                <input 
                  ref={groupInputRef}
                  type="text" 
                  required 
                  value={newGroupName} 
                  onChange={e => setNewGroupName(e.target.value)} 
                  placeholder="Enter group name..." 
                  className="w-full px-4 bg-slate-50 border border-slate-200 rounded-lg font-bold text-[14px] text-slate-900 focus:border-brand focus:bg-white transition-all outline-none uppercase h-[44px] placeholder:text-slate-400 placeholder:text-[11px] placeholder:normal-case shadow-inner" 
                />
              </div>
              <div className="pt-2 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsGroupModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-brand text-white rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-brand-hover transition-all shadow-lg shadow-emerald-500/10"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center gap-1 mb-2">
        <h1 className="text-[18px] font-bold text-slate-900 tracking-widest uppercase">Ledger Master Registry</h1>
        <div className="h-1 w-10 bg-brand rounded-full opacity-40" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
           <BookOpen size={18} className="text-brand" />
           <h2 className="text-[13px] font-bold text-slate-900 uppercase tracking-widest">Account Details</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest px-0.5">Ledger Account Name</label>
              <input 
                type="text" 
                required 
                value={formData.name} 
                onChange={e => setFormData({ ...formData, name: e.target.value })} 
                placeholder="Enter account title (e.g. HDFC Bank)..." 
                className={`w-full px-4 bg-white border border-slate-200 rounded-lg font-bold text-[14px] text-slate-900 focus:border-brand transition-all outline-none uppercase ${inputHeight} placeholder:text-slate-400 placeholder:text-[11px] placeholder:normal-case shadow-sm hover:border-slate-300`} 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest px-0.5">Parent Account Group</label>
              <div className={`flex items-center gap-2 ${inputHeight}`}>
                <div className="flex-1 h-full">
                  <HierarchyDropdown 
                    accounts={accounts} 
                    selectedId={formData.parentId || null} 
                    onChange={id => setFormData({ ...formData, parentId: id })} 
                    excludeId={id} 
                    placeholder="Select parent group..." 
                  />
                </div>
                <button 
                  type="button" 
                  onClick={() => setIsGroupModalOpen(true)} 
                  className="w-[44px] h-full bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center hover:bg-brand hover:text-white transition-all border border-slate-200 shadow-sm active:scale-95"
                  title="Create New Group"
                >
                  <Plus size={18} strokeWidth={3} />
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest px-0.5">Opening Balance (Debit)</label>
              <div className={`relative ${inputHeight}`}>
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[11px]">₹</span>
                <input 
                  type="number" 
                  value={formData.openingDebit || ''} 
                  onChange={e => setFormData({ ...formData, openingDebit: Number(e.target.value) })} 
                  placeholder="0.00" 
                  className={`w-full pl-8 pr-4 bg-white border border-slate-200 rounded-lg font-bold text-[14px] text-slate-900 focus:border-brand transition-all h-full font-mono placeholder:text-slate-400 placeholder:text-[11px] shadow-sm hover:border-slate-300`} 
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest px-0.5">Opening Balance (Credit)</label>
              <div className={`relative ${inputHeight}`}>
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[11px]">₹</span>
                <input 
                  type="number" 
                  value={formData.openingCredit || ''} 
                  onChange={e => setFormData({ ...formData, openingCredit: Number(e.target.value) })} 
                  placeholder="0.00" 
                  className={`w-full pl-8 pr-4 bg-white border border-slate-200 rounded-lg font-bold text-[14px] text-slate-900 focus:border-brand transition-all h-full font-mono placeholder:text-slate-400 placeholder:text-[11px] shadow-sm hover:border-slate-300`} 
                />
              </div>
            </div>
          </div>
          
          <div className="pt-6 border-t border-slate-100 flex items-center justify-center gap-8">
            <button type="button" onClick={() => setFormData(getInitialFormData())} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 hover:text-rose-600 transition-colors">
              <RotateCcw size={14} /> Clear Entry
            </button>
            <button type="submit" className="px-16 py-3.5 bg-brand text-white rounded-xl font-bold text-[14px] uppercase tracking-widest hover:bg-brand-hover shadow-xl shadow-emerald-500/10 transition-all active:scale-95">
              {isEditing ? 'Save Changes' : 'Register Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountMaster;
