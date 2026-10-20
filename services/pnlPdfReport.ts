import { DEPARTMENT_LABELS } from './exportCsv';

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

export interface PnLReportData {
  basicInput: any;
  projectedData: any;
  dateStr?: string;
}

export const generateAndPrintPnLPdf = ({
  basicInput,
  projectedData,
  dateStr
}: PnLReportData) => {
  if (!projectedData) return;

  const { revenue, depts } = projectedData;
  const deptValues = Object.values(depts) as any[];
  const totalPayroll = deptValues.reduce((a: number, b: any) => a + (b.payroll as number), 0);
  const totalExpense = deptValues.reduce((a: number, b: any) => a + (b.totalExpense as number), 0);
  const totalOpex = totalPayroll + totalExpense;
  const gop = revenue.total - totalOpex;
  const gopMargin = revenue.total > 0 ? (gop / revenue.total) : 0;

  const fee = basicInput.feeModel === '15_percent'
    ? revenue.total * (basicInput.customFee.revPct / 100)
    : (revenue.total * (basicInput.customFee.baseRevPct / 100)) + (Math.max(0, gop) * (basicInput.customFee.gopPct / 100));
  const nop = gop - fee;
  const nopMargin = revenue.total > 0 ? (nop / revenue.total) : 0;

  const fixedChargesList = basicInput.fixedCharges || [];
  const activeFixedCharges = fixedChargesList.filter((fc: any) => fc.active);
  const totalFixedChargesAnnual = activeFixedCharges.reduce(
    (acc: number, fc: any) => acc + ((Number(fc.monthlyAmount) || 0) * 12),
    0
  );

  const netCashFlow = nop - totalFixedChargesAnnual;
  const netMargin = revenue.total > 0 ? (netCashFlow / revenue.total) : 0;

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
  <title>P&L Proyeksi Konsolidasi - ${basicInput.name}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 14mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background-color: #fff;
      margin: 0;
      padding: 0;
      font-size: 11px;
      line-height: 1.4;
    }
    .header {
      border-bottom: 2px solid #1e3a8a;
      padding-bottom: 12px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .brand-title {
      font-size: 20px;
      font-weight: 800;
      color: #1e3a8a;
      letter-spacing: -0.5px;
      margin: 0 0 2px 0;
    }
    .report-title {
      font-size: 13px;
      font-weight: 700;
      color: #334155;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 4px 0;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      font-size: 9px;
      font-weight: 700;
      background-color: #e0e7ff;
      color: #3730a3;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .meta-box {
      text-align: right;
      font-size: 10px;
      color: #64748b;
    }
    .meta-box strong {
      color: #0f172a;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 16px;
    }
    .kpi-card {
      border: 1px solid #e2e8f0;
      background-color: #f8fafc;
      padding: 8px 10px;
      border-radius: 6px;
    }
    .kpi-card.highlight {
      background-color: #eff6ff;
      border-color: #bfdbfe;
    }
    .kpi-card.dark {
      background-color: #0f172a;
      border-color: #0f172a;
      color: #fff;
    }
    .kpi-label {
      font-size: 9px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .kpi-card.dark .kpi-label {
      color: #94a3b8;
    }
    .kpi-val {
      font-size: 13px;
      font-weight: 800;
      font-family: monospace;
      color: #0f172a;
    }
    .kpi-card.highlight .kpi-val {
      color: #1e3a8a;
    }
    .kpi-card.dark .kpi-val {
      color: #34d399;
    }
    .kpi-sub {
      font-size: 8.5px;
      color: #64748b;
      margin-top: 2px;
    }
    .kpi-card.dark .kpi-sub {
      color: #cbd5e1;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
    }
    th, td {
      padding: 5px 8px;
      font-size: 10px;
    }
    th {
      background-color: #f1f5f9;
      color: #475569;
      font-weight: 700;
      text-transform: uppercase;
      border-bottom: 1.5px solid #cbd5e1;
    }
    td {
      border-bottom: 1px solid #f1f5f9;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-mono { font-family: monospace; }
    .font-bold { font-weight: 700; }
    .row-major {
      background-color: #f8fafc;
      font-weight: 700;
    }
    .row-gop {
      background-color: #eff6ff;
      font-weight: 800;
      color: #1e3a8a;
      border-top: 1.5px solid #bfdbfe;
      border-bottom: 1.5px solid #bfdbfe;
    }
    .row-nop {
      background-color: #f1f5f9;
      font-weight: 700;
      border-top: 1px solid #cbd5e1;
      border-bottom: 1px solid #cbd5e1;
    }
    .row-net {
      background-color: #0f172a;
      color: #fff;
      font-weight: 800;
      font-size: 11px;
    }
    .row-net td {
      border: none;
      padding: 8px;
    }
    .section-title {
      font-size: 10.5px;
      font-weight: 800;
      color: #1e3a8a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 12px 0 6px 0;
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 3px;
    }
    .signatures {
      margin-top: 24px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      page-break-inside: avoid;
    }
    .sig-box {
      border-top: 1px solid #94a3b8;
      padding-top: 6px;
      text-align: center;
      font-size: 9.5px;
      color: #475569;
    }
    .sig-space {
      height: 48px;
    }
    .footer {
      margin-top: 16px;
      border-top: 1px solid #e2e8f0;
      padding-top: 6px;
      font-size: 8.5px;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }
    @media print {
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div>
      <h1 class="brand-title">THELOKA PRO</h1>
      <div class="report-title">Laporan Proyeksi Konsolidasi Laba Rugi (P&L)</div>
      <div class="badge">Standar USALI Hotel • Proyeksi Tahun Pertama (Year 1)</div>
    </div>
    <div class="meta-box">
      <div>Properti: <strong>${basicInput.name}</strong></div>
      <div>Lokasi: ${basicInput.address || basicInput.location}</div>
      <div>Kapasitas: <strong>${basicInput.rooms} Kamar</strong> • Tipe: ${basicInput.type}</div>
      <div>Target ADR: <strong>${formatIDR(basicInput.adr)}</strong> • Okupansi: <strong>${basicInput.targetOcc}%</strong></div>
      <div>Tanggal Cetak: ${printDate}</div>
    </div>
  </div>

  <!-- KPI Executive Summary -->
  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">Total Pendapatan</div>
      <div class="kpi-val">${formatIDR(revenue.total)}</div>
      <div class="kpi-sub">Topline Revenue (Rooms, F&B, Lainnya)</div>
    </div>
    <div class="kpi-card highlight">
      <div class="kpi-label">Gross Operating Profit (GOP)</div>
      <div class="kpi-val">${formatIDR(gop)}</div>
      <div class="kpi-sub">Margin: ${formatPercent(gopMargin)} dari Revenue</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Beban Tetap Non-Operasional</div>
      <div class="kpi-val">(${formatIDR(totalFixedChargesAnnual)})</div>
      <div class="kpi-sub">Sewa, Cicilan Bank, Asuransi, PBB</div>
    </div>
    <div class="kpi-card dark">
      <div class="kpi-label">Net Cash Flow Pemilik</div>
      <div class="kpi-val" style="color: #34d399;">${formatIDR(netCashFlow)}</div>
      <div class="kpi-sub">EBITDA Bersih Pemilik (${formatPercent(netMargin)})</div>
    </div>
  </div>

  <!-- USALI Statement -->
  <div class="section-title">
    <span>1. Rincian Laporan Laba Rugi Konsolidasi (USALI Summary)</span>
    <span>Mata Uang: IDR (Rupiah)</span>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 50%;">Pos Finansial (Line Items)</th>
        <th class="text-right" style="width: 25%;">Jumlah Tahunan (Rp)</th>
        <th class="text-right" style="width: 25%;">Rasio (% Revenue)</th>
      </tr>
    </thead>
    <tbody>
      <!-- REVENUE -->
      <tr class="row-major">
        <td colspan="3">A. PENDAPATAN OPERASIONAL HOTEL (OPERATING REVENUE)</td>
      </tr>
      <tr>
        <td style="padding-left: 16px;">• Pendapatan Kamar (Room Revenue)</td>
        <td class="text-right font-mono">${formatIDR(revenue.room)}</td>
        <td class="text-right font-mono">${formatPercent(revenue.total > 0 ? revenue.room / revenue.total : 0)}</td>
      </tr>
      <tr>
        <td style="padding-left: 16px;">• Pendapatan Makanan & Minuman (F&B Revenue)</td>
        <td class="text-right font-mono">${basicInput.hasRestaurant ? formatIDR(revenue.fb) : 'Rp 0 (Non-Aktif)'}</td>
        <td class="text-right font-mono">${basicInput.hasRestaurant ? formatPercent(revenue.total > 0 ? revenue.fb / revenue.total : 0) : '0.0%'}</td>
      </tr>
      <tr>
        <td style="padding-left: 16px;">• Pendapatan Departemen Lainnya (Laundry, Spa, dll)</td>
        <td class="text-right font-mono">${formatIDR(revenue.other)}</td>
        <td class="text-right font-mono">${formatPercent(revenue.total > 0 ? revenue.other / revenue.total : 0)}</td>
      </tr>
      <tr class="row-major" style="background-color: #f1f5f9;">
        <td>TOTAL PENDAPATAN OPERASIONAL KOTOR (TOPLINE)</td>
        <td class="text-right font-mono font-bold">${formatIDR(revenue.total)}</td>
        <td class="text-right font-mono font-bold">100.0%</td>
      </tr>

      <!-- OPERATING EXPENSES -->
      <tr class="row-major">
        <td colspan="3" style="padding-top: 8px;">B. BEBAN OPERASIONAL HOTEL (OPERATING EXPENSES)</td>
      </tr>
      <tr>
        <td style="padding-left: 16px;">• Total Gaji, Upah & Tunjangan Karyawan (Payroll & Benefits)</td>
        <td class="text-right font-mono" style="color: #dc2626;">(${formatIDR(totalPayroll)})</td>
        <td class="text-right font-mono">${formatPercent(revenue.total > 0 ? totalPayroll / revenue.total : 0)}</td>
      </tr>
      <tr>
        <td style="padding-left: 16px;">• Total Biaya Operasional Departemen (Departmental OPEX)</td>
        <td class="text-right font-mono" style="color: #dc2626;">(${formatIDR(totalExpense)})</td>
        <td class="text-right font-mono">${formatPercent(revenue.total > 0 ? totalExpense / revenue.total : 0)}</td>
      </tr>
      <tr class="row-major" style="background-color: #f1f5f9;">
        <td>TOTAL BEBAN OPERASIONAL (TOTAL OPEX)</td>
        <td class="text-right font-mono font-bold" style="color: #dc2626;">(${formatIDR(totalOpex)})</td>
        <td class="text-right font-mono font-bold">${formatPercent(revenue.total > 0 ? totalOpex / revenue.total : 0)}</td>
      </tr>

      <!-- GOP -->
      <tr class="row-gop">
        <td>GROSS OPERATING PROFIT (GOP)</td>
        <td class="text-right font-mono font-bold">${formatIDR(gop)}</td>
        <td class="text-right font-mono font-bold">${formatPercent(gopMargin)}</td>
      </tr>

      <!-- MANAGEMENT FEE -->
      <tr>
        <td style="padding-left: 16px;">• Operator Management Fee (${basicInput.feeModel.replace('_', ' ')})</td>
        <td class="text-right font-mono" style="color: #4f46e5;">(${formatIDR(fee)})</td>
        <td class="text-right font-mono">${formatPercent(revenue.total > 0 ? fee / revenue.total : 0)}</td>
      </tr>

      <!-- NOP -->
      <tr class="row-nop">
        <td>NET OPERATING PROFIT (NOP / GOP SETELAH FEE OPERATOR)</td>
        <td class="text-right font-mono font-bold">${formatIDR(nop)}</td>
        <td class="text-right font-mono font-bold">${formatPercent(nopMargin)}</td>
      </tr>

      <!-- NON-OPERATING CHARGES -->
      <tr class="row-major">
        <td colspan="3" style="padding-top: 8px;">C. BEBAN TETAP NON-OPERASIONAL PEMILIK (NON-OPERATING CHARGES)</td>
      </tr>
      ${activeFixedCharges.length === 0 ? `
        <tr>
          <td style="padding-left: 16px; color: #94a3b8; font-style: italic;">Tidak ada biaya tetap non-operasional aktif</td>
          <td class="text-right font-mono">Rp 0</td>
          <td class="text-right font-mono">0.0%</td>
        </tr>
      ` : activeFixedCharges.map((fc: any) => {
        const val = (Number(fc.monthlyAmount) || 0) * 12;
        return `
          <tr>
            <td style="padding-left: 16px;">• ${fc.name} <span style="font-size: 8.5px; color: #64748b;">(${formatIDR(fc.monthlyAmount)}/bln)</span></td>
            <td class="text-right font-mono" style="color: #b91c1c;">(${formatIDR(val)})</td>
            <td class="text-right font-mono">${formatPercent(revenue.total > 0 ? val / revenue.total : 0)}</td>
          </tr>
        `;
      }).join('')}
      <tr class="row-major" style="background-color: #fef2f2;">
        <td>TOTAL BEBAN TETAP NON-OPERASIONAL (SEWA, PINJAMAN, DLL)</td>
        <td class="text-right font-mono font-bold" style="color: #b91c1c;">(${formatIDR(totalFixedChargesAnnual)})</td>
        <td class="text-right font-mono font-bold">${formatPercent(revenue.total > 0 ? totalFixedChargesAnnual / revenue.total : 0)}</td>
      </tr>

      <!-- NET CASH FLOW -->
      <tr class="row-net">
        <td>NET CASH FLOW TO OWNER / EBITDA (LABA BERSIH AKHIR PEMILIK)</td>
        <td class="text-right font-mono font-bold" style="color: #34d399;">${formatIDR(netCashFlow)}</td>
        <td class="text-right font-mono font-bold" style="color: #34d399;">${formatPercent(netMargin)}</td>
      </tr>
    </tbody>
  </table>

  <!-- Departmental OPEX Breakdown -->
  <div class="section-title">
    <span>2. Rekapitulasi Beban Departemen (Departmental OPEX & Payroll Breakdown)</span>
  </div>

  <table>
    <thead>
      <tr>
        <th>Departemen</th>
        <th class="text-center">Staff</th>
        <th class="text-right">Payroll Bulanan</th>
        <th class="text-right">Payroll Tahunan</th>
        <th class="text-right">Biaya Operasional (Opex)</th>
        <th class="text-right">Total Beban</th>
      </tr>
    </thead>
    <tbody>
      ${Object.entries(depts).map(([code, dept]: [string, any]) => {
        const staffCount = dept.roles.reduce((sum: number, r: any) => sum + (Number(r.count) || 0), 0);
        const monthlyPayroll = dept.payroll / 12;
        const totalDeptCost = Number(dept.payroll) + Number(dept.totalExpense);
        const label = (DEPARTMENT_LABELS as any)[code] || code.toUpperCase();
        return `
          <tr>
            <td class="font-bold">${label}</td>
            <td class="text-center">${staffCount} org</td>
            <td class="text-right font-mono">${formatIDR(monthlyPayroll)}</td>
            <td class="text-right font-mono">${formatIDR(dept.payroll)}</td>
            <td class="text-right font-mono">${formatIDR(dept.totalExpense)}</td>
            <td class="text-right font-mono font-bold">${formatIDR(totalDeptCost)}</td>
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>

  <!-- Signatures -->
  <div class="signatures">
    <div class="sig-box">
      <div>Disiapkan & Divalidasi Oleh:</div>
      <div class="sig-space"></div>
      <div style="font-weight: 700; color: #0f172a;">Financial Controller / Theloka Asset Manager</div>
      <div style="font-size: 8.5px;">Tanggal: ${printDate}</div>
    </div>
    <div class="sig-box">
      <div>Disetujui Oleh:</div>
      <div class="sig-space"></div>
      <div style="font-weight: 700; color: #0f172a;">Owner / Direksi Properti (${basicInput.name})</div>
      <div style="font-size: 8.5px;">Tanggal: ${printDate}</div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div>THELOKA PRO HOSPITALITY SYSTEM • Standar USALI Perhotelan Indonesia</div>
    <div>Dicetak pada: ${new Date().toLocaleString('id-ID')} • Halaman 1 dari 1</div>
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
