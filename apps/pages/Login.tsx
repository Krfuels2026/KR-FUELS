
import React, { useState } from 'react';
import { Lock, Mail, LogIn, AlertCircle, Fuel, BarChart3, ShieldCheck } from 'lucide-react';
import { User } from '../types';
import { useLogin } from '../convex-api';
import { storeAuthData } from '../lib/auth';

interface LoginProps {
  onLogin: (user: User) => void;
}

const KRLogoFull = ({ className = "" }: { className?: string }) => (
  <div className={`flex flex-col items-center ${className}`}>
    <div className="bg-brand p-3 rounded-[20%] flex items-center justify-center shadow-lg shadow-green-900/10">
      <div className="bg-[#f7fee7] px-4 py-2 rounded-lg">
        <span className="text-brand font-black text-4xl tracking-tighter leading-none">KR</span>
      </div>
    </div>
    <span className="mt-2 text-brand font-black text-xl tracking-[0.2em] uppercase">Fuels</span>
  </div>
);

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const login = useLogin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      // Call Convex login action (returns JWT token)
      const userData = await login({ username, password });
      
      // Store JWT token and user data securely
      storeAuthData(
        userData.token,
        {
          id: userData.id,
          username: userData.username,
          name: userData.name,
          role: userData.role,
          accessibleBunkIds: userData.accessibleBunkIds,
        },
        userData.expiresIn || '24h'
      );
      
      // Convert Convex user data to app User type
      const user: User = {
        username: userData.username,
        name: userData.name,
        role: userData.role,
        accessibleBunkIds: userData.accessibleBunkIds,
      };
      
      onLogin(user);
    } catch (err: any) {
      setError(err?.message || 'Invalid username or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-light flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-[1100px] min-h-[650px] bg-white rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col md:flex-row border border-brand/5">
        
        <div className="w-full md:w-1/2 bg-brand-light p-8 md:p-16 flex flex-col items-center justify-center text-center relative overflow-hidden border-b md:border-b-0 md:border-r border-brand/5">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand/5 rounded-full blur-3xl" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand/10 rounded-full blur-3xl" />
          
          <div className="relative z-10 w-full max-w-[400px]">
            <div className="mb-12 relative">
              <div className="bg-white p-8 rounded-[40px] shadow-2xl shadow-green-500/5 inline-block">
                <div className="relative">
                  <BarChart3 className="w-48 h-48 text-brand/10 absolute -top-4 -left-4 animate-pulse" strokeWidth={1} />
                  <Fuel className="w-40 h-40 text-brand" strokeWidth={1.5} />
                  <div className="absolute -bottom-2 -right-2 bg-brand text-white p-4 rounded-3xl shadow-lg border-4 border-white">
                    <ShieldCheck size={24} />
                  </div>
                </div>
              </div>
            </div>

            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight uppercase mb-4">
              KR Fuels <br />
              <span className="text-brand">Accounting Hub</span>
            </h1>
            <p className="text-slate-500 font-bold text-sm uppercase tracking-tight leading-relaxed max-w-[320px] mx-auto opacity-80">
              Unleash Operational Excellence with our Station Management Platform
            </p>

            <div className="flex gap-2 justify-center mt-12">
              <div className="w-2.5 h-2.5 rounded-full bg-brand" />
              <div className="w-2.5 h-2.5 rounded-full bg-brand/20" />
              <div className="w-2.5 h-2.5 rounded-full bg-brand/20" />
              <div className="w-2.5 h-2.5 rounded-full bg-brand/20" />
            </div>
          </div>
        </div>

        <div className="w-full md:w-1/2 p-8 md:p-20 flex flex-col justify-center bg-white">
          <div className="max-w-[380px] mx-auto w-full">
            <KRLogoFull className="mb-14 scale-110" />

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[12px] font-bold text-slate-500 uppercase tracking-widest px-1">Username or email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl text-[14px] font-bold text-slate-900 outline-none focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all placeholder:text-slate-300 shadow-sm"
                    placeholder="johnsmith007"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">Password</label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl text-[14px] font-bold text-slate-900 outline-none focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all placeholder:text-slate-300 shadow-sm"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-[11px] font-bold uppercase tracking-tight animate-in slide-in-from-top-1">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-[13px] uppercase tracking-[0.15em] hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70 mt-4"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Sign in <LogIn size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-12 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                © 2025 KR FUELS • SECURE ACCOUNTING GATEWAY
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;