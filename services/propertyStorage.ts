import { UserAccount, PropertyData, CapexSetup } from '../types';

const STORAGE_USERS_KEY = 'theloka_pro_users_v2';
const STORAGE_CURRENT_USER_KEY = 'theloka_pro_current_user_v2';
const STORAGE_PROPERTIES_KEY = 'theloka_pro_properties_v2';
const STORAGE_ACTIVE_PROP_ID_KEY = 'theloka_pro_active_property_id_v2';

export const DEFAULT_CAPEX: CapexSetup = {
  roomRenovationPerRoom: 35000000,
  publicAreaRenovation: 300000000,
  mepEquipment: 250000000,
  itPmsHardware: 150000000,
  workingCapital: 200000000,
};

const BASE_SEASONALITY = [0.70, 0.65, 0.60, 0.75, 0.70, 0.80, 0.85, 0.88, 0.75, 0.72, 0.68, 0.90];

export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'user_super_admin',
    email: 'superadmin@theloka.com',
    name: 'Super Admin Theloka',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'super_admin',
    createdAt: '2026-01-01T00:00:00.000Z',
    lastLogin: new Date().toISOString(),
  },
  {
    id: 'user_owner_bali',
    email: 'owner.bali@gmail.com',
    name: 'Wayan Resort Owner',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    role: 'user',
    createdAt: '2026-01-15T08:30:00.000Z',
    lastLogin: new Date().toISOString(),
  },
  {
    id: 'user_investor_jkt',
    email: 'investor.jakarta@gmail.com',
    name: 'Hendra Investor',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    role: 'user',
    createdAt: '2026-02-10T11:20:00.000Z',
    lastLogin: new Date().toISOString(),
  }
];

