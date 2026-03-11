'use client';

import { useState, use, useEffect, useRef } from 'react';
import { FiscalPrinter, TechnicalReview, AnnualInspection } from '@/lib/mock-data';
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
    const [viewMode, setViewMode] = useState<'info' | 'tech' | 'inspection'>('info');
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
    const records = viewMode === 'tech' ? printer.technicalReviews : printer.annualInspections;
    const totalPages = viewMode === 'info' ? 1 : records.length;
    const currentRecord = viewMode !== 'info' ? records[currentPage] : null;

    const handleNext = () => {
        if (currentPage < totalPages - 1) setCurrentPage(p => p + 1);
    };

    const handlePrev = () => {
        if (currentPage > 0) setCurrentPage(p => p - 1);
    };

    const handleTabChange = (mode: 'info' | 'tech' | 'inspection') => {
        setViewMode(mode);
        setCurrentPage(0); // Reset pagination naturally switching context
    };
    const downloadPDF = async () => {
        if (!printer || !currentRecord) return;
        setIsDownloading(true);
        try {
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'letter'
            });

            const margin = 20;

            // --- PAGE 1: BASE INFORMATION ---
            const drawBaseInfo = (cursorY: number) => {
                doc.setFontSize(22);
                doc.setFont('helvetica', 'bold');
                doc.text('AEG', margin, cursorY);

                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.text('PORTAL DE AUDITORÍA FISCAL', margin, cursorY + 5);

                doc.setFontSize(10);
                doc.text('SERIAL FISCAL:', 160, cursorY, { align: 'right' });
                doc.setFontSize(12);
                doc.setFont('courier', 'bold');
                doc.text(printer.serial_fiscal, 160, cursorY + 6, { align: 'right' });

                cursorY += 20;
                doc.setLineWidth(0.5);
                doc.line(margin, cursorY, 200 - margin, cursorY);
                cursorY += 15;

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(14);
                doc.text('1. IDENTIFICACIÓN DEL EQUIPO Y CONTRIBUYENTE', 100, cursorY, { align: 'center' });
                cursorY += 15;

                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.text('Contribuyente:', margin, cursorY);
                doc.setFont('helvetica', 'bold');
                doc.text(printer.businessName || 'SIN ASIGNAR', margin + 40, cursorY);
                cursorY += 8;

                doc.setFont('helvetica', 'normal');
                doc.text('RIF:', margin, cursorY);
                doc.setFont('helvetica', 'bold');
                doc.text(printer.rif || 'N/A', margin + 40, cursorY);
                cursorY += 8;

                doc.setFont('helvetica', 'normal');
                doc.text('Tipo Contribuyente:', margin, cursorY);
                doc.setFont('helvetica', 'bold');
                doc.text(printer.taxpayerType || 'N/A', margin + 40, cursorY);
                cursorY += 8;

                doc.setFont('helvetica', 'normal');
                doc.text('Dirección Fiscal:', margin, cursorY);
                doc.setFont('helvetica', 'bold');
                const splitAddr = doc.splitTextToSize(printer.address || 'SIN UBICACIÓN', 120);
                doc.text(splitAddr, margin + 40, cursorY);
                cursorY += splitAddr.length * 5 + 10;

                doc.setDrawColor(230);
                doc.line(margin, cursorY, 200 - margin, cursorY);
                cursorY += 10;

                doc.setFont('helvetica', 'normal');
                doc.text('Modelo del Equipo:', margin, cursorY);
                doc.setFont('helvetica', 'bold');
                doc.text(String(printer.id_modelo_impresora || '').toUpperCase(), margin + 40, cursorY);
                cursorY += 8;

                doc.setFont('helvetica', 'normal');
                doc.text('Distribuidor Autorizado:', margin, cursorY);
                doc.setFont('helvetica', 'bold');
                doc.text(printer.id_distribuidor || 'GRA-DIRECTO', margin + 45, cursorY);
                cursorY += 8;

                doc.setFont('helvetica', 'normal');
                doc.text('Estatus Técnico:', margin, cursorY);
                doc.setFont('helvetica', 'bold');
                doc.text(String(printer.estatus || '').toUpperCase().replace('_', ' '), margin + 45, cursorY);

                return cursorY;
            };

            drawBaseInfo(20);

            // --- PAGE 2: RECORD DETAILS ---
            doc.addPage();
            let cursorY = 20;

            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text('AEG', margin, cursorY);
            doc.setFontSize(10);
            doc.text(printer.serial_fiscal, 160, cursorY, { align: 'right' });
            cursorY += 10;
            doc.line(margin, cursorY, 200 - margin, cursorY);
            cursorY += 15;

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            const title = viewMode === 'tech' ? '2. RESUMEN DE ACTUACIÓN TÉCNICA' : '2. RESUMEN DE INSPECCIÓN ANUAL';
            doc.text(title, 100, cursorY, { align: 'center' });
            cursorY += 15;

            const rec = currentRecord;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('Fecha de Registro:', margin, cursorY);
            doc.setFont('helvetica', 'bold');
            doc.text(rec.date, margin + 45, cursorY);
            cursorY += 8;

            doc.setFont('helvetica', 'normal');
            doc.text('Número de Control:', margin, cursorY);
            doc.setFont('helvetica', 'bold');
            doc.text(String(rec.id), margin + 45, cursorY);
            cursorY += 12;

            doc.setDrawColor(0);
            const actorLabel = viewMode === 'tech' ? 'Centro de Servicio Autorizado:' : 'Inspector Actuante:';
            doc.setFont('helvetica', 'normal');
            doc.text(actorLabel, margin, cursorY);
            doc.setFont('helvetica', 'bold');
            doc.text(viewMode === 'tech' ? (rec as TechnicalReview).serviceCenter : (rec as AnnualInspection).inspector, margin + 55, cursorY);
            cursorY += 10;

            if (viewMode === 'tech') {
                doc.setFont('helvetica', 'normal');
                doc.text('Tipo de Intervención:', margin, cursorY);
                doc.setFont('helvetica', 'bold');
                doc.text((rec as TechnicalReview).interventionType, margin + 55, cursorY);
                cursorY += 8;

                doc.setFont('helvetica', 'normal');
                doc.text('Rango de Reportes Z:', margin, cursorY);
                doc.setFont('helvetica', 'bold');
                doc.text(`${(rec as TechnicalReview).zReportStart} - ${(rec as TechnicalReview).zReportEnd}`, margin + 55, cursorY);
                cursorY += 12;
            }

            // Observations Box
            doc.rect(margin, cursorY, 200 - (margin * 2), 65);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text('CONTENIDO DEL ACTA / OBSERVACIONES:', margin + 3, cursorY + 6);

            doc.setFont('courier', 'normal');
            doc.setFontSize(9);
            const obs = viewMode === 'tech' ? (rec as TechnicalReview).description : (rec as AnnualInspection).observations || 'EL EQUIPO CUMPLE CON TODOS LOS REQUERIMIENTOS DE LA PROVIDENCIA 0141 DEL SENIAT.';
            const splitObs = doc.splitTextToSize(obs.toUpperCase(), 155);
            doc.text(splitObs, margin + 5, cursorY + 16);

            cursorY += 85;

            // Signatures
            const sigY = cursorY + 15;
            doc.setDrawColor(150);
            doc.line(margin, sigY, margin + 65, sigY);
            doc.line(115, sigY, 115 + 65, sigY);

            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text('FIRMA RESPONSABLE', margin + 32.5, sigY + 5, { align: 'center' });
            doc.text('FIRMA CONTRIBUYENTE', 147.5, sigY + 5, { align: 'center' });

            // Universal Footer
            doc.setFontSize(7);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(150);
            doc.text(`Expedido dinámicamente el ${new Date().toLocaleString()} - Sistema de Auditoría AEG`, 100, 270, { align: 'center' });

            doc.save(`AEG-Expediente-${printer.serial_fiscal}-${rec.id}.pdf`);
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
                        className={`px-4 py-2 text-sm whitespace-nowrap font-semibold rounded-lg transition-all snap-start ${viewMode === 'tech' ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-sm' : 'text-muted hover:text-foreground'}`}
                    >
                        Servicios ({printer.technicalReviews.length})
                    </button>
                    <button
                        onClick={() => handleTabChange('inspection')}
                        className={`px-4 py-2 text-sm whitespace-nowrap font-semibold rounded-lg transition-all snap-start ${viewMode === 'inspection' ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-sm' : 'text-muted hover:text-foreground'}`}
                    >
                        Inspecciones ({printer.annualInspections.length})
                    </button>
                </div>

                {/* Right: Actions (Spacer 2) */}
                <div className="flex-1 flex items-center justify-end gap-3 w-full md:w-auto">
                    <button
                        onClick={downloadPDF}
                        disabled={isDownloading || viewMode === 'info'}
                        className="flex justify-center items-center w-10 h-10 rounded-xl transition-all duration-200 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:pointer-events-none active:scale-95"
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

