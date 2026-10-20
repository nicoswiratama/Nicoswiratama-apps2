import React, { useState, useMemo } from 'react';
import { 
  GitCompare, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  ArrowRight, 
  Layers, 
  Zap, 
  Coins, 
  Building2,
  Sliders,
  RotateCcw,
  Wrench,
  Clock,
  Landmark
} from 'lucide-react';
import { DEFAULT_CAPEX } from '../services/propertyStorage';

interface ScenarioComparisonProps {
  basicInput: any;
  projectedData: any;
  monthlyTargets: any[];
  onApplyScenario: (modifiedSetup: any, modifiedTargets: any[]) => void;
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

export const ScenarioComparison: React.FC<ScenarioComparisonProps> = ({
  basicInput,
  projectedData,
  monthlyTargets,
  onApplyScenario
}) => {
  // Scenario modifier params
  const [params, setParams] = useState({
    conservative: {
      occDelta: -15, // -15%
      adrDelta: -10, // -10%
      costCut: -5,   // -5% expenses
      name: 'Konservatif (Low Season / Krisis)'
    },
    aggressive: {
      occDelta: 10,  // +10%
      adrDelta: 15,  // +15%
      costCut: 5,    // +5% expenses (higher volume)
      name: 'Optimis (High Demand / Booming)'
    }
  });

  const rooms = basicInput.rooms || 40;
  const capex = basicInput.capex || DEFAULT_CAPEX;
  const totalCapex = (capex.roomRenovationPerRoom * rooms) + 
    capex.publicAreaRenovation + 
    capex.mepEquipment + 
    capex.itPmsHardware + 
    capex.workingCapital;

  const fixedChargesList = basicInput.fixedCharges || [];
  const activeFixedCharges = fixedChargesList.filter((fc: any) => fc.active);
  const totalFixedChargesAnnual = activeFixedCharges.reduce((acc: number, fc: any) => acc + ((Number(fc.monthlyAmount) || 0) * 12), 0);

  const baseRevenue = projectedData?.revenue?.total || 0;
  const baseRoomRevenue = projectedData?.revenue?.room || 0;
  const baseFbRevenue = projectedData?.revenue?.fb || 0;
  const baseOtherRevenue = projectedData?.revenue?.other || 0;
  
  const deptValues = Object.values(projectedData?.depts || {}) as any[];
  const basePayroll = deptValues.reduce((a, b) => a + (Number(b.payroll) || 0), 0);
  const baseExpenses = deptValues.reduce((a, b) => a + (Number(b.totalExpense) || 0), 0);
  const baseTotalCost = basePayroll + baseExpenses;
  const baseGop = baseRevenue - baseTotalCost;
  const baseFee = basicInput.feeModel === '15_percent' 
    ? baseRevenue * (basicInput.customFee.revPct / 100) 
    : (baseRevenue * (basicInput.customFee.baseRevPct / 100)) + (Math.max(0, baseGop) * (basicInput.customFee.gopPct / 100));
  const baseNop = baseGop - baseFee;
  const baseNetCashflow = baseNop - totalFixedChargesAnnual;

  // Helper to calculate estimated payback years given annual owner cash flow
  const calcPaybackStr = (annualCash: number) => {
    if (annualCash <= 0 || totalCapex <= 0) return '> 10 Tahun';
    const yearsFrac = totalCapex / annualCash;
    if (yearsFrac > 10) return '> 10 Tahun';
    const whole = Math.floor(yearsFrac);
    const months = Math.round((yearsFrac - whole) * 12);
    return `${whole} Thn ${months > 0 ? `${months} Bln` : ''}`;
  };

  const scenarios = useMemo(() => {
    // 1. Realistic / Base
    const rPayback = calcPaybackStr(baseNetCashflow);
    const rRoi = totalCapex > 0 ? (baseNetCashflow / totalCapex) * 100 : 0;

    const realistic = {
      id: 'realistic',
      name: 'Realistis (Baseline Aktif)',
      tag: 'Aktif Saat Ini',
      color: 'blue',
      occ: basicInput.targetOcc,
      adr: basicInput.adr,
      revenue: baseRevenue,
      roomRev: baseRoomRevenue,
      fbRev: baseFbRevenue,
      otherRev: baseOtherRevenue,
      payroll: basePayroll,
      expenses: baseExpenses,
      totalCost: baseTotalCost,
      gop: baseGop,
      gopMargin: baseRevenue > 0 ? (baseGop / baseRevenue) : 0,
      fee: baseFee,
      nop: baseNop,
      nopMargin: baseRevenue > 0 ? (baseNop / baseRevenue) : 0,
      fixedCharges: totalFixedChargesAnnual,
      netCashflow: baseNetCashflow,
      payback: rPayback,
      roi: rRoi,
    };

    // 2. Conservative
    const cOcc = Math.max(10, Math.min(95, basicInput.targetOcc + params.conservative.occDelta));
    const cAdr = Math.round(basicInput.adr * (1 + params.conservative.adrDelta / 100));
    const cRoomRev = baseRoomRevenue * (cOcc / basicInput.targetOcc) * (cAdr / basicInput.adr);
    const cFbRev = basicInput.hasRestaurant ? cRoomRev * (basicInput.fbRatio / 100) : 0;
    const cOtherRev = baseOtherRevenue * (cRoomRev / (baseRoomRevenue || 1));
    const cTotalRev = cRoomRev + cFbRev + cOtherRev;
    const cExpenses = baseExpenses * (1 + params.conservative.costCut / 100);
    const cTotalCost = basePayroll + cExpenses; // Payroll stays fixed for core staff
    const cGop = cTotalRev - cTotalCost;
    const cFee = basicInput.feeModel === '15_percent' 
      ? cTotalRev * (basicInput.customFee.revPct / 100) 
      : (cTotalRev * (basicInput.customFee.baseRevPct / 100)) + (Math.max(0, cGop) * (basicInput.customFee.gopPct / 100));
    const cNop = cGop - cFee;
    const cNetCashflow = cNop - totalFixedChargesAnnual;
    const cPayback = calcPaybackStr(cNetCashflow);
    const cRoi = totalCapex > 0 ? (cNetCashflow / totalCapex) * 100 : 0;

    const conservative = {
      id: 'conservative',
      name: params.conservative.name,
      tag: 'Risiko Rendah / Defensif',
      color: 'amber',
      occ: cOcc,
      adr: cAdr,
      revenue: cTotalRev,
      roomRev: cRoomRev,
      fbRev: cFbRev,
      otherRev: cOtherRev,
      payroll: basePayroll,
      expenses: cExpenses,
      totalCost: cTotalCost,
      gop: cGop,
      gopMargin: cTotalRev > 0 ? (cGop / cTotalRev) : 0,
      fee: cFee,
      nop: cNop,
      nopMargin: cTotalRev > 0 ? (cNop / cTotalRev) : 0,
      fixedCharges: totalFixedChargesAnnual,
      netCashflow: cNetCashflow,
      payback: cPayback,
      roi: cRoi,
    };

    // 3. Aggressive
    const aOcc = Math.max(10, Math.min(99, basicInput.targetOcc + params.aggressive.occDelta));
    const aAdr = Math.round(basicInput.adr * (1 + params.aggressive.adrDelta / 100));
    const aRoomRev = baseRoomRevenue * (aOcc / basicInput.targetOcc) * (aAdr / basicInput.adr);
    const aFbRev = basicInput.hasRestaurant ? aRoomRev * (basicInput.fbRatio / 100) * 1.1 : 0;
    const aOtherRev = baseOtherRevenue * (aRoomRev / (baseRoomRevenue || 1));
    const aTotalRev = aRoomRev + aFbRev + aOtherRev;
    const aExpenses = baseExpenses * (1 + params.aggressive.costCut / 100);
    const aTotalCost = basePayroll + aExpenses;
    const aGop = aTotalRev - aTotalCost;
    const aFee = basicInput.feeModel === '15_percent' 
      ? aTotalRev * (basicInput.customFee.revPct / 100) 
      : (aTotalRev * (basicInput.customFee.baseRevPct / 100)) + (Math.max(0, aGop) * (basicInput.customFee.gopPct / 100));
    const aNop = aGop - aFee;
    const aNetCashflow = aNop - totalFixedChargesAnnual;
    const aPayback = calcPaybackStr(aNetCashflow);
    const aRoi = totalCapex > 0 ? (aNetCashflow / totalCapex) * 100 : 0;

    const aggressive = {
      id: 'aggressive',
      name: params.aggressive.name,
      tag: 'Potensi Maksimal',
      color: 'emerald',
      occ: aOcc,
      adr: aAdr,
      revenue: aTotalRev,
      roomRev: aRoomRev,
      fbRev: aFbRev,
      otherRev: aOtherRev,
      payroll: basePayroll,
      expenses: aExpenses,
      totalCost: aTotalCost,
      gop: aGop,
      gopMargin: aTotalRev > 0 ? (aGop / aTotalRev) : 0,
      fee: aFee,
      nop: aNop,
      nopMargin: aTotalRev > 0 ? (aNop / aTotalRev) : 0,
      fixedCharges: totalFixedChargesAnnual,
      netCashflow: aNetCashflow,
      payback: aPayback,
      roi: aRoi,
    };

    return [conservative, realistic, aggressive];
  }, [basicInput, baseRevenue, baseRoomRevenue, baseFbRevenue, baseOtherRevenue, basePayroll, baseExpenses, params, totalCapex, totalFixedChargesAnnual]);

  const handleApply = (sc: any) => {
    // Generate modified monthly targets based on the chosen scenario ADR and Occ ratio
    const occRatio = sc.occ / basicInput.targetOcc;
    const adrRatio = sc.adr / basicInput.adr;

    const newTargets = monthlyTargets.map((m) => ({
      ...m,
      occ: parseFloat(Math.min(99, Math.max(10, m.occ * occRatio)).toFixed(1)),
      arr: Math.round(m.arr * adrRatio)
    }));

    onApplyScenario({
      ...basicInput,
      targetOcc: sc.occ,
      adr: sc.adr,
    }, newTargets);
  };

  return (
    <div className="max-w-6xl mx-auto pt-6 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-100 text-indigo-800 rounded-xl">
            <GitCompare className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              Multi-Scenario Manager (3-Way Comparison)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulasi perbandingan berdampingan: Konservatif, Realistis, dan Optimis tersinkron dengan CAPEX & Estimasi Payback ROI.
            </p>
          </div>
        </div>

        <div className="text-xs font-bold bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-slate-700 shadow-sm flex items-center">
          <Wrench className="w-3.5 h-3.5 mr-1.5 text-rose-600" />
          Total CAPEX Properti: <span className="text-rose-700 font-extrabold ml-1">{formatIDR(totalCapex)}</span>
        </div>
      </div>

      {/* Side-by-Side Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {scenarios.map((sc) => {
          const isBase = sc.id === 'realistic';
          const isCons = sc.id === 'conservative';
          const isAggr = sc.id === 'aggressive';

          return (
            <div 
              key={sc.id} 
              className={`rounded-2xl border-2 transition-all shadow-sm overflow-hidden flex flex-col justify-between ${
                isBase 
                  ? 'border-blue-500 bg-white ring-4 ring-blue-500/10' 
                  : isCons 
                  ? 'border-amber-300 bg-white' 
                  : 'border-emerald-400 bg-white'
              }`}
            >
              <div>
                {/* Header Banner */}
                <div className={`p-4 border-b ${
                  isBase ? 'bg-blue-50/80 border-blue-100' : isCons ? 'bg-amber-50/80 border-amber-100' : 'bg-emerald-50/80 border-emerald-100'
                }`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      isBase ? 'bg-blue-600 text-white' : isCons ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'
                    }`}>
                      {sc.tag}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      Target: {sc.occ}% Occ
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-base mt-2">
                    {sc.name}
                  </h3>
                  <div className="text-xs text-slate-500 mt-0.5">
                    ADR: <span className="font-bold text-slate-700">{formatIDR(sc.adr)}</span>
                  </div>
                </div>

                {/* Key Numbers */}
                <div className="p-5 space-y-4">
                  <div>
                    <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Topline Revenue Tahunan</div>
                    <div className="text-xl font-black text-slate-900 font-mono mt-0.5">
                      {formatIDR(sc.revenue)}
                    </div>
                  </div>

                  {/* Highlights Box */}
                  <div className={`p-3.5 rounded-xl border ${
                    isBase ? 'bg-blue-50 border-blue-100' : isCons ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'
                  }`}>
                    <div className="text-[10px] font-bold uppercase text-slate-500">Gross Operating Profit (GOP)</div>
                    <div className={`text-2xl font-black mt-1 ${
                      isBase ? 'text-blue-900' : isCons ? 'text-amber-900' : 'text-emerald-900'
                    }`}>
                      {formatIDR(sc.gop)}
                    </div>
                    <div className="mt-2 text-xs flex justify-between text-slate-600 pt-2 border-t border-slate-200/60">
                      <span>Margin GOP:</span>
                      <span className="font-bold">{formatPercent(sc.gopMargin)}</span>
                    </div>
                  </div>

                  {/* CAPEX Payback & Net Cashflow Badge */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="flex items-center">
                        <Landmark className="w-3 h-3 mr-1 text-slate-400" />
                        Net Kas Pemilik:
                      </span>
                      <span className="font-mono font-bold text-slate-800">{formatIDR(sc.netCashflow)}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-700 pt-1 border-t border-slate-200">
                      <span className="flex items-center font-semibold">
                        <Clock className="w-3 h-3 mr-1 text-blue-600" />
                        Balik Modal CAPEX:
                      </span>
                      <span className="font-bold text-emerald-700">{sc.payback}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Estimasi ROI:</span>
                      <span className="font-mono font-bold text-blue-900">{formatPercent(sc.roi / 100)} / thn</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-4 border-t border-slate-100 bg-slate-50">
                {isBase ? (
                  <div className="w-full text-center py-2 text-xs font-bold text-blue-700 bg-blue-100/60 rounded-xl">
                    ✓ Skenario Aktif Saat Ini
                  </div>
                ) : (
                  <button
                    onClick={() => handleApply(sc)}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow flex items-center justify-center"
                  >
                    Terapkan Skenario Ini <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Side-by-Side Comparison Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 text-base flex items-center">
            <Layers className="w-4 h-4 mr-2 text-indigo-600" />
            Tabel Komparasi Rinci Antar Skenario & Kelayakan Investasi (CAPEX)
          </h3>
          <span className="text-xs text-slate-400">Standar USALI Perhotelan</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200 tracking-wider">
                <th className="py-3 px-4 text-left">Finansial & Operasional</th>
                <th className="py-3 px-4 text-amber-700">Konservatif</th>
                <th className="py-3 px-4 text-blue-700 bg-blue-50/50">Realistis (Base)</th>
                <th className="py-3 px-4 text-emerald-700">Optimis / Agresif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
              <tr>
                <td className="py-2.5 px-4 text-left font-medium">Average Occupancy</td>
                <td className="py-2.5 px-4 font-mono font-bold text-amber-800">{scenarios[0].occ}%</td>
                <td className="py-2.5 px-4 font-mono font-bold text-blue-800 bg-blue-50/30">{scenarios[1].occ}%</td>
                <td className="py-2.5 px-4 font-mono font-bold text-emerald-800">{scenarios[2].occ}%</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 text-left font-medium">Average Daily Rate (ADR)</td>
                <td className="py-2.5 px-4 font-mono">{formatIDR(scenarios[0].adr)}</td>
                <td className="py-2.5 px-4 font-mono bg-blue-50/30 font-bold">{formatIDR(scenarios[1].adr)}</td>
                <td className="py-2.5 px-4 font-mono">{formatIDR(scenarios[2].adr)}</td>
              </tr>
              <tr className="bg-slate-50/50 font-bold">
                <td className="py-2.5 px-4 text-left text-slate-900">Total Revenue</td>
                <td className="py-2.5 px-4 font-mono text-amber-800">{formatIDR(scenarios[0].revenue)}</td>
                <td className="py-2.5 px-4 font-mono text-blue-900 bg-blue-50/50">{formatIDR(scenarios[1].revenue)}</td>
                <td className="py-2.5 px-4 font-mono text-emerald-800">{formatIDR(scenarios[2].revenue)}</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 text-left pl-8 text-xs text-slate-500">Room Revenue</td>
                <td className="py-2.5 px-4 font-mono text-xs text-slate-600">{formatIDR(scenarios[0].roomRev)}</td>
                <td className="py-2.5 px-4 font-mono text-xs text-slate-600 bg-blue-50/30">{formatIDR(scenarios[1].roomRev)}</td>
                <td className="py-2.5 px-4 font-mono text-xs text-slate-600">{formatIDR(scenarios[2].roomRev)}</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 text-left pl-8 text-xs text-slate-500">F&B Revenue</td>
                <td className="py-2.5 px-4 font-mono text-xs text-slate-600">{formatIDR(scenarios[0].fbRev)}</td>
                <td className="py-2.5 px-4 font-mono text-xs text-slate-600 bg-blue-50/30">{formatIDR(scenarios[1].fbRev)}</td>
                <td className="py-2.5 px-4 font-mono text-xs text-slate-600">{formatIDR(scenarios[2].fbRev)}</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 text-left font-medium text-rose-700">Total Operating Expenses (OpEx)</td>
                <td className="py-2.5 px-4 font-mono text-rose-600">({formatIDR(scenarios[0].totalCost)})</td>
                <td className="py-2.5 px-4 font-mono text-rose-600 bg-blue-50/30 font-bold">({formatIDR(scenarios[1].totalCost)})</td>
                <td className="py-2.5 px-4 font-mono text-rose-600">({formatIDR(scenarios[2].totalCost)})</td>
              </tr>
              <tr className="bg-slate-100/70 font-black text-slate-900">
                <td className="py-3 px-4 text-left">Gross Operating Profit (GOP)</td>
                <td className="py-3 px-4 font-mono text-amber-900">{formatIDR(scenarios[0].gop)}</td>
                <td className="py-3 px-4 font-mono text-blue-900 bg-blue-100/40 text-base">{formatIDR(scenarios[1].gop)}</td>
                <td className="py-3 px-4 font-mono text-emerald-900">{formatIDR(scenarios[2].gop)}</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 text-left font-medium">GOP Margin (%)</td>
                <td className="py-2.5 px-4 font-mono font-bold text-amber-800">{formatPercent(scenarios[0].gopMargin)}</td>
                <td className="py-2.5 px-4 font-mono font-bold text-blue-800 bg-blue-50/30">{formatPercent(scenarios[1].gopMargin)}</td>
                <td className="py-2.5 px-4 font-mono font-bold text-emerald-800">{formatPercent(scenarios[2].gopMargin)}</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 text-left text-xs text-indigo-700">Operator Management Fee</td>
                <td className="py-2.5 px-4 font-mono text-xs text-indigo-700">{formatIDR(scenarios[0].fee)}</td>
                <td className="py-2.5 px-4 font-mono text-xs text-indigo-700 bg-blue-50/30 font-bold">{formatIDR(scenarios[1].fee)}</td>
                <td className="py-2.5 px-4 font-mono text-xs text-indigo-700">{formatIDR(scenarios[2].fee)}</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 text-left font-semibold">Net Operating Profit (NOP)</td>
                <td className="py-2.5 px-4 font-mono font-bold text-slate-800">{formatIDR(scenarios[0].nop)}</td>
                <td className="py-2.5 px-4 font-mono font-bold text-slate-800 bg-blue-50/30">{formatIDR(scenarios[1].nop)}</td>
                <td className="py-2.5 px-4 font-mono font-bold text-slate-800">{formatIDR(scenarios[2].nop)}</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 text-left font-medium text-rose-700">Beban Tetap Non-Operasional (Sewa/Bank)</td>
                <td className="py-2.5 px-4 font-mono text-rose-600">({formatIDR(scenarios[0].fixedCharges)})</td>
                <td className="py-2.5 px-4 font-mono text-rose-600 bg-blue-50/30">({formatIDR(scenarios[1].fixedCharges)})</td>
                <td className="py-2.5 px-4 font-mono text-rose-600">({formatIDR(scenarios[2].fixedCharges)})</td>
              </tr>
              <tr className="bg-slate-900 text-white font-black">
                <td className="py-3 px-4 text-left">Net Cash Flow to Owner (EBITDA)</td>
                <td className="py-3 px-4 font-mono text-emerald-300">{formatIDR(scenarios[0].netCashflow)}</td>
                <td className="py-3 px-4 font-mono text-emerald-400 bg-slate-800 text-base">{formatIDR(scenarios[1].netCashflow)}</td>
                <td className="py-3 px-4 font-mono text-emerald-300">{formatIDR(scenarios[2].netCashflow)}</td>
              </tr>
              <tr className="bg-emerald-50/60 font-bold text-emerald-950">
                <td className="py-3 px-4 text-left flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1.5 text-emerald-700" />
                  Estimasi Payback Periode CAPEX ({formatIDR(totalCapex)})
                </td>
                <td className="py-3 px-4 font-mono font-bold text-amber-800">{scenarios[0].payback}</td>
                <td className="py-3 px-4 font-mono font-black text-blue-900 bg-blue-100/50">{scenarios[1].payback}</td>
                <td className="py-3 px-4 font-mono font-black text-emerald-800">{scenarios[2].payback}</td>
              </tr>
              <tr className="bg-emerald-50/30 font-bold text-slate-800">
                <td className="py-2.5 px-4 text-left">Estimasi ROI CAPEX Tahunan</td>
                <td className="py-2.5 px-4 font-mono text-amber-800">{formatPercent(scenarios[0].roi / 100)}</td>
                <td className="py-2.5 px-4 font-mono text-blue-900 bg-blue-50/50">{formatPercent(scenarios[1].roi / 100)}</td>
                <td className="py-2.5 px-4 font-mono text-emerald-800">{formatPercent(scenarios[2].roi / 100)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