export const INITIAL_PROPERTIES: PropertyData[] = [
  {
    id: 'prop_skyaloka_bali',
    name: 'Skyaloka Resort Bali',
    ownerEmail: 'owner.bali@gmail.com',
    createdAt: '2026-01-15T09:00:00.000Z',
    updatedAt: new Date().toISOString(),
    basicInput: {
      name: 'Skyaloka Resort Bali',
      location: 'Ubud',
      address: 'Jl. Richloka 88, Ubud, Gianyar',
      rooms: 80,
      adr: 2500000,
      targetOcc: 70,
      type: 'Resort',
      umkArea: 'bali_gianyar',
      customUmk: 3130000,
      feeModel: '15_percent',
      customFee: { revPct: 15, baseRevPct: 5, gopPct: 10 },
      hasRestaurant: true,
      fbRatio: 25,
      otherStreams: [
        { id: 1, name: 'Laundry', value: 1.5, type: 'percent', active: true },
        { id: 2, name: 'Spa & Wellness', value: 3.0, type: 'percent', active: true }
      ],
      fixedCharges: [
        { id: 'fc_rent', name: 'Biaya Sewa Lahan / Bangunan (Lease)', monthlyAmount: 25000000, active: true, category: 'Sewa Lahan/Gedung', notes: 'Sewa tanah atau bangunan properti tetap per bulan' },
        { id: 'fc_loan', name: 'Cicilan Pinjaman & Bunga Bank (Debt Service)', monthlyAmount: 35000000, active: true, category: 'Pinjaman / Bunga Bank', notes: 'Beban bunga & cicilan pokok kredit modal kerja/investasi' },
        { id: 'fc_insurance', name: 'Asuransi Properti & Bangunan', monthlyAmount: 5000000, active: true, category: 'Asuransi Properti', notes: 'Polis asuransi all-risk properti & liabilitas' },
        { id: 'fc_tax_pbb', name: 'Pajak Bumi & Bangunan (PBB)', monthlyAmount: 3000000, active: true, category: 'PBB & Retribusi', notes: 'PBB tahunan dibagi 12 bulan' },
        { id: 'fc_other', name: 'Biaya Tetap Lainnya (Retainer/Lisensi)', monthlyAmount: 2000000, active: false, category: 'Lainnya', notes: 'Audit, legal retainer, atau iuran lingkungan' }
      ]
    },
    monthlyTargets: BASE_SEASONALITY.map((occ, idx) => ({
      monthIdx: idx,
      occ: parseFloat((occ * 100).toFixed(1)),
      arr: 2500000
    })),
    growthParams: { revGrowth: 0.05, costInflation: 0.03 },
    capex: {
      roomRenovationPerRoom: 35000000,
      publicAreaRenovation: 300000000,
      mepEquipment: 250000000,
      itPmsHardware: 150000000,
      workingCapital: 200000000,
    }
  },
  {
    id: 'prop_theloka_city_jkt',
    name: 'Theloka Urban Stay Jakarta',
    ownerEmail: 'investor.jakarta@gmail.com',
    createdAt: '2026-02-10T12:00:00.000Z',
    updatedAt: new Date().toISOString(),
    basicInput: {
      name: 'Theloka Urban Stay Jakarta',
      location: 'Jakarta',
      address: 'Jl. Thamrin Boulevard No. 12, Jakarta Pusat',
      rooms: 45,
      adr: 850000,
      targetOcc: 75,
      type: 'Hotel',
      umkArea: 'jakarta',
      customUmk: 5067381,
      feeModel: '15_percent',
      customFee: { revPct: 12, baseRevPct: 4, gopPct: 8 },
      hasRestaurant: false, // Room Only Hotel (No F&B)
      fbRatio: 0,
      otherStreams: [
        { id: 1, name: 'Laundry', value: 2.0, type: 'percent', active: true },
        { id: 2, name: 'Meeting Room Rental', value: 15000000, type: 'fixed', active: true }
      ],
      fixedCharges: [
        { id: 'fc_rent', name: 'Biaya Sewa Gedung Komersial', monthlyAmount: 40000000, active: true, category: 'Sewa Lahan/Gedung', notes: 'Kontrak sewa gedung 10 tahun' },
        { id: 'fc_loan', name: 'Cicilan Kredit Investasi Bank Mandiri', monthlyAmount: 28000000, active: true, category: 'Pinjaman / Bunga Bank', notes: 'Pokok + bunga flat' },
        { id: 'fc_insurance', name: 'Asuransi Kebakaran & Gempa', monthlyAmount: 3500000, active: true, category: 'Asuransi Properti', notes: 'Premi asuransi tahunan' },
        { id: 'fc_tax_pbb', name: 'PBB Gedung Komersial', monthlyAmount: 4500000, active: true, category: 'PBB & Retribusi', notes: 'Pajak Daerah DKI' }
      ]
    },
    monthlyTargets: BASE_SEASONALITY.map((_, idx) => ({
      monthIdx: idx,
      occ: [72, 74, 76, 75, 78, 80, 82, 85, 78, 77, 75, 70][idx],
      arr: 850000
    })),
    growthParams: { revGrowth: 0.04, costInflation: 0.035 },
    capex: {
      roomRenovationPerRoom: 25000000,
      publicAreaRenovation: 180000000,
      mepEquipment: 160000000,
      itPmsHardware: 110000000,
      workingCapital: 120000000,
    }
  },
  {
    id: 'prop_aloka_villa_lombok',
    name: 'Aloka Beachfront Villa Lombok',
    ownerEmail: 'owner.bali@gmail.com',
    createdAt: '2026-03-01T10:00:00.000Z',
    updatedAt: new Date().toISOString(),
    basicInput: {
      name: 'Aloka Beachfront Villa Lombok',
      location: 'Lombok',
      address: 'Pantai Senggigi, Lombok Barat, NTB',
      rooms: 14,
      adr: 1800000,
      targetOcc: 65,
      type: 'Villa',
      umkArea: 'lombok',
      customUmk: 2685000,
      feeModel: '15_percent',
      customFee: { revPct: 15, baseRevPct: 5, gopPct: 10 },
      hasRestaurant: true,
      fbRatio: 30,
      otherStreams: [
        { id: 1, name: 'Laundry', value: 1.5, type: 'percent', active: true },
        { id: 2, name: 'Snorkeling & Boat Trip', value: 8000000, type: 'fixed', active: true }
      ],
      fixedCharges: [
        { id: 'fc_rent', name: 'Sewa Hak Pakai Lahan Pantai', monthlyAmount: 15000000, active: true, category: 'Sewa Lahan/Gedung', notes: 'Perjanjian sewa 20 tahun' },
        { id: 'fc_loan', name: 'Pinjaman Renovasi Villa Bank NTB', monthlyAmount: 18000000, active: true, category: 'Pinjaman / Bunga Bank', notes: 'Cicilan 5 tahun' },
        { id: 'fc_insurance', name: 'Asuransi Badai & Kebakaran', monthlyAmount: 2500000, active: true, category: 'Asuransi Properti', notes: 'All-risk resort' }
      ]
    },
    monthlyTargets: BASE_SEASONALITY.map((occ, idx) => ({
      monthIdx: idx,
      occ: parseFloat((occ * 95).toFixed(1)),
      arr: 1800000
    })),
    growthParams: { revGrowth: 0.06, costInflation: 0.03 },
    capex: {
      roomRenovationPerRoom: 40000000,
      publicAreaRenovation: 150000000,
      mepEquipment: 120000000,
      itPmsHardware: 80000000,
      workingCapital: 100000000,
    }
  }
];

