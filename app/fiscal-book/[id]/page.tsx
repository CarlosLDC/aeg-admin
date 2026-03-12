'use client';

import { useState, use, useEffect, useRef } from 'react';
import { FiscalPrinter, TechnicalReview, AnnualInspection, Precinto } from '@/lib/mock-data';
import { printerService } from '@/lib/printer-service';
import Link from 'next/link';
import jsPDF from 'jspdf';

// Helper to chunk arrays
function chunkArray<T>(array: T[], size: number): T[][] {
    const chunked_arr = [];
    for (let i = 0; i < array.length; i += size) {
        chunked_arr.push(array.slice(i, i + size));
    }
    return chunked_arr;
}

export default function FiscalBookDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [printer, setPrinter] = useState<FiscalPrinter | undefined>(undefined);
    const [loading, setLoading] = useState(true);

    // Core States
    const [viewMode, setViewMode] = useState<'info' | 'tech' | 'inspection' | 'precintos'>('info');
    const [currentPage, setCurrentPage] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const data = await printerService.getPrinterById(id);
            setPrinter(data);
            setLoading(false);
        };
        loadData();
    }, [id]);

    if (loading) {
        return (
            <main className="container mx-auto px-4 py-32 max-w-4xl text-center flex-1 flex flex-col justify-center">
                <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted font-medium">Cargando Libro Fiscal...</p>
            </main>
        );
    }

    if (!printer) {
        return (
            <main className="container mx-auto px-4 py-32 max-w-4xl text-center flex-1 flex flex-col justify-center">
                <h1 className="text-3xl font-bold text-foreground mb-4">Equipo no encontrado</h1>
                <Link href="/" className="text-accent hover:underline">← Volver al inicio</Link>
            </main>
        );
    }

    // Mathematical Navigation logic for 1 Record per Page
    const records = viewMode === 'tech'
        ? printer.technicalReviews
        : viewMode === 'inspection'
            ? printer.annualInspections
            : viewMode === 'precintos'
                ? printer.precintos
                : [];
    const totalPages = viewMode === 'info' ? 1 : records.length;
    const currentRecord = viewMode !== 'info' ? records[currentPage] : null;

    const handleNext = () => {
        if (currentPage < totalPages - 1) setCurrentPage(p => p + 1);
    };

    const handlePrev = () => {
        if (currentPage > 0) setCurrentPage(p => p - 1);
    };

    const handleTabChange = (mode: 'info' | 'tech' | 'inspection' | 'precintos') => {
        setViewMode(mode);
        setCurrentPage(0);
    };
    const downloadPDF = async () => {
        if (!printer) return;
        if (viewMode !== 'info' && !currentRecord) return;
        setIsDownloading(true);
        try {
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'letter'
            });

            const margin = 20;

            // Helper to draw section header
            const drawSectionHeader = (doc: jsPDF, title: string, y: number) => {
                doc.setDrawColor(240);
                doc.setFillColor(248, 250, 252);
                doc.rect(margin, y - 5, 176, 7, 'F');
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(9);
                doc.setTextColor(30, 41, 59);
                doc.text(title, margin + 2, y);
                doc.setDrawColor(226, 232, 240);
                doc.line(margin, y + 2, margin + 176, y + 2);
                return y + 12;
            };

            // Helper for data rows
            const drawDataRow = (doc: jsPDF, label: string, value: string, y: number, xOffset: number = 0) => {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                doc.setTextColor(100);
                doc.text(label.toUpperCase(), margin + xOffset, y);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(10);
                doc.setTextColor(30);
                doc.text(String(value || 'N/A').toUpperCase(), margin + xOffset, y + 5);
                return y + 12;
            };

            // Header Branding
            const drawHeader = (doc: jsPDF, serial: string) => {
                doc.setFontSize(22);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(15);
                doc.text('AEG', margin, 25);

                doc.setFontSize(8);
                doc.setTextColor(100);
                doc.text('ALPHA ENGINEER GROUP, C.A.', margin, 30);
                doc.setFontSize(7);
                doc.text('RIF: J-40582910-3 | CONTROL FISCAL SENIAT 0141', margin, 34);

                doc.setFontSize(9);
                doc.setTextColor(100);
                doc.text('SERIAL FISCAL:', 160, 25, { align: 'right' });
                doc.setFontSize(12);
                doc.setFont('courier', 'bold');
                doc.setTextColor(15);
                doc.text(serial, 160, 31, { align: 'right' });

                doc.setDrawColor(15);
                doc.setLineWidth(0.5);
                doc.line(margin, 40, 200 - margin, 40);
                return 55;
            };

            // --- PAGE 1: INFORMATION ---
            let y = drawHeader(doc, printer.serial_fiscal);

            y = drawSectionHeader(doc, '1. DATOS DEL CONTRIBUYENTE', y);
            y = drawDataRow(doc, 'Razón Social', printer.businessName || '', y);
            y = drawDataRow(doc, 'RIF', printer.rif || '', y);
            y = drawDataRow(doc, 'Tipo Contribuyente', printer.taxpayerType || '', y);
            const splitAddr = doc.splitTextToSize(printer.address || 'N/A', 140);
            drawDataRow(doc, 'Dirección Fiscal', '', y);
            doc.text(splitAddr, margin, y + 5);
            y += (splitAddr.length * 5) + 10;

            y = drawSectionHeader(doc, '2. ESPECIFICACIONES TÉCNICAS', y);
            const modelStr = printer.modelo
                ? `${printer.modelo.marca}-${printer.modelo.codigo_modelo}`
                : String(printer.id_modelo_impresora || 'N/A').toUpperCase();

            doc.text('MARCA Y MODELO', margin, y);
            doc.text(modelStr, margin, y + 5);
            doc.text('REGISTRO FISCAL', margin + 80, y);
            doc.text(printer.registro_fiscal || 'SIN REGISTRO', margin + 80, y + 5);
            y += 15;

            if (printer.modelo?.providencia) {
                doc.text('PROVIDENCIA HOMOLOGACIÓN', margin, y);
                doc.text(printer.modelo.providencia, margin, y + 5);
                y += 15;
            }

            // --- PAGE 2: DETAILS ---
            if (viewMode !== 'info' && currentRecord) {
                doc.addPage();
                y = drawHeader(doc, printer.serial_fiscal);

                if (viewMode === 'tech') {
                    const tr = currentRecord as TechnicalReview;
                    y = drawSectionHeader(doc, '1. DATOS DEL CENTRO DE SERVICIO', y);
                    drawDataRow(doc, 'Centro Autorizado', tr.serviceCenter, y);
                    drawDataRow(doc, 'RIF Centro', tr.centerRif, y, 90);
                    y += 15;
                    drawDataRow(doc, 'Técnico', tr.technician, y);
                    drawDataRow(doc, 'ID Técnico', tr.technicianId, y, 90);
                    y += 15;

                    y = drawSectionHeader(doc, '2. DETALLES DE LA INTERVENCIÓN', y);
                    drawDataRow(doc, 'Motivo', tr.interventionType, y);
                    drawDataRow(doc, 'Fecha', tr.date, y, 90);
                    y += 15;
                    drawDataRow(doc, 'Reporte Z Inicial', tr.zReportStart, y);
                    drawDataRow(doc, 'Reporte Z Final', tr.zReportEnd, y, 90);
                    y += 15;

                    y = drawSectionHeader(doc, '3. CONTENIDO DEL ACTA', y);
                    doc.rect(margin, y, 176, 40);
                    const splitObs = doc.splitTextToSize((tr.description || 'N/A').toUpperCase(), 165);
                    doc.setFont('courier', 'normal');
                    doc.setFontSize(9);
                    doc.text(splitObs, margin + 5, y + 10);
                    y += 50;

                    // Signatures
                    doc.line(margin, y + 15, margin + 70, y + 15);
                    doc.line(120, y + 15, 120 + 70, y + 15);
                    doc.setFontSize(8);
                    doc.text('FIRMA TÉCNICO', margin + 35, y + 20, { align: 'center' });
                    doc.text('FIRMA CONTRIBUYENTE', 155, y + 20, { align: 'center' });

                } else if (viewMode === 'inspection') {
                    const ai = currentRecord as AnnualInspection;
                    y = drawSectionHeader(doc, '1. DATOS DE LA INSPECCIÓN', y);
                    drawDataRow(doc, 'Centro de Servicio', ai.serviceCenter, y);
                    drawDataRow(doc, 'RIF Centro', ai.centerRif, y, 90);
                    y += 15;
                    drawDataRow(doc, 'Inspector', ai.inspector, y);
                    drawDataRow(doc, 'Tipo', ai.tipo || 'ANUAL OBLIGATORIA', y, 90);
                    y += 15;

                    y = drawSectionHeader(doc, '2. RESULTADOS', y);
                    drawDataRow(doc, 'Estatus', ai.status === 'passed' ? 'APROBADA' : 'OBSERVADA', y);
                    drawDataRow(doc, 'Fecha', ai.date, y, 90);
                    y += 15;

                    doc.rect(margin, y, 176, 50);
                    const splitObs = doc.splitTextToSize((ai.observations || 'N/A').toUpperCase(), 165);
                    doc.setFont('courier', 'normal');
                    doc.setFontSize(9);
                    doc.text(splitObs, margin + 5, y + 10);
                    y += 65;

                    doc.line(margin, y + 15, margin + 70, y + 15);
                    doc.line(120, y + 15, 120 + 70, y + 15);
                    doc.text('FIRMA INSPECTOR', margin + 35, y + 20, { align: 'center' });
                    doc.text('FIRMA CONTRIBUYENTE', 155, y + 20, { align: 'center' });

                } else if (viewMode === 'precintos') {
                    const pr = currentRecord as Precinto;
                    y = drawSectionHeader(doc, '1. DATOS DEL PRECINTO', y);
                    drawDataRow(doc, 'Serial', pr.serial, y);
                    drawDataRow(doc, 'Color', pr.color, y, 90);
                    y += 15;
                    drawDataRow(doc, 'Estatus', pr.estatus, y);
                    y += 15;

                    y = drawSectionHeader(doc, '2. CRONOLOGÍA', y);
                    drawDataRow(doc, 'Fecha Instalación', pr.fecha_instalacion || 'N/A', y);
                    drawDataRow(doc, 'Fecha Retiro', pr.fecha_retiro || 'VIGENTE', y, 90);
                    y += 20;

                    doc.setFillColor(30, 41, 59);
                    doc.rect(margin, y, 176, 15, 'F');
                    doc.setTextColor(255);
                    doc.setFontSize(10);
                    doc.text('REGISTRO OFICIAL DE SEGURIDAD SENIAT', 100, y + 9, { align: 'center' });
                }
            }

            doc.setFontSize(7);
            doc.setTextColor(150);
            doc.text(`Documento generado por Portal de Auditoría AEG - ${new Date().toLocaleString()}`, 100, 275, { align: 'center' });

            const filename = `AEG-${viewMode.toUpperCase()}-${printer.serial_fiscal}-${new Date().getTime()}.pdf`;
            doc.save(filename);

        } catch (error) {
            console.error("PDF Generation error:", error);
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <main className="container mx-auto px-2 py-6 md:py-12 flex flex-col items-center min-h-screen">
            <style jsx global>{`
                @media print {
                    @page {
                        size: letter;
                        margin: 10mm;
                    }
                    html, body {
                        background: white !important;
                        color: black !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .print-container {
                        width: 100% !important;
                        max-width: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        border: none !important;
                        box-shadow: none !important;
                        background: white !important;
                        color: black !important;
                    }
                    /* Ensure all text is dark and backgrounds are handled */
                    .print-container *, .print-container p, .print-container span, .print-container h1, .print-container h2, .print-container h3 {
                        color: black !important;
                        border-color: #666 !important;
                        background-color: transparent !important;
                    }
                    /* Specific overrides for official headers that should stay dark */
                    .print-container .bg-slate-900, 
                    .print-container .dark\\:bg-slate-100 {
                        background-color: #1e293b !important; /* Forces a dark header */
                    }
                    .print-container .bg-slate-900 *, 
                    .print-container .dark\\:bg-slate-100 * {
                        color: white !important; /* Forces white text inside dark headers */
                    }
                    /* Sub-sections background */
                    .print-container .bg-slate-50, 
                    .print-container .dark\\:bg-slate-900\\/50,
                    .print-container .bg-slate-50\\/50 {
                        background-color: #f8fafc !important; /* Very light gray for visibility */
                    }
                }
            `}</style>

            {/* Context Header: Actions & Toggles (HIDDEN ON PRINT) */}
            <div className="no-print w-full max-w-[900px] mb-6 flex flex-col md:flex-row gap-4 justify-between items-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-3 rounded-2xl border border-slate-200 dark:border-slate-800 transition-colors">

                {/* Left: Back Button (Spacer 1) */}
                <div className="flex-1 flex justify-start w-full md:w-auto">
                    <Link href="/" className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors pl-2">
                        <ArrowLeft size={18} />
                        <span className="text-sm font-medium">Volver</span>
                    </Link>
                </div>

                {/* Center: Tabs (True Center) */}
                <div className="flex-none flex overflow-x-auto hide-scrollbar bg-slate-200/50 dark:bg-slate-800/50 backdrop-blur p-1 rounded-xl shadow-inner snap-x">
                    <button
                        onClick={() => handleTabChange('info')}
                        className={`px-4 py-2 text-sm whitespace-nowrap font-semibold rounded-lg transition-all snap-start ${viewMode === 'info' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-muted hover:text-foreground'}`}
                    >
                        Inf. Base
                    </button>
                    <button
                        onClick={() => handleTabChange('tech')}
                        className={`px-4 py-2 text-sm whitespace-nowrap font-semibold rounded-lg transition-all snap-start ${viewMode === 'tech' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-muted hover:text-foreground'}`}
                    >
                        Servicios ({printer.technicalReviews.length})
                    </button>
                    <button
                        onClick={() => handleTabChange('inspection')}
                        className={`px-4 py-2 text-sm whitespace-nowrap font-semibold rounded-lg transition-all snap-start ${viewMode === 'inspection' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-muted hover:text-foreground'}`}
                    >
                        Inspecciones ({printer.annualInspections.length})
                    </button>
                    <button
                        onClick={() => handleTabChange('precintos')}
                        className={`px-4 py-2 text-sm whitespace-nowrap font-semibold rounded-lg transition-all snap-start ${viewMode === 'precintos' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-muted hover:text-foreground'}`}
                    >
                        Precintos ({printer.precintos.length})
                    </button>
                </div>

                {/* Right: Actions (Spacer 2) */}
                <div className="flex-1 flex items-center justify-end gap-3 w-full md:w-auto">
                    <button
                        onClick={downloadPDF}
                        disabled={isDownloading || viewMode === 'info' || records.length === 0}
                        className="flex justify-center items-center w-10 h-10 rounded-xl transition-all duration-200 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-sm border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:pointer-events-none active:scale-95"
                        title="Descargar PDF"
                    >
                        {isDownloading ? (
                            <div className="w-[18px] h-[18px] border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <DownloadIcon size={20} />
                        )}
                    </button>
                    <div className="text-muted dark:text-slate-400 text-xs font-mono font-bold bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 min-w-[85px] text-center">
                        {totalPages > 0 ? `Pag ${currentPage + 1}/${totalPages}` : 'Sin Registros'}
                    </div>
                </div>
            </div>

            {/* Formal Record Sheet (Letter Size: 21.59cm x 27.94cm) */}
            <div className="w-full overflow-x-auto pb-6 -mx-2 px-2 md:mx-0 md:px-0">
                <div className="print-container min-w-[800px] w-full max-w-[21.59cm] min-h-[27.94cm] bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 shadow-xl border border-slate-200 dark:border-slate-800 relative flex flex-col overflow-hidden transition-colors mx-auto">

                    {/* Content Area */}
                    <div className="flex-1 px-10 py-12 md:px-16 md:py-14 relative z-10 flex flex-col">

                        {/* Official Banner - Simplified */}
                        <div className="flex items-start justify-between border-b border-slate-900 dark:border-slate-100 pb-6 mb-10">
                            <div>
                                <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                                    Libro de Control y Reparación
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold tracking-[0.2em] uppercase mt-1">
                                    Máquina Fiscal - Providencia SENIAT 0141
                                </p>
                            </div>
                            <div className="text-right flex flex-col items-end border border-slate-200 dark:border-slate-800 rounded p-2 bg-slate-50 dark:bg-slate-900 transition-colors">
                                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0.5">Serial Fiscal</span>
                                <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">{printer.serial_fiscal}</span>
                            </div>
                        </div>

                        {/* Conditional Rendering of 1-Record Pages */}
                        <div className="flex-1 flex flex-col">
                            {viewMode === 'info' && <InfoPage printer={printer} />}

                            {viewMode === 'tech' && (
                                currentRecord ? (
                                    <SingleTechSheet review={currentRecord as TechnicalReview} printer={printer} />
                                ) : (
                                    <EmptyState type="services" />
                                )
                            )}

                            {viewMode === 'inspection' && (
                                currentRecord ? (
                                    <SingleInspectionSheet inspection={currentRecord as AnnualInspection} printer={printer} />
                                ) : (
                                    <EmptyState type="inspections" />
                                )
                            )}

                            {viewMode === 'precintos' && (
                                currentRecord ? (
                                    <SinglePrecintoCoverSheet precinto={currentRecord as Precinto} printer={printer} />
                                ) : (
                                    <EmptyState type="precintos" />
                                )
                            )}
                        </div>
                    </div>

                    {/* Navigation Footer (HIDDEN ON PRINT) */}
                    {viewMode !== 'info' && totalPages > 0 && (
                        <div className="no-print mt-auto border-t border-slate-100 dark:border-slate-900 px-8 py-4 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center z-10 transition-colors">
                            <button
                                onClick={handlePrev}
                                disabled={currentPage === 0}
                                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-foreground disabled:opacity-20 transition-colors"
                            >
                                <ArrowLeft size={14} /> Anterior
                            </button>

                            <div className="text-slate-300 dark:text-slate-700 font-mono text-[9px] uppercase tracking-widest">
                                Hoja de Registro {currentPage + 1} de {totalPages}
                            </div>

                            <button
                                onClick={handleNext}
                                disabled={currentPage === totalPages - 1}
                                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-foreground disabled:opacity-20 transition-colors"
                            >
                                Siguiente <ArrowRight size={14} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

function EmptyState({ type }: { type: 'services' | 'inspections' | 'precintos' }) {
    return (
        <div className="flex flex-col items-center justify-center flex-1 py-20 text-center">
            <div className="w-12 h-12 rounded-full border border-dashed border-slate-300 dark:border-slate-700 mb-4 flex items-center justify-center">
                <span className="text-xl grayscale opacity-30">📋</span>
            </div>
            <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Libro sin registros</h3>
            <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">No se han encontrado {type === 'services' ? 'servicios' : type === 'precintos' ? 'precintos' : 'inspecciones'}.</p>
        </div>
    );
}

function InfoPage({ printer }: { printer: FiscalPrinter }) {
    return (
        <div className="space-y-12">
            <section>
                <h2 className="text-[11px] uppercase tracking-widest font-black text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-100 dark:border-slate-900">1. DATOS DEL CONTRIBUYENTE</h2>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border border-slate-100 dark:border-slate-900 transition-colors">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1 uppercase tracking-tight">{printer.businessName}</h3>
                    <p className="text-slate-600 dark:text-slate-400 font-mono text-sm font-bold mb-6">RIF: {printer.rif}</p>

                    <div className="mb-6">
                        <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Tipo de Contribuyente</label>
                        <p className="text-slate-700 dark:text-slate-300 font-medium text-sm leading-relaxed uppercase">{printer.taxpayerType || 'N/A'}</p>
                    </div>

                    <div>
                        <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Domicilio Fiscal</label>
                        <p className="text-slate-700 dark:text-slate-300 font-medium text-sm leading-relaxed uppercase">{printer.address}</p>
                    </div>
                </div>
            </section>

            <section>
                <h2 className="text-[11px] uppercase tracking-widest font-black text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-100 dark:border-slate-900">2. ESPECIFICACIONES TÉCNICAS</h2>
                <div className="grid grid-cols-2 gap-8 bg-slate-50 dark:bg-slate-900/50 p-6 border border-slate-100 dark:border-slate-900 transition-colors">
                    <div>
                        <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Marca y Modelo</label>
                        <p className="text-slate-900 dark:text-white font-black uppercase text-sm">
                            {printer.modelo ? `${printer.modelo.marca}-${printer.modelo.codigo_modelo}` : String(printer.id_modelo_impresora || 'N/A').toUpperCase()}
                        </p>
                    </div>
                    <div>
                        <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Serial Fiscal</label>
                        <p className="font-mono text-slate-900 dark:text-white text-sm font-bold">{printer.serial_fiscal}</p>
                    </div>
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800 col-span-2">
                        <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Número de Registro Fiscal</label>
                        <p className="font-mono text-slate-900 dark:text-white text-sm font-bold">{printer.registro_fiscal || 'SIN REGISTRO'}</p>
                    </div>
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                        <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Versión Firmware</label>
                        <p className="font-mono text-slate-900 dark:text-white font-black text-sm">{printer.id_firmware || 'V0.0.0'}</p>
                    </div>
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                        <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Software de Caja</label>
                        <p className="font-mono text-slate-900 dark:text-white font-black text-sm">{printer.id_software || 'STANDALONE'}</p>
                    </div>
                    {printer.modelo?.providencia && (
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 col-span-2">
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Providencia de Homologación</label>
                            <p className="text-slate-700 dark:text-slate-300 font-bold text-xs uppercase">
                                {printer.modelo.providencia}
                                {printer.modelo.fecha_homologacion && ` (${new Date(printer.modelo.fecha_homologacion).toLocaleDateString('es-VE')})`}
                            </p>
                        </div>
                    )}
                </div>
            </section>

            <section>
                <h2 className="text-[11px] uppercase tracking-widest font-black text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-100 dark:border-slate-900">3. DATOS ADMINISTRATIVOS Y COMERCIALES</h2>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border border-slate-100 dark:border-slate-900 transition-colors">

                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Estatus Operativo</label>
                            <span className={`inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider rounded border ${printer.estatus === 'asignada'
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/30'
                                : printer.estatus === 'laboratorio'
                                    ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/30'
                                    : printer.estatus === 'sin_asignar'
                                        ? 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                                        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/30'
                                }`}>
                                {String(printer.estatus || '').replace('_', ' ')}
                            </span>
                        </div>
                        <div className="text-right">
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Liquidación (USD)</label>
                            <p className="font-mono text-slate-900 dark:text-white font-black text-lg">${printer.precio_venta_final !== null ? printer.precio_venta_final.toFixed(2) : '0.00'}</p>
                            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 mt-1 inline-block rounded ${printer.se_pago ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                                {printer.se_pago ? 'Pagado' : (printer.se_pago === false ? 'Pendiente' : 'SIN REGISTRO')}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Agente / Distribuidor</label>
                            <p className="text-slate-700 dark:text-slate-300 font-medium text-xs uppercase">{printer.id_distribuidor || 'GRA-DIRECTO'}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Sucursal Asignada</label>
                            <p className="text-slate-700 dark:text-slate-300 font-medium text-xs uppercase">{printer.id_sucursal || 'ALMACÉN CENTRAL'}</p>
                        </div>
                        <div className="col-span-2">
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Cód. Orden de Compra</label>
                            <p className="font-mono text-slate-500 dark:text-slate-400 text-xs">{printer.id_compra || 'N/A'}</p>
                        </div>
                    </div>
                </div>
            </section>

            <section>
                <h2 className="text-[11px] uppercase tracking-widest font-black text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-100 dark:border-slate-900">4. INFORMACIÓN DE LA EMPRESA</h2>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border border-slate-100 dark:border-slate-900 transition-colors">
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Nombre / Razón Social</label>
                            <p className="text-slate-900 dark:text-white font-black uppercase text-sm">Alpha Engineer Group, C.A.</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">RIF</label>
                            <p className="font-mono text-slate-900 dark:text-white text-sm font-bold">J-40582910-3</p>
                        </div>
                        <div className="col-span-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Providencia de Autorización</label>
                            <p className="text-slate-700 dark:text-slate-300 font-medium text-xs uppercase">SENIAT/GER/0141-2024</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

function SingleTechSheet({ review, printer }: { review: TechnicalReview, printer: FiscalPrinter }) {
    return (
        <div className="space-y-12">
            <section>
                <div className="flex justify-between items-end mb-6 pb-2 border-b border-slate-100 dark:border-slate-900">
                    <h2 className="text-[11px] uppercase tracking-widest font-black text-slate-900 dark:text-white">1. DATOS DEL CENTRO DE SERVICIO</h2>
                    <span className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-tighter">ID: {review.id}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border border-slate-100 dark:border-slate-900 transition-colors">
                    <div className="grid grid-cols-2 gap-8">
                        <div className="col-span-2 md:col-span-1">
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Centro de Servicio Técnico Autorizado</label>
                            <p className="text-slate-900 dark:text-white font-black uppercase text-sm leading-tight">{review.serviceCenter}</p>
                        </div>
                        <div className="md:text-right">
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">RIF Centro de Servicio</label>
                            <p className="font-mono text-slate-700 dark:text-slate-300 font-bold text-sm tracking-tight">{review.centerRif}</p>
                        </div>
                        <div className="col-span-2 md:col-span-1 border-t border-slate-200 dark:border-slate-800 pt-4">
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Técnico Autorizado</label>
                            <p className="text-slate-900 dark:text-white font-black uppercase text-sm">{review.technician}</p>
                        </div>
                        <div className="md:text-right border-t border-slate-200 dark:border-slate-800 pt-4">
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">C.I. / ID Técnico</label>
                            <p className="font-mono text-slate-700 dark:text-slate-300 font-bold text-sm">{review.technicianId}</p>
                        </div>
                    </div>
                </div>
            </section>

            <section>
                <h2 className="text-[11px] uppercase tracking-widest font-black text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-100 dark:border-slate-900">2. DETALLES DE LA INTERVENCIÓN</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-slate-50 dark:bg-slate-900/50 p-6 border border-slate-100 dark:border-slate-900 transition-colors">
                    <div className="col-span-2">
                        <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Tipo de Intervención</label>
                        <p className="text-slate-900 dark:text-white font-black uppercase text-sm">{review.interventionType}</p>
                    </div>
                    <div className="col-span-2 md:text-right">
                        <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Fecha y Horario</label>
                        <p className="font-mono text-slate-900 dark:text-white font-bold text-sm">
                            {review.date} {review.startTime && `| ${review.startTime}`} {review.endTime && `- ${review.endTime}`}
                        </p>
                    </div>
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                        <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Reporte Z Inicial</label>
                        <p className="font-mono text-slate-900 dark:text-white font-black text-sm">{review.zReportStart}</p>
                    </div>
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                        <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Reporte Z Final</label>
                        <p className="font-mono text-slate-900 dark:text-white font-black text-sm">{review.zReportEnd}</p>
                    </div>
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                        <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Precinto Roto</label>
                        <p className={`font-black text-xs uppercase ${review.sealBroken ? 'text-red-500' : 'text-emerald-500'}`}>{review.sealBroken ? 'SÍ' : 'NO'}</p>
                    </div>
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                        <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Precinto Reemplazado</label>
                        <p className={`font-black text-xs uppercase ${review.sealReplaced ? 'text-blue-500' : 'text-slate-400'}`}>{review.sealReplaced ? 'SÍ' : 'NO'}</p>
                    </div>
                </div>
            </section>

            <section>
                <h2 className="text-[11px] uppercase tracking-widest font-black text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-100 dark:border-slate-900">3. CONTENIDO DEL ACTA / FALLA</h2>
                <div className="space-y-6 bg-slate-50 dark:bg-slate-900/50 p-6 border border-slate-100 dark:border-slate-900 transition-colors">
                    <div>
                        <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-2">Falla Reportada y Acción Realizada</label>
                        <p className="text-slate-800 dark:text-slate-200 font-medium text-sm leading-relaxed uppercase bg-white/50 dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 min-h-[100px] whitespace-pre-wrap">
                            {review.description || 'SIN DESCRIPCIÓN'}
                        </p>
                    </div>
                    {review.observaciones && (
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-2">Observaciones Adicionales</label>
                            <p className="text-slate-600 dark:text-slate-400 font-medium text-xs leading-relaxed uppercase border-l-2 border-slate-200 dark:border-slate-800 pl-4 py-1 italic">
                                {review.observaciones}
                            </p>
                        </div>
                    )}
                </div>
            </section>

            <section>
                <h2 className="text-[11px] uppercase tracking-widest font-black text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-100 dark:border-slate-900">4. CIERRE Y RESPONSABILIDADES</h2>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border border-slate-100 dark:border-slate-900 transition-colors">
                    {review.partsReplaced && review.partsReplaced.length > 0 && (
                        <div className="mb-8 pb-8 border-b border-slate-200 dark:border-slate-800">
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-3">Componentes Sustituidos</label>
                            <div className="flex gap-2 flex-wrap">
                                {review.partsReplaced.map((part) => (
                                    <span key={part} className="px-3 py-1 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 font-mono text-[10px] uppercase font-black border border-slate-200 dark:border-slate-700 shadow-sm">
                                        {part}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-12 pt-6">
                        <div className="text-center pt-8 border-t border-slate-300 dark:border-slate-700">
                            <span className="text-[8px] uppercase text-slate-400 dark:text-slate-500 font-bold block mb-2">Firma Técnico Autorizado</span>
                            <span className="font-black text-[11px] uppercase text-slate-900 dark:text-white tracking-tight">{review.technician}</span>
                        </div>
                        <div className="text-center pt-8 border-t border-slate-300 dark:border-slate-700">
                            <span className="text-[8px] uppercase text-slate-400 dark:text-slate-500 font-bold block mb-2">Firma del Contribuyente</span>
                            <span className="font-black text-[11px] uppercase text-slate-900 dark:text-white tracking-tight">{printer.businessName}</span>
                        </div>
                    </div>

                    {review.costo != null && (
                        <div className="mt-8 flex justify-end">
                            <div className="text-right bg-slate-100 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                                <label className="text-[8px] uppercase font-bold text-slate-500 block">Liquidación</label>
                                <p className="font-mono font-black text-slate-900 dark:text-white text-xl leading-none pt-1">
                                    <span className="text-xs mr-1 opacity-50">$</span>
                                    {Number(review.costo).toFixed(2)}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

function SingleInspectionSheet({ inspection, printer }: { inspection: AnnualInspection, printer: FiscalPrinter }) {
    return (
        <div className="space-y-12">
            <section>
                <div className="flex justify-between items-end mb-6 pb-2 border-b border-slate-100 dark:border-slate-900">
                    <h2 className="text-[11px] uppercase tracking-widest font-black text-slate-900 dark:text-white">1. DATOS DEL CENTRO Y AUDITOR</h2>
                    <span className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-tighter">ID: {inspection.id}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border border-slate-100 dark:border-slate-900 transition-colors">
                    <div className="grid grid-cols-2 gap-8">
                        <div className="col-span-2 md:col-span-1">
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Centro de Servicio Técnico</label>
                            <p className="text-slate-900 dark:text-white font-black uppercase text-sm leading-tight">{inspection.serviceCenter}</p>
                        </div>
                        <div className="md:text-right">
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">RIF Centro de Servicio</label>
                            <p className="font-mono text-slate-700 dark:text-slate-300 font-bold text-sm tracking-tight">{inspection.centerRif}</p>
                        </div>
                        <div className="col-span-2 md:col-span-1 border-t border-slate-200 dark:border-slate-800 pt-4">
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Inspector Actuante</label>
                            <p className="text-slate-900 dark:text-white font-black uppercase text-sm">{inspection.inspector}</p>
                        </div>
                        <div className="md:text-right border-t border-slate-200 dark:border-slate-800 pt-4">
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Tipo de Inspección</label>
                            <p className="text-slate-700 dark:text-slate-300 font-bold text-xs uppercase">{inspection.tipo || 'ANUAL OBLIGATORIA'}</p>
                        </div>
                    </div>
                </div>
            </section>

            <section>
                <h2 className="text-[11px] uppercase tracking-widest font-black text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-100 dark:border-slate-900">2. RESULTADO DE LA INSPECCIÓN</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 bg-slate-50 dark:bg-slate-900/50 p-6 border border-slate-100 dark:border-slate-900 transition-colors">
                    <div className="col-span-2 md:col-span-1">
                        <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Estatus Final</label>
                        <span className={`inline-block px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded border ${inspection.status === 'passed'
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/30'
                            : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/30'
                            }`}>
                            {inspection.status === 'passed' ? 'APROBADA' : 'CON OBSERVACIONES'}
                        </span>
                    </div>
                    <div>
                        <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Fecha de Ejecución</label>
                        <p className="font-mono text-slate-900 dark:text-white font-bold text-sm">{inspection.date}</p>
                    </div>
                    <div className="md:text-right">
                        <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Horario de Auditoría</label>
                        <p className="font-mono text-slate-900 dark:text-white font-bold text-sm">
                            {inspection.startTime || '--:--'} A {inspection.endTime || '--:--'}
                        </p>
                    </div>

                    <div className="col-span-2 md:col-span-3 pt-6 border-t border-slate-200 dark:border-slate-800">
                        <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-3">Observaciones y Hallazgos</label>
                        <p className="text-slate-800 dark:text-slate-200 font-medium text-sm leading-relaxed uppercase bg-white/50 dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 min-h-[120px] whitespace-pre-wrap transition-colors shadow-sm">
                            {inspection.observations || 'EL EQUIPO CUMPLE SATISFACTORIAMENTE CON TODOS LOS REQUERIMIENTOS TÉCNICOS Y LEGALES ESTABLECIDOS EN LA PROVIDENCIA 0141 DEL SENIAT.'}
                        </p>
                    </div>
                </div>
            </section>

            <section>
                <h2 className="text-[11px] uppercase tracking-widest font-black text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-100 dark:border-slate-900">3. CIERRE Y FIRMAS</h2>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-8 border border-slate-100 dark:border-slate-900 transition-colors">
                    <div className="grid grid-cols-2 gap-12 pt-4">
                        <div className="text-center pt-8 border-t border-slate-300 dark:border-slate-700">
                            <span className="text-[8px] uppercase text-slate-400 dark:text-slate-500 font-bold block mb-2">Firma Inspector Actuante</span>
                            <span className="font-black text-[11px] uppercase text-slate-900 dark:text-white tracking-tight">{inspection.inspector}</span>
                        </div>
                        <div className="text-center pt-8 border-t border-slate-300 dark:border-slate-700">
                            <span className="text-[8px] uppercase text-slate-400 dark:text-slate-500 font-bold block mb-2">Firma del Contribuyente Beneficiario</span>
                            <span className="font-black text-[11px] uppercase text-slate-900 dark:text-white tracking-tight">{printer.businessName}</span>
                        </div>
                    </div>
                    <div className="mt-12 text-center text-slate-400 dark:text-slate-600 text-[10px] uppercase font-bold tracking-[0.2em]">
                        Inspección Anual Obligatoria SENIAT Prov. 0141
                    </div>
                </div>
            </section>
        </div>
    );
}

// SimplifiedRecord component and its usage are removed as html2canvas is no longer used.

function SinglePrecintoCoverSheet({ precinto, printer }: { precinto: Precinto, printer: FiscalPrinter }) {
    const isActive = String(precinto.estatus).toLowerCase() === 'activo';
    return (
        <div className="space-y-12">
            <section>
                <div className="flex justify-between items-end mb-6 pb-2 border-b border-slate-100 dark:border-slate-900">
                    <h2 className="text-[11px] uppercase tracking-widest font-black text-slate-900 dark:text-white">1. IDENTIFICACIÓN DEL PRECINTO</h2>
                    <span className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-tighter">ID: {String(precinto.id)}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border border-slate-100 dark:border-slate-900 transition-colors">
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Serial del Precinto</label>
                            <p className="font-mono text-slate-900 dark:text-white font-black text-lg tracking-widest">{precinto.serial}</p>
                        </div>
                        <div className="md:text-right">
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Estatus actual</label>
                            <span className={`inline-block px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded border ${isActive
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/30'
                                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/30'
                                }`}>
                                {precinto.estatus}
                            </span>
                        </div>
                        <div className="col-span-2 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-4">
                            <div
                                className="w-10 h-10 rounded-full border-4 border-white dark:border-slate-800 shadow-sm flex-shrink-0"
                                style={{ backgroundColor: precinto.color.toLowerCase() }}
                                title={precinto.color}
                            />
                            <div>
                                <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-0.5">Color del Precinto</label>
                                <p className="text-slate-900 dark:text-white font-black uppercase text-sm">{precinto.color}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section>
                <h2 className="text-[11px] uppercase tracking-widest font-black text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-100 dark:border-slate-900">2. CRONOLOGÍA DE SEGURIDAD</h2>
                <div className="grid grid-cols-2 gap-8 bg-slate-50 dark:bg-slate-900/50 p-6 border border-slate-100 dark:border-slate-900 transition-colors">
                    <div>
                        <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Fecha de Instalación</label>
                        <p className="font-mono text-slate-900 dark:text-white font-black text-sm">
                            {precinto.fecha_instalacion ? new Date(precinto.fecha_instalacion).toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A'}
                        </p>
                    </div>
                    <div className="md:text-right">
                        <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Fecha de Retiro / Sustitución</label>
                        <p className={`font-mono font-black text-sm ${precinto.fecha_retiro ? 'text-slate-900 dark:text-white' : 'text-slate-300 dark:text-slate-700'}`}>
                            {precinto.fecha_retiro ? new Date(precinto.fecha_retiro).toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'VIGENTE'}
                        </p>
                    </div>
                </div>
            </section>

        </div>
    );
}

function DownloadIcon({ size, className }: { size: number; className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" />
        </svg>
    );
}

// Icons
function ArrowLeft({ size, className }: { size: number; className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
        </svg>
    );
}

function ArrowRight({ size, className }: { size: number; className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
        </svg>
    );
}

function PrinterIcon({ size, className }: { size: number; className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><path d="M6 9V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5" /><rect x="6" y="14" width="12" height="8" rx="2" />
        </svg>
    );
}
