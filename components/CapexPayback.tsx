import React, { useState, useMemo } from 'react';
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
  ArrowRight
} from 'lucide-react';

interface CapexPaybackProps {
  basicInput: any;
  projectedData: any;
  longTermData: any[];
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
  longTermData
}) => {
  const rooms = basicInput?.rooms || 40;

  // Initial CAPEX components
  const [capexItems, setCapexItems] = useState({
    roomRenovationPerRoom: 35000000, // Rp 35jt per room
    publicAreaRenovation: 300000000, // Rp 300jt
    mepEquipment: 250000000,        // AC, Genset, Pumps
    itPmsHardware: 150000000,       // PMS, Keycards, WiFi
    workingCapital: 200000000,      // Kas Awal Operasional
  });

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

    let cumulative = 0;
    let paybackYearFraction = -1; // -1 if not paid back in 10 yrs

    const timeline = longTermData.map((d: any) => {
      // Calculate NOP after operator fee
      const gop = d.gop || 0;
      const rev = d.revenue || 0;
      let fee = 0;
      if (basicInput.feeModel === '15_percent') {
        fee = rev * (basicInput.customFee.revPct / 100);
      } else {
        fee = (rev * (basicInput.customFee.baseRevPct / 100)) + (Math.max(0, gop) * (basicInput.customFee.gopPct / 100));
      }
      const ownerNop = gop - fee;
      const prevCumulative = cumulative;
      cumulative += ownerNop;

      // Check if payback milestone hit in this year
      if (paybackYearFraction === -1 && cumulative >= totalCapex) {
        const needed = totalCapex - prevCumulative;
        const fraction = ownerNop > 0 ? (needed / ownerNop) : 0;
        paybackYearFraction = (d.year - 1) + fraction;
      }

      return {
        year: d.year,
        revenue: rev,
        gop,
        ownerNop,
        cumulative,
        recoveredPct: Math.min(100, (cumulative / totalCapex) * 100),
        isPaybackYear: cumulative >= totalCapex && prevCumulative < totalCapex,
        isFullyRecovered: cumulative >= totalCapex,
      };
    });

    const avgAnnualNop = timeline.reduce((acc, t) => acc + t.ownerNop, 0) / timeline.length;
    const simpleRoi = totalCapex > 0 ? (avgAnnualNop / totalCapex) * 100 : 0;

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
      avgAnnualNop,
      simpleRoi,
      timeline,
      isRecoverable: paybackYearFraction > 0
    };
  }, [longTermData, totalCapex, basicInput]);

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
              Simulasi kelayakan investasi renovasi / takeover dan estimasi timeline balik modal bagi pemilik properti.
            </p>
          </div>
        </div>

        <div className="text-xs font-bold bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-slate-700 shadow-sm">
          Aset: <span className="text-blue-900 font-extrabold">{basicInput.name}</span> ({rooms} kamar)
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
              Estimasi Balik Modal (BEP)
            </div>
            <div className="text-2xl font-black text-emerald-700 mt-2">
              {paybackAnalysis.paybackDisplay}
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Berdasarkan cashflow NOP dividen Owner
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
              Return on Investment tahunan
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Rata-rata NOP Bersih / Thn
            </div>
            <div className="text-2xl font-black text-slate-800 mt-2 font-mono">
              {formatIDR(paybackAnalysis.avgAnnualNop)}
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Arus kas bersih hak Owner
            </div>
          </div>
        </div>
      )}

      {/* Interactive CAPEX Budget Inputs */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-800 text-sm flex items-center">
            <DollarSign className="w-4 h-4 mr-1.5 text-rose-600" />
            Rincian Alokasi Modal Awal / Renovasi
          </h3>
          <span className="text-xs text-slate-400">Silahkan sesuaikan nilai di bawah</span>
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
                onChange={(e) => setCapexItems({ ...capexItems, roomRenovationPerRoom: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Total {rooms} kamar: <span className="font-bold text-slate-700">{formatIDR(capexItems.roomRenovationPerRoom * rooms)}</span></p>
          </div>

          <div>
            <label className="block font-bold text-slate-600 uppercase mb-1">
              Public Area / Lobby / Resto
            </label>
            <input 
              type="number"
              value={capexItems.publicAreaRenovation}
              onChange={(e) => setCapexItems({ ...capexItems, publicAreaRenovation: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <p className="text-[10px] text-slate-400 mt-1">Lump sum area publik & lanskap</p>
          </div>

          <div>
            <label className="block font-bold text-slate-600 uppercase mb-1">
              MEP, Genset, AC, Pompa
            </label>
            <input 
              type="number"
              value={capexItems.mepEquipment}
              onChange={(e) => setCapexItems({ ...capexItems, mepEquipment: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <p className="text-[10px] text-slate-400 mt-1">Mesin & kelistrikan gedung</p>
          </div>

          <div>
            <label className="block font-bold text-slate-600 uppercase mb-1">
              IT, PMS, Kunci Kartu, CCTV
            </label>
            <input 
              type="number"
              value={capexItems.itPmsHardware}
              onChange={(e) => setCapexItems({ ...capexItems, itPmsHardware: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <p className="text-[10px] text-slate-400 mt-1">Teknologi & sistem operasional</p>
          </div>

          <div>
            <label className="block font-bold text-slate-600 uppercase mb-1">
              Working Capital / Kas Awal
            </label>
            <input 
              type="number"
              value={capexItems.workingCapital}
              onChange={(e) => setCapexItems({ ...capexItems, workingCapital: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <p className="text-[10px] text-slate-400 mt-1">Kas operasional bulan pertama</p>
          </div>

          <div className="bg-rose-50 p-3.5 rounded-xl border border-rose-200 flex flex-col justify-center">
            <span className="text-[10px] font-bold text-rose-800 uppercase">Total Modal Dibutuhkan</span>
            <span className="text-xl font-black text-rose-900 font-mono mt-0.5">{formatIDR(totalCapex)}</span>
          </div>
        </div>
      </div>

      {/* Payback Progression Table */}
      {paybackAnalysis && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-base flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-blue-600" />
              Proyeksi Akumulasi Arus Kas & Milestone Balik Modal (10 Tahun)
            </h3>
            <span className="text-xs text-slate-500">Target Modal: {formatIDR(totalCapex)}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 text-left">Tahun Ke</th>
                  <th className="py-3 px-4">Proyeksi Revenue</th>
                  <th className="py-3 px-4">Owner NOP (Arus Kas)</th>
                  <th className="py-3 px-4">Akumulasi Kas Masuk</th>
                  <th className="py-3 px-4 text-center">Progress Modal</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paybackAnalysis.timeline.map((row) => (
                  <tr 
                    key={row.year} 
                    className={`transition-colors ${
                      row.isPaybackYear 
                        ? 'bg-emerald-50 font-bold border-l-4 border-l-emerald-500' 
                        : row.isFullyRecovered 
                        ? 'bg-emerald-50/20' 
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="py-3 px-4 text-left font-bold text-slate-800">
                      Tahun {row.year}
                      {row.isPaybackYear && (
                        <span className="ml-2 text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full uppercase font-black">
                          ★ Balik Modal!
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">{formatIDR(row.revenue)}</td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-900">{formatIDR(row.ownerNop)}</td>
                    <td className="py-3 px-4 font-mono font-black text-slate-800">{formatIDR(row.cumulative)}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${row.recoveredPct}%` }} 
                            className={`h-full rounded-full ${row.isFullyRecovered ? 'bg-emerald-600' : 'bg-blue-600'}`} 
                          />
                        </div>
                        <span className="text-xs font-mono text-slate-500 w-12 text-right">
                          {row.recoveredPct.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center text-xs">
                      {row.isFullyRecovered ? (
                        <span className="text-emerald-700 font-bold flex items-center justify-center">
                          <CheckCircle className="w-3.5 h-3.5 mr-1" /> Profit Murni
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">
                          Recovery Modal
                        </span>
                      )}
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