// --- STORAGE ACCESS FUNCTIONS ---

export const getStoredUsers = (): UserAccount[] => {
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_USERS;
  }
};

export const saveStoredUsers = (users: UserAccount[]) => {
  try {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save users', e);
  }
};

export const getStoredCurrentUser = (): UserAccount => {
  try {
    const raw = localStorage.getItem(STORAGE_CURRENT_USER_KEY);
    if (!raw) {
      // Default to Super Admin for complete out-of-the-box convenience
      const defaultUser = INITIAL_USERS[0];
      localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(defaultUser));
      return defaultUser;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_USERS[0];
  }
};

export const saveStoredCurrentUser = (user: UserAccount) => {
  try {
    localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(user));
  } catch (e) {
    console.error('Failed to save current user', e);
  }
};

export const getStoredProperties = (): PropertyData[] => {
  try {
    const raw = localStorage.getItem(STORAGE_PROPERTIES_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_PROPERTIES_KEY, JSON.stringify(INITIAL_PROPERTIES));
      return INITIAL_PROPERTIES;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_PROPERTIES_KEY, JSON.stringify(INITIAL_PROPERTIES));
      return INITIAL_PROPERTIES;
    }
    return parsed;
  } catch (e) {
    return INITIAL_PROPERTIES;
  }
};

export const saveStoredProperties = (props: PropertyData[]) => {
  try {
    localStorage.setItem(STORAGE_PROPERTIES_KEY, JSON.stringify(props));
  } catch (e) {
    console.error('Failed to save properties', e);
  }
};

export const getStoredActivePropertyId = (): string => {
  try {
    const id = localStorage.getItem(STORAGE_ACTIVE_PROP_ID_KEY);
    return id || INITIAL_PROPERTIES[0].id;
  } catch (e) {
    return INITIAL_PROPERTIES[0].id;
  }
};

export const saveStoredActivePropertyId = (id: string) => {
  try {
    localStorage.setItem(STORAGE_ACTIVE_PROP_ID_KEY, id);
  } catch (e) {
    console.error('Failed to save active property id', e);
  }
};

// --- AUTHENTICATION & USER MANAGEMENT ---

