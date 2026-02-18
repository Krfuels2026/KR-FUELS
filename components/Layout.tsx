
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  FileText, 
  Wallet, 
  Menu, 
  PlusCircle,
  Bell,
  MapPin,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Bunk, User, Reminder } from '../types';

const KRLogo = ({ size = 32, collapsed = false, className = "" }: { size?: number, collapsed?: boolean, className?: string }) => {
  const lime = "#f7fee7";
  const green = "#006400"; // Updated to theme color
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div 
        className="relative rounded-full overflow-hidden flex flex-col items-center justify-center shadow-md shadow-green-500/5 flex-shrink-0"
        style={{ width: size, height: size, backgroundColor: green }}
      >
        <div 
          className="absolute top-[12%] left-[12%] right-[12%] h-[52%] rounded-[0.3rem] flex items-center justify-center overflow-hidden"
          style={{ backgroundColor: lime }}
        >
          <span 
            className="font-black leading-none select-none"
            style={{ color: green, fontSize: size * 0.38 }}
          >
            KR
          </span>
        </div>
        <div className="absolute bottom-[8%] w-full flex items-center justify-center">
          <span 
            className="font-black leading-none select-none tracking-[0.1em]"
            style={{ color: lime, fontSize: size * 0.14 }}
          >
            FUELS
          </span>
        </div>
      </div>
      {!collapsed && (
        <div className="flex flex-col animate-in fade-in duration-300">
          <h1 className="text-[13px] font-bold tracking-tight text-[#0f172a] uppercase leading-tight">KR Fuels</h1>
          <span className="text-[9px] font-bold text-brand uppercase tracking-widest leading-none">Management</span>
        </div>
      )}
    </div>
  );
};

