import React, { useState, useMemo, useEffect } from 'react';
import { 
  Wrench, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  PieChart, 
  Layers, 
  RotateCcw, 
  Sparkles, 
  ArrowRight,
  GitCompare,
  Landmark,
  ShieldCheck,
  Building,
  Save,
  Check
} from 'lucide-react';
import { CapexSetup } from '../types';
import { DEFAULT_CAPEX } from '../services/propertyStorage';

interface CapexPaybackProps {
  basicInput: any;
  projectedData: any;
  longTermData: any[];
  onUpdateCapex?: (newCapex: CapexSetup) => void;
  onSaveCapex?: () => void;
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

export const CapexPayback: React.FC<CapexPaybackProps> = ({
  basicInput,
  projectedData,
  longTermData,
  onUpdateCapex,
  onSaveCapex
}) => {
  const rooms = basicInput?.rooms || 40;
  const [isSavedRecently, setIsSavedRecently] = useState<boolean>(false);

  // CAPEX components from basicInput.capex with fallback
  const initialCapex: CapexSetup = basicInput?.capex || DEFAULT_CAPEX;
  const [capexItems, setCapexItems] = useState<CapexSetup>(initialCapex);

  // Sync state if basicInput.capex changes from outside (e.g. switching property)
  useEffect(() => {
    if (basicInput?.capex) {
      setCapexItems(basicInput.capex);
    }
  }, [basicInput?.capex]);

  const updateItem = (field: keyof CapexSetup, val: number) => {
    const updated = { ...capexItems, [field]: val };
    setCapexItems(updated);
    if (onUpdateCapex) {
      onUpdateCapex(updated);
    }
  };

  // Scenario toggle in CAPEX Payback analysis
  const [selectedScenario, setSelectedScenario] = useState<'realistic' | 'conservative' | 'aggressive'>('realistic');
  const [cashflowBasis, setCashflowBasis] = useState<'net_cashflow' | 'nop'>('net_cashflow');

  const totalCapex = useMemo(() => {
    const roomCost = capexItems.roomRenovationPerRoom * rooms;
    return roomCost + 
      capexItems.publicAreaRenovation + 
      capexItems.mepEquipment + 
      capexItems.itPmsHardware + 
      capexItems.workingCapital;
  }, [capexItems, rooms]);

  const paybackAnalysis = useMemo(() => {
    if (!longTermData || longTermData.length === 0 || totalCapex <= 0) return null;

    // Multipliers based on selected scenario
    let occFactor = 1.0;
    let adrFactor = 1.0;
    if (selectedScenario === 'conservative') {
      occFactor = Math.max(0.6, (basicInput.targetOcc - 15) / basicInput.targetOcc);
      adrFactor = 0.90;
    } else if (selectedScenario === 'aggressive') {
      occFactor = Math.min(1.3, (basicInput.targetOcc + 10) / basicInput.targetOcc);
      adrFactor = 1.15;
    }

    const revFactor = occFactor * adrFactor;
    let cumulative = 0;
    let paybackYearFraction = -1; // -1 if not paid back in 10 yrs

    const timeline = longTermData.map((d: any) => {
      const baseRev = (d.revenue || 0) * revFactor;
      const baseExp = (d.expense || 0) * (selectedScenario === 'conservative' ? 0.95 : selectedScenario === 'aggressive' ? 1.05 : 1.0);
      const gop = baseRev - baseExp;
      
      let fee = 0;
      if (basicInput.feeModel === '15_percent') {
        fee = baseRev * (basicInput.customFee.revPct / 100);
      } else {
        fee = (baseRev * (basicInput.customFee.baseRevPct / 100)) + (Math.max(0, gop) * (basicInput.customFee.gopPct / 100));
      }
      
      const ownerNop = gop - fee;
      const fixedCharges = Number(d.fixedCharges) || 0;
      const ownerNetCashflow = ownerNop - fixedCharges;

      // Select cash flow basis for investor payback: Net Cash Flow (USALI Net) or NOP
      const annualDividend = cashflowBasis === 'net_cashflow' ? ownerNetCashflow : ownerNop;
      
      const prevCumulative = cumulative;
      cumulative += annualDividend;

      // Check if payback milestone hit in this year
      if (paybackYearFraction === -1 && cumulative >= totalCapex) {
        const needed = totalCapex - prevCumulative;
        const fraction = annualDividend > 0 ? (needed / annualDividend) : 0;
        paybackYearFraction = (d.year - 1) + fraction;
      }

      return {
        year: d.year,
        revenue: baseRev,
        gop,
        ownerNop,
        fixedCharges,
        ownerNetCashflow,
        annualDividend,
        cumulative,
        recoveredPct: Math.min(100, (cumulative / totalCapex) * 100),
        isPaybackYear: cumulative >= totalCapex && prevCumulative < totalCapex,
        isFullyRecovered: cumulative >= totalCapex,
      };
    });

    const avgAnnualDividend = timeline.reduce((acc, t) => acc + t.annualDividend, 0) / timeline.length;
    const simpleRoi = totalCapex > 0 ? (avgAnnualDividend / totalCapex) * 100 : 0;

    let paybackDisplay = '';
    if (paybackYearFraction > 0) {
      const wholeYears = Math.floor(paybackYearFraction);
      const months = Math.round((paybackYearFraction - wholeYears) * 12);
      paybackDisplay = `${wholeYears} Tahun ${months > 0 ? `${months} Bulan` : ''}`;
    } else {
      paybackDisplay = '> 10 Tahun';
    }

    return {
      totalCapex,
      paybackYearFraction,
      paybackDisplay,
      avgAnnualDividend,
      simpleRoi,
      timeline,
      isRecoverable: paybackYearFraction > 0
    };
  }, [longTermData, totalCapex, basicInput, selectedScenario, cashflowBasis]);

  return (
    <div className="max-w-6xl mx-auto pt-6 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-rose-100 text-rose-800 rounded-xl">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              CAPEX, Renovation & Payback Period (ROI)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulasi kelayakan investasi renovasi / takeover dan estimasi timeline balik modal bagi pemilik properti terintegrasi dengan Quick Setup & Multi-Skenario.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="text-xs font-bold bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-slate-700 shadow-sm flex items-center">
            <Building className="w-3.5 h-3.5 mr-1.5 text-blue-900" />
            Aset: <span className="text-blue-900 font-extrabold ml-1">{basicInput.name}</span> ({rooms} kamar)
          </div>

          {onSaveCapex && (
            <button
              onClick={() => {
                onSaveCapex();
                setIsSavedRecently(true);
                setTimeout(() => setIsSavedRecently(false), 2500);
              }}
              className={`text-xs font-bold px-3.5 py-1.5 rounded-xl flex items-center transition-all shadow-sm active:scale-95 ${
                isSavedRecently 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
              title="Simpan perubahan rincian CAPEX ini ke properti"
            >
              {isSavedRecently ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                  Tersimpan di Properti!
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 mr-1.5 text-yellow-300" />
                  Simpan Setup CAPEX
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Scenario & Cashflow Basis Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Scenario Switcher */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-500 uppercase flex items-center shrink-0">
            <GitCompare className="w-3.5 h-3.5 mr-1 text-indigo-600" /> Skenario Proyeksi:
          </span>
          <div className="grid grid-cols-3 gap-1.5 w-full md:w-auto">
            <button
              onClick={() => setSelectedScenario('conservative')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedScenario === 'conservative'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Konservatif (-15% Occ)
            </button>
            <button
              onClick={() => setSelectedScenario('realistic')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedScenario === 'realistic'
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Realistis (Baseline)
            </button>
            <button
              onClick={() => setSelectedScenario('aggressive')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedScenario === 'aggressive'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Optimis (+10% Occ)
            </button>
          </div>
        </div>

        {/* Basis Switcher */}
        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          <span className="text-xs font-bold text-slate-500 uppercase shrink-0">
            Dasar Arus Kas:
          </span>
          <div className="bg-slate-100 p-1 rounded-xl flex space-x-1">
            <button
              onClick={() => setCashflowBasis('net_cashflow')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                cashflowBasis === 'net_cashflow'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Memperhitungkan beban tetap sewa lahan & cicilan bank"
            >
              Net Cash Flow (Setelah Sewa/Bank)
            </button>
            <button
              onClick={() => setCashflowBasis('nop')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                cashflowBasis === 'nop'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              title="NOP murni operasional sebelum sewa/pinjaman"
            >
              NOP Murni
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {paybackAnalysis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Total Investasi (CAPEX)
            </div>
            <div className="text-2xl font-black text-rose-700 mt-2 font-mono">
              {formatIDR(totalCapex)}
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Rata-rata: {formatIDR(totalCapex / rooms)} / kamar
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Estimasi Balik Modal ({selectedScenario.toUpperCase()})
            </div>
            <div className="text-2xl font-black text-emerald-700 mt-2">
              {paybackAnalysis.paybackDisplay}
            </div>
            <div className="mt-2 text-xs text-slate-500">
              {cashflowBasis === 'net_cashflow' ? 'Berdasarkan Net Cash Flow Pemilik' : 'Berdasarkan NOP Operasional'}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Rata-rata ROI Tahunan
            </div>
            <div className="text-3xl font-black text-blue-900 mt-2 font-mono">
              {formatPercent(paybackAnalysis.simpleRoi / 100)}
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Return on Investment tahunan rata-rata
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Rata-rata Kas Bersih / Thn
            </div>
            <div className="text-2xl font-black text-slate-800 mt-2 font-mono">
              {formatIDR(paybackAnalysis.avgAnnualDividend)}
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Arus kas tahunan hak pemilik properti
            </div>
          </div>
        </div>
      )}

      {/* Interactive CAPEX Budget Inputs */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-800 text-sm flex items-center">
            <DollarSign className="w-4 h-4 mr-1.5 text-rose-600" />
            Rincian Alokasi Modal Awal / Renovasi (Sync Otomatis ke Setup)
          </h3>
          <span className="text-xs text-emerald-600 font-bold flex items-center">
            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Tersinkron ke Setup Properti
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
          <div>
            <label className="block font-bold text-slate-600 uppercase mb-1">
              Renovasi Kamar (per Kamar)
            </label>
            <div className="flex items-center space-x-2">
              <input 
                type="number"
                value={capexItems.roomRenovationPerRoom}
                onChange={(e) => updateItem('roomRenovationPerRoom', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Total {rooms} kamar: <span className="font-bold text-slate-700">{formatIDR(capexItems.roomRenovationPerRoom * rooms)}</span></p>
          </div>

          <div>
            <label className="block font-bold text-slate-600 uppercase mb-1">
              Renovasi Area Publik & Lobby
            </label>
            <input 
              type="number"
              value={capexItems.publicAreaRenovation}
              onChange={(e) => updateItem('publicAreaRenovation', parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <p className="text-[10px] text-slate-400 mt-1">Lobby, Resto, Koridor, Façade & Pool</p>
          </div>

          <div>
            <label className="block font-bold text-slate-600 uppercase mb-1">
              MEP, Genset, AC & Pompa
            </label>
            <input 
              type="number"
              value={capexItems.mepEquipment}
              onChange={(e) => updateItem('mepEquipment', parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <p className="text-[10px] text-slate-400 mt-1">Infrastruktur mekanikal, elektrikal, plumbing</p>
          </div>

          <div>
            <label className="block font-bold text-slate-600 uppercase mb-1">
              IT, PMS, WiFi & Keycard Locks
            </label>
            <input 
              type="number"
              value={capexItems.itPmsHardware}
              onChange={(e) => updateItem('itPmsHardware', parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <p className="text-[10px] text-slate-400 mt-1">Hardware & setup integrasi Theloka OS</p>
          </div>

          <div>
            <label className="block font-bold text-slate-600 uppercase mb-1">
              Modal Kerja Awal (Working Capital)
            </label>
            <input 
              type="number"
              value={capexItems.workingCapital}
              onChange={(e) => updateItem('workingCapital', parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <p className="text-[10px] text-slate-400 mt-1">Kas operasional buffer bulan ke-1 & ke-2</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Estimasi Investasi</span>
            <span className="text-xl font-black text-rose-700 font-mono mt-1">{formatIDR(totalCapex)}</span>
          </div>
        </div>
      </div>

      {/* Payback Timeline Table */}
      {paybackAnalysis && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                Timeline Proyeksi Pemulihan Investasi 10 Tahun ({selectedScenario.toUpperCase()})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Akumulasi pengembalian modal modal kerja berdasarkan proyeksi arus kas tahunan.
              </p>
            </div>
            <div className="text-xs font-bold text-blue-900 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              Target Balik Modal: {paybackAnalysis.paybackDisplay}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                  <th className="py-3 px-4 text-left">Tahun</th>
                  <th className="py-3 px-3">Topline Revenue</th>
                  <th className="py-3 px-3">GOP</th>
                  <th className="py-3 px-3">Beban Tetap (Sewa/Bank)</th>
                  <th className="py-3 px-3 font-bold text-blue-950">Arus Kas Pemilik</th>
                  <th className="py-3 px-3 font-bold text-emerald-800">Akumulasi Kas</th>
                  <th className="py-3 px-4 text-center">Progress Recovery</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paybackAnalysis.timeline.map((row: any) => (
                  <tr 
                    key={row.year} 
                    className={`transition-colors ${
                      row.isPaybackYear 
                        ? 'bg-emerald-50/80 font-bold' 
                        : row.isFullyRecovered 
                        ? 'bg-emerald-50/20' 
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 px-4 text-left font-bold text-slate-700 flex items-center space-x-1.5">
                      <span>Tahun {row.year}</span>
                      {row.isPaybackYear && (
                        <span className="text-[10px] bg-emerald-600 text-white font-black px-2 py-0.5 rounded-full uppercase ml-1 animate-pulse">
                          ★ Balik Modal
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono">{formatIDR(row.revenue)}</td>
                    <td className="py-3 px-3 font-mono">{formatIDR(row.gop)}</td>
                    <td className="py-3 px-3 font-mono text-rose-600">
                      {row.fixedCharges > 0 ? `(${formatIDR(row.fixedCharges)})` : '-'}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-blue-900">
                      {formatIDR(row.annualDividend)}
                    </td>
                    <td className="py-3 px-3 font-mono font-black text-emerald-700">
                      {formatIDR(row.cumulative)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              row.recoveredPct >= 100 ? 'bg-emerald-500' : 'bg-blue-600'
                            }`}
                            style={{ width: `${Math.min(100, row.recoveredPct)}%` }}
                          ></div>
                        </div>
                        <span className="text-[10px] font-mono font-bold w-10 text-right">
                          {formatPercent(row.recoveredPct / 100)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
