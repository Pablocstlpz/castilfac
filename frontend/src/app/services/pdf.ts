import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type TipoCalculo = 'perimetro' | 'area' | 'por_metro_ancho';

@Injectable({ providedIn: 'root' })
export class PdfService {

  // Mapea tipo_unidad (del backend) al concepto de cálculo de corte
  private derivarTipoCalculo(tipoUnidad: string): TipoCalculo {
    if (tipoUnidad === 'metros_lineales') return 'perimetro';
    if (tipoUnidad === 'metros_cuadrados') return 'area';
    return 'por_metro_ancho';
  }

  // Genera la cadena de instrucción de corte para el taller
  private instruccionCorte(tipoCalculo: TipoCalculo, anchoMm: number, altoMm: number, cantidad: number): string {
    switch (tipoCalculo) {
      case 'perimetro': {
        const n = 2 * cantidad;
        return `${n} de ${anchoMm}mm y ${n} de ${altoMm}mm`;
      }
      case 'area':
        return `${cantidad} vidrio${cantidad !== 1 ? 's' : ''} de ${anchoMm}mm x ${altoMm}mm`;
      default:
        return `${cantidad} de ${anchoMm}mm`;
    }
  }

  private etiquetaTipoCalculo(tipoCalculo: TipoCalculo): string {
    const etiquetas: Record<TipoCalculo, string> = {
      perimetro: 'Perimetro',
      area: 'Area / Vidrio',
      por_metro_ancho: 'Por Unidad',
    };
    return etiquetas[tipoCalculo];
  }

  generarHojaFabricacion(presupuesto: any, materialesLista: any[]): void {
    try {
      this._generarPDF(presupuesto, materialesLista);
    } catch (err) {
      console.error('[PdfService] Error al generar la Hoja de Fabricacion:', err);
    }
  }

  private _generarPDF(presupuesto: any, materialesLista: any[]): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // --- Paleta de colores corporativa ---
    const AZUL_R = 37, AZUL_G = 99, AZUL_B = 235;         // #2563eb
    const SLATE_R = 30, SLATE_G = 41, SLATE_B = 59;        // slate-800
    const SLATE_MID_R = 71, SLATE_MID_G = 85, SLATE_MID_B = 105; // slate-600

    // ==============================
    // CABECERA
    // ==============================
    doc.setFillColor(AZUL_R, AZUL_G, AZUL_B);
    doc.rect(0, 0, 210, 38, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('CastilFac', 14, 16);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('HOJA DE FABRICACION — Uso interno del taller', 14, 24);

    // Bloque de datos de referencia (alineado a la derecha)
    const fechaDoc = new Date().toLocaleDateString('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
    doc.setFontSize(8.5);
    doc.text(`Ref: ${presupuesto.numero_presupuesto || '---'}`, 196, 14, { align: 'right' });
    doc.text(`Cliente: ${presupuesto.cliente_nombre || '---'}`, 196, 21, { align: 'right' });
    doc.text(`Fecha: ${fechaDoc}`, 196, 28, { align: 'right' });

    // ==============================
    // RESUMEN DE ELEMENTOS
    // ==============================
    let y = 46;
    const elementos = presupuesto.elementos ?? [];

    if (elementos.length === 0) {
      doc.setTextColor(SLATE_MID_R, SLATE_MID_G, SLATE_MID_B);
      doc.setFontSize(10);
      doc.text('Este presupuesto no tiene elementos de fabricacion asignados.', 14, y + 8);
      doc.save(`Hoja_Fabricacion_${presupuesto.numero_presupuesto ?? 'presupuesto'}.pdf`);
      return;
    }

    elementos.forEach((el: any, idx: number) => {
      // Salto de pagina preventivo
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      const cantidad = Number(el.cantidad) || 1;
      // Conversion metros → milimetros (1m = 1000mm)
      const anchoMm = Math.round((Number(el.medida_ancho) || 0) * 1000);
      const altoMm = Math.round((Number(el.medida_alto) || 0) * 1000);

      // --- Barra de titulo del elemento ---
      doc.setFillColor(SLATE_R, SLATE_G, SLATE_B);
      doc.rect(14, y, 182, 9, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      const titulo =
        `${idx + 1}. ${el.descripcion || 'Sin descripcion'}` +
        `   |   Cantidad: ${cantidad} ud.` +
        `   |   Tamano: ${anchoMm} x ${altoMm} mm`;
      doc.text(titulo, 17, y + 6);
      y += 12;

      // --- Tabla de materiales / instrucciones de corte ---
      const desglose: any[] = el.materiales_desglose ?? [];

      const filas = desglose.map((mat: any) => {
        // Busca el tipo_unidad real en la lista maestra de materiales
        const matInfo = materialesLista.find((m: any) => m.id === mat.material_id);
        const tipoUnidad: string = matInfo?.tipo_unidad ?? mat.tipo_unidad ?? '';
        const tipoCalculo = this.derivarTipoCalculo(tipoUnidad);
        const instruccion = this.instruccionCorte(tipoCalculo, anchoMm, altoMm, cantidad);
        return [
          mat.nombre_material_snapshot ?? '---',
          this.etiquetaTipoCalculo(tipoCalculo),
          instruccion,
        ];
      });

      autoTable(doc, {
        startY: y,
        head: [['Material / Cristal', 'Tipo de Calculo', 'Instruccion de Corte / Fabricacion']],
        body: filas.length > 0 ? filas : [['Sin materiales asignados', '—', '—']],
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 3,
          font: 'helvetica',
          textColor: [30, 41, 59],
        },
        headStyles: {
          fillColor: [AZUL_R, AZUL_G, AZUL_B],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { cellWidth: 72 },
          1: { cellWidth: 32 },
          2: { cellWidth: 78 },
        },
        margin: { left: 14, right: 14 },
      });

      y = (doc as any).lastAutoTable.finalY + 3;

      // --- Notas de fabricacion del elemento ---
      if (el.notas_fabricacion?.trim()) {
        // Aseguramos espacio para la nota
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.setFont('helvetica', 'bolditalic');
        doc.text(`Nota taller: ${el.notas_fabricacion}`, 14, y + 4);
        doc.setFont('helvetica', 'normal');
        y += 9;
      }

      y += 7; // Separacion entre elementos
    });

    // ==============================
    // PIE DE PAGINA EN TODAS LAS PAGINAS
    // ==============================
    const totalPaginas: number = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPaginas; i++) {
      doc.setPage(i);
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 289, 210, 8, 'F');
      doc.setFontSize(6.5);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'normal');
      doc.text('CastilFac — Documento confidencial para uso interno del taller. No incluye precios.', 14, 293.5);
      doc.text(`Pag. ${i} / ${totalPaginas}`, 196, 293.5, { align: 'right' });
    }

    doc.save(`Hoja_Fabricacion_${presupuesto.numero_presupuesto ?? 'presupuesto'}.pdf`);
  }
}
