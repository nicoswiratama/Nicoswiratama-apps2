import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { RevenueScenarios, RevenueScenarioTarget } from '../types';

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

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
}: RevenuePdfReportData): string => {
  if (!revenueScenarios) {
    throw new Error("Data skenario revenue tidak tersedia.");
  }

  const rooms = Number(basicInput?.rooms) || 40;
  const activeKey = revenueScenarios.activeScenario || 'realistic';

  const resRealistic = calculateScenarioMetrics(rooms, revenueScenarios.realistic || []);
  const resConservative = calculateScenarioMetrics(rooms, revenueScenarios.conservative || []);
  const resOptimistic = calculateScenarioMetrics(rooms, revenueScenarios.optimistic || []);

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

  // Initialize jsPDF A4 Landscape (297 x 210 mm)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 12;

  // 1. BRAND HEADER BAR (Landscape)
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 24, 'F');

  // Blue Accent Stripe
  doc.setFillColor(37, 99, 235); // blue-600
  doc.rect(0, 23, pageWidth, 1.2, 'F');

  // Brand Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('THELOKA PRO', marginX, 10);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('STRATEGIC REVENUE MANAGEMENT & MULTI-SCENARIO (3-WAY) PROJECTION', marginX, 15);

  // Document Title on Right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('LAPORAN EKSEKUTIF REVENUE MANAGEMENT (3-WAY)', pageWidth - marginX, 10, { align: 'right' });

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(147, 197, 253);
  doc.text(`SKENARIO AKTIF: ${scenarioTitles[activeKey].toUpperCase()} • DICETAK: ${printDate}`, pageWidth - marginX, 15, { align: 'right' });

  let currentY = 28;

  // 2. PROPERTY BANNER
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, currentY, pageWidth - (marginX * 2), 11, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(basicInput?.name || 'Properti Hotel', marginX + 3.5, currentY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`${basicInput?.location || '-'} ${basicInput?.address ? '• ' + basicInput.address : ''} • ${rooms} Kamar (${rooms * 365} Kamar-Malam / Thn)`, marginX + 3.5, currentY + 8.5);

  // Right side of banner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 58, 138);
  doc.text(`Target Quick Setup: ${formatPercent((basicInput?.targetOcc || 0) / 100)} Okupansi • ADR: ${formatIDR(basicInput?.adr || 0)}`, pageWidth - marginX - 3.5, currentY + 4.5, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Sinkronisasi Proyeksi 2-Arah Terintegrasi ke USALI P&L Konsolidasi', pageWidth - marginX - 3.5, currentY + 8.5, { align: 'right' });

  currentY += 14;

  // 3. 3-WAY SCENARIO COMPARISON CARDS
  const cardWidth = (pageWidth - (marginX * 2) - 8) / 3;
  const cardHeight = 27;

  const scenariosMeta = [
    {
      key: 'conservative',
      name: '1. Skenario Konservatif (Bear Case)',
      res: resConservative,
      badgeText: activeKey === 'conservative' ? '★ SKENARIO AKTIF' : 'ALTERNATIF (BEAR)',
      devText: formatPercent((resConservative.totalRoomRevenue - resRealistic.totalRoomRevenue) / Math.max(1, resRealistic.totalRoomRevenue)),
      devLabel: 'Deviasi vs Realistis:',
      devColor: [185, 28, 28],
      isActive: activeKey === 'conservative',
    },
    {
      key: 'realistic',
      name: '2. Skenario Realistis (Baseline Case)',
      res: resRealistic,
      badgeText: activeKey === 'realistic' ? '★ SKENARIO AKTIF' : 'BASELINE (BASE)',
      devText: '100.0% (Acuan Proyeksi)',
      devLabel: 'Baseline Index:',
      devColor: [30, 58, 138],
      isActive: activeKey === 'realistic',
    },
    {
      key: 'optimistic',
      name: '3. Skenario Optimis (Bull Case)',
      res: resOptimistic,
      badgeText: activeKey === 'optimistic' ? '★ SKENARIO AKTIF' : 'ALTERNATIF (BULL)',
      devText: `+${formatPercent((resOptimistic.totalRoomRevenue - resRealistic.totalRoomRevenue) / Math.max(1, resRealistic.totalRoomRevenue))}`,
      devLabel: 'Potensi Kenaikan:',
      devColor: [21, 128, 61],
      isActive: activeKey === 'optimistic',
    }
  ];

  scenariosMeta.forEach((sc, idx) => {
    const cardX = marginX + (idx * (cardWidth + 4));

    if (sc.isActive) {
      doc.setFillColor(239, 246, 255); // blue-50
      doc.setDrawColor(37, 99, 235); // blue-600
    } else {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
    }
    doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

    // Title & Badge
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(sc.name, cardX + 3, currentY + 4.5);

    // Badge
    doc.setFontSize(6);
    if (sc.isActive) {
      doc.setFillColor(30, 58, 138);
      doc.setTextColor(255, 255, 255);
      doc.roundedRect(cardX + cardWidth - 25, currentY + 1.8, 22, 3.8, 1, 1, 'F');
      doc.text(sc.badgeText, cardX + cardWidth - 14, currentY + 4.3, { align: 'center' });
    } else {
      doc.setFillColor(226, 232, 240);
      doc.setTextColor(71, 85, 105);
      doc.roundedRect(cardX + cardWidth - 25, currentY + 1.8, 22, 3.8, 1, 1, 'F');
      doc.text(sc.badgeText, cardX + cardWidth - 14, currentY + 4.3, { align: 'center' });
    }

    // Revenue
    doc.setFont('courier', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(sc.isActive ? 30 : 15, sc.isActive ? 58 : 23, sc.isActive ? 138 : 42);
    doc.text(formatIDR(sc.res.totalRoomRevenue), cardX + 3, currentY + 10.5);

    // Grid of stats inside card
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);

    const leftColX = cardX + 3;
    const rightColX = cardX + (cardWidth / 2) + 2;

    doc.text(`Rata-rata Okupansi:`, leftColX, currentY + 15);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${formatPercent(sc.res.weightedOcc)}`, leftColX + 26, currentY + 15);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Kamar Terjual:`, rightColX, currentY + 15);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${sc.res.totalSold.toLocaleString('id-ID')} Rms`, rightColX + 22, currentY + 15);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Rata-rata ARR:`, leftColX, currentY + 19);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${formatIDR(sc.res.weightedArr)}`, leftColX + 26, currentY + 19);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`RevPAR Tahunan:`, rightColX, currentY + 19);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${formatIDR(sc.res.weightedRevpar)}`, rightColX + 22, currentY + 19);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(sc.devLabel, leftColX, currentY + 23.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(sc.devColor[0], sc.devColor[1], sc.devColor[2]);
    doc.text(sc.devText, leftColX + 26, currentY + 23.5);
  });

  currentY += cardHeight + 4;

  // 4. DETAILED 12-MONTH TABLE FOR ACTIVE SCENARIO
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`RINCIAN TARGET 12-BULAN — SKENARIO ${scenarioTitles[activeKey].toUpperCase()}`, marginX, currentY + 2);
  currentY += 4;

  const tableBody = activeRes.monthlyDetails.map((m) => [
    m.month,
    `${m.days} hr`,
    m.roomsAvailable.toLocaleString('id-ID'),
    m.roomsSold.toLocaleString('id-ID'),
    `${m.occ.toFixed(1)}%`,
    formatIDR(m.arr),
    formatIDR(m.revpar),
    formatIDR(m.roomRev)
  ]);

  tableBody.push([
    { content: 'TOTAL / RATA-RATA TAHUNAN', styles: { fontStyle: 'bold' } } as any,
    '365 hr',
    activeRes.totalAvailable.toLocaleString('id-ID'),
    activeRes.totalSold.toLocaleString('id-ID'),
    { content: formatPercent(activeRes.weightedOcc), styles: { fontStyle: 'bold' } } as any,
    { content: formatIDR(activeRes.weightedArr), styles: { fontStyle: 'bold' } } as any,
    { content: formatIDR(activeRes.weightedRevpar), styles: { fontStyle: 'bold' } } as any,
    { content: formatIDR(activeRes.totalRoomRevenue), styles: { fontStyle: 'bold', textColor: [250, 204, 21] } } as any
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Bulan', 'Hari/Bln', 'Rooms Avail', 'Rooms Sold', 'Okupansi (%)', 'ARR (Net IDR)', 'RevPAR (IDR)', 'Total Room Revenue (IDR)']],
    body: tableBody,
    theme: 'grid',
    styles: {
      fontSize: 7.2,
      cellPadding: 1.5,
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      cellPadding: 1.8,
    },
    columnStyles: {
      0: { cellWidth: 32, fontStyle: 'bold' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 28, halign: 'right', font: 'courier' },
      3: { cellWidth: 28, halign: 'right', font: 'courier' },
      4: { cellWidth: 28, halign: 'right', font: 'courier' },
      5: { cellWidth: 42, halign: 'right', font: 'courier' },
      6: { cellWidth: 42, halign: 'right', font: 'courier' },
      7: { cellWidth: 53, halign: 'right', font: 'courier', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.row.index === tableBody.length - 1) {
        data.cell.styles.fillColor = [15, 23, 42];
        data.cell.styles.textColor = [255, 255, 255];
      }
    },
    margin: { left: marginX, right: marginX },
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // 5. SIGNATURES & VERIFICATION (Landscape 3 Columns)
  if (currentY > pageHeight - 35) {
    doc.addPage();
    currentY = 16;
  }

  const sigWidth = (pageWidth - (marginX * 2) - 30) / 3;

  const signatures = [
    { title: 'Disiapkan Oleh:', role: 'Revenue Manager / Yield Specialist', org: 'Theloka Asset Management' },
    { title: 'Divalidasi Oleh:', role: 'General Manager / Financial Controller', org: 'Standar Operasional Hotel' },
    { title: 'Disetujui Oleh:', role: `Owner / Direksi (${basicInput?.name || 'Properti'})`, org: 'Otorisasi Target Tahunan' },
  ];

  signatures.forEach((sig, idx) => {
    const sigX = marginX + (idx * (sigWidth + 15));
    doc.setDrawColor(203, 213, 225);
    doc.line(sigX, currentY + 14, sigX + sigWidth, currentY + 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(sig.title, sigX, currentY + 2.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(sig.role, sigX, currentY + 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`${sig.org} • ${printDate}`, sigX, currentY + 22);
  });

  // 6. FOOTER BAR ON ALL PAGES
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(marginX, pageHeight - 7, pageWidth - marginX, pageHeight - 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text('THELOKA PRO HOSPITALITY SYSTEM • Strategic Multi-Scenario Revenue Management & USALI Analytics', marginX, pageHeight - 3.8);
    doc.text(`Halaman ${i} dari ${totalPages}`, pageWidth - marginX, pageHeight - 3.8, { align: 'right' });
  }

  // Save PDF file directly to client computer!
  const cleanName = (basicInput?.name || 'Properti')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_');
  const fileName = `Theloka_Revenue_Management_3Way_${cleanName}.pdf`;
  doc.save(fileName);

  return fileName;
};
