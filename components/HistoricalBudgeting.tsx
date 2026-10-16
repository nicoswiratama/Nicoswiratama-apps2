import React, { useState, useMemo } from 'react';
import { 
  History, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  ArrowUpRight, 
  ArrowDownRight, 
  RotateCcw, 
  CheckCircle, 
  AlertCircle,
  Percent,
  FileSpreadsheet
} from 'lucide-react';

interface HistoricalBudgetingProps {
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

const formatPercent = (val: number) => `${(val * 100).toFixed(1)}%`;

export const HistoricalBudgeting: React.FC<HistoricalBudgetingProps> = ({
  basicInput,
  projectedData
}) => {
  const currentTotalRev = projectedData?.revenue?.total || 10000000000;
  const currentRoomRev = projectedData?.revenue?.room || 8000000000;
  const currentFbRev = projectedData?.revenue?.fb || 2000000000;
  const currentOtherRev = projectedData?.revenue?.other || 0;
  const currentOcc = basicInput?.targetOcc || 70;
  const currentAdr = basicInput?.adr || 2000000;

  const deptValues = Object.values(projectedData?.depts || {}) as any[];
  const currentPayroll = deptValues.reduce((a, b) => a + (Number(b.payroll) || 0), 0);
  const currentExpenses = deptValues.reduce((a, b) => a + (Number(b.totalExpense) || 0), 0);
  const currentTotalCost = currentPayroll + currentExpenses;
  const currentGop = currentTotalRev - currentTotalCost;

  // Historical (Last Year) state - initialized with typical -8% to -10% baseline
  const [priorYear, setPriorYear] = useState({
    occ: Math.round(currentOcc * 0.9),
    adr: Math.round(currentAdr * 0.92),
    roomRev: Math.round(currentRoomRev * 0.88),
    fbRev: Math.round(currentFbRev * 0.85),
    otherRev: Math.round(currentOtherRev * 0.9),
    payroll: Math.round(currentPayroll * 0.95),
    expenses: Math.round(currentExpenses * 0.96),
  });

  const varianceAnalysis = useMemo(() => {
    const priorTotalRev = priorYear.roomRev + priorYear.fbRev + priorYear.otherRev;
    const priorTotalCost = priorYear.payroll + priorYear.expenses;
    const priorGop = priorTotalRev - priorTotalCost;
    const priorGopMargin = priorTotalRev > 0 ? (priorGop / priorTotalRev) : 0;
    const currentGopMargin = currentTotalRev > 0 ? (currentGop / currentTotalRev) : 0;

    const calcVar = (curr: number, prior: number, isCost: boolean = false) => {
      const diff = curr - prior;
      const pct = prior !== 0 ? (diff / Math.abs(prior)) * 100 : 0;
      const favorable = isCost ? diff < 0 : diff > 0;
      return { diff, pct, favorable };
    };

    const revVar = calcVar(currentTotalRev, priorTotalRev);
    const roomVar = calcVar(currentRoomRev, priorYear.roomRev);
    const fbVar = calcVar(currentFbRev, priorYear.fbRev);
    const payrollVar = calcVar(currentPayroll, priorYear.payroll, true);
    const expensesVar = calcVar(currentExpenses, priorYear.expenses, true);
    const totalCostVar = calcVar(currentTotalCost, priorTotalCost, true);
    const gopVar = calcVar(currentGop, priorGop);
    const occDiff = currentOcc - priorYear.occ;
    const adrVar = calcVar(currentAdr, priorYear.adr);

    const rows = [
      { name: 'Average Occupancy (%)', prior: `${priorYear.occ}%`, current: `${currentOcc}%`, diff: `${occDiff > 0 ? `+${occDiff}` : occDiff}%`, pct: `${((occDiff / (priorYear.occ || 1)) * 100).toFixed(1)}%`, fav: occDiff >= 0 },
      { name: 'Average Daily Rate (ADR)', prior: formatIDR(priorYear.adr), current: formatIDR(currentAdr), diff: formatIDR(adrVar.diff), pct: `${adrVar.pct.toFixed(1)}%`, fav: adrVar.favorable },
      { name: 'Room Revenue', prior: formatIDR(priorYear.roomRev), current: formatIDR(currentRoomRev), diff: formatIDR(roomVar.diff), pct: `${roomVar.pct.toFixed(1)}%`, fav: roomVar.favorable },
      { name: 'F&B Revenue', prior: formatIDR(priorYear.fbRev), current: formatIDR(currentFbRev), diff: formatIDR(fbVar.diff), pct: `${fbVar.pct.toFixed(1)}%`, fav: fbVar.favorable },
      { name: 'TOTAL REVENUE', prior: formatIDR(priorTotalRev), current: formatIDR(currentTotalRev), diff: formatIDR(revVar.diff), pct: `${revVar.pct.toFixed(1)}%`, fav: revVar.favorable, isHeader: true },
      { name: 'Staff Manning Payroll', prior: formatIDR(priorYear.payroll), current: formatIDR(currentPayroll), diff: formatIDR(payrollVar.diff), pct: `${payrollVar.pct.toFixed(1)}%`, fav: payrollVar.favorable, isCost: true },
      { name: 'Operational Expenses (OpEx)', prior: formatIDR(priorYear.expenses), current: formatIDR(currentExpenses), diff: formatIDR(expensesVar.diff), pct: `${expensesVar.pct.toFixed(1)}%`, fav: expensesVar.favorable, isCost: true },
      { name: 'TOTAL OPERATING COSTS', prior: formatIDR(priorTotalCost), current: formatIDR(currentTotalCost), diff: formatIDR(totalCostVar.diff), pct: `${totalCostVar.pct.toFixed(1)}%`, fav: totalCostVar.favorable, isCost: true, isHeader: true },
      { name: 'GROSS OPERATING PROFIT (GOP)', prior: formatIDR(priorGop), current: formatIDR(currentGop), diff: formatIDR(gopVar.diff), pct: `${gopVar.pct.toFixed(1)}%`, fav: gopVar.favorable, isGop: true },
      { name: 'GOP Margin (%)', prior: formatPercent(priorGopMargin), current: formatPercent(currentGopMargin), diff: formatPercent(currentGopMargin - priorGopMargin), pct: '-', fav: currentGopMargin >= priorGopMargin }
    ];

    return {
      priorTotalRev,
      priorTotalCost,
      priorGop,
      revVar,
      gopVar,
      rows
    };
  }, [priorYear, currentTotalRev, currentRoomRev, currentFbRev, currentOtherRev, currentPayroll, currentExpenses, currentTotalCost, currentGop, currentOcc, currentAdr]);

  const resetToBenchmark = () => {
    setPriorYear({
      occ: Math.round(currentOcc * 0.9),
      adr: Math.round(currentAdr * 0.92),
      roomRev: Math.round(currentRoomRev * 0.88),
      fbRev: Math.round(currentFbRev * 0.85),
      otherRev: Math.round(currentOtherRev * 0.9),
      payroll: Math.round(currentPayroll * 0.95),
      expenses: Math.round(currentExpenses * 0.96),
    });
  };

  return (
    <div className="max-w-6xl mx-auto pt-6 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-cyan-100 text-cyan-800 rounded-xl">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              Annual Budgeting & YoY Variance Analysis
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Komparasi target budget tahun ini terhadap realisasi aktual tahun sebelumnya (Year-over-Year Growth & Cost Variance).
            </p>
          </div>
        </div>

        <button 
          onClick={resetToBenchmark}
          className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-2 rounded-xl flex items-center hover:bg-slate-50 transition-all shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Auto-Seed Realisasi Lalu (-10%)
        </button>
      </div>

      {/* Highlights KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Target Pertumbuhan Revenue (YoY)
          </div>
          <div className="text-3xl font-black text-blue-900 mt-2 font-mono flex items-center">
            {varianceAnalysis.revVar.pct >= 0 ? '+' : ''}{varianceAnalysis.revVar.pct.toFixed(1)}%
            {varianceAnalysis.revVar.pct >= 0 ? (
              <ArrowUpRight className="w-6 h-6 text-emerald-600 ml-2" />
            ) : (
              <ArrowDownRight className="w-6 h-6 text-rose-600 ml-2" />
            )}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Kenaikan nominal: <span className="font-bold text-slate-700">{formatIDR(varianceAnalysis.revVar.diff)}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Target Peningkatan GOP (YoY)
          </div>
          <div className="text-3xl font-black text-emerald-700 mt-2 font-mono flex items-center">
            {varianceAnalysis.gopVar.pct >= 0 ? '+' : ''}{varianceAnalysis.gopVar.pct.toFixed(1)}%
            {varianceAnalysis.gopVar.pct >= 0 ? (
              <ArrowUpRight className="w-6 h-6 text-emerald-600 ml-2" />
            ) : (
              <ArrowDownRight className="w-6 h-6 text-rose-600 ml-2" />
            )}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Pertambahan laba kotor: <span className="font-bold text-slate-700">{formatIDR(varianceAnalysis.gopVar.diff)}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Perbandingan GOP Nominal
          </div>
          <div className="text-2xl font-black text-slate-800 mt-2 font-mono">
            {formatIDR(currentGop)}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Tahun Lalu: <span className="font-bold text-slate-500">{formatIDR(varianceAnalysis.priorGop)}</span>
          </div>
        </div>
      </div>

      {/* Input Actuals from Prior Year */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-800 text-sm flex items-center">
            <History className="w-4 h-4 mr-2 text-cyan-600" />
            Data Realisasi Tahun Sebelumnya (Historical Baseline)
          </h3>
          <span className="text-xs text-slate-400 italic">Dapat diedit sesuai laporan keuangan tahun lalu</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-600 mb-1">Okupansi Lalu (%)</label>
            <input 
              type="number"
              value={priorYear.occ}
              onChange={(e) => setPriorYear({ ...priorYear, occ: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold text-slate-800 font-mono"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-600 mb-1">ADR Lalu (Rp)</label>
            <input 
              type="number"
              value={priorYear.adr}
              onChange={(e) => setPriorYear({ ...priorYear, adr: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold text-slate-800 font-mono"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-600 mb-1">Room Rev Lalu (Rp)</label>
            <input 
              type="number"
              value={priorYear.roomRev}
              onChange={(e) => setPriorYear({ ...priorYear, roomRev: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold text-slate-800 font-mono"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-600 mb-1">F&B Rev Lalu (Rp)</label>
            <input 
              type="number"
              value={priorYear.fbRev}
              onChange={(e) => setPriorYear({ ...priorYear, fbRev: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold text-slate-800 font-mono"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-600 mb-1">Payroll Lalu (Rp)</label>
            <input 
              type="number"
              value={priorYear.payroll}
              onChange={(e) => setPriorYear({ ...priorYear, payroll: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold text-slate-800 font-mono"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-600 mb-1">OpEx Lalu (Rp)</label>
            <input 
              type="number"
              value={priorYear.expenses}
              onChange={(e) => setPriorYear({ ...priorYear, expenses: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold text-slate-800 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Variance Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 text-base flex items-center">
            <BarChart3 className="w-4 h-4 mr-2 text-blue-600" />
            Laporan Komparasi Budget vs Realisasi Lalu (YoY Variance)
          </h3>
          <span className="text-xs text-slate-400">Budget Review</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                <th className="py-3 px-4 text-left">Komponen Finansial</th>
                <th className="py-3 px-4 text-slate-600">Realisasi Tahun Lalu</th>
                <th className="py-3 px-4 text-blue-900 bg-blue-50/50">Target Budget Baru</th>
                <th className="py-3 px-4">Selisih (Variance)</th>
                <th className="py-3 px-4">Growth (%)</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {varianceAnalysis.rows.map((r, idx) => (
                <tr 
                  key={idx}
                  className={`transition-colors ${
                    r.isGop 
                      ? 'bg-emerald-50/70 font-black text-slate-900 text-base' 
                      : r.isHeader 
                      ? 'bg-slate-50 font-bold text-slate-900' 
                      : 'hover:bg-slate-50/60'
                  }`}
                >
                  <td className="py-3 px-4 text-left font-medium">
                    {r.name}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">{r.prior}</td>
                  <td className={`py-3 px-4 font-mono font-bold ${r.isHeader ? 'text-blue-900' : 'text-slate-800'} ${r.isGop ? 'text-emerald-900' : ''}`}>
                    {r.current}
                  </td>
                  <td className={`py-3 px-4 font-mono font-bold ${r.fav ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {r.diff}
                  </td>
                  <td className={`py-3 px-4 font-mono font-bold ${r.fav ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {r.pct}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      r.fav ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {r.fav ? 'Favorable' : 'Unfavorable'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
