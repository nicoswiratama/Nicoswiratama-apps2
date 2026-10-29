import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DEPARTMENT_LABELS } from './exportCsv';

const formatIDR = (amount: number) => {
  if (isNaN(amount) || amount === null || amount === undefined) return "Rp 0";
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatPercent = (val: number) => {
  if (isNaN(val) || val === null || val === undefined) return "0.0%";
  return `${(val * 100).toFixed(1)}%`;
};

export interface PnLReportData {
  basicInput: any;
  projectedData: any;
  dateStr?: string;
}

export const generateAndPrintPnLPdf = ({
  basicInput,
  projectedData,
  dateStr
}: PnLReportData): string => {
  if (!projectedData) {
    throw new Error("Data proyeksi P&L tidak tersedia.");
  }

  const { revenue, depts } = projectedData;
  const deptValues = Object.values(depts || {}) as any[];
  const totalPayroll = deptValues.reduce((a: number, b: any) => a + (Number(b.payroll) || 0), 0);
  const totalExpense = deptValues.reduce((a: number, b: any) => a + (Number(b.totalExpense) || 0), 0);
  const totalOpex = totalPayroll + totalExpense;
  const totalRev = Number(revenue?.total) || 0;
  const gop = totalRev - totalOpex;
  const gopMargin = totalRev > 0 ? (gop / totalRev) : 0;

  const fee = basicInput.feeModel === '15_percent'
    ? totalRev * ((basicInput.customFee?.revPct || 15) / 100)
    : (totalRev * ((basicInput.customFee?.baseRevPct || 10) / 100)) + (Math.max(0, gop) * ((basicInput.customFee?.gopPct || 5) / 100));
  const nop = gop - fee;
  const nopMargin = totalRev > 0 ? (nop / totalRev) : 0;

  const fixedChargesList = basicInput.fixedCharges || [];
  const activeFixedCharges = fixedChargesList.filter((fc: any) => fc.active);
  const totalFixedChargesAnnual = activeFixedCharges.reduce(
    (acc: number, fc: any) => acc + ((Number(fc.monthlyAmount) || 0) * 12),
    0
  );

  const netCashFlow = nop - totalFixedChargesAnnual;
  const netMargin = totalRev > 0 ? (netCashFlow / totalRev) : 0;

  const printDate = dateStr || new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Initialize jsPDF A4 Portrait (210 x 297 mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;

  // 1. BRAND HEADER BAR (Deep Navy gradient style)
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Accent Line
  doc.setFillColor(37, 99, 235); // blue-600
  doc.rect(0, 27, pageWidth, 1.5, 'F');

  // Brand Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('THELOKA PRO', marginX, 12);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('HOSPITALITY ASSET MANAGEMENT & USALI ANALYTICS', marginX, 17);

  // Document Title on Right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('LAPORAN PROYEKSI KONSOLIDASI (P&L)', pageWidth - marginX, 12, { align: 'right' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(147, 197, 253); // blue-300
  doc.text('STANDAR USALI HOTEL • TAHUN PERTAMA (YEAR 1)', pageWidth - marginX, 17, { align: 'right' });

  // Date Generated
  doc.setTextColor(203, 213, 225); // slate-300
  doc.setFontSize(7.5);
  doc.text(`Dicetak: ${printDate}`, pageWidth - marginX, 22, { align: 'right' });

  let currentY = 34;

  // 2. PROPERTY SUMMARY BADGE / CARD
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(marginX, currentY, pageWidth - (marginX * 2), 17, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(basicInput.name || 'Properti Tanpa Nama', marginX + 4, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const locationText = `${basicInput.location || '-'} ${basicInput.address ? '• ' + basicInput.address : ''}`;
  doc.text(locationText.length > 55 ? locationText.slice(0, 55) + '...' : locationText, marginX + 4, currentY + 11.5);

  // Property Details on Right side of card
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Kapasitas: ${basicInput.rooms || 0} Kamar (${basicInput.type || 'Hotel'})`, pageWidth - marginX - 4, currentY + 5.5, { align: 'right' });
  doc.text(`Target ADR: ${formatIDR(basicInput.adr)} • Target Okupansi: ${basicInput.targetOcc}%`, pageWidth - marginX - 4, currentY + 10, { align: 'right' });
  doc.text(`F&B Outlet: ${basicInput.hasRestaurant ? 'Aktif (' + (basicInput.fbRatio || 0) + '% dari Rooms)' : 'Non-Aktif (Room-Only)'}`, pageWidth - marginX - 4, currentY + 14, { align: 'right' });

  currentY += 21;

  // 3. EXECUTIVE KPI CARDS (4 Columns)
  const cardWidth = (pageWidth - (marginX * 2) - 9) / 4;
  const cardHeight = 18;

  const kpis = [
    {
      title: 'TOTAL PENDAPATAN',
      val: formatIDR(totalRev),
      sub: 'Topline Revenue',
      bgColor: [241, 245, 249],
      textColor: [15, 23, 42],
      accentColor: [71, 85, 105]
    },
    {
      title: 'TOTAL BEBAN OPEX',
      val: `(${formatIDR(totalOpex)})`,
      sub: `Rasio: ${formatPercent(totalRev > 0 ? totalOpex / totalRev : 0)}`,
      bgColor: [254, 242, 242],
      textColor: [185, 28, 28],
      accentColor: [220, 38, 38]
    },
    {
      title: 'GROSS OPERATING PROFIT',
      val: formatIDR(gop),
      sub: `GOP Margin: ${formatPercent(gopMargin)}`,
      bgColor: [239, 246, 255],
      textColor: [30, 58, 138],
      accentColor: [37, 99, 235]
    },
    {
      title: 'NET CASH FLOW PEMILIK',
      val: formatIDR(netCashFlow),
      sub: `Net Margin: ${formatPercent(netMargin)}`,
      bgColor: [15, 23, 42],
      textColor: [52, 211, 153], // emerald-400
      accentColor: [16, 185, 129]
    }
  ];

  kpis.forEach((kpi, idx) => {
    const cardX = marginX + (idx * (cardWidth + 3));
    doc.setFillColor(kpi.bgColor[0], kpi.bgColor[1], kpi.bgColor[2]);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(idx === 3 ? 148 : 100, idx === 3 ? 163 : 116, idx === 3 ? 184 : 139);
    doc.text(kpi.title, cardX + 2.5, currentY + 4.5);

    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(kpi.textColor[0], kpi.textColor[1], kpi.textColor[2]);
    doc.text(kpi.val, cardX + 2.5, currentY + 10.5);

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(idx === 3 ? 203 : 100, idx === 3 ? 213 : 116, idx === 3 ? 225 : 139);
    doc.text(kpi.sub, cardX + 2.5, currentY + 15);
  });

  currentY += cardHeight + 5;

  // 4. USALI CONSOLIDATED TABLE
  const tableRows: any[] = [
    // Operating Revenue Section
    [
      { content: 'A. PENDAPATAN OPERASIONAL HOTEL (OPERATING REVENUE)', colSpan: 3, styles: { fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [30, 58, 138] } }
    ],
    ['    • Pendapatan Kamar (Room Revenue)', formatIDR(revenue?.room || 0), formatPercent(totalRev > 0 ? (revenue?.room || 0) / totalRev : 0)],
    ['    • Pendapatan Makanan & Minuman (F&B)', basicInput.hasRestaurant ? formatIDR(revenue?.fb || 0) : 'Rp 0 (Non-Aktif)', basicInput.hasRestaurant ? formatPercent(totalRev > 0 ? (revenue?.fb || 0) / totalRev : 0) : '0.0%'],
    ['    • Pendapatan Lain-lain (Other Income Streams)', formatIDR(revenue?.other || 0), formatPercent(totalRev > 0 ? (revenue?.other || 0) / totalRev : 0)],
    [
      { content: 'TOTAL PENDAPATAN OPERASIONAL KOTOR (TOPLINE)', styles: { fontStyle: 'bold' } },
      { content: formatIDR(totalRev), styles: { fontStyle: 'bold', halign: 'right' } },
      { content: '100.0%', styles: { fontStyle: 'bold', halign: 'right' } }
    ],

    // Operating Expenses Section
    [
      { content: 'B. BEBAN OPERASIONAL HOTEL (OPERATING EXPENSES)', colSpan: 3, styles: { fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [185, 28, 28] } }
    ],
    ['    • Total Payroll, Upah & Tunjangan Karyawan', `(${formatIDR(totalPayroll)})`, formatPercent(totalRev > 0 ? totalPayroll / totalRev : 0)],
    ['    • Total Biaya Operasional Departemen (Opex)', `(${formatIDR(totalExpense)})`, formatPercent(totalRev > 0 ? totalExpense / totalRev : 0)],
    [
      { content: 'TOTAL BEBAN OPERASIONAL (TOTAL OPEX)', styles: { fontStyle: 'bold', textColor: [185, 28, 28] } },
      { content: `(${formatIDR(totalOpex)})`, styles: { fontStyle: 'bold', halign: 'right', textColor: [185, 28, 28] } },
      { content: formatPercent(totalRev > 0 ? totalOpex / totalRev : 0), styles: { fontStyle: 'bold', halign: 'right' } }
    ],

    // GOP
    [
      { content: 'GROSS OPERATING PROFIT (GOP)', styles: { fontStyle: 'bold', fillColor: [239, 246, 255], textColor: [30, 58, 138] } },
      { content: formatIDR(gop), styles: { fontStyle: 'bold', halign: 'right', fillColor: [239, 246, 255], textColor: [30, 58, 138] } },
      { content: formatPercent(gopMargin), styles: { fontStyle: 'bold', halign: 'right', fillColor: [239, 246, 255], textColor: [30, 58, 138] } }
    ],

    // Management Fee
    [
      { content: `• Operator Management Fee (${basicInput.feeModel === '15_percent' ? 'Rev Share' : 'Split Base+Incentive'})`, styles: { textColor: [79, 70, 229] } },
      { content: `(${formatIDR(fee)})`, styles: { halign: 'right', textColor: [79, 70, 229] } },
      { content: formatPercent(totalRev > 0 ? fee / totalRev : 0), styles: { halign: 'right' } }
    ],

    // NOP
    [
      { content: 'NET OPERATING PROFIT (NOP / GOP SETELAH FEE)', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
      { content: formatIDR(nop), styles: { fontStyle: 'bold', halign: 'right', fillColor: [248, 250, 252] } },
      { content: formatPercent(nopMargin), styles: { fontStyle: 'bold', halign: 'right', fillColor: [248, 250, 252] } }
    ],

    // Fixed Charges
    [
      { content: 'C. BEBAN TETAP NON-OPERASIONAL PEMILIK (NON-OPERATING CHARGES)', colSpan: 3, styles: { fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [185, 28, 28] } }
    ]
  ];

  if (activeFixedCharges.length === 0) {
    tableRows.push([
      '    • Tidak ada beban sewa, pinjaman atau fixed charges aktif',
      'Rp 0',
      '0.0%'
    ]);
  } else {
    activeFixedCharges.forEach((fc: any) => {
      const annualVal = (Number(fc.monthlyAmount) || 0) * 12;
      tableRows.push([
        `    • ${fc.name} (${formatIDR(fc.monthlyAmount)} / bln)`,
        `(${formatIDR(annualVal)})`,
        formatPercent(totalRev > 0 ? annualVal / totalRev : 0)
      ]);
    });
  }

  tableRows.push([
    { content: 'TOTAL BEBAN TETAP NON-OPERASIONAL (BELOW GOP)', styles: { fontStyle: 'bold', textColor: [185, 28, 28] } },
    { content: `(${formatIDR(totalFixedChargesAnnual)})`, styles: { fontStyle: 'bold', halign: 'right', textColor: [185, 28, 28] } },
    { content: formatPercent(totalRev > 0 ? totalFixedChargesAnnual / totalRev : 0), styles: { fontStyle: 'bold', halign: 'right' } }
  ]);

  // Net Cash Flow to Owner
  tableRows.push([
    { content: 'NET CASH FLOW TO OWNER / EBITDA (LABA BERSIH AKHIR PEMILIK)', styles: { fontStyle: 'bold', fillColor: [15, 23, 42], textColor: [52, 211, 153] } },
    { content: formatIDR(netCashFlow), styles: { fontStyle: 'bold', halign: 'right', fillColor: [15, 23, 42], textColor: [52, 211, 153] } },
    { content: formatPercent(netMargin), styles: { fontStyle: 'bold', halign: 'right', fillColor: [15, 23, 42], textColor: [52, 211, 153] } }
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Pos Finansial USALI Hotel (Line Items)', 'Jumlah Tahunan (Rp)', 'Rasio (% Revenue)']],
    body: tableRows,
    theme: 'plain',
    styles: {
      fontSize: 7.5,
      cellPadding: 1.8,
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
      textColor: [15, 23, 42],
    },
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 2.2,
    },
    columnStyles: {
      0: { cellWidth: 105 },
      1: { cellWidth: 47, halign: 'right', font: 'courier' },
      2: { cellWidth: 30, halign: 'right', font: 'courier' },
    },
    margin: { left: marginX, right: marginX },
  });

  currentY = (doc as any).lastAutoTable.finalY + 5;

  // 5. DEPARTMENTAL OPEX & PAYROLL BREAKDOWN TABLE
  const deptRows = Object.entries(depts || {}).map(([code, dept]: [string, any]) => {
    const staffCount = (dept.roles || []).reduce((sum: number, r: any) => sum + (Number(r.count) || 0), 0);
    const monthlyPayroll = (Number(dept.payroll) || 0) / 12;
    const totalDeptCost = (Number(dept.payroll) || 0) + (Number(dept.totalExpense) || 0);
    const label = (DEPARTMENT_LABELS as any)[code] || code.toUpperCase();
    return [
      label,
      `${staffCount} staf`,
      formatIDR(monthlyPayroll),
      formatIDR(dept.payroll),
      formatIDR(dept.totalExpense),
      formatIDR(totalDeptCost),
      formatPercent(totalRev > 0 ? totalDeptCost / totalRev : 0)
    ];
  });

  // Check if we need page break before Department table
  if (currentY > 215) {
    doc.addPage();
    currentY = 16;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 58, 138);
  doc.text('2. REKAPITULASI BIAYA DEPARTEMEN & PAYROLL (DEPARTMENTAL USALI)', marginX, currentY);
  currentY += 2;

  autoTable(doc, {
    startY: currentY,
    head: [['Departemen', 'Tenaga Kerja', 'Payroll/Bln', 'Payroll/Thn', 'Opex/Thn', 'Total Beban', '% Rev']],
    body: deptRows,
    theme: 'striped',
    styles: {
      fontSize: 7,
      cellPadding: 1.6,
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [51, 65, 85], // slate-700
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 42, fontStyle: 'bold' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 28, halign: 'right', font: 'courier' },
      3: { cellWidth: 28, halign: 'right', font: 'courier' },
      4: { cellWidth: 28, halign: 'right', font: 'courier' },
      5: { cellWidth: 26, halign: 'right', font: 'courier', fontStyle: 'bold' },
      6: { cellWidth: 10, halign: 'right', font: 'courier' },
    },
    margin: { left: marginX, right: marginX },
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // 6. SIGNATURE SECTION
  if (currentY > pageHeight - 40) {
    doc.addPage();
    currentY = 20;
  }

  const sigBoxWidth = (pageWidth - (marginX * 2) - 20) / 2;

  // Signer 1
  doc.setDrawColor(203, 213, 225);
  doc.line(marginX, currentY + 16, marginX + sigBoxWidth, currentY + 16);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Disiapkan & Divalidasi Oleh:', marginX, currentY + 3);
  doc.text('Financial Controller / Theloka Asset Manager', marginX, currentY + 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Tanggal Otorisasi: ${printDate}`, marginX, currentY + 24);

  // Signer 2
  const sig2X = marginX + sigBoxWidth + 20;
  doc.setDrawColor(203, 213, 225);
  doc.line(sig2X, currentY + 16, sig2X + sigBoxWidth, currentY + 16);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Disetujui Oleh:', sig2X, currentY + 3);
  doc.text(`Owner / Direksi (${basicInput.name || 'Properti'})`, sig2X, currentY + 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Tanggal Persetujuan: ${printDate}`, sig2X, currentY + 24);

  // 7. FOOTER BAR ON ALL PAGES
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(marginX, pageHeight - 8, pageWidth - marginX, pageHeight - 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text('THELOKA PRO HOSPITALITY SYSTEM • Standar USALI Perhotelan Indonesia', marginX, pageHeight - 4.5);
    doc.text(`Halaman ${i} dari ${totalPages}`, pageWidth - marginX, pageHeight - 4.5, { align: 'right' });
  }

  // Trigger real direct download to client disk!
  const cleanName = (basicInput.name || 'Properti')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_');
  const fileName = `Theloka_PnL_Konsolidasi_${cleanName}_${new Date().getFullYear()}.pdf`;
  doc.save(fileName);

  return fileName;
};
