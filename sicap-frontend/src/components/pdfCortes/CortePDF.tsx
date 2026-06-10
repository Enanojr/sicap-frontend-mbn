import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import logoImg from '../../assets/Logo.png';

// ─────────────────────────────────────────────
// Tipos genéricos del PDF
// ─────────────────────────────────────────────

export interface CortePDFMovimiento {
  fecha_pago:      string;
  usuario:         string;
  monto_recibido:  string | number;
  tipo?:           string;   // opcional — solo tesorero jefe lo tiene
  cobrador?:       string;   // opcional — solo tesorero jefe lo tiene
}

export interface CortePDFInfo {
  folio_corte:          number;
  fecha_inicio:         string;   // "YYYY-MM-DD"
  fecha_fin:            string;   // "YYYY-MM-DD"
  fecha_generacion:     string;
  tesorero_nombre:      string;
  total_pagos_normales: string | number;
  total_pagos_cargos:   string | number;
  gran_total:           string | number;
}

export interface CortePDFConfig {
  titulo:       string;   // "Corte de Tesorero Jr" | "Corte de Tesorero Principal"
  responsable?: string;   // si se omite, usa tesorero_nombre del info
  mostrarTipo?: boolean;  // muestra columna "Tipo" (Pago/Cargo)
  mostrarCobrador?: boolean; // muestra columna "Responsable de cobro"
}

// ─────────────────────────────────────────────
// Helpers internos
// ─────────────────────────────────────────────

