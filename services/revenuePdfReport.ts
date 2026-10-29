import { RevenueScenarios, RevenueScenarioTarget } from '../types';

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

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

export interface RevenuePdfReportData {
  basicInput: any;
  revenueScenarios: RevenueScenarios;
  dateStr?: string;
}

interface ScenarioCalcResult {
  monthlyDetails: Array<{
    month: string;
    days: number;
    roomsAvailable: number;
    roomsSold: number;
    occ: number;
    arr: number;
    revpar: number;
    roomRev: number;
  }>;
  totalAvailable: number;
  totalSold: number;
  weightedOcc: number;
  weightedArr: number;
  weightedRevpar: number;
  totalRoomRevenue: number;
}

const calculateScenarioMetrics = (rooms: number, targets: RevenueScenarioTarget[]): ScenarioCalcResult => {
  const safeRooms = Math.max(1, rooms);
  let totalAvailable = 0;
  let totalSold = 0;
  let totalRoomRevenue = 0;

  const monthlyDetails = (targets || []).map((t, i) => {
    const days = DAYS_IN_MONTH[i] || 30;
    const avail = safeRooms * days;
    const occ = Number(t.occ) || 0;
    const arr = Number(t.arr) || 0;
    const sold = Math.round((occ / 100) * avail);
    const revpar = Math.round((arr * occ) / 100);
    const roomRev = sold * arr;

    totalAvailable += avail;
    totalSold += sold;
    totalRoomRevenue += roomRev;

    return {
      month: MONTH_NAMES[i],
      days,
      roomsAvailable: avail,
      roomsSold: sold,
      occ,
      arr,
      revpar,
      roomRev
    };
  });

  const weightedOcc = totalAvailable > 0 ? (totalSold / totalAvailable) : 0;
  const weightedArr = totalSold > 0 ? (totalRoomRevenue / totalSold) : 0;
  const weightedRevpar = totalAvailable > 0 ? (totalRoomRevenue / totalAvailable) : 0;

  return {
    monthlyDetails,
    totalAvailable,
    totalSold,
    weightedOcc,
    weightedArr,
    weightedRevpar,
    totalRoomRevenue
  };
};

