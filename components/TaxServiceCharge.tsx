import React, { useState, useMemo } from 'react';
import { 
  Percent, 
  Coins, 
  Users, 
  Building2, 
  HelpCircle, 
  FileText, 
  CheckCircle,
  Receipt,
  Scale
} from 'lucide-react';

interface TaxServiceChargeProps {
  basicInput: any;
  projectedData: any;
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

export const TaxServiceCharge: React.FC<TaxServiceChargeProps> = ({
  basicInput,
  projectedData
}) => {
  const [serviceChargeRate, setServiceChargeRate] = useState<number>(10); // 10%
  const [pb1TaxRate, setPb1TaxRate] = useState<number>(10); // 10%
  const [scRetentionRate, setScRetentionRate] = useState<number>(10); // 10% breakage/lost reserve

  const calculations = useMemo(() => {
    if (!projectedData) return null;

    const netRoomRev = projectedData.revenue.room || 0;
    const netFbRev = projectedData.revenue.fb || 0;
    const netOtherRev = projectedData.revenue.other || 0;
    const totalNetRev = projectedData.revenue.total || 0;

    // Service charge applies to Room & F&B (hospitality services)
    const scEligibleRevenue = netRoomRev + netFbRev;
    const annualServiceChargeTotal = scEligibleRevenue * (serviceChargeRate / 100);
    const monthlyServiceChargeTotal = annualServiceChargeTotal / 12;

    // Indonesian 21% formula: PB1 is applied on base + service charge
    const taxableBaseAnnual = scEligibleRevenue + annualServiceChargeTotal;
    const annualPb1Tax = taxableBaseAnnual * (pb1TaxRate / 100);
    const monthlyPb1Tax = annualPb1Tax / 12;

    // Gross Guest Folio Billing (Total Paid by Guests)
    const grossTotalBillingAnnual = totalNetRev + annualServiceChargeTotal + annualPb1Tax;

    // Total Pax count eligible for service charge pool (all operational staff)
    const deptValues = Object.values(projectedData.depts || {}) as any[];
    const totalStaffPax = deptValues.reduce((acc, d) => {
      const p = (d.roles || []).reduce((a: number, r: any) => a + (Number(r.count) || 0), 0);
      return acc + p;
    }, 0) || 1;

    // Service Charge Distribution
    const retentionAnnual = annualServiceChargeTotal * (scRetentionRate / 100);
    const netDistributableScAnnual = annualServiceChargeTotal - retentionAnnual;
    const netDistributableScMonthly = netDistributableScAnnual / 12;

    const monthlyScPerStaff = totalStaffPax > 0 
      ? Math.round(netDistributableScMonthly / totalStaffPax) 
      : 0;

    return {
      netRoomRev,
      netFbRev,
      totalNetRev,
      scEligibleRevenue,
      annualServiceChargeTotal,
      monthlyServiceChargeTotal,
      annualPb1Tax,
      monthlyPb1Tax,
      grossTotalBillingAnnual,
      totalStaffPax,
      retentionAnnual,
      netDistributableScAnnual,
      netDistributableScMonthly,
      monthlyScPerStaff,
    };
  }, [projectedData, serviceChargeRate, pb1TaxRate, scRetentionRate]);

  if (!calculations) {
    return (
      <div className="text-center py-20 text-slate-400">
        Silahkan generate proyeksi finansial terlebih dahulu.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pt-6 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-yellow-100 text-yellow-800 rounded-xl">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              Tax (PB1) & Service Charge Pool Simulation
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Standar 21% (++) Industri Perhotelan Indonesia & simulasi bonus Service Charge bulanan karyawan.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm">
          <span className="font-bold text-slate-700">Formula ++ :</span>
          <span className="text-blue-600 font-mono font-bold">{serviceChargeRate}% SC</span>
          <span>+</span>
          <span className="text-purple-600 font-mono font-bold">{pb1TaxRate}% PB1</span>
        </div>
      </div>

      {/* Control Configuration Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
            Service Charge Rate (%)
          </label>
          <div className="relative">
            <input 
              type="number"
              value={serviceChargeRate}
              onChange={(e) => setServiceChargeRate(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">%</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5">Standar hotel bintang 3-5: 10%</p>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
            PB1 / Pajak Restoran & Hotel (%)
          </label>
          <div className="relative">
            <input 
              type="number"
              value={pb1TaxRate}
              onChange={(e) => setPb1TaxRate(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500"
            />
            <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">%</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5">Ketetapan Bapenda Daerah: 10% - 11%</p>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
            Management SC Breakage Retention (%)
          </label>
          <div className="relative">
            <input 
              type="number"
              value={scRetentionRate}
              onChange={(e) => setScRetentionRate(Math.max(0, Math.min(30, parseFloat(e.target.value) || 0)))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
            />
            <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">%</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5">Dana cadangan piring pecah / linen hilang: 5% - 10%</p>
        </div>
      </div>

      {/* Service Charge Pool Highlight: Staff Take-Home */}
      <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Coins size={140} />
        </div>

        <div className="relative z-10 max-w-2xl">
          <span className="text-[10px] bg-yellow-400 text-slate-900 font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
            Employee Take-Home Impact
          </span>
          <h3 className="text-2xl font-bold mt-3 text-white">
            Estimasi Tambahan Service Charge Bulanan per Staf
          </h3>
          <div className="text-4xl font-black text-yellow-400 mt-3 font-mono">
            {formatIDR(calculations.monthlyScPerStaff)} <span className="text-sm font-medium text-slate-300">/ staf / bulan</span>
          </div>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            Didistribusikan merata kepada <span className="font-bold text-white">{calculations.totalStaffPax} staf operasional</span> dari {100 - scRetentionRate}% pool bersih ({formatIDR(calculations.netDistributableScMonthly)}/bulan).
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-800 text-xs">
          <div>
            <div className="text-slate-400 text-[10px] uppercase font-bold">Total SC Terkumpul (Tahun 1)</div>
            <div className="text-lg font-bold text-slate-100 font-mono mt-0.5">{formatIDR(calculations.annualServiceChargeTotal)}</div>
          </div>
          <div>
            <div className="text-slate-400 text-[10px] uppercase font-bold">Cadangan Breakage ({scRetentionRate}%)</div>
            <div className="text-lg font-bold text-amber-400 font-mono mt-0.5">{formatIDR(calculations.retentionAnnual)}</div>
          </div>
          <div>
            <div className="text-slate-400 text-[10px] uppercase font-bold">Total Disalurkan ke Staf</div>
            <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">{formatIDR(calculations.netDistributableScAnnual)}</div>
          </div>
        </div>
      </div>

      {/* Comparison: Net Revenue vs Gross Guest Billing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Net Revenue (Laporan Internal / P&L) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h4 className="font-bold text-slate-800 text-sm flex items-center">
              <Scale className="w-4 h-4 mr-2 text-blue-600" />
              Net Revenue (P&L Basis)
            </h4>
            <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold uppercase">
              Operator Basis
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Angka murni sebelum penambahan Service Charge dan PB1. Digunakan sebagai dasar kalkulasi GOP dan Management Fee.
          </p>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Room Revenue Net</span>
              <span className="font-bold text-slate-700 font-mono">{formatIDR(calculations.netRoomRev)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">F&B Revenue Net</span>
              <span className="font-bold text-slate-700 font-mono">{formatIDR(calculations.netFbRev)}</span>
            </div>
            <div className="flex justify-between py-2 font-bold text-sm bg-slate-50 px-3 rounded-lg text-blue-900">
              <span>Total Net Revenue</span>
              <span className="font-mono">{formatIDR(calculations.totalNetRev)}</span>
            </div>
          </div>
        </div>

        {/* Gross Billing (Total Uang Masuk dari Tamu) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h4 className="font-bold text-slate-800 text-sm flex items-center">
              <Receipt className="w-4 h-4 mr-2 text-purple-600" />
              Gross Guest Folio (Total Tagihan Tamu)
            </h4>
            <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-bold uppercase">
              Termasuk 21% ++
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Total perputaran uang kas yang dibayarkan oleh seluruh tamu, mencakup setoran pajak daerah ke Bapenda.
          </p>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Total Net Basis</span>
              <span className="font-bold text-slate-700 font-mono">{formatIDR(calculations.totalNetRev)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-blue-700 font-medium">Service Charge ({serviceChargeRate}%)</span>
              <span className="font-bold text-blue-700 font-mono">+{formatIDR(calculations.annualServiceChargeTotal)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-purple-700 font-medium">Pajak Daerah PB1 ({pb1TaxRate}%)</span>
              <span className="font-bold text-purple-700 font-mono">+{formatIDR(calculations.annualPb1Tax)}</span>
            </div>
            <div className="flex justify-between py-2 font-bold text-sm bg-purple-50 px-3 rounded-lg text-purple-900">
              <span>Total Gross Billing</span>
              <span className="font-mono">{formatIDR(calculations.grossTotalBillingAnnual)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