const formatCurrency = (value: string | number): string =>
  parseFloat(String(value)).toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (iso: string): string => {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

// ─────────────────────────────────────────────
// Función principal exportable
// ─────────────────────────────────────────────

export const generarCortePDF = (
  info:        CortePDFInfo,
  movimientos: CortePDFMovimiento[],
  config:      CortePDFConfig
): void => {
  const doc        = new jsPDF();
  const pageWidth  = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  const colorAzulOscuro: [number, number, number] = [0, 48, 87];
  const colorAzulTitulo: [number, number, number] = [0, 51, 153];
  const colorBordeGris:  [number, number, number] = [200, 200, 200];

  const responsable = config.responsable ?? info.tesorero_nombre;

  // ── Marca de agua imagen ──────────────────
  const addWatermark = () => {
    const imgSize   = 120;
    const xCentered = (pageWidth  - imgSize) / 2;
    const yCentered = (pageHeight - imgSize) / 2 + 20;
    doc.saveGraphicsState();
    doc.setGState(new (doc as any).GState({ opacity: 0.10 }));
    doc.addImage(logoImg, 'PNG', xCentered, yCentered, imgSize, imgSize);
    doc.restoreGraphicsState();
  };

  addWatermark();

  // ── 1. Encabezado ─────────────────────────
  doc.addImage(logoImg, 'PNG', 15, 10, 30, 30);
  doc.setFontSize(6);
  doc.setTextColor(0, 0, 0);
  doc.text('GUADALUPE HIDALGO,', 30, 42, { align: 'center' });
  doc.text('ACUAMANALA. 2026',   30, 45, { align: 'center' });

  // ── 2. Tarjeta superior derecha ───────────
  doc.setDrawColor(...colorBordeGris);
  doc.roundedRect(80, 10, 115, 35, 3, 3, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...colorAzulTitulo);
  doc.text(config.titulo, 85, 18);

  doc.setFontSize(10);
  doc.text(`${formatDate(info.fecha_inicio)} al ${formatDate(info.fecha_fin)}`, 130, 18);

  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);

  doc.setFont('helvetica', 'bold');
  doc.text('Número de corte', 85, 26);
  doc.setFont('helvetica', 'normal');
  doc.text(`#${info.folio_corte}`, 130, 26);

  doc.setFont('helvetica', 'bold');
  doc.text('Responsable', 85, 32);
  doc.setFont('helvetica', 'normal');
  doc.text(responsable, 130, 32);

  doc.setFont('helvetica', 'bold');
  doc.text('Generado el', 85, 38);
  doc.setFont('helvetica', 'normal');
  doc.text(
    new Date(info.fecha_generacion).toLocaleString('es-MX'),
    130, 38
  );

  // ── 3. Título de tabla ────────────────────
  doc.setDrawColor(...colorBordeGris);
  doc.roundedRect(15, 55, 180, 10, 2, 2, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...colorAzulTitulo);
  doc.text('Tabla de movimientos del corte', 20, 61);

  // ── 4. Construir columnas dinámicamente ───
  const headers: string[] = ['Fecha', 'Cuentahabiente'];
  if (config.mostrarTipo)      headers.push('Tipo');
  headers.push('Monto cobrado');
  if (config.mostrarCobrador)  headers.push('Responsable de cobro');
  else                         headers.push('Responsable');

  const tablaCuerpo = movimientos.map((mov) => {
    const fila: string[] = [
      mov.fecha_pago,
      mov.usuario,
    ];
    if (config.mostrarTipo)     fila.push(mov.tipo     ?? '—');
    fila.push(`$${formatCurrency(mov.monto_recibido)}`);
    if (config.mostrarCobrador) fila.push(mov.cobrador ?? '—');
    else                        fila.push(info.tesorero_nombre);
    return fila;
  });

  // Anchos de columna según configuración
  const columnStyles: Record<number, object> = {
    0: { cellWidth: 28 },
  };
  let colIdx = 1;
  columnStyles[colIdx++] = { cellWidth: config.mostrarCobrador ? 50 : 65 };
  if (config.mostrarTipo)     columnStyles[colIdx++] = { cellWidth: 20, fontStyle: 'italic' };
  columnStyles[colIdx++] = { cellWidth: 30, fontStyle: 'bold' };
  columnStyles[colIdx]   = { cellWidth: 'auto' };

  autoTable(doc, {
    startY: 70,
    head: [headers],
    body: tablaCuerpo,
    theme: 'plain',
    headStyles: {
      fillColor: colorAzulOscuro,
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
      cellPadding: 4,
    },
    bodyStyles: {
      fillColor: false,
      textColor: 0,
      halign: 'center',
      fontSize: 9,
      cellPadding: 4,
    },
    columnStyles,
    didDrawCell: (data) => {
      if (data.section === 'body' && data.row.index < tablaCuerpo.length - 1) {
        doc.setDrawColor(200, 200, 200);
        doc.line(
          data.cell.x,
          data.cell.y + data.cell.height,
          data.cell.x + data.cell.width,
          data.cell.y + data.cell.height
        );
      }
    },
    didDrawPage: () => { addWatermark(); },
  });

  // ── 5. Totales y firma ────────────────────
  const yFirmaFijo  = pageHeight - 60;
  const finalYTabla = (doc as any).lastAutoTable.finalY;

  if (finalYTabla > yFirmaFijo - 20) {
    doc.addPage();
    addWatermark();
  }

  // Marca de agua texto
  doc.saveGraphicsState();
  doc.setGState(new (doc as any).GState({ opacity: 0.05 }));
  doc.setFontSize(30);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(150, 150, 150);
  doc.text('GUADALUPE HIDALGO,', pageWidth / 2, yFirmaFijo - 10, { align: 'center' });
  doc.text('ACUAMANALA. 2026',   pageWidth / 2, yFirmaFijo + 2,  { align: 'center' });
  doc.restoreGraphicsState();

  // Subtotales
  const yTotal = yFirmaFijo - 35;
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text(`Pagos normales:  $${formatCurrency(info.total_pagos_normales)}`, 180, yTotal,      { align: 'right' });
  doc.text(`Pagos con cargo: $${formatCurrency(info.total_pagos_cargos)}`,   180, yTotal + 7,  { align: 'right' });
  doc.setFontSize(11);
  doc.text(`Total recaudado: $${formatCurrency(info.gran_total)}`,           180, yTotal + 16, { align: 'right' });

  // Firma
  doc.setFontSize(10);
  doc.text('Firma', pageWidth / 2, yFirmaFijo, { align: 'center' });
  doc.setDrawColor(0, 48, 87);
  doc.line(70, yFirmaFijo + 5, 140, yFirmaFijo + 5);
  doc.setFontSize(11);
  doc.text(responsable, pageWidth / 2, yFirmaFijo + 12, { align: 'center' });

  // Pie de página
  const totalPages     = doc.getNumberOfPages();
  const fechaImpresion = format(new Date(), 'dd/MM/yyyy');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.text('Documento generado automáticamente',       15,             pageHeight - 10);
    doc.text('Guadalupe Hidalgo Acuamanala, C.P. 90860', pageWidth / 2,  pageHeight - 10, { align: 'center' });
    doc.text(fechaImpresion,                             pageWidth - 15, pageHeight - 10, { align: 'right' });
  }

  doc.save(`Corte_${info.folio_corte}.pdf`);
};