interface LayoutProps {
  children: React.ReactNode;
  bunks: Bunk[];
  currentBunk: Bunk;
  onBunkChange: (id: string) => void;
  onLogout: () => void;
  user: User;
  reminders?: Reminder[];
  onAddReminder?: (r: Partial<Reminder>) => void;
  onDeleteReminder?: (id: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, bunks, currentBunk, onBunkChange, onLogout, user, reminders = [], onAddReminder, onDeleteReminder }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('kr_sidebar_collapsed');
    return saved === 'true';
  });
  const [isBunkDropdownOpen, setIsBunkDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const location = useLocation();

  const bunkRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('kr_sidebar_collapsed', String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bunkRef.current && !bunkRef.current.contains(event.target as Node)) {
        setIsBunkDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuGroups = useMemo(() => {
    const groups = [
      { label: 'OVERVIEW', items: [{ name: 'Dashboard', icon: LayoutDashboard, path: '/' }, { name: 'Reminders', icon: Bell, path: '/reminders' }] },
      { label: 'TRANSACTIONS', items: [{ name: 'Daily Voucher', icon: FileText, path: '/vouchers' }] },
      { label: 'MASTERS', items: [
        { name: 'Ledger', icon: Users, path: '/accounts' },
        { name: 'Account Master', icon: PlusCircle, path: '/account-master' }
      ]},
      { label: 'REPORTS', items: [
        { name: 'Ledger Report', icon: BookOpen, path: '/ledger' },
        { name: 'Cash Report', icon: Wallet, path: '/cash-report' }
      ]}
    ];

    if (user.role === 'super_admin') {
      groups.push({
        label: 'SYSTEM',
        items: [{ name: 'Administration', icon: ShieldCheck, path: '/administration' }]
      });
    }

    return groups;
  }, [user.role]);

  const getIsActive = (itemPath: string) => {
    const currentPath = location.pathname;
    if (currentPath === itemPath) return true;
    if (itemPath === '/accounts' && (currentPath === '/accounts' || currentPath.startsWith('/account-master/'))) return true;
    return false;
  };

  const sidebarWidth = isCollapsed ? 'w-[75px]' : 'w-[250px]';

  return (
    <div className="h-screen flex bg-[#f8fafc] text-[#0f172a] font-sans overflow-hidden">
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[60] lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside 
        className={`fixed lg:static inset-y-0 left-0 ${sidebarWidth} bg-white z-[70] transition-all duration-300 transform border-r border-slate-200 h-full flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className={`h-14 flex items-center ${isCollapsed ? 'justify-center' : 'px-5'} flex-shrink-0 border-b border-slate-100 relative`}>
          <KRLogo size={34} collapsed={isCollapsed} />
          
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-brand hover:border-brand transition-all shadow-sm z-[80] hidden lg:flex"
          >
            {isCollapsed ? <ChevronRight size={12} strokeWidth={3} /> : <ChevronLeft size={12} strokeWidth={3} />}
          </button>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-6 overflow-y-auto custom-scrollbar">
          {menuGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              {!isCollapsed && (
                <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 animate-in fade-in duration-300">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = getIsActive(item.path);
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all font-semibold text-[14px] group relative ${isActive ? 'bg-brand text-white shadow-lg shadow-green-500/10' : 'text-slate-600 hover:text-brand hover:bg-green-50/50'}`}
                    >
                      <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} className="flex-shrink-0" />
                      {!isCollapsed && (
                        <span className="whitespace-nowrap tracking-tight animate-in fade-in duration-300">
                          {item.name}
                        </span>
                      )}
                      {isCollapsed && (
                        <div className="absolute left-full ml-3 px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100] whitespace-nowrap uppercase tracking-widest border border-slate-700">
                          {item.name}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        

        <div className={`p-5 border-t border-slate-100 bg-slate-50/30 ${isCollapsed ? 'flex justify-center' : ''}`}>
          {!isCollapsed ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
                <MapPin size={16} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-slate-900 uppercase truncate leading-tight">{currentBunk.code}</span>
                <span className="text-[9px] text-slate-500 font-bold uppercase truncate tracking-wider leading-none">{currentBunk.location}</span>
              </div>
            </div>
          ) : (
            <div className="text-brand">
              <MapPin size={18} />
            </div>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-full">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0 z-50 no-print">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-1.5 text-slate-500" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            
            <div className="relative" ref={bunkRef}>
              <button 
                onClick={() => setIsBunkDropdownOpen(!isBunkDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all group shadow-sm"
              >
                <MapPin size={14} className="text-brand" />
                <div className="text-left hidden sm:block">
                   <p className="text-[12px] font-bold text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                     {currentBunk.name}
                     <ChevronDown size={12} className={`text-slate-400 group-hover:text-brand transition-transform ${isBunkDropdownOpen ? 'rotate-180' : ''}`} />
                   </p>
                </div>
              </button>

              {isBunkDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in slide-in-from-top-1">
                  {bunks.map(bunk => {
                    const isActive = bunk.id === currentBunk.id;
                    return (
                      <button
                        key={bunk.id}
                        onClick={() => {
                          onBunkChange(bunk.id);
                          setIsBunkDropdownOpen(false);
                        }}
                        className={`w-full flex flex-col items-start px-5 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 text-left ${isActive ? 'bg-green-50/50' : 'bg-white'}`}
                      >
                        <span className={`text-[13px] font-bold uppercase tracking-tight ${isActive ? 'text-brand' : 'text-slate-700'}`}>
                          {bunk.name}
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                          {bunk.location}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 relative" ref={profileRef}>
            <div 
              className="flex flex-col items-end cursor-pointer group"
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            >
               <p className="text-[12px] font-bold text-[#0f172a] flex items-center gap-1.5 uppercase tracking-tight group-hover:text-brand transition-colors">
                 {user.name}
                 <ChevronDown size={12} className={`text-slate-400 group-hover:text-brand transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
               </p>
               <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{user.role} Access</p>
            </div>
            <div 
              className="w-9 h-9 bg-brand/10 border border-brand/20 rounded-xl flex items-center justify-center text-brand font-bold text-[11px] cursor-pointer shadow-sm"
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            >
              {user.name.substring(0, 2).toUpperCase()}
            </div>

            {isProfileDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in slide-in-from-top-1">
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Active Account</p>
                  <p className="text-[13px] font-bold text-slate-900 truncate">{user.username}</p>
                </div>
                <button
                  onClick={() => {
                    onLogout();
                    setIsProfileDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-5 py-4 text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-all text-left"
                >
                  <LogOut size={18} />
                  <span className="text-[12px] font-bold uppercase tracking-widest">Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="w-full max-w-[1440px] mx-auto p-6 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;