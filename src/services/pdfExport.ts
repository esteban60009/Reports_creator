import jsPDF from 'jspdf';
import type { Report, ReportVariableValue, ReportBlock } from '../types';
import type { CompanySettings, ReportLayout } from '../types';

interface PDFOptions {
  report: Report;
  company?: CompanySettings | null;
  layout?: ReportLayout | null;
}

const COLORS = {
  primary: [200, 16, 46] as [number, number, number],     // #C8102E
  text: [28, 28, 30] as [number, number, number],          // #1C1C1E
  secondary: [120, 120, 128] as [number, number, number],  // #78788C
  border: [229, 229, 234] as [number, number, number],     // #E5E5EA
  bg: [247, 247, 249] as [number, number, number],         // #F7F7F9
  white: [255, 255, 255] as [number, number, number],
  pass: [27, 141, 54] as [number, number, number],         // #1B8D36
  fail: [255, 59, 48] as [number, number, number],         // #FF3B30
};

export async function generateReportPDF({ report, company, layout }: PDFOptions): Promise<jsPDF> {
  const pageSize = layout?.pageSize === 'a4' ? 'a4' : 'letter';
  const margins = layout?.margins || { top: 20, right: 20, bottom: 20, left: 20 };
  
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: pageSize,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margins.left - margins.right;
  let y = margins.top;

  const fontSize = layout?.fontSize === 'small' ? 0.85 : layout?.fontSize === 'large' ? 1.15 : 1;

  // Helper functions
  const setFont = (size: number, style: 'normal' | 'bold' = 'normal', color = COLORS.text) => {
    doc.setFontSize(size * fontSize);
    doc.setFont('helvetica', style);
    doc.setTextColor(...color);
  };

  const drawLine = (x1: number, y1: number, x2: number, y2: number, color = COLORS.border) => {
    doc.setDrawColor(...color);
    doc.setLineWidth(0.3);
    doc.line(x1, y1, x2, y2);
  };

  const drawRect = (x: number, yy: number, w: number, h: number, color: [number, number, number]) => {
    doc.setFillColor(...color);
    doc.rect(x, yy, w, h, 'F');
  };

  const checkNewPage = (needed: number) => {
    if (y + needed > pageHeight - margins.bottom) {
      doc.addPage();
      y = margins.top;
      return true;
    }
    return false;
  };

  // ============== HEADER ==============
  const headerLayout = layout?.headerLayout || 'two-column';
  
  // Header background
  drawRect(margins.left, y, contentWidth, 22, [255, 245, 246]);
  drawLine(margins.left, y + 22, margins.left + contentWidth, y + 22, COLORS.primary);

  if (headerLayout === 'centered') {
    // Centered header
    if (company?.companyName && (layout?.showCompanyInfo !== false)) {
      setFont(8, 'normal', COLORS.secondary);
      doc.text(company.companyName, pageWidth / 2, y + 5, { align: 'center' });
    }
    setFont(14, 'bold', COLORS.primary);
    doc.text('REPORTE DE SERVICIO', pageWidth / 2, y + 12, { align: 'center' });
    setFont(10, 'bold', COLORS.text);
    doc.text(report.reportNumber, pageWidth / 2, y + 18, { align: 'center' });
  } else if (headerLayout === 'left-aligned') {
    // Left-aligned
    let hx = margins.left + 4;
    if (company?.companyName && (layout?.showCompanyInfo !== false)) {
      setFont(8, 'normal', COLORS.secondary);
      doc.text(company.companyName, hx, y + 5);
    }
    setFont(14, 'bold', COLORS.primary);
    doc.text('REPORTE DE SERVICIO', hx, y + 12);
    setFont(10, 'bold', COLORS.text);
    doc.text(report.reportNumber, hx, y + 18);
  } else {
    // Two-column (default)
    let hx = margins.left + 4;
    if (company?.companyName && (layout?.showCompanyInfo !== false)) {
      setFont(9, 'bold', COLORS.text);
      doc.text(company.companyName, hx, y + 6);
      if (company.address) {
        setFont(7, 'normal', COLORS.secondary);
        doc.text(company.address, hx, y + 10);
      }
      if (company.phone || company.email) {
        setFont(7, 'normal', COLORS.secondary);
        const contact = [company.phone, company.email].filter(Boolean).join(' | ');
        doc.text(contact, hx, y + 14);
      }
    }
    setFont(13, 'bold', COLORS.primary);
    doc.text('REPORTE DE SERVICIO', margins.left + contentWidth - 4, y + 8, { align: 'right' });
    setFont(10, 'bold', COLORS.text);
    doc.text(report.reportNumber, margins.left + contentWidth - 4, y + 15, { align: 'right' });
  }

  y += 26;

  // ============== INFO GRID ==============
  drawRect(margins.left, y, contentWidth, 20, COLORS.bg);
  
  const infoItems = [
    { label: 'Equipo', value: report.equipmentName },
    { label: 'Tipo de Servicio', value: report.serviceType.replace(/_/g, ' ') },
    { label: 'Técnico', value: report.technician },
    { label: 'Fecha', value: report.serviceDate },
  ];
  if (report.supervisorName) infoItems.push({ label: 'Supervisor', value: report.supervisorName });
  if (report.nextServiceDate) infoItems.push({ label: 'Próximo Servicio', value: report.nextServiceDate });

  const colWidth = contentWidth / Math.min(infoItems.length, 4);
  infoItems.forEach((item, i) => {
    const row = Math.floor(i / 4);
    const col = i % 4;
    const ix = margins.left + col * colWidth + 4;
    const iy = y + 4 + row * 10;

    setFont(7, 'normal', COLORS.secondary);
    doc.text(item.label.toUpperCase(), ix, iy);
    setFont(9, 'bold', COLORS.text);
    doc.text(item.value || '—', ix, iy + 4.5);
  });

  const infoRows = Math.ceil(infoItems.length / 4);
  y += 8 + infoRows * 10;

  // Status badge
  const statusLabels: Record<string, string> = {
    draft: 'BORRADOR',
    completed: 'COMPLETADO',
    approved: 'APROBADO',
  };
  const statusColors: Record<string, [number, number, number]> = {
    draft: COLORS.secondary,
    completed: COLORS.primary,
    approved: COLORS.pass,
  };
  const statusText = statusLabels[report.status] || report.status;
  const statusColor = statusColors[report.status] || COLORS.text;

  setFont(7, 'bold', statusColor);
  const stWidth = doc.getTextWidth(statusText) + 6;
  drawRect(margins.left + contentWidth - stWidth - 2, y - 8, stWidth + 4, 6, [...statusColor, 30] as any);
  doc.text(statusText, margins.left + contentWidth - 2, y - 4, { align: 'right' });
  
  y += 4;

  // ============== BLOCKS ==============
  const blockStyle = layout?.blockStyle || 'card';
  const showNumbers = layout?.showBlockNumbers !== false;

  const sortedBlocks = [...report.blocks].sort((a, b) => a.order - b.order);

  for (let bi = 0; bi < sortedBlocks.length; bi++) {
    const block = sortedBlocks[bi];
    const blockHeight = 8 + block.values.length * 7 + (block.blockNotes ? 6 : 0);

    checkNewPage(Math.min(blockHeight, 40));

    // Block title
    if (blockStyle === 'card' || blockStyle === 'table') {
      drawRect(margins.left, y, contentWidth, 7, COLORS.bg);
      drawLine(margins.left, y, margins.left + contentWidth, y, COLORS.border);
      drawLine(margins.left, y + 7, margins.left + contentWidth, y + 7, COLORS.border);
    }

    if (showNumbers) {
      // Number circle
      doc.setFillColor(...COLORS.primary);
      doc.circle(margins.left + 6, y + 3.5, 2.8, 'F');
      setFont(7, 'bold', COLORS.white);
      doc.text(String(bi + 1), margins.left + 6, y + 4.5, { align: 'center' });

      setFont(10, 'bold', COLORS.text);
      doc.text(block.title, margins.left + 12, y + 5);
    } else {
      setFont(10, 'bold', COLORS.text);
      doc.text(block.title, margins.left + 4, y + 5);
    }

    y += 9;

    // Variables
    for (const v of block.values) {
      checkNewPage(7);

      const label = v.label;
      const valueText = getValueText(v);
      const valueColor = getValueColor(v);

      if (blockStyle === 'card') {
        drawLine(margins.left + 4, y + 5, margins.left + contentWidth - 4, y + 5, [240, 240, 245]);
      } else if (blockStyle === 'table') {
        drawLine(margins.left, y + 5, margins.left + contentWidth, y + 5, COLORS.border);
      }

      setFont(8, 'normal', COLORS.secondary);
      doc.text(label, margins.left + 6, y + 4);

      setFont(8, 'bold', valueColor);
      doc.text(valueText, margins.left + contentWidth - 6, y + 4, { align: 'right' });

      // Signature image
      if (v.type === 'signature' && v.value && typeof v.value === 'string' && v.value.startsWith('data:')) {
        try {
          y += 2;
          doc.addImage(v.value as string, 'PNG', margins.left + contentWidth - 50, y, 44, 16);
          y += 16;
        } catch {
          // skip bad signature images
        }
      }

      y += 6;
    }

    // Block notes
    if (block.blockNotes) {
      checkNewPage(8);
      setFont(7, 'normal', COLORS.secondary);
      doc.text(`Notas: ${block.blockNotes}`, margins.left + 6, y + 3);
      y += 6;
    }

    y += 4;
  }

  // ============== OBSERVATIONS ==============
  if (report.generalObservations) {
    checkNewPage(20);
    drawLine(margins.left, y, margins.left + contentWidth, y, COLORS.border);
    y += 4;
    setFont(10, 'bold', COLORS.text);
    doc.text('Observaciones Generales', margins.left + 4, y + 4);
    y += 8;
    setFont(8, 'normal', COLORS.secondary);
    const obsLines = doc.splitTextToSize(report.generalObservations, contentWidth - 8);
    doc.text(obsLines, margins.left + 4, y);
    y += obsLines.length * 4 + 4;
  }

  // ============== SIGNATURES ==============
  if (layout?.showSignatureLines !== false) {
    checkNewPage(30);
    y = Math.max(y + 10, pageHeight - margins.bottom - 25);

    const sigWidth = contentWidth / 2 - 10;

    // Technician signature
    drawLine(margins.left + 10, y, margins.left + 10 + sigWidth, y, COLORS.text);
    setFont(8, 'normal', COLORS.secondary);
    doc.text(`Técnico: ${report.technician}`, margins.left + 10 + sigWidth / 2, y + 5, { align: 'center' });

    // Supervisor signature
    if (report.supervisorName) {
      const sx = margins.left + contentWidth / 2 + 10;
      drawLine(sx, y, sx + sigWidth, y, COLORS.text);
      doc.text(`Supervisor: ${report.supervisorName}`, sx + sigWidth / 2, y + 5, { align: 'center' });
    }
  }

  // ============== FOOTER ==============
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    setFont(7, 'normal', COLORS.secondary);
    doc.text(
      company?.footerText || 'Generado por Reports Creator',
      margins.left,
      pageHeight - margins.bottom + 5
    );
    doc.text(
      `Página ${p} de ${totalPages}`,
      pageWidth - margins.right,
      pageHeight - margins.bottom + 5,
      { align: 'right' }
    );
  }

  return doc;
}

function getValueText(v: ReportVariableValue): string {
  if (v.type === 'pass_fail') {
    if (v.value === 'pass') return 'APROBADO';
    if (v.value === 'fail') return 'FALLA';
    return '—';
  }
  if (v.type === 'checkbox') return v.value ? '✓ Realizado' : '○ Pendiente';
  if (v.type === 'measurement') return v.value ? `${v.value} ${v.unit}` : '—';
  if (v.type === 'signature') return v.value ? '[Firmado]' : '—';
  return String(v.value) || '—';
}

function getValueColor(v: ReportVariableValue): [number, number, number] {
  if (v.type === 'pass_fail') {
    if (v.value === 'pass') return COLORS.pass;
    if (v.value === 'fail') return COLORS.fail;
  }
  return COLORS.text;
}
