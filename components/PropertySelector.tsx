import React, { useState } from 'react';
import { 
  Building2, 
  ChevronDown, 
  Plus, 
  Copy, 
  Trash2, 
  Save, 
  Check, 
  Hotel, 
  Sparkles,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { PropertyData, UserAccount } from '../types';

interface PropertySelectorProps {
  properties: PropertyData[];
  activeProperty: PropertyData;
  currentUser: UserAccount;
  onSelectProperty: (propertyId: string) => void;
  onAddProperty: (name: string) => void;
  onDuplicateProperty: () => void;
  onDeleteProperty: (propertyId: string) => void;
  onManualSave: () => void;
  isSaved?: boolean;
}

export const PropertySelector: React.FC<PropertySelectorProps> = ({
  properties,
  activeProperty,
  currentUser,
  onSelectProperty,
  onAddProperty,
  onDuplicateProperty,
  onDeleteProperty,
  onManualSave,
  isSaved = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isNewPropModalOpen, setIsNewPropModalOpen] = useState(false);
  const [newPropName, setNewPropName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPropName.trim()) return;
    onAddProperty(newPropName.trim());
    setNewPropName('');
    setIsNewPropModalOpen(false);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Selector Trigger Button */}
      <div className="flex items-center space-x-2">
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center space-x-2.5 bg-white hover:bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-left shadow-sm transition-all text-xs font-bold text-slate-800"
          >
            <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center shrink-0">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <div className="max-w-[150px] sm:max-w-[200px] truncate">
              <div className="truncate font-extrabold text-slate-900">{activeProperty.name}</div>
              <div className="text-[10px] text-slate-400 font-normal truncate">
                {activeProperty.basicInput?.rooms || 0} Kamar • {activeProperty.basicInput?.location || '-'}
              </div>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
              <div className="absolute left-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-fade-in divide-y divide-slate-100">
                <div className="p-3 bg-slate-50 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Daftar Properti Anda ({properties.length})</span>
                  {currentUser.role === 'super_admin' && (
                    <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-extrabold">
                      Super Admin View
                    </span>
                  )}
                </div>

                {/* Property List */}
                <div className="max-h-60 overflow-y-auto p-1.5 space-y-1">
                  {properties.map((p) => {
                    const isSelected = p.id === activeProperty.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          onSelectProperty(p.id);
                          setIsOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all text-xs ${
                          isSelected
                            ? 'bg-blue-50 text-blue-950 font-bold border border-blue-200'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <div className="font-bold truncate">{p.name}</div>
                          <div className="text-[10px] text-slate-400">
                            {p.basicInput?.rooms || 0} Kamar • {p.basicInput?.type || 'Hotel'} • {p.basicInput?.location || '-'}
                          </div>
                          {currentUser.role === 'super_admin' && (
                            <div className="text-[9px] text-slate-400 font-mono">
                              Owner: {p.ownerEmail}
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Actions inside Dropdown */}
                <div className="p-2 bg-slate-50 space-y-1.5">
                  <button
                    onClick={() => {
                      setIsNewPropModalOpen(true);
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center justify-center px-3 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    + Tambah Properti Baru
                  </button>

                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <button
                      onClick={() => {
                        onDuplicateProperty();
                        setIsOpen(false);
                      }}
                      className="flex items-center justify-center px-2 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 transition-colors"
                      title="Duplikasi properti ini beserta seluruh konfigurasinya"
                    >
                      <Copy className="w-3 h-3 mr-1 text-slate-500" />
                      Duplikasi
                    </button>

                    {properties.length > 1 && (
                      <button
                        onClick={() => {
                          setDeleteConfirm(true);
                          setIsOpen(false);
                        }}
                        className="flex items-center justify-center px-2 py-1.5 bg-white hover:bg-rose-50 border border-slate-200 rounded-lg text-[11px] font-bold text-rose-600 transition-colors"
                        title="Hapus properti ini"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Hapus
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Quick Save Indicator Button */}
        <button
          onClick={onManualSave}
          className="flex items-center space-x-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-xs"
          title="Klik untuk memastikan seluruh perubahan tersimpan di memori akun"
        >
          <Save className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden sm:inline">Simpan Properti</span>
        </button>
      </div>

      {/* Modal Tambah Properti Baru */}
      {isNewPropModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <h4 className="font-bold text-slate-900 text-base mb-1">Tambah Properti Baru</h4>
            <p className="text-xs text-slate-500 mb-4">
              Buat properti baru yang akan tersimpan di akun Anda dan dapat diatur kalkulasinya secara terpisah.
            </p>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Hotel / Villa / Resort</label>
                <input
                  type="text"
                  placeholder="Contoh: Sunset Villa Canggu"
                  value={newPropName}
                  onChange={(e) => setNewPropName(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none font-semibold"
                  autoFocus
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewPropModalOpen(false)}
                  className="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-blue-900 hover:bg-blue-800 text-white rounded-xl shadow-sm"
                >
                  Buat Properti
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Hapus Properti Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-base mb-1">Hapus Properti Ini?</h4>
            <p className="text-xs text-slate-500 mb-4">
              Apakah Anda yakin ingin menghapus <span className="font-bold text-slate-800">{activeProperty.name}</span>? Seluruh data proyeksi & konfigurasi properti ini akan dihapus.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(false)}
                className="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteProperty(activeProperty.id);
                  setDeleteConfirm(false);
                }}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm"
              >
                Ya, Hapus Properti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
