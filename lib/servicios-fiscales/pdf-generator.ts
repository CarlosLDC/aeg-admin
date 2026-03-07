import type { Printer, TechnicalService, AnnualInspection } from './mock-data'

function formatDate(dateStr: string): string {
    const [year, month, day] = dateStr.split('-')
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
    return `${parseInt(day)} de ${months[parseInt(month) - 1]} de ${year}`
}

function line(doc: any, y: number) {
    const pageW = doc.internal.pageSize.getWidth()
    doc.setDrawColor(180, 180, 180)
    doc.line(14, y, pageW - 14, y)
}

function label(doc: any, text: string, x: number, y: number) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text(text.toUpperCase(), x, y)
}

function value(doc: any, text: string, x: number, y: number, maxWidth?: number) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(20, 20, 20)
    if (maxWidth) {
        const lines = doc.splitTextToSize(text, maxWidth)
        doc.text(lines, x, y)
        return lines.length
    }
    doc.text(text, x, y)
    return 1
}

function addHeader(doc: any, title: string, subtitle: string): number {
    const pageW = doc.internal.pageSize.getWidth()

    // Title block
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(20, 20, 20)
    doc.text('AEG Sistemas Fiscales', 14, 20)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.text('Libro de Control de Impresoras Fiscales – SENIAT', 14, 27)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(20, 20, 20)
    doc.text(title, pageW - 14, 18, { align: 'right' })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.text(subtitle, pageW - 14, 25, { align: 'right' })

    line(doc, 32)
    return 40
}

function addEquipmentInfo(doc: any, printer: Printer, y: number): number {
    const pageW = doc.internal.pageSize.getWidth()
    const mid = pageW / 2

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(20, 20, 20)
    doc.text('DATOS DEL EQUIPO', 14, y)
    y += 5

    label(doc, 'Serial', 14, y);         value(doc, printer.serial, 14, y + 5)
    label(doc, 'Modelo', mid, y);        value(doc, printer.model, mid, y + 5)
    y += 14

    label(doc, 'Empresa', 14, y);        value(doc, printer.company, 14, y + 5)
    label(doc, 'RIF', mid, y);           value(doc, printer.rif, mid, y + 5)
    y += 14

    label(doc, 'Dirección', 14, y)
    value(doc, printer.address, 14, y + 5)
    y += 14

    label(doc, 'Fecha de Instalación', 14, y); value(doc, formatDate(printer.installDate), 14, y + 5)
    label(doc, 'Estado del Equipo', mid, y);   value(doc, printer.status, mid, y + 5)
    y += 14

    line(doc, y)
    return y + 8
}

function addFooter(doc: any) {
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    line(doc, pageH - 20)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(130, 130, 130)
    doc.text('Documento generado por AEG Sistemas Fiscales conforme a la Resolución No. 071 del SENIAT.', 14, pageH - 14)
    doc.text('Este documento tiene validez oficial como parte del Libro de Control de Impresoras Fiscales.', 14, pageH - 9)
    doc.text(`Generado: ${formatDate(new Date().toISOString().split('T')[0])}`, pageW - 14, pageH - 9, { align: 'right' })
}

// ─── Servicio Técnico ─────────────────────────────────────────────────────────

