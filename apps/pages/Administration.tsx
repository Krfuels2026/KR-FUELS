
import React, { useState } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api as convexApi } from '../../convex/_generated/api';
import { 
  Building2, 
  Users, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  ShieldAlert, 
  MapPin, 
  UserPlus, 
  Lock,
  Mail,
  CheckCircle2,
  X
} from 'lucide-react';

const Administration: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'bunks' | 'users'>('bunks');
  const [isAddingBunk, setIsAddingBunk] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);

  const [newBunk, setNewBunk] = useState({ name: '', code: '', location: '' });
  const [newUser, setNewUser] = useState({ 
    username: '', password: '', name: '', 
    role: 'admin' as 'admin' | 'super_admin', 
    accessibleBunkIds: [] as string[]
  });

  // ── Convex data ────────────────────────────────────────────────────
  const convexUsers = useQuery(convexApi.queries.users.getAllUsers);
  const allUserBunkAccess = useQuery(convexApi.queries.users.getAllUserBunkAccess);
  const convexBunksRaw = useQuery(convexApi.queries.bunks.getAllBunks);
  const bunks = (convexBunksRaw ?? []).map((b: any) => ({ id: b._id as string, name: b.name as string, code: b.code as string, location: b.location as string }));

  // ── Convex mutations / actions ──────────────────────────────────────
  const createBunk = useMutation(convexApi.mutations.bunks.createBunk);
  const deleteBunk = useMutation(convexApi.mutations.bunks.deleteBunk);
  const registerUser = useAction((convexApi.actions.auth as any).registerUser);
  const deleteUser = useMutation(convexApi.mutations.users.deleteUser);

  // ── Handlers ───────────────────────────────────────────────────────
  const handleAddBunk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBunk.name || !newBunk.code) return;
    try {
      await createBunk({
        name: newBunk.name.toUpperCase(),
        code: newBunk.code.toUpperCase(),
        location: (newBunk.location || '').toUpperCase(),
      });
      setNewBunk({ name: '', code: '', location: '' });
      setIsAddingBunk(false);
    } catch (err: any) {
      alert('Failed to add bunk: ' + (err.message || err));
    }
  };

  const handleDeleteBunk = async (id: string) => {
    if (!confirm("Are you sure? Deleting a bunk will restrict access to its data.")) return;
    try {
      await deleteBunk({ id: id as any });
    } catch (err: any) {
      alert('Failed to delete bunk: ' + (err.message || err));
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.name || !newUser.password) return;
    try {
      await registerUser({
        username: newUser.username.toLowerCase(),
        password: newUser.password,
        name: newUser.name,
        role: newUser.role,
        accessibleBunkIds: newUser.accessibleBunkIds as any,
      });
      setNewUser({ username: '', password: '', name: '', role: 'admin', accessibleBunkIds: [] });
      setIsAddingUser(false);
    } catch (err: any) {
      alert('Failed to create user: ' + (err.message || err));
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm(`Remove this user?`)) return;
    try {
      await deleteUser({ userId: userId as any });
    } catch (err: any) {
      alert('Failed to delete user: ' + (err.message || err));
    }
  };

  const toggleBunkForUser = (bunkId: string) => {
    const current = newUser.accessibleBunkIds;
    if (current.includes(bunkId)) {
      setNewUser({ ...newUser, accessibleBunkIds: current.filter(id => id !== bunkId) });
    } else {
      setNewUser({ ...newUser, accessibleBunkIds: [...current, bunkId] });
    }
  };

  const getUserBunkNames = (userId: string, role: string) => {
    if (role === 'super_admin') return 'Global Access';
    if (!allUserBunkAccess) return '...';
    const accessIds = allUserBunkAccess
      .filter((a: any) => a.userId === userId)
      .map((a: any) => a.bunkId);
    if (accessIds.length === 0) return 'No Bunks Assigned';
    return accessIds
      .map((id: string) => bunks.find(b => b.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between border-b border-slate-200 pb-5 mb-8">
        <div>
          <h1 className="text-[18px] font-black text-slate-900 tracking-tight uppercase">Administration</h1>
        </div>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1.5 rounded-2xl w-fit mb-8 shadow-inner">
        <button 
          onClick={() => setActiveTab('bunks')}
          className={`px-8 py-2.5 rounded-xl font-bold text-[12px] uppercase tracking-widest transition-all flex items-center gap-2.5 ${activeTab === 'bunks' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <Building2 size={16} /> Fuel Stations
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`px-8 py-2.5 rounded-xl font-bold text-[12px] uppercase tracking-widest transition-all flex items-center gap-2.5 ${activeTab === 'users' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <Users size={16} /> Admin Users
        </button>
      </div>

      {activeTab === 'bunks' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-[14px] font-black text-slate-800 uppercase tracking-widest">Active Station List</h2>
            <button 
              onClick={() => setIsAddingBunk(true)}
              className="px-6 py-2.5 bg-brand text-white rounded-xl font-bold text-[11px] uppercase tracking-widest flex items-center gap-2 hover:bg-brand-hover shadow-lg shadow-emerald-500/10 transition-all active:scale-95"
            >
              <Plus size={16} strokeWidth={3} /> Add New Bunk
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bunks.map((bunk) => (
              <div key={bunk.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm group hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-brand/10 group-hover:text-brand transition-colors">
                    <Building2 size={24} />
                  </div>
                  <button onClick={() => handleDeleteBunk(bunk.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
                <h3 className="text-[15px] font-black text-slate-900 uppercase tracking-tight">{bunk.name}</h3>
                <div className="flex items-center gap-4 mt-3">
                  <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-600 tracking-widest">{bunk.code}</span>
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <MapPin size={12} /> {bunk.location}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-[14px] font-black text-slate-800 uppercase tracking-widest">System User Directory</h2>
            <button 
              onClick={() => setIsAddingUser(true)}
              className="px-6 py-2.5 bg-brand text-white rounded-xl font-bold text-[11px] uppercase tracking-widest flex items-center gap-2 hover:bg-brand-hover shadow-lg shadow-emerald-500/10 transition-all active:scale-95"
            >
              <UserPlus size={16} strokeWidth={3} /> Create Admin
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Account Name</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Role Type</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Access Type</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Authorized Bunks</th>
                  <th className="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(convexUsers || []).map((user: any) => (
                  <tr key={user.username} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 font-bold text-[11px]">
                          {user.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-[13px] font-black text-slate-900 uppercase tracking-tight">{user.name}</p>
                          <p className="text-[10px] font-bold text-slate-400">{user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.role === 'super_admin' ? (
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit">
                          <ShieldCheck size={12} /> Super Admin
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit">
                          <ShieldAlert size={12} /> Branch Admin
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[11px] font-bold text-slate-600 uppercase">
                        {user.role === 'super_admin' ? 'Unrestricted Global' : 'Specific Branch'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[300px]">
                        {user.role === 'super_admin' ? (
                          <span className="text-[10px] font-bold text-brand uppercase tracking-widest flex items-center gap-1">
                            <CheckCircle2 size={12} /> Full System Access
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight leading-relaxed">
                            {getUserBunkNames(user._id, user.role)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDeleteUser(user._id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Bunk Modal */}
      {isAddingBunk && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsAddingBunk(false)} />
          <form onSubmit={handleAddBunk} className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h2 className="text-[14px] font-black text-slate-900 uppercase tracking-widest">Register New Bunk</h2>
              <button type="button" onClick={() => setIsAddingBunk(false)} className="p-1.5 text-slate-400 hover:text-rose-500 transition-all"><X size={18} /></button>
            </div>
            <div className="p-8 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Bunk Name</label>
                <input required type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold uppercase tracking-tight focus:border-brand focus:bg-white transition-all outline-none" placeholder="E.G. KR FUELS - COIMBATORE" value={newBunk.name} onChange={e => setNewBunk({...newBunk, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Station Code</label>
                  <input required type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold uppercase tracking-tight focus:border-brand focus:bg-white transition-all outline-none" placeholder="CBE01" value={newBunk.code} onChange={e => setNewBunk({...newBunk, code: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Location</label>
                  <input required type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold uppercase tracking-tight focus:border-brand focus:bg-white transition-all outline-none" placeholder="CITY NAME" value={newBunk.location} onChange={e => setNewBunk({...newBunk, location: e.target.value})} />
                </div>
              </div>
            </div>
            <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex gap-4">
              <button type="button" onClick={() => setIsAddingBunk(false)} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all">Cancel</button>
              <button type="submit" className="flex-1 py-3 bg-brand text-white rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-brand-hover shadow-lg shadow-emerald-500/10 transition-all">Create Bunk</button>
            </div>
          </form>
        </div>
      )}

      {/* Add User Modal */}
      {isAddingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsAddingUser(false)} />
          <form onSubmit={handleAddUser} className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h2 className="text-[14px] font-black text-slate-900 uppercase tracking-widest">Add Admin</h2>
              <button type="button" onClick={() => setIsAddingUser(false)} className="p-1.5 text-slate-400 hover:text-rose-500 transition-all"><X size={18} /></button>
            </div>
            <div className="p-8 space-y-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Staff Display Name</label>
                <div className="relative">
                   <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                   <input required type="text" className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold focus:border-brand focus:bg-white transition-all outline-none" placeholder="E.G. VIJAY" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Username</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input required type="text" className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold focus:border-brand focus:bg-white transition-all outline-none" placeholder="E.G. KR_ADMIN_01" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Initial Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input required type="text" className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold focus:border-brand focus:bg-white transition-all outline-none" placeholder="MIN 6 CHARACTERS" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">System Role</label>
                <div className="flex gap-4">
                   <button 
                    type="button" 
                    onClick={() => setNewUser({...newUser, role: 'admin'})}
                    className={`flex-1 p-4 rounded-2xl border transition-all text-left ${newUser.role === 'admin' ? 'bg-white border-brand ring-4 ring-emerald-50' : 'bg-slate-50 border-slate-200 opacity-60'}`}
                   >
                     <p className="text-[12px] font-black text-slate-900 uppercase tracking-tight">Branch Admin</p>
                     <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">Specific Bunk Access</p>
                   </button>
                   <button 
                    type="button" 
                    onClick={() => setNewUser({...newUser, role: 'super_admin'})}
                    className={`flex-1 p-4 rounded-2xl border transition-all text-left ${newUser.role === 'super_admin' ? 'bg-white border-brand ring-4 ring-emerald-50' : 'bg-slate-50 border-slate-200 opacity-60'}`}
                   >
                     <p className="text-[12px] font-black text-slate-900 uppercase tracking-tight">Super Admin</p>
                     <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">Full System Access</p>
                   </button>
                </div>
              </div>

              {newUser.role === 'admin' && (
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Bunk Access Permissions</label>
                  <div className="grid grid-cols-1 gap-2">
                    {bunks.map(b => (
                      <div 
                        key={b.id} 
                        onClick={() => toggleBunkForUser(b.id)}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${newUser.accessibleBunkIds?.includes(b.id) ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}
                      >
                         <div className="flex items-center gap-3">
                            <Building2 size={14} className={newUser.accessibleBunkIds?.includes(b.id) ? 'text-emerald-600' : 'text-slate-400'} />
                            <span className={`text-[11px] font-black uppercase tracking-tight ${newUser.accessibleBunkIds?.includes(b.id) ? 'text-emerald-900' : 'text-slate-600'}`}>{b.name}</span>
                         </div>
                         <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${newUser.accessibleBunkIds?.includes(b.id) ? 'bg-brand border-brand' : 'bg-white border-slate-200'}`}>
                           {newUser.accessibleBunkIds?.includes(b.id) && <Plus size={12} className="text-white rotate-45" />}
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex gap-4">
              <button type="button" onClick={() => setIsAddingUser(false)} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all">Cancel</button>
              <button type="submit" className="flex-1 py-3 bg-brand text-white rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-brand-hover shadow-lg shadow-emerald-500/10 transition-all">Create Account</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Administration;