function EmptyState({ type }: { type: 'services' | 'inspections' }) {
    return (
        <div className="flex flex-col items-center justify-center flex-1 py-20 text-center">
            <div className="w-12 h-12 rounded-full border border-dashed border-slate-300 dark:border-slate-700 mb-4 flex items-center justify-center">
                <span className="text-xl grayscale opacity-30">📋</span>
            </div>
            <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Libro sin registros</h3>
            <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">No se han encontrado {type === 'services' ? 'servicios' : 'inspecciones'}.</p>
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
                        <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Modelo Aprobado</label>
                        <p className="text-slate-900 dark:text-white font-black uppercase text-sm">{String(printer.id_modelo_impresora || '').replace('mod-', '') || 'GENERIC-AEG'}</p>
                    </div>
                    <div>
                        <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Serial Fiscal</label>
                        <p className="font-mono text-slate-900 dark:text-white text-sm font-bold">{printer.serial_fiscal}</p>
                    </div>
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                        <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Versión Firmware</label>
                        <p className="font-mono text-slate-900 dark:text-white font-black text-sm">{printer.id_firmware || 'V0.0.0'}</p>
                    </div>
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                        <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Software de Caja</label>
                        <p className="font-mono text-slate-900 dark:text-white font-black text-sm">{printer.id_software || 'STANDALONE'}</p>
                    </div>
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
        </div>
    );
}

