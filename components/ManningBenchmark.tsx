import React, { useState, useMemo } from 'react';
import { 
  Users, 
  BedDouble, 
  CheckCircle, 
  AlertTriangle, 
  ShieldAlert, 
  HelpCircle, 
  BarChart3, 
  Info,
  Building,
  Activity,
  Sliders,
  RotateCcw,
  Sparkles,
  DollarSign,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Edit3,
  Check,
  TrendingUp,
  MapPin
} from 'lucide-react';
import { DEPARTMENT_LABELS } from '../services/exportCsv';
import { REGIONAL_UMK_DB } from '../App';

interface ManningBenchmarkProps {
  basicInput: any;
  projectedData: any;
  onApplyUmkScale?: (newUmk: number) => void;
  onUpdateRole?: (dept: string, idx: number, field: string, val: any) => void;
  onAddRole?: (dept: string) => void;
  onRemoveRole?: (dept: string, idx: number) => void;
  onUpdateBasicInput?: (field: string, val: any) => void;
}

const formatIDR = (amount: number) => {
  if (isNaN(amount)) return "Rp 0";
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatPercent = (val: number) => `${(val * 100).toFixed(1)}%`;

export const ManningBenchmark: React.FC<ManningBenchmarkProps> = ({
  basicInput,
  projectedData,
  onApplyUmkScale,
  onUpdateRole,
  onAddRole,
  onRemoveRole,
  onUpdateBasicInput
}) => {
  const [selectedBenchmarkType, setSelectedBenchmarkType] = useState<string>(
    basicInput?.type === 'Resort' ? 'resort' : 'midscale'
  );

  const [expandedDept, setExpandedDept] = useState<string | null>('all');
  const [isEditingPositions, setIsEditingPositions] = useState<boolean>(true);

  // Standard Indonesian & International Hospitality Manning Standards
  const benchmarkStandards: Record<string, { name: string; min: number; max: number; hkLoad: number; maxPayrollPct: number; desc: string }> = {
    budget: { 
      name: 'Budget / Select Service', 
      min: 0.25, 
      max: 0.45, 
      hkLoad: 16, 
      maxPayrollPct: 22, 
      desc: 'Layanan minimalis, fokus efisiensi tinggi, operasional ramping tanpa outlet F&B kompleks.' 
    },
    midscale: { 
      name: 'Midscale Hotel (3-Star)', 
      min: 0.45, 
      max: 0.70, 
      hkLoad: 15, 
      maxPayrollPct: 26, 
      desc: 'Standar hotel bisnis bintang 3 dengan fasilitas F&B dasar dan layanan 24 jam terbatas.' 
    },
    resort: { 
      name: 'Upscale Resort (4-Star)', 
      min: 0.70, 
      max: 1.10, 
      hkLoad: 13, 
      maxPayrollPct: 30, 
      desc: 'Resort dengan lanskap taman, kolam renang, spa, operasional F&B aktif, & hospitality service.' 
    },
    luxury: { 
      name: 'Luxury / Boutique (5-Star)', 
      min: 1.20, 
      max: 2.00, 
      hkLoad: 10, 
      maxPayrollPct: 35, 
      desc: 'High-touch personalized service, butler, fine dining, 24/7 concierge, & perawatan aset intensif.' 
    }
  };

  const standard = benchmarkStandards[selectedBenchmarkType] || benchmarkStandards.midscale;

  // Current UMK configuration from basicInput
  const currentUmk = basicInput?.customUmk || 3130000;
  const currentUmkArea = basicInput?.umkArea || 'bali_gianyar';
  const umkAreaInfo = REGIONAL_UMK_DB[currentUmkArea] || { label: basicInput?.location || 'Area Properti', umk: currentUmk, province: 'Indonesia' };

  // --- DYNAMIC & SENSIBLE KPI CALIBRATION ---
  // In Indonesia, labor cost percentage depends heavily on regional wage (UMK) vs ADR:
  // When UMK is high (e.g. Jakarta Rp 5M) and ADR is moderate, payroll % is naturally higher.
  // When UMK is low (e.g. Jogja Rp 2.3M), payroll % is lower.
  // We calibrate the baseline target dynamically so it stays realistic and sensible ("masuk akal")!
  const baseAdr = Math.max(100000, Number(basicInput?.adr) || 1500000);
  const wageToAdrRatio = currentUmk / baseAdr; // Standard is around 2.0 - 2.6
  const laborPressureIndex = wageToAdrRatio / 2.2; 
  
  const sensibleAdaptivePayrollPct = Math.round(
    Math.min(38, Math.max(18, standard.maxPayrollPct * Math.min(1.3, Math.max(0.85, 0.75 + 0.25 * laborPressureIndex))))
  );

  // Editable custom target overrides
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [customMinRatio, setCustomMinRatio] = useState<number>(standard.min);
  const [customMaxRatio, setCustomMaxRatio] = useState<number>(standard.max);
  const [customHkLoad, setCustomHkLoad] = useState<number>(standard.hkLoad);
  const [customMaxPayrollPct, setCustomMaxPayrollPct] = useState<number>(sensibleAdaptivePayrollPct);

  // Sync defaults when standard or UMK changes
  React.useEffect(() => {
    if (!isCustomMode) {
      setCustomMinRatio(standard.min);
      setCustomMaxRatio(standard.max);
      setCustomHkLoad(standard.hkLoad);
      setCustomMaxPayrollPct(sensibleAdaptivePayrollPct);
    }
  }, [selectedBenchmarkType, isCustomMode, standard, sensibleAdaptivePayrollPct]);

  const activeMin = isCustomMode ? customMinRatio : standard.min;
  const activeMax = isCustomMode ? customMaxRatio : standard.max;
  const activeHkLoad = isCustomMode ? customHkLoad : standard.hkLoad;
  const activePayrollPct = isCustomMode ? customMaxPayrollPct : sensibleAdaptivePayrollPct;

  // Analysis computation
  const analysis = useMemo(() => {
    if (!projectedData) return null;

    const rooms = basicInput.rooms || 1;
    const depts = projectedData.depts || {};
    const totalRev = projectedData.revenue.total || 1;

    let totalPax = 0;
    let totalBasePayrollMonthly = 0;
    let totalPayrollAnnualWithBenefits = 0;
    let minRoleSalary = Infinity;
    let nonCompliantRoles: any[] = [];

    const deptStats: any[] = [];

    Object.entries(depts).forEach(([code, dept]: [string, any]) => {
      const pax = dept.roles.reduce((a: number, r: any) => a + (Number(r.count) || 0), 0);
      const monthlyBase = dept.roles.reduce((a: number, r: any) => a + ((Number(r.count) || 0) * (Number(r.salary) || 0)), 0);
      const annualWithBenefits = Number(dept.payroll) || 0;

      dept.roles.forEach((r: any) => {
        if (r.count > 0 && r.salary > 0) {
          if (r.salary < minRoleSalary) {
            minRoleSalary = r.salary;
          }
          if (r.salary < currentUmk * 0.98) {
            nonCompliantRoles.push({ dept: code, role: r.role, salary: r.salary });
          }
        }
      });

      totalPax += pax;
      totalBasePayrollMonthly += monthlyBase;
      totalPayrollAnnualWithBenefits += annualWithBenefits;

      deptStats.push({
        code,
        name: DEPARTMENT_LABELS[code] || code.toUpperCase(),
        pax,
        monthlyBase,
        annualWithBenefits,
        roles: dept.roles
      });
    });

    if (minRoleSalary === Infinity) minRoleSalary = currentUmk;

    // Staff-to-Room Ratio
    const staffToRoomRatio = totalPax / rooms;

    // Payroll-to-Revenue Ratio
    const payrollToRevenueRatio = (totalPayrollAnnualWithBenefits / totalRev) * 100;

    // Housekeeping Workload (Rooms per HK attendant)
    const hkAttendants = (depts.hk?.roles || [])
      .filter((r: any) => r.role.toLowerCase().includes('attendant') || r.role.toLowerCase().includes('clean'))
      .reduce((a: number, r: any) => a + (Number(r.count) || 0), 0) || Math.max(1, Math.ceil(rooms / 8));
    const roomsPerHkAttendant = rooms / Math.max(1, hkAttendants);

    // Average staff monthly salary
    const avgStaffSalary = totalPax > 0 ? (totalBasePayrollMonthly / totalPax) : currentUmk;
    const avgUmkMultiple = currentUmk > 0 ? (avgStaffSalary / currentUmk) : 1;

    // UMK Compliance Check (tolerance 2%)
    const isUmkCompliant = minRoleSalary >= currentUmk * 0.98;

    // Diagnostic Status
    let status: 'optimal' | 'lean' | 'heavy' = 'optimal';
    let statusMessage = '';

    if (staffToRoomRatio < activeMin) {
      status = 'lean';
      statusMessage = `Rasio tergolong sangat ramping (${staffToRoomRatio.toFixed(2)} staff/kamar vs target min ${activeMin.toFixed(2)}). Efisiensi payroll tinggi, namun perhatikan potensi kelelahan karyawan dan konsistensi kualitas layanan tamu.`;
    } else if (staffToRoomRatio > activeMax) {
      status = 'heavy';
      statusMessage = `Rasio tergolong gemuk (${staffToRoomRatio.toFixed(2)} staff/kamar vs target max ${activeMax.toFixed(2)}). Disarankan evaluasi duplikasi tugas dan optimalkan per shift agar margin GOP tidak tertekan.`;
    } else {
      status = 'optimal';
      statusMessage = `Struktur manning sangat ideal (${staffToRoomRatio.toFixed(2)} staff/kamar), berada dalam rentang target standar ${activeMin.toFixed(2)} - ${activeMax.toFixed(2)} staff/kamar untuk kategori ${standard.name}.`;
    }

    return {
      totalPax,
      rooms,
      staffToRoomRatio,
      payrollToRevenueRatio,
      totalBasePayrollMonthly,
      totalPayrollAnnualWithBenefits,
      hkAttendants,
      roomsPerHkAttendant,
      avgStaffSalary,
      avgUmkMultiple,
      minRoleSalary,
      isUmkCompliant,
      nonCompliantRoles,
      status,
      statusMessage,
      deptStats
    };
  }, [projectedData, basicInput, activeMin, activeMax, currentUmk, standard]);

  if (!analysis) {
    return (
      <div className="text-center py-20 text-slate-400">
        Silahkan generate proyeksi kalkulasi terlebih dahulu.
      </div>
    );
  }

  const resetCustomTargets = () => {
    setIsCustomMode(false);
    setCustomMinRatio(standard.min);
    setCustomMaxRatio(standard.max);
    setCustomHkLoad(standard.hkLoad);
    setCustomMaxPayrollPct(sensibleAdaptivePayrollPct);
  };

  const handleUmkSelectChange = (key: string) => {
    const selected = REGIONAL_UMK_DB[key];
    if (selected && onUpdateBasicInput) {
      onUpdateBasicInput('umkArea', key);
      onUpdateBasicInput('customUmk', selected.umk);
    }
  };

  const handleCustomUmkValueChange = (newVal: number) => {
    if (onUpdateBasicInput) {
      onUpdateBasicInput('customUmk', newVal);
      onUpdateBasicInput('umkArea', 'custom');
    }
  };

  return (
    <div className="max-w-6xl mx-auto pt-6 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              Staff Productivity & Manning Health Check
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Evaluasi rasio staf per kamar, kepatuhan UMK regional, dan efisiensi beban gaji operasional hotel.
            </p>
          </div>
        </div>

        {/* Benchmark Selector & Custom Toggle */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <span className="text-xs text-slate-400 pl-2 font-medium">Kategori:</span>
            <select 
              value={selectedBenchmarkType}
              onChange={(e) => {
                setSelectedBenchmarkType(e.target.value);
                setIsCustomMode(false);
              }}
              className="text-xs font-bold bg-slate-50 border-0 rounded-lg px-2.5 py-1.5 text-slate-700 outline-none cursor-pointer"
            >
              {Object.entries(benchmarkStandards).map(([key, item]) => (
                <option key={key} value={key}>{item.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsCustomMode(!isCustomMode)}
            className={`text-xs font-bold px-3 py-2 rounded-xl border flex items-center transition-all ${
              isCustomMode 
                ? 'bg-blue-600 text-white border-blue-600 shadow' 
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 mr-1.5" />
            {isCustomMode ? 'Target KPI Custom' : 'Edit Target KPI'}
          </button>
        </div>
      </div>

      {/* Regional UMK Configuration & Auto-Sync Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider flex items-center">
              <MapPin className="w-3.5 h-3.5 mr-1" /> Acuan Upah Minimum Regional (UMK/UMR Properti)
            </span>
            <h3 className="text-lg font-bold text-slate-800">
              {umkAreaInfo.label} — <span className="font-mono text-indigo-700">{formatIDR(currentUmk)}</span> / bulan
            </h3>
            <p className="text-xs text-slate-500">
              Nilai UMK ini menjadi dasar pengali standar gaji entry-level, supervisor, hingga jajaran manajemen hotel.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {onApplyUmkScale && (
              <button
                onClick={() => onApplyUmkScale(currentUmk)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center transition-all shadow-sm"
                title="Terapkan rumus skala UMK ke seluruh gaji departemen"
              >
                <Sparkles className="w-4 h-4 mr-1.5 text-yellow-300" /> Terapkan Skala UMK ke Seluruh Staf
              </button>
            )}
          </div>
        </div>

        {/* Quick Area Switcher and Custom UMK input */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Pilih Wilayah / Kota Wisata
            </label>
            <select
              value={currentUmkArea}
              onChange={(e) => handleUmkSelectChange(e.target.value)}
              className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {Object.entries(REGIONAL_UMK_DB).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.label} ({formatIDR(item.umk)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Nilai UMK Custom (Dapat Diedit Langsung)
            </label>
            <div className="relative">
              <input
                type="number"
                value={currentUmk}
                onChange={(e) => handleCustomUmkValueChange(parseFloat(e.target.value) || 0)}
                className="w-full text-xs font-mono font-bold bg-white border border-slate-200 rounded-lg p-2.5 text-indigo-900 outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="3000000"
              />
            </div>
          </div>

          <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-100 flex flex-col justify-center text-xs text-indigo-950">
            <div className="flex items-center justify-between font-bold">
              <span>Sensible KPI Calibration:</span>
              <span className="font-mono text-indigo-700">{activePayrollPct}% Max</span>
            </div>
            <p className="text-[11px] text-indigo-800/80 mt-1 leading-relaxed">
              Target Payroll dikalibrasi proporsional dengan UMK ({formatIDR(currentUmk)}) vs target ADR ({formatIDR(baseAdr)}) agar diagnosa manning tetap <strong>masuk akal</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Editable Target Sliders if isCustomMode */}
      {isCustomMode && (
        <div className="bg-blue-50/80 p-6 rounded-2xl border border-blue-200 shadow-sm space-y-4 animate-fade-in text-xs">
          <div className="flex justify-between items-center border-b border-blue-200/80 pb-2">
            <h4 className="font-bold text-blue-900 flex items-center">
              <Sliders className="w-4 h-4 mr-2 text-blue-700" />
              Sesuaikan Parameter KPI Sesuai Kebutuhan Spesifik Properti
            </h4>
            <button 
              onClick={resetCustomTargets}
              className="text-[11px] font-bold text-blue-700 hover:underline flex items-center"
            >
              <RotateCcw className="w-3 h-3 mr-1" /> Reset ke Rekomendasi Adaptif
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-blue-900 mb-1">Target Min Staff/Kamar</label>
              <input 
                type="number" 
                step="0.05"
                value={customMinRatio} 
                onChange={(e) => setCustomMinRatio(parseFloat(e.target.value) || 0.1)}
                className="w-full bg-white border border-blue-200 rounded-lg p-2 font-bold font-mono text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-blue-900 mb-1">Target Max Staff/Kamar</label>
              <input 
                type="number" 
                step="0.05"
                value={customMaxRatio} 
                onChange={(e) => setCustomMaxRatio(parseFloat(e.target.value) || 0.5)}
                className="w-full bg-white border border-blue-200 rounded-lg p-2 font-bold font-mono text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-blue-900 mb-1">Max Beban HK (Kamar/Staf)</label>
              <input 
                type="number" 
                value={customHkLoad} 
                onChange={(e) => setCustomHkLoad(parseInt(e.target.value) || 10)}
                className="w-full bg-white border border-blue-200 rounded-lg p-2 font-bold font-mono text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-blue-900 mb-1">Max Payroll / Revenue (%)</label>
              <input 
                type="number" 
                value={customMaxPayrollPct} 
                onChange={(e) => setCustomMaxPayrollPct(parseInt(e.target.value) || 20)}
                className="w-full bg-white border border-blue-200 rounded-lg p-2 font-bold font-mono text-slate-800"
              />
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Staff-to-Room Ratio */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Staff-to-Room Ratio</span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-slate-800 mt-2">
            {analysis.staffToRoomRatio.toFixed(2)} <span className="text-sm font-semibold text-slate-400">staff/room</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Target Ideal: <span className="font-bold text-slate-700">{activeMin.toFixed(2)} - {activeMax.toFixed(2)}</span>
          </div>
        </div>

        {/* Total Staff Pax */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Total Karyawan (Headcount)</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl font-black text-blue-900 mt-2">
            {analysis.totalPax} <span className="text-sm font-semibold text-slate-500">orang</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Melayani <span className="font-bold text-slate-700">{analysis.rooms} kamar</span>
          </div>
        </div>

        {/* Payroll-to-Revenue Ratio */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Payroll / Total Rev</span>
            <Info className="w-4 h-4 text-purple-500" />
          </div>
          <div className={`text-3xl font-black mt-2 font-mono ${
            analysis.payrollToRevenueRatio <= activePayrollPct ? 'text-purple-900' : 'text-rose-600'
          }`}>
            {analysis.payrollToRevenueRatio.toFixed(1)}%
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Batas Sehat: <span className="font-bold text-slate-700">&le; {activePayrollPct}%</span>
          </div>
        </div>

        {/* HK Attendant Workload */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Beban Housekeeping</span>
            <BedDouble className="w-4 h-4 text-amber-500" />
          </div>
          <div className={`text-3xl font-black mt-2 font-mono ${
            analysis.roomsPerHkAttendant <= activeHkLoad ? 'text-amber-900' : 'text-rose-600'
          }`}>
            {analysis.roomsPerHkAttendant.toFixed(1)} <span className="text-sm font-semibold text-slate-500">kamar/staf</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Beban Maksimal: <span className="font-bold text-slate-700">{activeHkLoad} kamar/hari</span>
          </div>
        </div>
      </div>

      {/* Health Assessment Banner */}
      <div className={`p-5 rounded-2xl border flex items-start space-x-4 ${
        analysis.status === 'optimal' 
          ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
          : analysis.status === 'lean' 
          ? 'bg-blue-50 border-blue-200 text-blue-900' 
          : 'bg-amber-50 border-amber-200 text-amber-900'
      }`}>
        <div className="p-2 rounded-xl bg-white shadow-sm shrink-0">
          {analysis.status === 'optimal' ? (
            <CheckCircle className="w-6 h-6 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h4 className="font-bold text-sm uppercase tracking-wide">
              Diagnosa Struktur Manning: {analysis.status === 'optimal' ? 'OPTIMAL & SEHAT' : analysis.status === 'lean' ? 'SANGAT EFISIEN / LEAN' : 'POTENSI OVERSTAFFED'}
            </h4>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
              analysis.isUmkCompliant 
                ? 'bg-emerald-100 text-emerald-800' 
                : 'bg-rose-100 text-rose-800'
            }`}>
              {analysis.isUmkCompliant ? '✓ Standar Upah Terpenuhi' : '⚠ Sebagian Posisi Di Bawah UMK'}
            </span>
          </div>
          <p className="text-xs mt-1 leading-relaxed opacity-90">
            {analysis.statusMessage}
          </p>
          <div className="mt-2 text-[11px] font-medium opacity-75">
            Rata-rata gaji karyawan saat ini: <span className="font-bold font-mono">{formatIDR(analysis.avgStaffSalary)}/bln</span> ({analysis.avgUmkMultiple.toFixed(2)}x UMK {umkAreaInfo.label}).
          </div>
        </div>
      </div>

      {/* EDITABLE MANNING & SALARY TABLE (The requested feature: "dan juga bisa di editable") */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="font-bold text-slate-800 text-base flex items-center">
              <Edit3 className="w-4 h-4 mr-2 text-indigo-600" />
              Tabel Rincian Gaji & Headcount Interaktif (Editable Mode)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Anda dapat mengubah nama jabatan, jumlah orang (Pax), dan gaji bulanan langsung di tabel ini.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setExpandedDept(expandedDept === 'all' ? null : 'all')}
              className="text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl transition-all"
            >
              {expandedDept === 'all' ? 'Tutup Rincian' : 'Buka Semua Rincian'}
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {analysis.deptStats.map((dept, deptIdx) => {
            const isExpanded = expandedDept === 'all' || expandedDept === dept.code;
            const pctOfTotal = analysis.totalPax > 0 ? (dept.pax / analysis.totalPax) * 100 : 0;

            return (
              <div key={dept.code} className="transition-colors">
                {/* Department Header Row */}
                <div 
                  onClick={() => setExpandedDept(isExpanded ? (expandedDept === 'all' ? dept.code : null) : dept.code)}
                  className="p-4 bg-slate-50/70 hover:bg-slate-100/70 cursor-pointer flex justify-between items-center transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      {dept.name}
                    </span>
                    <span className="text-xs font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">
                      {dept.pax} Pax ({pctOfTotal.toFixed(0)}%)
                    </span>
                  </div>

                  <div className="flex items-center space-x-4">
                    <span className="text-xs font-mono text-slate-600">
                      Monthly: <strong className="text-slate-800">{formatIDR(dept.monthlyBase)}</strong>
                    </span>
                    <span className="text-xs font-mono text-slate-500 hidden sm:inline">
                      Annual (1.2x): <strong className="text-blue-900">{formatIDR(dept.annualWithBenefits)}</strong>
                    </span>
                    {onAddRole && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddRole(dept.code);
                        }}
                        className="text-[11px] bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 px-2 py-1 rounded font-bold flex items-center shadow-2xs"
                      >
                        <Plus className="w-3 h-3 mr-1" /> Tambah Posisi
                      </button>
                    )}
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>

                {/* Expanded Detailed Roles Table */}
                {isExpanded && (
                  <div className="p-4 overflow-x-auto bg-white">
                    <table className="w-full text-left text-xs">
                      <thead className="text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100 pb-2">
                        <tr>
                          <th className="py-2 pl-2">Nama Posisi / Jabatan</th>
                          <th className="py-2 text-center w-20">Headcount (Pax)</th>
                          <th className="py-2 text-right w-36">Gaji Pokok / Bln (IDR)</th>
                          <th className="py-2 text-center w-28">Multiplier UMK</th>
                          <th className="py-2 text-right w-36">Subtotal Bln</th>
                          <th className="py-2 text-center w-12">Hapus</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {dept.roles.map((role: any, rIdx: number) => {
                          const multiple = currentUmk > 0 ? (role.salary / currentUmk) : 1;
                          const isBelowUmk = role.salary < currentUmk * 0.98;

                          return (
                            <tr key={rIdx} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-2 pl-2">
                                <input
                                  type="text"
                                  value={role.role}
                                  onChange={(e) => onUpdateRole && onUpdateRole(dept.code, rIdx, 'role', e.target.value)}
                                  className="w-full bg-slate-50/80 hover:bg-white focus:bg-white border border-transparent focus:border-indigo-300 rounded px-2 py-1.5 font-bold text-slate-800 outline-none transition-all"
                                  placeholder="Nama Jabatan..."
                                />
                              </td>

                              <td className="py-2 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  value={role.count}
                                  onChange={(e) => onUpdateRole && onUpdateRole(dept.code, rIdx, 'count', parseInt(e.target.value) || 0)}
                                  className="w-16 text-center bg-slate-50/80 hover:bg-white focus:bg-white border border-transparent focus:border-blue-400 rounded py-1.5 font-bold font-mono text-blue-900 outline-none transition-all"
                                />
                              </td>

                              <td className="py-2 text-right">
                                <input
                                  type="number"
                                  step="50000"
                                  value={role.salary}
                                  onChange={(e) => onUpdateRole && onUpdateRole(dept.code, rIdx, 'salary', parseFloat(e.target.value) || 0)}
                                  className="w-32 text-right bg-slate-50/80 hover:bg-white focus:bg-white border border-transparent focus:border-indigo-400 rounded py-1.5 px-2 font-bold font-mono text-slate-700 outline-none transition-all"
                                />
                              </td>

                              <td className="py-2 text-center">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
                                  isBelowUmk 
                                    ? 'bg-rose-100 text-rose-700' 
                                    : multiple >= 2.5 
                                    ? 'bg-purple-100 text-purple-700' 
                                    : multiple >= 1.5 
                                    ? 'bg-blue-100 text-blue-700' 
                                    : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                  {multiple.toFixed(2)}x UMK
                                </span>
                              </td>

                              <td className="py-2 text-right font-mono font-bold text-slate-700">
                                {formatIDR(role.count * role.salary)}
                              </td>

                              <td className="py-2 text-center">
                                {onRemoveRole && (
                                  <button
                                    onClick={() => onRemoveRole(dept.code, rIdx)}
                                    className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                                    title="Hapus Posisi"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Total Summary Footer */}
        <div className="p-4 bg-slate-100/70 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center text-xs font-bold text-slate-800">
          <div className="flex items-center space-x-4 mb-2 sm:mb-0">
            <span>TOTAL MANNING: <span className="text-blue-900 font-mono text-sm">{analysis.totalPax} Pax</span></span>
            <span>•</span>
            <span>STAFF/ROOM RATIO: <span className="text-emerald-700 font-mono text-sm">{analysis.staffToRoomRatio.toFixed(2)}</span></span>
          </div>

          <div className="flex items-center space-x-4">
            <span>Monthly Base: <span className="font-mono text-slate-900">{formatIDR(analysis.totalBasePayrollMonthly)}</span></span>
            <span>•</span>
            <span>Annual (w/ 1.2x Benefit): <span className="font-mono text-indigo-700">{formatIDR(analysis.totalPayrollAnnualWithBenefits)}</span></span>
          </div>
        </div>
      </div>
    </div>
  );
};