export async function generateServicioTecnicoPDF(printer: Printer, svc: TechnicalService) {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const mid = pageW / 2

    let y = addHeader(doc, 'Comprobante de Servicio Técnico', `Folio: ${svc.id}`)
    y = addEquipmentInfo(doc, printer, y)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(20, 20, 20)
    doc.text('DATOS DEL SERVICIO TÉCNICO', 14, y)
    y += 5

    label(doc, 'ID de Servicio', 14, y);     value(doc, svc.id, 14, y + 5)
    label(doc, 'Fecha', mid, y);              value(doc, formatDate(svc.date), mid, y + 5)
    y += 14

    label(doc, 'Tipo de Servicio', 14, y)
    value(doc, svc.type, 14, y + 5)
    y += 14

    label(doc, 'Técnico Responsable', 14, y); value(doc, svc.technician, 14, y + 5)
    label(doc, 'Duración', mid, y);           value(doc, svc.duration, mid, y + 5)
    y += 14

    label(doc, 'Estado', 14, y);             value(doc, svc.status, 14, y + 5)
    if (svc.nextService) {
        label(doc, 'Próximo Servicio', mid, y)
        value(doc, formatDate(svc.nextService), mid, y + 5)
    }
    y += 14

    line(doc, y)
    y += 8

    label(doc, 'Observaciones', 14, y)
    y += 6
    const numLines = value(doc, svc.observations, 14, y, pageW - 28)
    y += numLines * 6 + 8

    line(doc, y)
    y += 14

    // Signatures
    doc.setDrawColor(150, 150, 150)
    doc.line(14, y, 80, y)
    doc.line(pageW - 80, y, pageW - 14, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text('Firma del Técnico Responsable', 14, y)
    doc.text('Firma y Sello del Cliente', pageW - 80, y)
    y += 5
    doc.setTextColor(20, 20, 20)
    doc.text(svc.technician, 14, y)

    addFooter(doc)
    doc.save(`Servicio_Tecnico_${printer.serial}_${svc.id}.pdf`)
}

// ─── Inspección Anual ─────────────────────────────────────────────────────────

export async function generateInspeccionAnualPDF(printer: Printer, ins: AnnualInspection) {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const mid = pageW / 2

    let y = addHeader(doc, `Acta de Inspección Anual ${ins.year}`, `Resolución: ${ins.resolutionNumber}`)
    y = addEquipmentInfo(doc, printer, y)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(20, 20, 20)
    doc.text('DATOS DE LA INSPECCIÓN', 14, y)
    y += 5

    label(doc, 'Número de Resolución', 14, y); value(doc, ins.resolutionNumber, 14, y + 5)
    label(doc, 'Año Fiscal', mid, y);           value(doc, String(ins.year), mid, y + 5)
    y += 14

    label(doc, 'Fecha de Inspección', 14, y);  value(doc, formatDate(ins.date), 14, y + 5)
    label(doc, 'Resultado', mid, y);            value(doc, ins.status, mid, y + 5)
    y += 14

    label(doc, 'Inspector Actuante', 14, y)
    value(doc, ins.inspector, 14, y + 5)
    y += 14

    label(doc, 'Delegación / Gerencia', 14, y)
    value(doc, ins.delegation, 14, y + 5)
    y += 14

    label(doc, 'Próxima Inspección', 14, y)
    value(doc, formatDate(ins.nextInspection), 14, y + 5)
    y += 14

    line(doc, y)
    y += 8

    label(doc, 'Observaciones del Inspector', 14, y)
    y += 6
    const numLines = value(doc, ins.observations, 14, y, pageW - 28)
    y += numLines * 6 + 8

    line(doc, y)
    y += 8

    // Legal note
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    const legalText = 'NOTA LEGAL: Este documento certifica que el equipo identificado fue inspeccionado conforme a la Providencia Administrativa del SENIAT. Su alteración constituye un delito fiscal sancionado por la Ley del ISLR.'
    const legalLines = doc.splitTextToSize(legalText, pageW - 28)
    doc.text(legalLines, 14, y)
    y += legalLines.length * 5 + 12

    // Signatures
    doc.setDrawColor(150, 150, 150)
    doc.line(14, y, 85, y)
    doc.line(pageW - 85, y, pageW - 14, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text('Firma del Inspector SENIAT', 14, y)
    doc.text('Firma y Sello del Representante Legal', pageW - 85, y)
    y += 5
    doc.setTextColor(20, 20, 20)
    doc.text(ins.inspector, 14, y)
    doc.text(ins.delegation, 14, y + 5)

    addFooter(doc)
    doc.save(`Inspeccion_Anual_${printer.serial}_${ins.year}.pdf`)
}
