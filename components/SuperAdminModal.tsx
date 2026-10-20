import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Users, 
  Trash2, 
  Building2, 
  UserCheck, 
  UserPlus, 
  Key, 
  AlertTriangle,
  ArrowRight,
  Search,
  Check,
  Edit,
  ExternalLink
} from 'lucide-react';
import { UserAccount, PropertyData } from '../types';
import { 
  getStoredUsers, 
  saveStoredUsers, 
  deleteUserById, 
  updateUserRoleById, 
  getStoredProperties,
  loginWithGmail 
} from '../services/propertyStorage';

interface SuperAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  onSwitchUser: (user: UserAccount) => void;
  onSelectProperty: (propertyId: string) => void;
}

export const SuperAdminModal: React.FC<SuperAdminModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSwitchUser,
  onSelectProperty
}) => {
  const [users, setUsers] = useState<UserAccount[]>(getStoredUsers());
  const [properties, setProperties] = useState<PropertyData[]>(getStoredProperties());
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'properties'>('users');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // New user form state
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'user' | 'super_admin'>('user');
  const [isAddingUser, setIsAddingUser] = useState(false);

  if (!isOpen) return null;

  const refreshData = () => {
    setUsers(getStoredUsers());
    setProperties(getStoredProperties());
  };

  const handleDeleteUser = (userId: string) => {
    const res = deleteUserById(userId, currentUser.id);
    if (res.success) {
      setActionNotice(res.message);
      setDeleteConfirmId(null);
      refreshData();
      setTimeout(() => setActionNotice(null), 4000);
    } else {
      alert(res.message);
    }
  };

  const handleToggleRole = (userId: string, currentRole: 'super_admin' | 'user') => {
    if (userId === currentUser.id) {
      alert("Anda tidak dapat menurunkan hak akses akun Anda sendiri!");
      return;
    }
    const nextRole = currentRole === 'super_admin' ? 'user' : 'super_admin';
    updateUserRoleById(userId, nextRole);
    refreshData();
    setActionNotice(`Role pengguna berhasil diubah menjadi ${nextRole === 'super_admin' ? 'SUPER ADMIN' : 'USER'}!`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleCreateNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes('@')) {
      alert('Harap masukkan email yang valid');
      return;
    }
    const created = loginWithGmail(newEmail.trim(), newName.trim() || undefined);
    if (newRole === 'super_admin') {
      updateUserRoleById(created.id, 'super_admin');
    }
    refreshData();
    setIsAddingUser(false);
    setNewEmail('');
    setNewName('');
    setActionNotice(`Pengguna baru ${created.email} berhasil ditambahkan!`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const filteredProperties = properties.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.ownerEmail.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white flex justify-between items-center border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-lg">Super Admin Control Center</h3>
                <span className="text-[10px] font-extrabold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Full Authority
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Kelola seluruh akun pengguna, hapus pengguna, dan buka/edit properti dari seluruh sistem.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Notice Alert */}
        {actionNotice && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 text-xs text-emerald-800 font-bold flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{actionNotice}</span>
            </div>
            <button onClick={() => setActionNotice(null)} className="text-emerald-600 hover:text-emerald-900">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tab & Search Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center transition-all ${
                activeTab === 'users'
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5 mr-1.5" />
              Daftar Pengguna ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('properties')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center transition-all ${
                activeTab === 'properties'
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 mr-1.5" />
              Semua Properti ({properties.length})
            </button>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={activeTab === 'users' ? 'Cari email / nama user...' : 'Cari nama properti / owner...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>
            {activeTab === 'users' && (
              <button
                onClick={() => setIsAddingUser(!isAddingUser)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center shrink-0 shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5 mr-1" />
                Tambah User
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Add User Modal / Inline Form */}
          {isAddingUser && (
            <form onSubmit={handleCreateNewUser} className="bg-blue-50/70 border border-blue-200 p-4 rounded-2xl mb-6 space-y-3 animate-fade-in">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-blue-900 uppercase">Tambah Pengguna Baru</span>
                <button type="button" onClick={() => setIsAddingUser(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="email"
                  placeholder="Email Gmail (contoh: user@gmail.com)"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="text-xs p-2 rounded-lg border border-slate-300 bg-white"
                  required
                />
                <input
                  type="text"
                  placeholder="Nama Pengguna"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="text-xs p-2 rounded-lg border border-slate-300 bg-white"
                />
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="text-xs p-2 rounded-lg border border-slate-300 bg-white font-bold"
                >
                  <option value="user">User Biasa (Owner)</option>
                  <option value="super_admin">Super Admin (Akses Penuh)</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddingUser(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 font-bold hover:bg-white rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-900 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-blue-800"
                >
                  Simpan Pengguna
                </button>
              </div>
            </form>
          )}

          {activeTab === 'users' ? (
            <div className="space-y-3">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-2.5 px-3">Pengguna</th>
                      <th className="py-2.5 px-3">Email Gmail</th>
                      <th className="py-2.5 px-3">Role / Hak Akses</th>
                      <th className="py-2.5 px-3">Properti Dimiliki</th>
                      <th className="py-2.5 px-3 text-right">Aksi Super Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredUsers.map((u) => {
                      const userProps = properties.filter(p => p.ownerEmail.toLowerCase() === u.email.toLowerCase());
                      const isMe = u.id === currentUser.id;

                      return (
                        <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3">
                            <div className="flex items-center space-x-2.5">
                              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs text-slate-700 overflow-hidden shrink-0">
                                {u.avatar ? <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" /> : u.name[0]}
                              </div>
                              <div>
                                <span className="font-bold text-slate-800">{u.name}</span>
                                {isMe && (
                                  <span className="ml-1.5 text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded">
                                    AKUN ANDA
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-600">{u.email}</td>
                          <td className="py-3 px-3">
                            <button
                              onClick={() => handleToggleRole(u.id, u.role)}
                              title={isMe ? "Tidak dapat mengubah akun sendiri" : "Klik untuk toggle role"}
                              disabled={isMe}
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border transition-all ${
                                u.role === 'super_admin'
                                  ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                              } ${isMe ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                            >
                              {u.role === 'super_admin' ? '🛡️ SUPER ADMIN' : '👤 USER (OWNER)'}
                            </button>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                              {userProps.length} Properti
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              {!isMe && (
                                <button
                                  onClick={() => {
                                    onSwitchUser(u);
                                    onClose();
                                  }}
                                  className="text-[11px] font-bold text-blue-700 hover:bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors"
                                  title="Login & lihat tampilan pengguna ini"
                                >
                                  Login Akun
                                </button>
                              )}

                              {!isMe ? (
                                deleteConfirmId === u.id ? (
                                  <div className="flex items-center space-x-1">
                                    <button
                                      onClick={() => handleDeleteUser(u.id)}
                                      className="text-[10px] bg-rose-600 text-white font-bold px-2 py-1 rounded hover:bg-rose-700"
                                    >
                                      Ya, Hapus
                                    </button>
                                    <button
                                      onClick={() => setDeleteConfirmId(null)}
                                      className="text-[10px] bg-slate-200 text-slate-700 font-bold px-1.5 py-1 rounded hover:bg-slate-300"
                                    >
                                      Batal
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setDeleteConfirmId(u.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                                    title="Hapus pengguna ini dari sistem"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-2.5 px-3">Nama Properti</th>
                      <th className="py-2.5 px-3">Tipe & Lokasi</th>
                      <th className="py-2.5 px-3">Jumlah Kamar</th>
                      <th className="py-2.5 px-3">Pemilik (Email Gmail)</th>
                      <th className="py-2.5 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredProperties.map((p) => {
                      return (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-800 text-xs sm:text-sm">{p.name}</div>
                            <div className="text-[10px] text-slate-400">{p.basicInput?.address || '-'}</div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-semibold text-slate-700">{p.basicInput?.type || 'Hotel'}</span> • <span className="text-slate-500">{p.basicInput?.location || '-'}</span>
                          </td>
                          <td className="py-3 px-3 font-bold text-blue-900">
                            {p.basicInput?.rooms || 0} Kamar
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-600">
                            {p.ownerEmail}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => {
                                onSelectProperty(p.id);
                                onClose();
                              }}
                              className="text-xs font-bold bg-blue-900 hover:bg-blue-800 text-white px-3 py-1.5 rounded-xl inline-flex items-center shadow-sm transition-all"
                            >
                              Buka & Edit <ArrowRight className="w-3 h-3 ml-1" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Mode Super Admin Aktif: Anda memiliki izin mengubah kalkulasi properti siapapun & menghapus pengguna.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
