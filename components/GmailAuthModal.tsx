import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  ShieldCheck, 
  Check, 
  User, 
  Lock, 
  Sparkles, 
  ArrowRight,
  LogOut,
  Building2
} from 'lucide-react';
import { UserAccount, PropertyData } from '../types';
import { INITIAL_USERS, loginWithGmail, getPropertiesForUser } from '../services/propertyStorage';

interface GmailAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  onLoginSuccess: (user: UserAccount) => void;
  onLogout: () => void;
}

export const GmailAuthModal: React.FC<GmailAuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout,
}) => {
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim() || !customEmail.includes('@')) {
      setErrorMsg('Harap masukkan alamat email valid (contoh: nama@gmail.com)');
      return;
    }
    setErrorMsg('');
    const user = loginWithGmail(customEmail, customName.trim() || undefined);
    onLoginSuccess(user);
    onClose();
  };

  const handleSelectQuickUser = (sampleEmail: string, sampleName: string) => {
    setErrorMsg('');
    const user = loginWithGmail(sampleEmail, sampleName);
    onLoginSuccess(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-6 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-md">
              {/* Google Colored G Icon */}
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-lg">Login via Google / Gmail</h3>
              <p className="text-xs text-blue-200">Theloka Cloud Property Sync</p>
            </div>
          </div>
          <p className="text-xs text-blue-100/90 mt-1">
            Masuk untuk menyimpan nama dan konfigurasi properti Anda secara otomatis ke akun Gmail.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Active Logged In User Status */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-900 font-bold flex items-center justify-center border border-blue-200 overflow-hidden text-sm">
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  currentUser.name.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-slate-800 text-xs sm:text-sm">{currentUser.name}</span>
                  {currentUser.role === 'super_admin' ? (
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-extrabold px-1.5 py-0.5 rounded border border-amber-300">
                      SUPER ADMIN
                    </span>
                  ) : (
                    <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded">
                      OWNER
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">{currentUser.email}</div>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center px-2.5 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
              title="Keluar dari akun saat ini"
            >
              <LogOut className="w-3.5 h-3.5 mr-1" /> Keluar
            </button>
          </div>

          {/* Quick 1-Click Demo Accounts */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Pilih Akun Demo / Cepat:
            </label>
            <div className="space-y-2">
              {INITIAL_USERS.map((u) => {
                const isSelected = u.email === currentUser.email;
                return (
                  <button
                    key={u.id}
                    onClick={() => handleSelectQuickUser(u.email, u.name)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700 overflow-hidden">
                        {u.avatar ? <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" /> : u.name[0]}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                          <span>{u.name}</span>
                          {u.role === 'super_admin' && (
                            <span className="text-[9px] bg-amber-500 text-white font-extrabold px-1.5 py-0.2 rounded">
                              SUPER ADMIN
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">{u.email}</div>
                      </div>
                    </div>
                    {isSelected ? (
                      <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full flex items-center">
                        <Check className="w-3 h-3 mr-1" /> Aktif
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 group-hover:text-slate-600">Gunakan</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-[11px] text-slate-400 font-bold uppercase">Atau Masuk Gmail Sendiri</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Custom Gmail Form */}
          <form onSubmit={handleCustomLogin} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Alamat Gmail / Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="contoh.anda@gmail.com"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Nama Lengkap / Nama Pemilik Properti (Opsional)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Contoh: Bpk. Gunawan"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-600 font-semibold">{errorMsg}</p>
            )}

            <button
              type="submit"
              className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center transition-all shadow-md"
            >
              Masuk & Simpan Properti ke Akun Ini
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