export const generateAndPrintRevenuePdf = ({
  basicInput,
  revenueScenarios,
  dateStr
}: RevenuePdfReportData) => {
  if (!revenueScenarios) return;

  const rooms = basicInput.rooms || 40;
  const activeKey = revenueScenarios.activeScenario || 'realistic';

  const resRealistic = calculateScenarioMetrics(rooms, revenueScenarios.realistic);
  const resConservative = calculateScenarioMetrics(rooms, revenueScenarios.conservative);
  const resOptimistic = calculateScenarioMetrics(rooms, revenueScenarios.optimistic);

  const activeRes = activeKey === 'conservative' 
    ? resConservative 
    : activeKey === 'optimistic' 
      ? resOptimistic 
      : resRealistic;

  const scenarioTitles: Record<string, string> = {
    realistic: 'Realistis (Base Case)',
    conservative: 'Konservatif (Bear Case)',
    optimistic: 'Optimis (Bull Case)'
  };

  const printDate = dateStr || new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Laporan Revenue Management 3-Way - ${basicInput.name}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 8mm 10mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
      font-size: 10.5px;
      line-height: 1.35;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    .brand-title {
      font-size: 17px;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #0f172a;
      margin: 0;
    }
    .brand-subtitle {
      font-size: 10px;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-top: 2px;
    }
    .doc-badge {
      display: inline-block;
      background: #e0e7ff;
      color: #3730a3;
      font-size: 9px;
      font-weight: 800;
      padding: 2px 7px;
      border-radius: 4px;
      text-transform: uppercase;
      margin-top: 3px;
    }
    .meta-table {
      font-size: 9.5px;
      text-align: right;
    }
    .meta-table td {
      padding: 1px 4px;
    }
    .meta-label {
      color: #64748b;
      font-weight: 500;
    }
    .meta-val {
      font-weight: 700;
      color: #0f172a;
    }

    /* Comparison Section */
    .section-title {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #1e293b;
      margin: 10px 0 6px 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .comp-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 14px;
    }
    .scenario-card {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 9px 12px;
      background: #f8fafc;
    }
    .scenario-card.active {
      border: 2px solid #1e40af;
      background: #eff6ff;
    }
    .card-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .card-title {
      font-size: 11px;
      font-weight: 800;
      color: #0f172a;
    }
    .card-badge {
      font-size: 8.5px;
      font-weight: 800;
      padding: 1px 6px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .badge-active {
      background: #1e40af;
      color: #ffffff;
    }
    .badge-alt {
      background: #e2e8f0;
      color: #475569;
    }
    .card-revenue {
      font-size: 15px;
      font-weight: 900;
      color: #0f172a;
      font-family: monospace;
      margin: 4px 0 6px 0;
    }
    .card-stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px;
      font-size: 9.5px;
    }
    .stat-label {
      color: #64748b;
    }
    .stat-val {
      font-weight: 700;
      color: #1e293b;
      font-family: monospace;
      text-align: right;
    }

    /* Main Detailed Table */
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5px;
      margin-top: 4px;
    }
    table.data-table th, table.data-table td {
      border: 1px solid #cbd5e1;
      padding: 4px 6px;
      text-align: right;
    }
    table.data-table th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 800;
      text-transform: uppercase;
      font-size: 8.5px;
      letter-spacing: 0.03em;
    }
    table.data-table th.text-left, table.data-table td.text-left {
      text-align: left;
    }
    table.data-table tr.total-row {
      background: #0f172a;
      color: #ffffff;
      font-weight: 800;
    }
    table.data-table tr.total-row td {
      border-color: #0f172a;
      color: #ffffff;
      font-family: monospace;
    }

    /* Signatures */
    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 20px;
      margin-top: 14px;
      padding-top: 10px;
      border-top: 1px solid #cbd5e1;
      font-size: 9px;
    }
    .sig-box {
      border: 1px dashed #cbd5e1;
      border-radius: 6px;
      padding: 8px 10px;
      background: #fafafa;
    }
    .sig-space {
      height: 38px;
    }

    .footer {
      display: flex;
      justify-content: space-between;
      font-size: 8.5px;
      color: #64748b;
      margin-top: 10px;
      padding-top: 4px;
      border-top: 1px solid #e2e8f0;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div>
      <h1 class="brand-title">THELOKA PRO HOSPITALITY SYSTEM</h1>
      <div class="brand-subtitle">Strategic Revenue Management & Multi-Scenario (3-Way) Performance</div>
      <div class="doc-badge">Official Projection Model • Standar USALI Perhotelan</div>
    </div>
    <div>
      <table class="meta-table">
        <tr><td class="meta-label">Properti:</td><td class="meta-val">${basicInput.name}</td></tr>
        <tr><td class="meta-label">Area / Tipe:</td><td class="meta-val">${basicInput.location || '-'} • ${basicInput.type || 'Hotel/Resort'}</td></tr>
        <tr><td class="meta-label">Kapasitas:</td><td class="meta-val">${rooms} Kamar (${rooms * 365} Kamar/Tahun)</td></tr>
        <tr><td class="meta-label">Tanggal Cetak:</td><td class="meta-val">${printDate}</td></tr>
        <tr><td class="meta-label">Skenario Aktif:</td><td class="meta-val" style="color: #1e40af;">${scenarioTitles[activeKey]}</td></tr>
      </table>
    </div>
  </div>

  <!-- 3-Way Scenario Summary Cards -->
  <div class="section-title">
    <span>1. Perbandingan Eksekutif 3 Skenario Revenue (3-Way Comparison)</span>
  </div>
  <div class="comp-grid">
    <!-- Konservatif -->
    <div class="scenario-card ${activeKey === 'conservative' ? 'active' : ''}">
      <div class="card-head">
        <span class="card-title">1. Skenario Konservatif (Bear Case)</span>
        <span class="card-badge ${activeKey === 'conservative' ? 'badge-active' : 'badge-alt'}">
          ${activeKey === 'conservative' ? '★ AKTIF DI PROYEKSI' : 'ALTERNATIF'}
        </span>
      </div>
      <div class="card-revenue">${formatIDR(resConservative.totalRoomRevenue)}</div>
      <div class="card-stats">
        <span class="stat-label">Rata-rata Okupansi:</span>
        <span class="stat-val">${formatPercent(resConservative.weightedOcc)}</span>
        <span class="stat-label">Kamar Terjual (Thn):</span>
        <span class="stat-val">${resConservative.totalSold.toLocaleString('id-ID')} Rms</span>
        <span class="stat-label">Rata-rata ARR (Net):</span>
        <span class="stat-val">${formatIDR(resConservative.weightedArr)}</span>
        <span class="stat-label">RevPAR Tahunan:</span>
        <span class="stat-val">${formatIDR(resConservative.weightedRevpar)}</span>
        <span class="stat-label">Deviasi vs Realistis:</span>
        <span class="stat-val" style="color: #b91c1c;">
          ${formatPercent((resConservative.totalRoomRevenue - resRealistic.totalRoomRevenue) / Math.max(1, resRealistic.totalRoomRevenue))}
        </span>
      </div>
    </div>

    <!-- Realistis -->
    <div class="scenario-card ${activeKey === 'realistic' ? 'active' : ''}">
      <div class="card-head">
        <span class="card-title">2. Skenario Realistis (Baseline)</span>
        <span class="card-badge ${activeKey === 'realistic' ? 'badge-active' : 'badge-alt'}">
          ${activeKey === 'realistic' ? '★ AKTIF DI PROYEKSI' : 'BASELINE'}
        </span>
      </div>
      <div class="card-revenue">${formatIDR(resRealistic.totalRoomRevenue)}</div>
      <div class="card-stats">
        <span class="stat-label">Rata-rata Okupansi:</span>
        <span class="stat-val">${formatPercent(resRealistic.weightedOcc)}</span>
        <span class="stat-label">Kamar Terjual (Thn):</span>
        <span class="stat-val">${resRealistic.totalSold.toLocaleString('id-ID')} Rms</span>
        <span class="stat-label">Rata-rata ARR (Net):</span>
        <span class="stat-val">${formatIDR(resRealistic.weightedArr)}</span>
        <span class="stat-label">RevPAR Tahunan:</span>
        <span class="stat-val">${formatIDR(resRealistic.weightedRevpar)}</span>
        <span class="stat-label">Baseline Index:</span>
        <span class="stat-val" style="color: #1e40af;">100.0% (Acuan)</span>
      </div>
    </div>

    <!-- Optimis -->
    <div class="scenario-card ${activeKey === 'optimistic' ? 'active' : ''}">
      <div class="card-head">
        <span class="card-title">3. Skenario Optimis (Bull Case)</span>
        <span class="card-badge ${activeKey === 'optimistic' ? 'badge-active' : 'badge-alt'}">
          ${activeKey === 'optimistic' ? '★ AKTIF DI PROYEKSI' : 'ALTERNATIF'}
        </span>
      </div>
      <div class="card-revenue">${formatIDR(resOptimistic.totalRoomRevenue)}</div>
      <div class="card-stats">
        <span class="stat-label">Rata-rata Okupansi:</span>
        <span class="stat-val">${formatPercent(resOptimistic.weightedOcc)}</span>
        <span class="stat-label">Kamar Terjual (Thn):</span>
        <span class="stat-val">${resOptimistic.totalSold.toLocaleString('id-ID')} Rms</span>
        <span class="stat-label">Rata-rata ARR (Net):</span>
        <span class="stat-val">${formatIDR(resOptimistic.weightedArr)}</span>
        <span class="stat-label">RevPAR Tahunan:</span>
        <span class="stat-val">${formatIDR(resOptimistic.weightedRevpar)}</span>
        <span class="stat-label">Potensi Kenaikan:</span>
        <span class="stat-val" style="color: #15803d;">
          +${formatPercent((resOptimistic.totalRoomRevenue - resRealistic.totalRoomRevenue) / Math.max(1, resRealistic.totalRoomRevenue))}
        </span>
      </div>
    </div>
  </div>

  <!-- Detailed 12-Month Table for Active Scenario -->
  <div class="section-title">
    <span>2. Rincian Target Bulanan 12-Bulan (Skenario: ${scenarioTitles[activeKey]})</span>
  </div>
  <table class="data-table">
    <thead>
      <tr>
        <th class="text-left" style="width: 14%;">Bulan</th>
        <th style="width: 10%;">Hari / Bln</th>
        <th style="width: 14%;">Rooms Available</th>
        <th style="width: 14%;">Rooms Sold</th>
        <th style="width: 14%;">Occupancy (%)</th>
        <th style="width: 16%;">ARR (Net IDR)</th>
        <th style="width: 14%;">RevPAR</th>
        <th style="width: 18%;">Room Revenue (IDR)</th>
      </tr>
    </thead>
    <tbody>
      ${activeRes.monthlyDetails.map((m) => `
        <tr>
          <td class="text-left" style="font-weight: 700;">${m.month}</td>
          <td>${m.days}</td>
          <td>${m.roomsAvailable.toLocaleString('id-ID')}</td>
          <td style="font-weight: 600;">${m.roomsSold.toLocaleString('id-ID')}</td>
          <td style="font-weight: 700; color: #1e40af;">${m.occ.toFixed(1)}%</td>
          <td style="font-family: monospace;">${formatIDR(m.arr)}</td>
          <td style="font-family: monospace; color: #475569;">${formatIDR(m.revpar)}</td>
          <td style="font-weight: 800; font-family: monospace; color: #0f172a;">${formatIDR(m.roomRev)}</td>
        </tr>
      `).join('')}
      <tr class="total-row">
        <td class="text-left">TOTAL / RATA-RATA</td>
        <td>365</td>
        <td>${activeRes.totalAvailable.toLocaleString('id-ID')}</td>
        <td>${activeRes.totalSold.toLocaleString('id-ID')}</td>
        <td>${formatPercent(activeRes.weightedOcc)}</td>
        <td>${formatIDR(activeRes.weightedArr)}</td>
        <td>${formatIDR(activeRes.weightedRevpar)}</td>
        <td style="font-size: 11px; color: #facc15;">${formatIDR(activeRes.totalRoomRevenue)}</td>
      </tr>
    </tbody>
  </table>

  <!-- Signatures -->
  <div class="signatures">
    <div class="sig-box">
      <div>Disiapkan Oleh:</div>
      <div class="sig-space"></div>
      <div style="font-weight: 800; color: #0f172a;">Revenue Manager / Yield Specialist</div>
      <div style="font-size: 8px; color: #64748b;">Theloka Asset Management • ${printDate}</div>
    </div>
    <div class="sig-box">
      <div>Ditinjau & Divalidasi:</div>
      <div class="sig-space"></div>
      <div style="font-weight: 800; color: #0f172a;">General Manager / Financial Controller</div>
      <div style="font-size: 8px; color: #64748b;">Standar Anggaran Operasional • ${printDate}</div>
    </div>
    <div class="sig-box">
      <div>Disetujui Oleh:</div>
      <div class="sig-space"></div>
      <div style="font-weight: 800; color: #0f172a;">Owner / Direksi Properti (${basicInput.name})</div>
      <div style="font-size: 8px; color: #64748b;">Otorisasi Target Revenue Multi-Skenario</div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div>THELOKA PRO HOSPITALITY SYSTEM • Multi-Scenario Revenue Management & USALI Analytics</div>
    <div>Dicetak pada: ${new Date().toLocaleString('id-ID')} • Laporan Resmi Eksekutif</div>
  </div>
</body>
</html>
  `;

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (doc) {
    doc.open();
    doc.write(html);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        console.error("Print error, falling back to window.print():", e);
        window.print();
      }
      setTimeout(() => {
        try {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        } catch (_) {}
      }, 3000);
    }, 400);
  } else {
    window.print();
  }
};
