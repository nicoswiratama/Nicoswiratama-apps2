import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CompetitorItem } from '../types';

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
  return `${val.toFixed(1)}%`;
};

export interface MarketIntelligencePdfReportData {
  basicInput: any;
  competitors: CompetitorItem[];
  aiAnalysis?: string;
  dateStr?: string;
}

export const generateAndPrintMarketIntelligencePdf = ({
  basicInput,
  competitors,
  aiAnalysis,
  dateStr,
}: MarketIntelligencePdfReportData): string => {
  if (!competitors || competitors.length === 0) {
    throw new Error("Tidak ada data kompetitor untuk dicetak.");
  }

  const printDate = dateStr || new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Calculate STR & USALI Benchmarks
  const count = competitors.length;
  const avgRate = Math.round(competitors.reduce((acc, c) => acc + (Number(c.rate) || 0), 0) / count);
  const avgOcc = competitors.reduce((acc, c) => acc + (Number(c.estimatedOcc) || 0), 0) / count;
  const avgRevpar = Math.round(avgRate * (avgOcc / 100));

  const totalCompRooms = competitors.reduce((acc, c) => acc + (Number(c.rooms) || 0), 0);
  const ourRooms = Number(basicInput?.rooms) || 40;
  const marketCapacity = totalCompRooms + ourRooms;
  const ourCapacityShare = marketCapacity > 0 ? (ourRooms / marketCapacity) * 100 : 0;

  const ourAdr = Number(basicInput?.adr) || 1000000;
  const ourOcc = Number(basicInput?.targetOcc) || 70;
  const ourRevpar = Math.round(ourAdr * (ourOcc / 100));

  // Indexes
  const ari = avgRate > 0 ? (ourAdr / avgRate) * 100 : 100;
  const mpi = avgOcc > 0 ? (ourOcc / avgOcc) * 100 : 100;
  const rgi = avgRevpar > 0 ? (ourRevpar / avgRevpar) * 100 : 100;

  // Pricing Tiers
  const suggestedAggressive = Math.round((Math.min(ourAdr, avgRate) * 0.88) / 10000) * 10000;
  const suggestedBalanced = Math.round(avgRate / 10000) * 10000;
  const suggestedPremium = Math.round((Math.max(ourAdr, avgRate) * 1.15) / 10000) * 10000;

  // Initialize jsPDF A4 Landscape (297 x 210 mm)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 12;

  // 1. BRAND HEADER BAR (Deep Navy gradient style)
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 26, 'F');

  // Accent Line
  doc.setFillColor(79, 70, 229); // indigo-600
  doc.rect(0, 25, pageWidth, 1.2, 'F');

  // Brand Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('THELOKA PRO', marginX, 11);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('HOSPITALITY MARKET INTELLIGENCE & COMPSET USALI BENCHMARK', marginX, 16);

  // Document Title on Right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('LAPORAN RESMI RADAR PASAR & ANALISIS KOMPETITOR', pageWidth - marginX, 11, { align: 'right' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(199, 210, 254); // indigo-200
  doc.text('STANDAR STR GLOBAL • METRIK ARI, MPI, RGI & REKOMENDASI PRICING', pageWidth - marginX, 16, { align: 'right' });

  doc.setTextColor(203, 213, 225);
  doc.setFontSize(7.5);
  doc.text(`Tanggal Cetak: ${printDate} • ID Properti: ${basicInput?.id || 'PROP-01'}`, pageWidth - marginX, 21, { align: 'right' });

  let currentY = 31;

  // 2. PROPERTY SUMMARY BADGE / CARD
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(marginX, currentY, pageWidth - (marginX * 2), 15, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`Properti Subjek: ${basicInput?.name || 'Properti Kami'}`, marginX + 4, currentY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const locationText = `Lokasi: ${basicInput?.location || '-'} ${basicInput?.address ? '• ' + basicInput.address : ''}`;
  doc.text(locationText.length > 75 ? locationText.slice(0, 75) + '...' : locationText, marginX + 4, currentY + 10.5);

  // Right details
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Kapasitas: ${ourRooms} Kamar (${basicInput?.type || 'Hotel'}) • Target Okupansi: ${ourOcc}%`, pageWidth - marginX - 4, currentY + 5.5, { align: 'right' });
  doc.text(`Target ADR: ${formatIDR(ourAdr)} • RevPAR Subjek: ${formatIDR(ourRevpar)} • CompSet: ${count} Hotel`, pageWidth - marginX - 4, currentY + 10.5, { align: 'right' });

  currentY += 19;

  // 3. EXECUTIVE KPI CARDS (5 Columns across available width: 273mm)
  const availableWidth = pageWidth - (marginX * 2);
  const cardGap = 3.5;
  const cardWidth = (availableWidth - (cardGap * 4)) / 5;
  const cardHeight = 22;

  const kpis = [
    {
      title: 'CompSet Average ADR',
      badge: `ARI: ${ari.toFixed(1)}`,
      badgeColor: ari >= 100 ? [238, 242, 255] : [236, 253, 245],
      badgeTextColor: ari >= 100 ? [67, 56, 202] : [4, 120, 87],
      value: formatIDR(avgRate),
      subtext: `Target Kita: ${formatIDR(ourAdr)} (${ourAdr >= avgRate ? '+' : ''}${formatIDR(ourAdr - avgRate)})`,
      interpretation: ari >= 100 ? 'Rate Premium vs Pasar' : 'Rate Lebih Rendah vs Pasar'
    },
    {
      title: 'CompSet Avg Occupancy',
      badge: `MPI: ${mpi.toFixed(1)}`,
      badgeColor: mpi >= 100 ? [236, 253, 245] : [254, 243, 199],
      badgeTextColor: mpi >= 100 ? [4, 120, 87] : [180, 83, 9],
      value: formatPercent(avgOcc),
      subtext: `Target Kita: ${formatPercent(ourOcc)} (${ourOcc >= avgOcc ? '+' : ''}${(ourOcc - avgOcc).toFixed(1)}%)`,
      interpretation: mpi >= 100 ? 'Market Volume Outperformer' : 'Peluang Ekspansi Volume'
    },
    {
      title: 'CompSet RevPAR (Yield)',
      badge: `RGI: ${rgi.toFixed(1)}`,
      badgeColor: rgi >= 100 ? [236, 253, 245] : [254, 242, 242],
      badgeTextColor: rgi >= 100 ? [4, 120, 87] : [185, 28, 28],
      value: formatIDR(avgRevpar),
      subtext: `RevPAR Kita: ${formatIDR(ourRevpar)}`,
      interpretation: rgi >= 100 ? 'Revenue Share Optimal' : 'Perlu Penyesuaian Yield'
    },
    {
      title: 'Market Capacity Share',
      badge: `${totalCompRooms} Kamar Comp`,
      badgeColor: [241, 245, 249],
      badgeTextColor: [71, 85, 105],
      value: `${ourCapacityShare.toFixed(1)}%`,
      subtext: `Porsi Kamar Kita: ${ourRooms} / ${marketCapacity}`,
      interpretation: 'Total Suplai Kamar di Radius'
    },
    {
      title: 'Rekomendasi Yield ADR',
      badge: 'Balanced ADR',
      badgeColor: [238, 242, 255],
      badgeTextColor: [67, 56, 202],
      value: formatIDR(suggestedBalanced),
      subtext: `Low: ${formatIDR(suggestedAggressive)} • High: ${formatIDR(suggestedPremium)}`,
      interpretation: 'Rentang Pricing Dinamis'
    }
  ];

  kpis.forEach((kpi, idx) => {
    const cardX = marginX + (idx * (cardWidth + cardGap));

    // Card border and background
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.title.toUpperCase(), cardX + 3, currentY + 4.5);

    // Badge on top right of card
    doc.setFillColor(kpi.badgeColor[0], kpi.badgeColor[1], kpi.badgeColor[2]);
    doc.roundedRect(cardX + cardWidth - 20, currentY + 1.8, 17, 3.8, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(kpi.badgeTextColor[0], kpi.badgeTextColor[1], kpi.badgeTextColor[2]);
    doc.text(kpi.badge, cardX + cardWidth - 11.5, currentY + 4.4, { align: 'center' });

    // Main Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(kpi.value, cardX + 3, currentY + 11.5);

    // Subtext
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.subtext, cardX + 3, currentY + 15.5);

    // Interpretation / Bottom Note
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(79, 70, 229);
    doc.text(kpi.interpretation, cardX + 3, currentY + 19.5);
  });

  currentY += cardHeight + 4;

  // 4. AI STRATEGIC ANALYSIS & POSITIONING BOX
  if (aiAnalysis && aiAnalysis.trim().length > 0) {
    const boxHeight = 17;
    doc.setFillColor(245, 247, 255); // very soft indigo
    doc.setDrawColor(199, 210, 254);
    doc.roundedRect(marginX, currentY, availableWidth, boxHeight, 1.5, 1.5, 'FD');

    // Accent line left
    doc.setFillColor(79, 70, 229);
    doc.rect(marginX, currentY, 1.5, boxHeight, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(67, 56, 202);
    doc.text('INTELIGENSI STRATEGIS PASAR & REKOMENDASI REVENUE MANAGEMENT:', marginX + 4, currentY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(30, 41, 59);

    const cleanAnalysis = aiAnalysis
      .replace(/\*\*/g, '')
      .replace(/[\r\n]+/g, ' ')
      .trim();

    const splitText = doc.splitTextToSize(cleanAnalysis, availableWidth - 10);
    // Draw up to 3 lines
    const textLines = splitText.slice(0, 3);
    doc.text(textLines, marginX + 4, currentY + 8.5);

    currentY += boxHeight + 4;
  }

  // 5. DETAILED COMPETITOR TABLE (AutoTable)
  const tableHead = [
    [
      { content: 'No', styles: { halign: 'center' as const } },
      { content: 'Nama Hotel / Kompetitor', styles: { halign: 'left' as const } },
      { content: 'Jarak', styles: { halign: 'center' as const } },
      { content: 'Bintang & Kategori', styles: { halign: 'left' as const } },
      { content: 'Kamar', styles: { halign: 'center' as const } },
      { content: 'Published ADR', styles: { halign: 'right' as const } },
      { content: 'Est. Occ', styles: { halign: 'right' as const } },
      { content: 'RevPAR', styles: { halign: 'right' as const } },
      { content: 'Tingkat Ancaman', styles: { halign: 'center' as const } },
      { content: 'Keunggulan Utama & Fasilitas', styles: { halign: 'left' as const } },
      { content: 'Kelemahan Kompetitor', styles: { halign: 'left' as const } },
    ]
  ];

  const tableBody = competitors.map((c, index) => {
    const cRate = Number(c.rate) || 0;
    const cOcc = Number(c.estimatedOcc) || 0;
    const cRevpar = Math.round(cRate * (cOcc / 100));
    const starStr = '★'.repeat(c.stars || 3);
    const threatStr = c.threatLevel === 'high' ? 'TINGGI' : c.threatLevel === 'medium' ? 'SEDANG' : 'RENDAH';

    const amenitiesList = (c.amenities || []).slice(0, 3).join(', ');
    const combinedStrengths = c.strengths 
      ? `${c.strengths}${amenitiesList ? ' • ' + amenitiesList : ''}`
      : (amenitiesList || '-');

    return [
      { content: (index + 1).toString(), styles: { halign: 'center' as const, fontStyle: 'bold' as const } },
      { content: c.name, styles: { halign: 'left' as const, fontStyle: 'bold' as const } },
      { content: `${c.distanceKm} km`, styles: { halign: 'center' as const } },
      { content: `${starStr}\n${c.tier}`, styles: { halign: 'left' as const } },
      { content: c.rooms.toString(), styles: { halign: 'center' as const } },
      { content: formatIDR(cRate), styles: { halign: 'right' as const, fontStyle: 'bold' as const } },
      { content: formatPercent(cOcc), styles: { halign: 'right' as const } },
      { content: formatIDR(cRevpar), styles: { halign: 'right' as const } },
      { content: threatStr, styles: { halign: 'center' as const, fontStyle: 'bold' as const } },
      { content: combinedStrengths, styles: { halign: 'left' as const } },
      { content: c.weaknesses || '-', styles: { halign: 'left' as const } },
    ];
  });

  // Summary Row at the bottom of the table
  tableBody.push([
    { content: '★', styles: { halign: 'center' as const, fontStyle: 'bold' as const } },
    { content: 'RATA-RATA / TOTAL COMPSET', styles: { halign: 'left' as const, fontStyle: 'bold' as const } },
    { content: '-', styles: { halign: 'center' as const } },
    { content: `${count} Properti Aktif`, styles: { halign: 'left' as const, fontStyle: 'bold' as const } },
    { content: `${totalCompRooms} Kamar`, styles: { halign: 'center' as const, fontStyle: 'bold' as const } },
    { content: formatIDR(avgRate), styles: { halign: 'right' as const, fontStyle: 'bold' as const } },
    { content: formatPercent(avgOcc), styles: { halign: 'right' as const, fontStyle: 'bold' as const } },
    { content: formatIDR(avgRevpar), styles: { halign: 'right' as const, fontStyle: 'bold' as const } },
    { content: `ARI: ${ari.toFixed(0)}`, styles: { halign: 'center' as const, fontStyle: 'bold' as const } },
    { content: `Market Capacity Share Kita: ${ourCapacityShare.toFixed(1)}%`, styles: { halign: 'left' as const, fontStyle: 'bold' as const } },
    { content: `RGI: ${rgi.toFixed(0)} • MPI: ${mpi.toFixed(0)}`, styles: { halign: 'left' as const, fontStyle: 'bold' as const } },
  ]);

  autoTable(doc, {
    startY: currentY,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 6.5,
      cellPadding: { top: 2, bottom: 2, left: 2, right: 2 },
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
      textColor: [30, 41, 59],
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 6.5,
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 8 },  // No
      1: { cellWidth: 46 }, // Name
      2: { cellWidth: 14 }, // Distance
      3: { cellWidth: 28 }, // Star & Tier
      4: { cellWidth: 13 }, // Rooms
      5: { cellWidth: 26 }, // Rate
      6: { cellWidth: 16 }, // Occ
      7: { cellWidth: 25 }, // RevPar
      8: { cellWidth: 20 }, // Threat
      9: { cellWidth: 41 }, // Strengths
      10: { cellWidth: 36 }, // Weaknesses
    },
    didParseCell: (data) => {
      // Style the Summary row
      if (data.row.index === tableBody.length - 1) {
        data.cell.styles.fillColor = [241, 245, 249]; // slate-100
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = [15, 23, 42];
      }

      // Threat level highlight colors
      if (data.column.index === 8 && data.row.index < tableBody.length - 1) {
        const text = data.cell.text[0];
        if (text === 'TINGGI') {
          data.cell.styles.textColor = [185, 28, 28]; // red-700
          data.cell.styles.fillColor = [254, 242, 242];
        } else if (text === 'SEDANG') {
          data.cell.styles.textColor = [180, 83, 9]; // amber-700
          data.cell.styles.fillColor = [254, 243, 199];
        } else if (text === 'RENDAH') {
          data.cell.styles.textColor = [4, 120, 87]; // emerald-700
          data.cell.styles.fillColor = [236, 253, 245];
        }
      }
    },
    margin: { left: marginX, right: marginX },
  });

  currentY = (doc as any).lastAutoTable.finalY + 5;

  // 6. SIGNATURES & VERIFICATION (Landscape 3 Columns)
  if (currentY > pageHeight - 34) {
    doc.addPage();
    currentY = 16;
  }

  const sigWidth = (availableWidth - 30) / 3;

  const signatures = [
    { title: 'Disiapkan Oleh:', role: 'Market Intelligence & Revenue Specialist', org: 'Theloka Commercial Division' },
    { title: 'Divalidasi Oleh:', role: 'General Manager / Director of Sales', org: 'Standar Operasional & Audit CompSet' },
    { title: 'Disetujui Oleh:', role: `Owner / Direksi (${basicInput?.name || 'Properti'})`, org: 'Otorisasi Posisi Harga & Strategi Yield' },
  ];

  signatures.forEach((sig, idx) => {
    const sigX = marginX + (idx * (sigWidth + 15));
    doc.setDrawColor(203, 213, 225);
    doc.line(sigX, currentY + 13, sigX + sigWidth, currentY + 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(sig.title, sigX, currentY + 2);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(sig.role, sigX, currentY + 17);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`${sig.org} • ${printDate}`, sigX, currentY + 21);
  });

  // 7. FOOTER BAR ON ALL PAGES
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(marginX, pageHeight - 7, pageWidth - marginX, pageHeight - 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text('THELOKA PRO HOSPITALITY SYSTEM • Strategic Market Intelligence, CompSet Radar & STR USALI Analytics', marginX, pageHeight - 3.8);
    doc.text(`Halaman ${i} dari ${totalPages}`, pageWidth - marginX, pageHeight - 3.8, { align: 'right' });
  }

  // Save PDF file directly to client computer!
  const cleanName = (basicInput?.name || 'Properti')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_');
  const fileName = `Theloka_Market_Intelligence_${cleanName}.pdf`;
  doc.save(fileName);

  return fileName;
};
