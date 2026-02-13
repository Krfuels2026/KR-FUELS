
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Account } from '../types';
import { ChevronDown, Check, Folder } from 'lucide-react';

interface HierarchyDropdownProps {
  accounts: Account[];
  selectedId: string | null;
  onChange: (id: string) => void;
  excludeId?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

const HierarchyDropdown: React.FC<HierarchyDropdownProps> = ({
  accounts,
  selectedId,
  onChange,
  excludeId,
  label,
  placeholder = "Select Group",
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedAccount = useMemo(() => 
    accounts.find(a => a.id === selectedId), 
    [accounts, selectedId]
  );

  const groupIds = useMemo(() => {
    const ids = new Set<string>();
    accounts.forEach(a => {
      if (a.parentId === null) ids.add(a.id);
      if (a.parentId) ids.add(a.parentId);
    });
    return ids;
  }, [accounts]);

  const onlyGroups = useMemo(() => {
    return accounts.filter(a => groupIds.has(a.id) && a.id !== excludeId);
  }, [accounts, groupIds, excludeId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (id: string) => {
    onChange(id);
    setIsOpen(false);
  };

  const renderHierarchical = (parentId: string | null, depth: number = 0) => {
    const children = onlyGroups
      .filter(a => a.parentId === parentId)
      .sort((a, b) => a.name.localeCompare(b.name));
    
    return children.map(account => {
      const isSelected = selectedId === account.id;

      return (
        <React.Fragment key={account.id}>
          <div
            onClick={() => handleSelect(account.id)}
            className={`
              px-6 py-2 transition-all flex items-center justify-between cursor-pointer
              ${isSelected ? 'bg-green-50 text-brand font-bold' : 'text-slate-700 hover:bg-slate-50'}
            `}
            style={{ paddingLeft: `${(depth + 1) * 1.5}rem` }}
          >
            <div className="flex items-center gap-3 truncate">
               <Folder size={14} className={`${isSelected ? 'text-brand' : 'text-slate-300'} flex-shrink-0`} />
               <span className="text-[12px] uppercase font-bold tracking-tight truncate">
                 {account.name}
               </span>
            </div>
            {isSelected && <Check size={14} className="text-brand flex-shrink-0" strokeWidth={3} />}
          </div>
          {renderHierarchical(account.id, depth + 1)}
        </React.Fragment>
      );
    });
  };

  return (
    <div className="flex flex-col w-full relative h-full" ref={dropdownRef}>
      {label && <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest px-1 mb-1">{label}</label>}
      
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full bg-white border border-slate-200 rounded-lg flex items-center justify-between cursor-pointer transition-all px-4 h-full
          ${isOpen ? 'border-brand ring-4 ring-brand/5' : 'hover:border-slate-300'}
        `}
      >
        <span className={`text-[14px] font-bold truncate uppercase ${!selectedAccount ? 'text-slate-300' : 'text-slate-800'}`}>
          {selectedAccount ? selectedAccount.name : placeholder}
        </span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[110] max-h-[250px] overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="py-2">
            {renderHierarchical(null)}
            {onlyGroups.length === 0 && (
              <div className="px-6 py-8 text-center text-slate-300 text-[10px] font-black uppercase tracking-widest">
                No groups found
              </div>
            )}
          </div>
        </div>
      )}

      {required && (
        <input
          type="text"
          value={selectedId || ''}
          required
          tabIndex={-1}
          className="absolute opacity-0 pointer-events-none"
          readOnly
        />
      )}
    </div>
  );
};

export default HierarchyDropdown;