export const loginWithGmail = (email: string, fullName?: string): UserAccount => {
  const users = getStoredUsers();
  const normalizedEmail = email.trim().toLowerCase();
  
  let user = users.find(u => u.email.toLowerCase() === normalizedEmail);
  
  if (!user) {
    // Determine role: emails containing admin or ending in @theloka.com can be super_admin
    const isSuperAdmin = normalizedEmail.includes('admin') || normalizedEmail.endsWith('@theloka.com');
    const derivedName = fullName || normalizedEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    user = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      email: normalizedEmail,
      name: derivedName,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(derivedName)}`,
      role: isSuperAdmin ? 'super_admin' : 'user',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };
    users.push(user);
    saveStoredUsers(users);
  } else {
    user.lastLogin = new Date().toISOString();
    if (fullName && fullName !== user.name) {
      user.name = fullName;
    }
    saveStoredUsers(users);
  }
  
  saveStoredCurrentUser(user);
  return user;
};

export const logoutCurrentUser = (): UserAccount => {
  // Reset to guest / first demo user or default
  const defaultUser = INITIAL_USERS[1]; // Regular owner user
  saveStoredCurrentUser(defaultUser);
  return defaultUser;
};

export const deleteUserById = (userId: string, currentUserId: string): { success: boolean; message: string } => {
  if (userId === currentUserId) {
    return { success: false, message: 'Anda tidak dapat menghapus akun Anda sendiri saat sedang login!' };
  }
  
  let users = getStoredUsers();
  const targetUser = users.find(u => u.id === userId);
  if (!targetUser) {
    return { success: false, message: 'Pengguna tidak ditemukan.' };
  }
  
  users = users.filter(u => u.id !== userId);
  saveStoredUsers(users);
  
  // Note: we can optionally delete properties or reassign them to super admin
  return { success: true, message: `Pengguna ${targetUser.email} berhasil dihapus dari sistem.` };
};

export const updateUserRoleById = (userId: string, newRole: 'super_admin' | 'user'): boolean => {
  const users = getStoredUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return false;
  user.role = newRole;
  saveStoredUsers(users);
  return true;
};

// --- PROPERTY MANAGEMENT LOGIC ---

export const getPropertiesForUser = (user: UserAccount): PropertyData[] => {
  const allProps = getStoredProperties();
  if (user.role === 'super_admin') {
    return allProps; // Super admin sees all properties
  }
  // Regular users see their own properties plus any unassigned/shared
  return allProps.filter(p => p.ownerEmail.toLowerCase() === user.email.toLowerCase() || p.ownerEmail === 'public');
};

export const saveOrUpdateProperty = (prop: PropertyData): PropertyData[] => {
  const allProps = getStoredProperties();
  const index = allProps.findIndex(p => p.id === prop.id);
  const updatedProp = { ...prop, updatedAt: new Date().toISOString() };
  
  if (index >= 0) {
    allProps[index] = updatedProp;
  } else {
    allProps.push(updatedProp);
  }
  saveStoredProperties(allProps);
  return allProps;
};

export const createNewProperty = (user: UserAccount, customName?: string): PropertyData => {
  const id = `prop_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const name = customName || `Properti Baru ${getStoredProperties().length + 1}`;
  
  const newProp: PropertyData = {
    id,
    name,
    ownerEmail: user.email,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    basicInput: {
      name,
      location: 'Bali',
      address: 'Jl. Pariwisata Utama No. 8',
      rooms: 30,
      adr: 1200000,
      targetOcc: 70,
      type: 'Resort',
      umkArea: 'bali_badung',
      customUmk: 3318000,
      feeModel: '15_percent',
      customFee: { revPct: 15, baseRevPct: 5, gopPct: 10 },
      hasRestaurant: true,
      fbRatio: 25,
      otherStreams: [
        { id: 1, name: 'Laundry', value: 1.5, type: 'percent', active: true },
        { id: 2, name: 'Spa & Wellness', value: 2.5, type: 'percent', active: true }
      ],
      fixedCharges: [
        { id: 'fc_rent', name: 'Biaya Sewa Lahan / Bangunan (Lease)', monthlyAmount: 18000000, active: true, category: 'Sewa Lahan/Gedung', notes: 'Sewa tempat operasional per bulan' },
        { id: 'fc_loan', name: 'Cicilan Pinjaman Bank / Investor', monthlyAmount: 20000000, active: true, category: 'Pinjaman / Bunga Bank', notes: 'Kewajiban cicilan pokok & bunga per bulan' },
        { id: 'fc_insurance', name: 'Asuransi Properti & Bangunan', monthlyAmount: 3000000, active: true, category: 'Asuransi Properti', notes: 'Polis asuransi all-risk' },
        { id: 'fc_tax_pbb', name: 'Pajak Bumi & Bangunan (PBB)', monthlyAmount: 2000000, active: true, category: 'PBB & Retribusi', notes: 'Estimasi PBB bulanan' }
      ]
    },
    monthlyTargets: BASE_SEASONALITY.map((occ, idx) => ({
      monthIdx: idx,
      occ: parseFloat((occ * 100).toFixed(1)),
      arr: 1200000
    })),
    growthParams: { revGrowth: 0.05, costInflation: 0.03 },
    capex: { ...DEFAULT_CAPEX }
  };
  
  saveOrUpdateProperty(newProp);
  saveStoredActivePropertyId(id);
  return newProp;
};

export const duplicateProperty = (user: UserAccount, sourceProp: PropertyData): PropertyData => {
  const id = `prop_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const cloned: PropertyData = {
    ...JSON.parse(JSON.stringify(sourceProp)),
    id,
    name: `${sourceProp.name} (Salinan)`,
    ownerEmail: user.email,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  cloned.basicInput.name = cloned.name;
  
  saveOrUpdateProperty(cloned);
  saveStoredActivePropertyId(id);
  return cloned;
};

export const deletePropertyById = (propId: string): boolean => {
  let allProps = getStoredProperties();
  if (allProps.length <= 1) {
    return false; // Prevent deleting the last remaining property
  }
  allProps = allProps.filter(p => p.id !== propId);
  saveStoredProperties(allProps);
  return true;
};
