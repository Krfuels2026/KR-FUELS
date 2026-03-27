
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Account } from '../types';
import { X, ChevronDown, Check, Folder, BookOpen, Search } from 'lucide-react';

interface LedgerModalSelectorProps {
  accounts: Account[];
  selectedId: string | null;
  onChange: (id: string) => void;
  label: string;
  placeholder?: string;
  compact?: boolean;
  labelClassName?: string;
  triggerHeight?: string;
  allowGroups?: boolean;
}

const LedgerModalSelector: React.FC<LedgerModalSelectorProps> = ({
  accounts,
  selectedId,
  onChange,
  label,
  placeholder = "Search ledger account...",
  compact = false,
  labelClassName,
  triggerHeight = "h-[40px]",
  allowGroups = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
      setSearchTerm('');
    }
  }, [isOpen]);

  const selectedAccount = useMemo(() => accounts.find(a => a.id === selectedId), [accounts, selectedId]);
  
  const parentIds = useMemo(() => new Set(accounts.map(a => a.parentId).filter((id): id is string => id !== null)), [accounts]);

  const renderHierarchical = (parentId: string | null, depth: number = 0) => {
    const children = accounts.filter(a => a.parentId === parentId);
    
    const sortedChildren = [...children].sort((a, b) => a.name.localeCompare(b.name));

    return sortedChildren.map(account => {
      const isSelected = selectedId === account.id;
      const isParent = parentIds.has(account.id);
      const isRoot = account.parentId === null;
      const isSelectable = allowGroups ? true : (!isParent && !isRoot);

      // Filter logic: if searching, only show if name matches or has matching children
      if (searchTerm.trim() && !account.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        const hasMatchingDescendant = (accId: string): boolean => {
          return accounts.some(a => a.parentId === accId && (a.name.toLowerCase().includes(searchTerm.toLowerCase()) || hasMatchingDescendant(a.id)));
        };
        if (!hasMatchingDescendant(account.id)) return null;
      }

      const showAsGroupHeader = !allowGroups && (isParent || isRoot);

      return (
        <React.Fragment key={account.id}>
          <div 
            onClick={() => { 
              if (isSelectable) {
                onChange(account.id); 
                setIsOpen(false); 
              }
            }} 
            className={`
              px-6 py-2 transition-all flex items-center justify-between
              ${isSelectable ? 'cursor-pointer' : 'cursor-default'}
              ${isSelected ? 'bg-green-50 text-brand' : isSelectable ? 'text-slate-700 hover:bg-slate-50' : 'text-slate-400 opacity-60'}
              ${isRoot ? 'bg-slate-50/30 mt-3 first:mt-1 border-y border-slate-100/50' : ''}
            `}
          >
            <div className="flex items-center gap-3 truncate" style={{ paddingLeft: `${depth * 1.25}rem` }}>
               {showAsGroupHeader ? (
                 <>
                   <Folder size={12} className={isSelected ? 'text-brand' : 'text-slate-300'} />
                   <span className={`text-[10px] font-bold uppercase tracking-[0.1em] truncate ${isSelected ? 'text-brand' : 'text-slate-500'}`}>
                     {account.name}
                   </span>
                 </>
               ) : (
                 <>
                   <div className="w-4 flex justify-center">
                     {isParent || isRoot ? (
                       <Folder size={12} className={isSelected ? 'text-brand' : 'text-slate-400'} />
                     ) : (
                       <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-brand shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />
                     )}
                   </div>
                   <span className={`text-[13px] font-bold uppercase tracking-tight truncate ${isSelected ? 'text-brand' : 'text-slate-800'}`}>
                     {account.name}
                   </span>
                 </>
               )}
            </div>
            {isSelected && isSelectable && <Check size={14} className="text-brand" strokeWidth={3} />}
          </div>
          {renderHierarchical(account.id, depth + 1)}
        </React.Fragment>
      );
    });
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <label className={labelClassName || "text-[10px] font-bold text-slate-600 uppercase tracking-widest px-1 mb-0.5"}>{label}</label>}
      <div 
        onClick={() => setIsOpen(true)} 
        className={`w-full bg-white border border-slate-200 rounded-lg flex items-center justify-between cursor-pointer transition-all ${triggerHeight} ${compact ? 'px-3' : 'px-4'} hover:border-brand shadow-sm group`}
      >
        <span className={`truncate tracking-tight ${!selectedAccount ? 'text-slate-400 text-[11px] font-medium normal-case' : 'text-slate-900 text-[13px] font-bold uppercase'}`}>
          {selectedAccount ? selectedAccount.name : placeholder}
        </span>
        <ChevronDown size={15} className="text-slate-300 group-hover:text-brand transition-colors" />
      </div>
      
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-brand text-white rounded-lg flex items-center justify-center shadow-md shadow-emerald-500/10">
                  <BookOpen size={14} />
                </div>
                <div>
                  <h2 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">Select Account</h2>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                    {allowGroups ? 'Groups are selectable' : 'Pick a sub-ledger to continue'}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1.5 text-slate-400 hover:text-rose-500 transition-all rounded-lg hover:bg-rose-50">
                <X size={18} />
              </button>
            </div>
            
            <div className="px-5 py-3 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  ref={searchInputRef} 
                  type="text" 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                  placeholder="Type to search ledgers..." 
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-900 outline-none focus:border-brand focus:bg-white transition-all uppercase h-[42px] shadow-inner placeholder:text-slate-400 placeholder:text-[11px] placeholder:normal-case" 
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pb-8 bg-white">
              {renderHierarchical(null)}
              {accounts.length === 0 && (
                <div className="py-20 text-center px-10">
                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">No accounts found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LedgerModalSelector;