function SingleTechSheet({ review, printer }: { review: TechnicalReview, printer: FiscalPrinter }) {
    return (
        <div className="flex flex-col h-full border border-slate-900 dark:border-slate-100 transition-colors">
            <div className="border-b border-slate-900 dark:border-slate-100 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2 flex justify-between items-center transition-colors">
                <h2 className="font-bold tracking-widest uppercase text-[10px]">Registro de Actuación Técnica</h2>
                <span className="font-mono text-[10px] opacity-70">{review.id.toUpperCase()}</span>
            </div>

            <div className="grid grid-cols-4 divide-x divide-y divide-slate-400 dark:divide-slate-700 border-b border-slate-400 dark:border-slate-700">
                <div className="p-3 col-span-3">
                    <span className="block text-[8px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-0.5">Centro de Servicio Técnico Autorizado</span>
                    <span className="font-bold text-slate-900 dark:text-white text-[11px] uppercase">{review.serviceCenter}</span>
                </div>
                <div className="p-3">
                    <span className="block text-[8px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-0.5">RIF CS</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-[11px]">{review.centerRif}</span>
                </div>

                <div className="p-3 col-span-2">
                    <span className="block text-[8px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-0.5">Técnico Autorizado</span>
                    <span className="font-bold text-slate-900 dark:text-white text-[11px] uppercase">{review.technician}</span>
                </div>
                <div className="p-3">
                    <span className="block text-[8px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-0.5">C.I. Técnico</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-[11px]">{review.technicianId}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/50">
                    <span className="block text-[8px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-0.5">Fecha</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-[11px]">{review.date}</span>
                </div>
            </div>

            <div className="grid grid-cols-3 divide-x divide-slate-400 dark:divide-slate-700 border-b border-slate-400 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 transition-colors">
                <div className="p-4">
                    <span className="block text-[8px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-2">Motivo</span>
                    <span className="font-black text-slate-900 dark:text-white text-[10px] uppercase">{review.interventionType}</span>
                </div>
                <div className="p-4 grid grid-cols-2 gap-2">
                    <div>
                        <span className="block text-[8px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Z Inicial</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white text-[10px]">{review.zReportStart}</span>
                    </div>
                    <div>
                        <span className="block text-[8px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Z Final</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white text-[10px]">{review.zReportEnd}</span>
                    </div>
                </div>
                <div className="p-4 flex gap-4">
                    <div>
                        <span className="block text-[8px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">P. Roto</span>
                        <span className="font-bold text-[10px] text-foreground">{review.sealBroken ? 'SÍ' : 'NO'}</span>
                    </div>
                    <div>
                        <span className="block text-[8px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">P. Reemp</span>
                        <span className="font-bold text-[10px] text-foreground">{review.sealReplaced ? 'SÍ' : 'NO'}</span>
                    </div>
                </div>
            </div>

            <div className="p-5 flex-1">
                <span className="block text-[9px] uppercase font-black text-slate-900 dark:text-white mb-3">Observaciones</span>
                <p className="text-slate-800 dark:text-slate-300 text-[11px] leading-relaxed font-mono uppercase bg-slate-50 dark:bg-slate-900/50 p-4 border border-slate-100 dark:border-slate-800 min-h-[120px] whitespace-pre-wrap transition-colors">
                    {review.description}
                </p>

                {review.partsReplaced && review.partsReplaced.length > 0 && (
                    <div className="mt-6">
                        <span className="block text-[8px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-2">Componentes Sustituidos</span>
                        <div className="flex gap-2 flex-wrap">
                            {review.partsReplaced.map((part) => (
                                <span key={part} className="px-2 py-1 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 font-mono text-[9px] uppercase font-bold border border-slate-200 dark:border-slate-700">
                                    {part}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="p-8 grid grid-cols-2 gap-12 text-center bg-slate-50 dark:bg-slate-900 items-end transition-colors">
                <div className="border-t border-slate-300 dark:border-slate-700 pt-3">
                    <span className="text-[8px] uppercase text-slate-400 dark:text-slate-500 font-bold block mb-1">Firma Técnico</span>
                    <span className="font-bold text-[10px] uppercase text-slate-900 dark:text-white">{review.technician}</span>
                </div>
                <div className="border-t border-slate-300 dark:border-slate-700 pt-3">
                    <span className="text-[8px] uppercase text-slate-400 dark:text-slate-500 font-bold block mb-1">Firma Contribuyente</span>
                    <span className="font-bold text-[10px] uppercase text-slate-900 dark:text-white">{printer.businessName}</span>
                </div>
            </div>
        </div>
    );
}

function SingleInspectionSheet({ inspection, printer }: { inspection: AnnualInspection, printer: FiscalPrinter }) {
    return (
        <div className="flex flex-col h-full border border-slate-900 dark:border-slate-100 transition-colors">
            <div className="border-b border-slate-900 dark:border-slate-100 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2 flex justify-between items-center transition-colors">
                <h2 className="font-bold tracking-widest uppercase text-[10px]">Inspección Anual Obligatoria</h2>
                <span className="font-mono text-[10px] opacity-70">{inspection.id.toUpperCase()}</span>
            </div>

            <div className="grid grid-cols-4 divide-x divide-y divide-slate-400 dark:divide-slate-700 border-b border-slate-400 dark:border-slate-700 transition-colors">
                <div className="p-3 col-span-3">
                    <span className="block text-[8px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-0.5">Centro de Servicio Técnico</span>
                    <span className="font-bold text-slate-900 dark:text-white text-[11px] uppercase">{inspection.serviceCenter}</span>
                </div>
                <div className="p-3">
                    <span className="block text-[8px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-0.5">RIF CS</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-[11px]">{inspection.centerRif}</span>
                </div>

                <div className="p-3 col-span-2">
                    <span className="block text-[8px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-0.5">Inspector Actuante</span>
                    <span className="font-bold text-slate-900 dark:text-white text-[11px] uppercase">{inspection.inspector}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/50">
                    <span className="block text-[8px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-0.5">Estatus</span>
                    <span className="font-black uppercase text-[10px] dark:text-white">{inspection.status === 'passed' ? 'Aprobada' : 'Observaciones'}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/50">
                    <span className="block text-[8px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-0.5">Fecha</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-[11px]">{inspection.date}</span>
                </div>
            </div>

            <div className="p-6 flex-1 flex flex-col transition-colors">
                <span className="block text-[9px] uppercase font-black text-slate-900 dark:text-white mb-4">Acta de Conformidad</span>
                <div className="border border-slate-100 dark:border-slate-800 p-8 bg-slate-50/50 dark:bg-slate-900/30 flex-1 relative transition-colors">
                    <p className="text-slate-900 dark:text-slate-200 text-xs leading-relaxed font-mono uppercase">
                        {inspection.observations || 'SIN OBSERVACIONES. EL EQUIPO CUMPLE CON TODOS LOS REQUERIMIENTOS DE LA PROVIDENCIA 0141 DEL SENIAT.'}
                    </p>
                </div>
            </div>

            <div className="p-8 flex justify-end bg-slate-50 dark:bg-slate-900 items-end transition-colors">
                <div className="border-t border-slate-300 dark:border-slate-700 w-64 text-center pt-3">
                    <span className="text-[8px] uppercase text-slate-400 dark:text-slate-500 font-bold block mb-1">Firma y Sello Inspector</span>
                    <span className="font-bold text-[10px] uppercase text-slate-900 dark:text-white">{inspection.inspector}</span>
                </div>
            </div>
        </div>
    );
}

// SimplifiedRecord component and its usage are removed as html2canvas is no longer used.

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
