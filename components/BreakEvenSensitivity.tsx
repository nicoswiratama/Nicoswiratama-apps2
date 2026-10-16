import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  ShieldCheck, 
  Percent, 
  DollarSign, 
  BedDouble,
  BarChart3,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Info,
  BookOpen,
  Layers,
  Sliders,
  CheckCircle2,
  Activity,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Zap,
  Building,
  Users
} from 'lucide-react';

interface BreakEvenProps {
  basicInput: any;
  projectedData: any;
  monthlyTargets: any[];
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

export const BreakEvenSensitivity: React.FC<BreakEvenProps> = ({
  basicInput,
  projectedData,
  monthlyTargets
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'methodology' | 'cost_breakdown' | 'stress_test'>('overview');
  const [customFixedCostAdjustment, setCustomFixedCostAdjustment] = useState<number>(0);
  
  // Stress Test Simulation Parameters
  const [stressWageHikePct, setStressWageHikePct] = useState<number>(0);
  const [stressUtilityHikePct, setStressUtilityHikePct] = useState<number>(0);
  const [stressOtaCommHikePct, setStressOtaCommHikePct] = useState<number>(0);

  // Detailed Cost Item Classification
  const costClassification = useMemo(() => {
    if (!projectedData) return null;

    const totalRevenue = projectedData.revenue.total || 1;
    const fbRevenue = projectedData.revenue.fb || 0;
    const roomRevenue = projectedData.revenue.room || 1;

    let fixedItems: any[] = [];
    let variableItems: any[] = [];
    let totalFixedPayroll = 0;
    let totalFixedOperating = 0;
    let totalVariableExpenses = 0;

    Object.entries(projectedData.depts).forEach(([deptKey, dept]: [string, any]) => {
      const deptName = deptKey === 'fo' ? 'Front Office' 
        : deptKey === 'hk' ? 'Housekeeping' 
        : deptKey === 'fb' ? 'Food & Beverage' 
        : deptKey === 'pomec' ? 'Engineering (POMEC)' 
        : deptKey === 'admin' ? 'Admin & General (A&G)' 
        : 'Sales & Marketing';

      // 1. Payroll is classified as Fixed Cost (base staff retention & monthly commitment)
      const deptPayroll = Number(dept.payroll) || 0;
      totalFixedPayroll += deptPayroll;
      
      const paxCount = dept.roles.reduce((a: number, r: any) => a + (Number(r.count) || 0), 0);
      fixedItems.push({
        dept: deptName,
        deptKey,
        name: `Payroll & Tunjangan (${paxCount} pax)`,
        category: 'Payroll (Fixed Commitment)',
        type: 'fixed',
        monthlyValue: deptPayroll / 12,
        annualValue: deptPayroll,
        basis: 'Monthly Salaried + 20% BPJS/THR',
        reason: 'Gaji pokok dan kewajiban ketenagakerjaan tetap harus dibayar setiap bulan terlepas dari sepi/ramainya tamu.'
      });

      // 2. Department Expenses
      const baseRev = deptKey === 'fb' ? fbRevenue : totalRevenue;

      dept.expenseItems.forEach((item: any) => {
        if (item.type === 'fixed') {
          const valMonthly = Number(item.value) || 0;
          const valAnnual = valMonthly * 12;
          totalFixedOperating += valAnnual;
          fixedItems.push({
            dept: deptName,
            deptKey,
            name: item.name,
            category: 'Operating Fixed Overhead',
            type: 'fixed',
            monthlyValue: valMonthly,
            annualValue: valAnnual,
            basis: 'Fixed Contract / Retainer',
            reason: 'Kontrak retainer bulanan (pemeliharaan, lisensi, langganan, kontrak pest control) yang bernilai tetap.'
          });
        } else {
          const pct = (Number(item.value) || 0);
          const annualVal = baseRev * (pct / 100);
          totalVariableExpenses += annualVal;
          variableItems.push({
            dept: deptName,
            deptKey,
            name: item.name,
            category: 'Variable Operational Expense',
            type: 'percent',
            pctValue: pct,
            monthlyValue: annualVal / 12,
            annualValue: annualVal,
            basis: `${pct}% dari ${deptKey === 'fb' ? 'F&B Rev' : 'Total Rev'}`,
            reason: 'Biaya bertambah seiring peningkatan okupansi atau konsumsi tamu (HPP F&B, linen, sabun, komisi OTA).'
          });
        }
      });
    });

    return {
      fixedItems,
      variableItems,
      totalFixedPayroll,
      totalFixedOperating,
      totalFixedCostBase: totalFixedPayroll + totalFixedOperating,
      totalVariableExpenses,
      totalRevenue,
      roomRevenue,
      fbRevenue
    };
  }, [projectedData]);

  // Break-Even Calculations
  const bepCalculations = useMemo(() => {
    if (!projectedData || !costClassification) return null;

    const rooms = basicInput.rooms || 0;
    const totalRoomNightsYear = rooms * 365;
    const currentAdr = basicInput.adr || 0;
    const currentOcc = basicInput.targetOcc || 0;
    const totalRevenue = costClassification.totalRevenue;
    const roomRevenue = costClassification.roomRevenue;

    // Apply Stress testing to fixed & variable costs if selected
    const wageHikeFactor = 1 + (stressWageHikePct / 100);
    const utilityHikeFactor = 1 + (stressUtilityHikePct / 100);
    const otaHikeFactor = 1 + (stressOtaCommHikePct / 100);

    const adjustedPayroll = costClassification.totalFixedPayroll * wageHikeFactor;
    const adjustedFixedOperating = costClassification.totalFixedOperating;
    const totalFixedCost = adjustedPayroll + adjustedFixedOperating + customFixedCostAdjustment;

    // Adjusted variable cost
    let adjustedVariableExpenses = 0;
    costClassification.variableItems.forEach(item => {
      let itemVal = item.annualValue;
      if (item.name.toLowerCase().includes('listrik') || item.name.toLowerCase().includes('utility')) {
        itemVal *= utilityHikeFactor;
      }
      if (item.name.toLowerCase().includes('ota') || item.name.toLowerCase().includes('marketing')) {
        itemVal *= otaHikeFactor;
      }
      adjustedVariableExpenses += itemVal;
    });

    const variableCostRatio = totalRevenue > 0 ? (adjustedVariableExpenses / totalRevenue) : 0.15;
    const contributionMarginRatio = Math.max(0.01, 1 - variableCostRatio);

    // 1. Break-Even Revenue (Total Pendapatan Minimal agar GOP = 0)
    // Formula USALI: BEP Revenue = Total Fixed Costs / Contribution Margin Ratio
    const breakEvenRevenue = totalFixedCost / contributionMarginRatio;

    // Proportion of room revenue to total revenue
    const roomRevRatio = totalRevenue > 0 ? (roomRevenue / totalRevenue) : 0.8;
    const breakEvenRoomRevenue = breakEvenRevenue * roomRevRatio;

    // 2. Break-Even Rooms Sold & Occupancy
    const breakEvenRoomsSoldYear = currentAdr > 0 ? Math.round(breakEvenRoomRevenue / currentAdr) : 0;
    const breakEvenRoomsSoldDay = Math.ceil(breakEvenRoomsSoldYear / 365);
    const breakEvenOccupancy = totalRoomNightsYear > 0 
      ? Math.min(100, Math.max(0, (breakEvenRoomsSoldYear / totalRoomNightsYear) * 100))
      : 0;

    // 3. Break-Even ADR at Current Occupancy
    const currentRoomsSoldYear = Math.round(totalRoomNightsYear * (currentOcc / 100));
    const breakEvenAdrAtCurrentOcc = currentRoomsSoldYear > 0 
      ? Math.round(breakEvenRoomRevenue / currentRoomsSoldYear)
      : 0;

    // 4. Margin of Safety (Buffer before operating at a loss)
    const marginOfSafetyRevenue = totalRevenue - breakEvenRevenue;
    const marginOfSafetyPct = totalRevenue > 0 ? (marginOfSafetyRevenue / totalRevenue) * 100 : 0;

    return {
      totalFixedPayroll: adjustedPayroll,
      totalFixedOperating: adjustedFixedOperating,
      totalFixedCost,
      totalVariableExpenses: adjustedVariableExpenses,
      variableCostRatio,
      contributionMarginRatio,
      breakEvenRevenue,
      breakEvenRoomRevenue,
      breakEvenRoomsSoldYear,
      breakEvenRoomsSoldDay,
      breakEvenOccupancy,
      breakEvenAdrAtCurrentOcc,
      marginOfSafetyRevenue,
      marginOfSafetyPct,
      currentRevenue: totalRevenue,
      currentRoomsSoldDay: Math.round(currentRoomsSoldYear / 365),
      currentOcc,
      currentAdr,
      roomRevRatio,
      totalRoomNightsYear
    };
  }, [projectedData, basicInput, customFixedCostAdjustment, costClassification, stressWageHikePct, stressUtilityHikePct, stressOtaCommHikePct]);

  // 2D Sensitivity Matrix: Occupancy vs ADR
  const sensitivityMatrix = useMemo(() => {
    if (!bepCalculations || !projectedData) return null;

    const baseOcc = bepCalculations.currentOcc;
    const baseAdr = bepCalculations.currentAdr;
    const rooms = basicInput.rooms || 0;
    const totalNights = rooms * 365;

    // Occupancy steps (-15% to +15%)
    const occDeltas = [-15, -10, -5, 0, 5, 10, 15];
    // ADR multipliers (-15% to +15%)
    const adrDeltas = [-15, -10, 0, 10, 15];

    const fbMultiplier = basicInput.hasRestaurant ? (basicInput.fbRatio / 100) : 0;
    const fixedCost = bepCalculations.totalFixedCost;
    const varRatio = bepCalculations.variableCostRatio;

    const rows = occDeltas.map(occDelta => {
      const simOcc = Math.max(5, Math.min(99, baseOcc + occDelta));
      const roomsSold = (totalNights * simOcc) / 100;

      const adrCols = adrDeltas.map(adrDelta => {
        const simAdr = Math.round(baseAdr * (1 + adrDelta / 100));
        const simRoomRev = roomsSold * simAdr;
        const simFbRev = simRoomRev * fbMultiplier;
        const simTotalRev = simRoomRev + simFbRev;

        // Cost estimation
        const simVarCost = simTotalRev * varRatio;
        const simTotalCost = fixedCost + simVarCost;
        const simGop = simTotalRev - simTotalCost;
        const simGopMargin = simTotalRev > 0 ? (simGop / simTotalRev) : 0;

        return {
          adrDelta,
          simAdr,
          simTotalRev,
          simGop,
          simGopMargin,
          isCurrent: occDelta === 0 && adrDelta === 0,
        };
      });

      return {
        occDelta,
        simOcc,
        isCurrentOcc: occDelta === 0,
        columns: adrCols
      };
    });

    return {
      adrHeaders: adrDeltas.map(d => ({
        delta: d,
        label: d === 0 ? 'Base ADR' : d > 0 ? `+${d}%` : `${d}%`,
        rate: Math.round(baseAdr * (1 + d / 100))
      })),
      rows
    };
  }, [bepCalculations, projectedData, basicInput]);

  if (!bepCalculations || !costClassification) {
    return (
      <div className="text-center py-20 text-slate-400">
        Silahkan generate kalkulasi proyeksi terlebih dahulu.
      </div>
    );
  }

  const isSafe = bepCalculations.marginOfSafetyPct > 15;

  return (
    <div className="max-w-6xl mx-auto pt-6 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-100 text-blue-800 rounded-xl">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                Break-Even Point (BEP) & Sensitivity Analysis
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluasi titik impas operasional, transparansi rumus USALI, dan ketahanan GOP terhadap fluktuasi pasar.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center border ${
            isSafe 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}>
            {isSafe ? (
              <ShieldCheck className="w-4 h-4 mr-1.5 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 mr-1.5 text-amber-600" />
            )}
            Margin of Safety: {formatPercent(bepCalculations.marginOfSafetyPct / 100)}
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center ${
            activeTab === 'overview'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
          Ringkasan Titik Impas & Matriks
        </button>

        <button
          onClick={() => setActiveTab('methodology')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center ${
            activeTab === 'methodology'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-indigo-700 hover:bg-indigo-50 border border-indigo-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 mr-1.5 text-yellow-400" />
          📘 Dari Mana Angka Ini Dihitung? (Rumus & USALI)
        </button>

        <button
          onClick={() => setActiveTab('cost_breakdown')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center ${
            activeTab === 'cost_breakdown'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5 mr-1.5" />
          Audit Beban Tetap vs Variabel ({costClassification.fixedItems.length + costClassification.variableItems.length} Item)
        </button>

        <button
          onClick={() => setActiveTab('stress_test')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center ${
            activeTab === 'stress_test'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-white text-purple-700 hover:bg-purple-50 border border-purple-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 mr-1.5" />
          🧪 Simulasi Stres Kenaikan UMK & Beban
        </button>
      </div>

      {/* TAB 1: OVERVIEW & SENSITIVITY MATRIX */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Explainer Callout */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-5 rounded-2xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-yellow-400 tracking-wider flex items-center">
                <Info className="w-3.5 h-3.5 mr-1" /> Intisari Titik Impas (BEP)
              </span>
              <p className="text-sm font-medium text-slate-100">
                Hotel Anda butuh minimal <span className="font-bold text-yellow-300 font-mono">{bepCalculations.breakEvenOccupancy.toFixed(1)}% okupansi</span> ({bepCalculations.breakEvenRoomsSoldDay} kamar/malam) atau omset tahunan <span className="font-bold text-yellow-300 font-mono">{formatIDR(bepCalculations.breakEvenRevenue)}</span> agar seluruh biaya operasional tertutupi (GOP = 0).
              </p>
            </div>
            <button
              onClick={() => setActiveTab('methodology')}
              className="text-xs bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3.5 py-2 rounded-xl font-bold flex items-center shrink-0 transition-all"
            >
              Lihat Bedah Rumus <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </button>
          </div>

          {/* KPI Cards: The Core Break-Even Figures */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* BEP Occupancy */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>BEP Occupancy</span>
                <Percent className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-3xl font-black text-blue-900 mt-2">
                {bepCalculations.breakEvenOccupancy.toFixed(1)}%
              </div>
              <div className="mt-2 text-xs text-slate-500 flex items-center">
                Target Anda: <span className="font-bold text-slate-800 ml-1">{bepCalculations.currentOcc}%</span>
                <span className={`ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  bepCalculations.currentOcc >= bepCalculations.breakEvenOccupancy 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-rose-100 text-rose-700'
                }`}>
                  {bepCalculations.currentOcc >= bepCalculations.breakEvenOccupancy 
                    ? `+${(bepCalculations.currentOcc - bepCalculations.breakEvenOccupancy).toFixed(1)}% Aman` 
                    : `${(bepCalculations.currentOcc - bepCalculations.breakEvenOccupancy).toFixed(1)}% Defisit`}
                </span>
              </div>
            </div>

            {/* BEP Daily Rooms Sold */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>BEP Kamar / Hari</span>
                <BedDouble className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-3xl font-black text-purple-900 mt-2">
                {bepCalculations.breakEvenRoomsSoldDay} <span className="text-sm font-semibold text-slate-500">kamar</span>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Dari total <span className="font-bold text-slate-800">{basicInput.rooms} kamar</span> tersedia/hari
              </div>
            </div>

            {/* BEP Minimum ADR */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>BEP Minimal ADR</span>
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-emerald-900 mt-2">
                {formatIDR(bepCalculations.breakEvenAdrAtCurrentOcc)}
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Pada target okupansi {bepCalculations.currentOcc}%
              </div>
            </div>

            {/* BEP Annual Revenue */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>BEP Annual Revenue</span>
                <TrendingUp className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-slate-800 mt-2">
                {formatIDR(bepCalculations.breakEvenRevenue)}
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Beban Tetap: <span className="font-semibold text-slate-700">{formatIDR(bepCalculations.totalFixedCost)}</span>
              </div>
            </div>
          </div>

          {/* Break-Even Visual Bar */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center">
              <BarChart3 className="w-4 h-4 mr-2 text-blue-600" />
              Visualisasi Titik Impas & Safety Buffer Okupansi
            </h3>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-rose-600 font-bold">
                  0% - {bepCalculations.breakEvenOccupancy.toFixed(1)}% (Zona Defisit Operasional)
                </span>
                <span className="text-emerald-700 font-bold">
                  {bepCalculations.breakEvenOccupancy.toFixed(1)}% - 100% (Zona Laba / GOP Positif)
                </span>
              </div>

              <div className="w-full bg-slate-100 h-6 rounded-full overflow-hidden flex relative border border-slate-200">
                <div 
                  style={{ width: `${Math.min(100, bepCalculations.breakEvenOccupancy)}%` }} 
                  className="bg-rose-400/80 h-full flex items-center justify-center text-[10px] text-white font-bold"
                >
                  BEP {bepCalculations.breakEvenOccupancy.toFixed(0)}%
                </div>
                <div 
                  style={{ width: `${Math.max(0, 100 - bepCalculations.breakEvenOccupancy)}%` }} 
                  className="bg-emerald-500 h-full flex items-center justify-center text-[10px] text-white font-bold"
                >
                  Profit Zone
                </div>
                
                {/* Target Occupancy Marker Pin */}
                <div 
                  style={{ left: `${Math.min(98, Math.max(2, bepCalculations.currentOcc))}%` }} 
                  className="absolute top-0 bottom-0 w-1.5 bg-slate-900 shadow-xl z-10"
                  title={`Target Anda: ${bepCalculations.currentOcc}%`}
                />
              </div>

              <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
                <span>Buffer Cadangan: {Math.max(0, basicInput.rooms - bepCalculations.breakEvenRoomsSoldDay)} kamar kosong aman/hari</span>
                <span className="font-bold text-slate-800">
                  Target Properti: {bepCalculations.currentOcc}% ({Math.round(basicInput.rooms * bepCalculations.currentOcc / 100)} kamar terjual/hari)
                </span>
              </div>
            </div>
          </div>

          {/* 2D Sensitivity Matrix */}
          {sensitivityMatrix && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Matriks Sensitivitas GOP (Occupancy vs ADR)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Simulasi Gross Operating Profit (GOP) dan Margin (%) jika kondisi pasar bergeser naik atau turun.
                  </p>
                </div>
                <div className="flex items-center space-x-3 text-xs">
                  <span className="flex items-center text-emerald-700 font-semibold">
                    <span className="w-3 h-3 bg-emerald-100 border border-emerald-300 rounded mr-1.5" /> Untung (GOP &gt; 0)
                  </span>
                  <span className="flex items-center text-rose-700 font-semibold">
                    <span className="w-3 h-3 bg-rose-100 border border-rose-300 rounded mr-1.5" /> Rugi (GOP &lt; 0)
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-center text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <th className="py-3 px-4 text-left font-bold uppercase tracking-wider sticky left-0 bg-slate-50">
                        Occupancy \ ADR
                      </th>
                      {sensitivityMatrix.adrHeaders.map((hdr, idx) => (
                        <th key={idx} className="py-3 px-3 font-bold">
                          <div>{hdr.label}</div>
                          <div className="text-[10px] font-normal text-slate-400">{formatIDR(hdr.rate)}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sensitivityMatrix.rows.map((row, rIdx) => (
                      <tr 
                        key={rIdx} 
                        className={`border-b last:border-0 transition-colors ${
                          row.isCurrentOcc ? 'bg-blue-50/40 font-bold' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className={`py-3 px-4 text-left font-bold sticky left-0 ${
                          row.isCurrentOcc ? 'bg-blue-100/70 text-blue-900' : 'bg-white text-slate-700'
                        }`}>
                          {row.simOcc.toFixed(1)}% 
                          {row.isCurrentOcc && <span className="ml-1 text-[10px] text-blue-600 font-black">(Base)</span>}
                        </td>

                        {row.columns.map((col, cIdx) => {
                          const isProfit = col.simGop >= 0;
                          return (
                            <td 
                              key={cIdx} 
                              className={`py-3 px-3 transition-colors ${
                                col.isCurrent 
                                  ? 'ring-2 ring-blue-600 ring-inset bg-blue-50 font-black' 
                                  : isProfit 
                                  ? 'bg-emerald-50/40 text-emerald-900' 
                                  : 'bg-rose-50/50 text-rose-800'
                              }`}
                            >
                              <div className={`font-bold ${isProfit ? 'text-emerald-700' : 'text-rose-600'}`}>
                                {formatIDR(col.simGop)}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                {formatPercent(col.simGopMargin)}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 text-center">
                * Kotak dengan bingkai biru tebal menandakan kondisi baseline target properti Anda saat ini.
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: METHODOLOGY & MATHEMATICAL DERIVATION */}
      {activeTab === 'methodology' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8 animate-fade-in">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-md">
              Hospitality Accounting Standard (USALI)
            </span>
            <h3 className="text-xl font-bold text-slate-900 mt-2">
              Dari Mana Angka BEP & Matriks Sensitivitas Ditentukan?
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Titik Impas (Break-Even Point) dihitung menggunakan metodologi akuntansi perhotelan USALI (Uniform System of Accounts for the Lodging Industry) dengan memisahkan total pengeluaran operasional hotel menjadi dua kategori utama: <strong className="text-slate-700">Biaya Tetap (Fixed Costs)</strong> dan <strong className="text-slate-700">Biaya Variabel (Variable Costs)</strong>.
            </p>
          </div>

          {/* 4 Steps Formula Grid with Live Numbers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Step 1: Fixed Costs */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center">
                  <Building className="w-4 h-4 mr-1.5" /> Langkah 1: Beban Tetap (Fixed Costs)
                </span>
                <span className="text-xs font-mono font-bold bg-white px-2 py-0.5 rounded border text-slate-700">
                  {formatIDR(bepCalculations.totalFixedCost)} / thn
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Biaya yang <strong>wajib dibayarkan secara rutin</strong> setiap bulan, tanpa memedulikan apakah hotel sedang sepi (0% okupansi) atau penuh.
              </p>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs font-mono">
                <div className="flex justify-between text-slate-700">
                  <span>• Gaji Pokok & Manpower (1.2x Benefit):</span>
                  <span className="font-bold">{formatIDR(bepCalculations.totalFixedPayroll)}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>• Biaya Tetap Opex (R&M, Lisensi, dll):</span>
                  <span className="font-bold">{formatIDR(bepCalculations.totalFixedOperating)}</span>
                </div>
                <div className="flex justify-between text-blue-900 border-t pt-1 font-bold">
                  <span>Total Biaya Tetap (FC):</span>
                  <span>{formatIDR(bepCalculations.totalFixedCost)}</span>
                </div>
              </div>
            </div>

            {/* Step 2: Variable Costs & CMR */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center">
                  <Activity className="w-4 h-4 mr-1.5" /> Langkah 2: Beban Variabel & CMR
                </span>
                <span className="text-xs font-mono font-bold bg-white px-2 py-0.5 rounded border text-emerald-700">
                  CMR: {(bepCalculations.contributionMarginRatio * 100).toFixed(1)}%
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Biaya yang bergerak sebanding dengan volume tamu menginap (HPP F&B, sabun, komisi OTA, linen, listrik kamar).
              </p>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs font-mono">
                <div className="flex justify-between text-slate-700">
                  <span>• Total Beban Variabel (VC):</span>
                  <span className="font-bold">{formatIDR(bepCalculations.totalVariableExpenses)}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>• Variable Cost Ratio (VC / Revenue):</span>
                  <span className="font-bold">{(bepCalculations.variableCostRatio * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-emerald-900 border-t pt-1 font-bold">
                  <span>Contribution Margin Ratio (CMR = 1 - VCR):</span>
                  <span>{(bepCalculations.contributionMarginRatio * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Step 3: BEP Revenue Equation */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center">
                  <Calculator className="w-4 h-4 mr-1.5" /> Langkah 3: BEP Revenue
                </span>
                <span className="text-xs font-mono font-bold bg-white px-2 py-0.5 rounded border text-purple-700">
                  GOP = Rp 0
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Rumus menghitung total pendapatan minimal agar laba operasional kotor (GOP) tepat bernilai 0:
              </p>
              <div className="bg-purple-900 text-white p-3.5 rounded-xl font-mono text-xs space-y-1.5">
                <div className="text-purple-300 text-[11px] font-bold">RUMUS BEP REVENUE:</div>
                <div className="text-sm font-bold text-yellow-300">BEP Revenue = Total Fixed Cost / CMR</div>
                <div className="text-slate-300 text-[11px] pt-1 border-t border-purple-800">
                  = {formatIDR(bepCalculations.totalFixedCost)} / {(bepCalculations.contributionMarginRatio * 100).toFixed(1)}%
                </div>
                <div className="text-emerald-300 font-bold text-sm">
                  = {formatIDR(bepCalculations.breakEvenRevenue)} / tahun
                </div>
              </div>
            </div>

            {/* Step 4: BEP Occupancy Equation */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center">
                  <BedDouble className="w-4 h-4 mr-1.5" /> Langkah 4: BEP Okupansi & Kamar
                </span>
                <span className="text-xs font-mono font-bold bg-white px-2 py-0.5 rounded border text-amber-700">
                  {bepCalculations.breakEvenOccupancy.toFixed(1)}% Okupansi
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Dari BEP Revenue, dicari jumlah malam kamar (room nights) yang harus terjual berdasarkan proporsi Room Revenue:
              </p>
              <div className="bg-amber-950 text-white p-3.5 rounded-xl font-mono text-xs space-y-1.5">
                <div className="text-amber-300 text-[11px] font-bold">RUMUS BEP OKUPANSI:</div>
                <div className="text-sm font-bold text-yellow-300">BEP Kamar Terjual = BEP Room Rev / ADR</div>
                <div className="text-slate-300 text-[11px] pt-1 border-t border-amber-900">
                  = {formatIDR(bepCalculations.breakEvenRoomRevenue)} / {formatIDR(bepCalculations.currentAdr)}
                </div>
                <div className="text-emerald-300 font-bold">
                  = {bepCalculations.breakEvenRoomsSoldYear} kamar/tahun ({bepCalculations.breakEvenRoomsSoldDay} kamar/malam)
                </div>
                <div className="text-yellow-400 font-bold text-sm pt-1 border-t border-amber-900">
                  BEP Occupancy = {bepCalculations.breakEvenOccupancy.toFixed(1)}%
                </div>
              </div>
            </div>

          </div>

          {/* Explanation on How the 2D Sensitivity Matrix is calculated */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-3">
            <h4 className="text-sm font-bold text-yellow-400 flex items-center">
              <Sparkles className="w-4 h-4 mr-2" /> Bagaimana Angka pada Matriks Sensitivitas Dihasilkan?
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Matriks Sensitivitas menghitung ulang laba operasional (GOP) di setiap perpotongan koordinat antara <strong>Tingkat Okupansi</strong> (sumbu Y: -15% s/d +15%) dan <strong>Harga Rata-rata Kamar (ADR)</strong> (sumbu X: -15% s/d +15%):
            </p>
            <div className="bg-slate-800 p-4 rounded-xl font-mono text-xs text-slate-200 space-y-1.5 border border-slate-700">
              <div>1. <strong className="text-blue-300">Pendapatan Simulasi</strong> = (Jumlah Kamar × 365 × Okupansi Simulasi × ADR Simulasi) + Estimasi F&B Simulasi</div>
              <div>2. <strong className="text-emerald-300">Biaya Variabel Simulasi</strong> = Pendapatan Simulasi × Rasio Biaya Variabel ({(bepCalculations.variableCostRatio * 100).toFixed(1)}%)</div>
              <div>3. <strong className="text-yellow-300">Total Biaya</strong> = Biaya Tetap ({formatIDR(bepCalculations.totalFixedCost)}) + Biaya Variabel Simulasi</div>
              <div>4. <strong className="text-purple-300">GOP Simulasi</strong> = Pendapatan Simulasi - Total Biaya</div>
            </div>
            <p className="text-[11px] text-slate-400 italic">
              Dengan matriks ini, manajemen hotel dapat langsung melihat titik batas kritis: jika okupansi turun 10%, berapa ADR yang harus dinaikkan agar hotel tetap mencatatkan laba positif (tidak masuk zona merah).
            </p>
          </div>
        </div>
      )}

      {/* TAB 3: COST BREAKDOWN INSPECTOR (FIXED VS VARIABLE) */}
      {activeTab === 'cost_breakdown' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-6 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">
                Audit Klasifikasi Biaya Operasional (Fixed vs Variable)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar rincian seluruh pos pengeluaran departemen yang membentuk dasar kalkulasi BEP.
              </p>
            </div>
            <div className="flex space-x-2 text-xs">
              <span className="bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-lg">
                Fixed: {formatIDR(bepCalculations.totalFixedCost)}
              </span>
              <span className="bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-lg">
                Variable: {formatIDR(bepCalculations.totalVariableExpenses)}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Departemen</th>
                  <th className="py-3 px-3">Item Pengeluaran</th>
                  <th className="py-3 px-3">Klasifikasi</th>
                  <th className="py-3 px-3 text-right">Nilai / Bulan</th>
                  <th className="py-3 px-3 text-right">Nilai / Tahun</th>
                  <th className="py-3 px-3">Alasan Klasifikasi USALI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Fixed items first */}
                {costClassification.fixedItems.map((item, idx) => (
                  <tr key={`fixed-${idx}`} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-700">{item.dept}</td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{item.name}</td>
                    <td className="py-3 px-3">
                      <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-bold font-mono">
                        FIXED
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600">{formatIDR(item.monthlyValue)}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-blue-900">{formatIDR(item.annualValue)}</td>
                    <td className="py-3 px-3 text-slate-500 text-[11px]">{item.reason}</td>
                  </tr>
                ))}

                {/* Variable items */}
                {costClassification.variableItems.map((item, idx) => (
                  <tr key={`var-${idx}`} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-700">{item.dept}</td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{item.name}</td>
                    <td className="py-3 px-3">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold font-mono">
                        VARIABLE ({item.pctValue}%)
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600">{formatIDR(item.monthlyValue)}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-900">{formatIDR(item.annualValue)}</td>
                    <td className="py-3 px-3 text-slate-500 text-[11px]">{item.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: STRESS TEST SIMULATION */}
      {activeTab === 'stress_test' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 animate-fade-in">
          <div className="border-b pb-4 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-slate-900 flex items-center">
                <Sliders className="w-5 h-5 mr-2 text-purple-600" />
                Simulasi Stres Kenaikan Gaji (UMK) & Inflasi Biaya Energi
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Uji ketahanan margin hotel jika terjadi kenaikan UMK regional atau lonjakan tarif listrik / utilitas.
              </p>
            </div>
            {(stressWageHikePct !== 0 || stressUtilityHikePct !== 0 || stressOtaCommHikePct !== 0) && (
              <button
                onClick={() => {
                  setStressWageHikePct(0);
                  setStressUtilityHikePct(0);
                  setStressOtaCommHikePct(0);
                }}
                className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Reset Simulasi
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-purple-50/50 p-5 rounded-2xl border border-purple-100">
            {/* Slider 1: Wage Hike */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-purple-900">
                <span>Kenaikan UMK / Gaji Staf</span>
                <span className="font-mono bg-white px-2 py-0.5 rounded border border-purple-200">
                  +{stressWageHikePct}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="2.5"
                value={stressWageHikePct}
                onChange={(e) => setStressWageHikePct(parseFloat(e.target.value) || 0)}
                className="w-full accent-purple-600 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500">
                Dampak penyesuaian kenaikan upah minimum tahunan (+Rp {formatIDR(costClassification.totalFixedPayroll * (stressWageHikePct / 100))}/thn).
              </p>
            </div>

            {/* Slider 2: Utility Tariff Hike */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-purple-900">
                <span>Lonjakan Tarif Listrik & Air</span>
                <span className="font-mono bg-white px-2 py-0.5 rounded border border-purple-200">
                  +{stressUtilityHikePct}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={stressUtilityHikePct}
                onChange={(e) => setStressUtilityHikePct(parseFloat(e.target.value) || 0)}
                className="w-full accent-purple-600 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500">
                Simulasi jika tarif dasar listrik (PLN) atau biaya bahan bakar genset/gas meningkat.
              </p>
            </div>

            {/* Slider 3: OTA Commission Spike */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-purple-900">
                <span>Kenaikan Komisi OTA / Iklan</span>
                <span className="font-mono bg-white px-2 py-0.5 rounded border border-purple-200">
                  +{stressOtaCommHikePct}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                step="5"
                value={stressOtaCommHikePct}
                onChange={(e) => setStressOtaCommHikePct(parseFloat(e.target.value) || 0)}
                className="w-full accent-purple-600 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500">
                Simulasi jika proporsi booking bergeser ke OTA dengan komisi lebih tinggi.
              </p>
            </div>
          </div>

          {/* Stressed Outcome Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="p-5 rounded-xl border bg-slate-50">
              <span className="text-[10px] uppercase font-bold text-slate-400">BEP Occupancy Hasil Simulasi</span>
              <div className="text-2xl font-bold text-slate-800 mt-1 font-mono">
                {bepCalculations.breakEvenOccupancy.toFixed(1)}%
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Kamar terjual: {bepCalculations.breakEvenRoomsSoldDay} kamar/hari
              </p>
            </div>

            <div className="p-5 rounded-xl border bg-slate-50">
              <span className="text-[10px] uppercase font-bold text-slate-400">BEP Minimal ADR</span>
              <div className="text-2xl font-bold text-slate-800 mt-1 font-mono">
                {formatIDR(bepCalculations.breakEvenAdrAtCurrentOcc)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Harga jual minimum pada target okupansi {bepCalculations.currentOcc}%
              </p>
            </div>

            <div className={`p-5 rounded-xl border ${
              bepCalculations.marginOfSafetyPct > 15 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
            }`}>
              <span className="text-[10px] uppercase font-bold text-slate-500">Margin of Safety Saat Stres</span>
              <div className={`text-2xl font-bold mt-1 font-mono ${
                bepCalculations.marginOfSafetyPct > 15 ? 'text-emerald-800' : 'text-rose-700'
              }`}>
                {formatPercent(bepCalculations.marginOfSafetyPct / 100)}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {bepCalculations.marginOfSafetyPct > 15 
                  ? 'Hotel tetap aman dan tidak mengalami kerugian.' 
                  : 'Peringatan: Margin keamanan sangat tipis!'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
