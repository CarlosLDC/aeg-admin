'use client';

import { useState, use, useEffect } from 'react';
import { FiscalPrinter, TechnicalReview, AnnualInspection } from '@/lib/mock-data';
import { printerService } from '@/lib/printer-service';
import Link from 'next/link';

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
            <main className="container mx-auto px-4 py-32 max-w-4xl text-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-500 font-medium">Cargando Libro Fiscal...</p>
            </main>
        );
    }

    if (!printer) {
        return (
            <main className="container mx-auto px-4 py-32 max-w-4xl text-center">
                <h1 className="text-3xl font-bold text-slate-900 mb-4">Equipo no encontrado</h1>
                <Link href="/" className="text-blue-600 hover:underline">← Volver al inicio</Link>
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

    return (
        <main className="container mx-auto px-2 py-6 md:py-12 max-w-[900px] min-h-screen flex flex-col items-center">

            {/* Context Header: Actions & Toggles */}
            <div className="w-full mb-6 flex flex-col md:flex-row gap-4 justify-between items-center bg-white/5 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors pl-2">
                    <ArrowLeft size={18} />
                    <span className="text-sm font-medium">Volver</span>
                </Link>

                {/* Elegant Segmented Controls for Mode Selection */}
                <div className="flex bg-slate-200/50 backdrop-blur p-1 rounded-xl shadow-inner">
                    <button
                        onClick={() => handleTabChange('info')}
                        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${viewMode === 'info' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Inf. Base
                    </button>
                    <button
                        onClick={() => handleTabChange('tech')}
                        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${viewMode === 'tech' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Servicios ({printer.technicalReviews.length})
                    </button>
                    <button
                        onClick={() => handleTabChange('inspection')}
                        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${viewMode === 'inspection' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Inspecciones ({printer.annualInspections.length})
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <div className="text-slate-500 text-xs font-mono font-bold bg-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-200">
                        {totalPages > 0 ? `Pag ${currentPage + 1}/${totalPages}` : 'Sin Registros'}
                    </div>
                </div>
            </div>

            {/* Formal Record Sheet (SENIAT Format) */}
            <div className="w-full bg-white text-slate-800 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-300 min-h-[850px] relative flex flex-col overflow-hidden">

                {/* Book Spine Simulation (Left Border Accent) */}
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-700 to-indigo-800 z-20"></div>

                {/* Content Area */}
                <div className="flex-1 px-8 py-10 md:px-14 md:py-12 relative z-10 flex flex-col">

                    {/* Official Banner */}
                    <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5 mb-8">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase">
                                Libro de Control y Reparación
                            </h1>
                            <p className="text-slate-500 text-sm font-bold tracking-widest uppercase mt-1">
                                Máquinas Fiscales - Providencia 0141
                            </p>
                        </div>
                        <div className="text-right flex flex-col items-end border border-slate-300 rounded p-2 bg-slate-50 min-w-[120px]">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Serial Fiscal</span>
                            <span className="font-mono text-base font-bold text-slate-900">{printer.serial}</span>
                        </div>
                    </div>

                    {/* Conditional Rendering of 1-Record Pages */}
                    <div className="flex-1 animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col">
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

                {/* Book Navigation Footer */}
                {viewMode !== 'info' && totalPages > 0 && (
                    <div className="mt-auto border-t-2 border-slate-200 px-8 py-5 bg-slate-50 flex justify-between items-center z-10 mx-1">
                        <button
                            onClick={handlePrev}
                            disabled={currentPage === 0}
                            className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-700 hover:text-blue-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        >
                            <ArrowLeft size={16} /> Hoja Previa
                        </button>

                        <div className="text-slate-400 font-mono text-xs">
                            HOJA OFICIAL DE REGISTRO {currentPage + 1}
                        </div>

                        <button
                            onClick={handleNext}
                            disabled={currentPage === totalPages - 1}
                            className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-700 hover:text-blue-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        >
                            Siguiente Hoja <ArrowRight size={16} />
                        </button>
                    </div>
                )}
            </div>
        </main>
    );
}

function EmptyState({ type }: { type: 'services' | 'inspections' }) {
    return (
        <div className="flex flex-col items-center justify-center flex-1 py-20 text-center opacity-50">
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-400 mb-4 flex items-center justify-center">
                <span className="text-2xl">📋</span>
            </div>
            <h3 className="text-lg font-bold text-slate-700">El libro está en blanco</h3>
            <p className="text-sm text-slate-500">No hay registros de {type === 'services' ? 'servicios técnicos' : 'inspecciones'} para esta impresora.</p>
        </div>
    );
}

// --- Omitted: InfoPage (remains visually as is, but renamed/scoped if needed. We'll keep InfoPage as is for now) ---
function InfoPage({ printer }: { printer: FiscalPrinter }) {
    return (
        <div className="space-y-8">
            <div className="bg-slate-50/50 p-6 md:p-8 rounded-none border-2 border-slate-900 border-dashed">
                <h2 className="text-sm uppercase tracking-widest font-black text-slate-900 mb-6 pb-2 border-b-2 border-slate-900">1. DATOS FISCALES DEL CONTRIBUYENTE</h2>
                <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase">{printer.businessName}</h3>
                <div className="inline-block px-4 py-1.5 bg-slate-900 text-white text-base font-mono font-bold">
                    RIF: {printer.rif}
                </div>
                <div className="mt-8">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 block">Domicilio Fiscal Registrado</label>
                    <p className="text-slate-900 font-medium mt-1 text-base leading-relaxed uppercase">{printer.address}</p>
                </div>
            </div>

            <div className="bg-slate-50/50 p-6 md:p-8 rounded-none border-2 border-slate-900 border-dashed">
                <h2 className="text-sm uppercase tracking-widest font-black text-slate-900 mb-6 pb-2 border-b-2 border-slate-900">2. ESPECIFICACIONES TÉCNICAS DEL EQUIPO</h2>
                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                    <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500 block">Marca / Modelo Aprobado</label>
                        <p className="text-slate-900 font-black mt-1 uppercase text-lg">{printer.model}</p>
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500 block">Serial Fiscal de Fábrica</label>
                        <p className="font-mono text-slate-900 mt-1 bg-white border-2 border-slate-900 px-3 py-1.5 inline-block text-lg font-bold">{printer.serial}</p>
                    </div>
                    <div className="col-span-2 pt-4 border-t border-slate-300">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500 block">Fecha de Inicialización / Registro</label>
                        <p className="text-slate-900 font-black mt-1 text-lg">{printer.registrationDate}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Official Single Sheets ---

function SingleTechSheet({ review, printer }: { review: TechnicalReview, printer: FiscalPrinter }) {
    return (
        <div className="border-2 border-slate-900 bg-white shadow-sm flex flex-col h-full">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
                <h2 className="font-black tracking-widest uppercase text-sm">Registro de Actuación Técnica</h2>
                <span className="font-mono text-sm">ID: {review.id.toUpperCase()}</span>
            </div>

            {/* Grid Layout representing a physical form */}
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y divide-slate-300 border-b border-slate-300">
                <div className="p-3 col-span-2 md:col-span-3">
                    <span className="block text-[9px] uppercase font-bold text-slate-500 mb-1">Centro de Servicio Técnico Autorizado (CS)</span>
                    <span className="font-bold text-slate-900 text-sm uppercase">{review.serviceCenter}</span>
                </div>
                <div className="p-3">
                    <span className="block text-[9px] uppercase font-bold text-slate-500 mb-1">RIF CS</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">{review.centerRif}</span>
                </div>

                <div className="p-3 col-span-2">
                    <span className="block text-[9px] uppercase font-bold text-slate-500 mb-1">Técnico Ejecutor</span>
                    <span className="font-bold text-slate-900 text-sm uppercase">{review.technician}</span>
                </div>
                <div className="p-3">
                    <span className="block text-[9px] uppercase font-bold text-slate-500 mb-1">C.I. Técnico</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">{review.technicianId}</span>
                </div>
                <div className="p-3 bg-slate-50">
                    <span className="block text-[9px] uppercase font-bold text-slate-500 mb-1">Fecha de Ejecución</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">{review.date}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-300 border-b border-slate-300 bg-slate-50">
                <div className="p-4 flex flex-col justify-center">
                    <span className="block text-[9px] uppercase font-bold text-slate-500 mb-2">Motivo de Intervención</span>
                    <span className="font-black text-blue-800 text-sm uppercase tracking-wide">{review.interventionType}</span>
                </div>
                <div className="p-4 grid grid-cols-2 gap-4">
                    <div>
                        <span className="block text-[9px] uppercase font-bold text-slate-500 mb-1">Cierre Z Inicial</span>
                        <span className="font-mono font-bold text-slate-900 bg-white border border-slate-200 px-2 py-0.5">{review.zReportStart}</span>
                    </div>
                    <div>
                        <span className="block text-[9px] uppercase font-bold text-slate-500 mb-1">Cierre Z Final</span>
                        <span className="font-mono font-bold text-slate-900 bg-white border border-slate-200 px-2 py-0.5">{review.zReportEnd}</span>
                    </div>
                </div>
                <div className="p-4 grid grid-cols-2 gap-4">
                    <div>
                        <span className="block text-[9px] uppercase font-bold text-slate-500 mb-1">Rotura Precinto</span>
                        <span className={`font-bold text-xs uppercase px-2 py-0.5 inline-block ${review.sealBroken ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-600'}`}>
                            {review.sealBroken ? 'SÍ' : 'NO'}
                        </span>
                    </div>
                    <div>
                        <span className="block text-[9px] uppercase font-bold text-slate-500 mb-1">Reemplazo Precinto</span>
                        <span className={`font-bold text-xs uppercase px-2 py-0.5 inline-block ${review.sealReplaced ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-600'}`}>
                            {review.sealReplaced ? 'SÍ' : 'NO'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="p-5 flex-1 border-b border-slate-300">
                <span className="block text-[10px] uppercase font-black tracking-widest text-slate-500 mb-3 border-b-2 border-slate-900 pb-1 w-max">Descripción Detallada y Observaciones</span>
                <p className="text-slate-800 text-sm leading-relaxed font-medium uppercase font-mono bg-yellow-50/30 p-4 border border-slate-100 min-h-[100px] whitespace-pre-wrap rounded">
                    {review.description}
                </p>

                {review.partsReplaced && review.partsReplaced.length > 0 && (
                    <div className="mt-6">
                        <span className="block text-[9px] uppercase font-bold text-slate-500 mb-2">Sustitución de Componentes</span>
                        <div className="flex gap-2 flex-wrap">
                            {review.partsReplaced.map((part) => (
                                <span key={part} className="px-3 py-1 bg-slate-100 text-slate-800 font-mono text-xs uppercase font-bold border-l-4 border-blue-600 shadow-sm">
                                    {part}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 grid grid-cols-2 gap-8 text-center bg-slate-50 h-32 items-end pb-4">
                <div className="border-t border-slate-400 mx-8 flex flex-col pt-2">
                    <span className="font-bold text-xs uppercase text-slate-800">{review.technician}</span>
                    <span className="text-[9px] uppercase text-slate-500 font-bold">Firma Técnico Autorizado</span>
                </div>
                <div className="border-t border-slate-400 mx-8 flex flex-col pt-2 opacity-50">
                    <span className="font-bold text-xs uppercase text-slate-800">{printer.businessName}</span>
                    <span className="text-[9px] uppercase text-slate-500 font-bold">Firma Representante / Contribuyente</span>
                </div>
            </div>
        </div>
    );
}

function SingleInspectionSheet({ inspection, printer }: { inspection: AnnualInspection, printer: FiscalPrinter }) {
    return (
        <div className="border-2 border-slate-900 bg-white shadow-sm flex flex-col h-full">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
                <h2 className="font-black tracking-widest uppercase text-sm flex items-center gap-2">
                    <ShieldCheckIcon size={18} />
                    Inspección Anual Obligatoria (SENIAT)
                </h2>
                <span className="font-mono text-sm">ID: {inspection.id.toUpperCase()}</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y divide-slate-300 border-b border-slate-300">
                <div className="p-3 col-span-2 md:col-span-3">
                    <span className="block text-[9px] uppercase font-bold text-slate-500 mb-1">Centro de Servicio Técnico Participante</span>
                    <span className="font-bold text-slate-900 text-sm uppercase">{inspection.serviceCenter}</span>
                </div>
                <div className="p-3">
                    <span className="block text-[9px] uppercase font-bold text-slate-500 mb-1">RIF CS</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">{inspection.centerRif}</span>
                </div>

                <div className="p-3 col-span-2">
                    <span className="block text-[9px] uppercase font-bold text-slate-500 mb-1">Funcionario / Inspector Actuante</span>
                    <span className="font-bold text-slate-900 text-sm uppercase">{inspection.inspector}</span>
                </div>
                <div className="p-3 bg-slate-50 flex flex-col justify-center items-start">
                    <span className="block text-[9px] uppercase font-bold text-slate-500 mb-1">Dictamen / Estatus</span>
                    <span className={`font-black uppercase tracking-widest text-xs px-2 py-0.5 ${inspection.status === 'passed' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300'} border`}>
                        {inspection.status === 'passed' ? 'Aprobada' : 'Observaciones'}
                    </span>
                </div>
                <div className="p-3 bg-slate-50 flex flex-col justify-center">
                    <span className="block text-[9px] uppercase font-bold text-slate-500 mb-1">Fecha de Inspección</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">{inspection.date}</span>
                </div>
            </div>

            <div className="p-6 md:p-8 flex-1 border-b border-slate-300 flex flex-col">
                <span className="block text-[10px] uppercase font-black tracking-widest text-slate-500 mb-4 border-b-2 border-slate-900 pb-1 w-max">Acta de Conformidad y Observaciones</span>

                <div className="border border-slate-300 p-6 flex-1 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+Cgo8cGF0aCBkPSJNMCAwbDQwIDQweiIgc3Ryb2tlPSIjZTJlOGYwIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiLz4KPC9zdmc+')] bg-repeat relative">
                    <div className="absolute inset-x-8 top-8 bottom-8 bg-white/90 backdrop-blur-sm p-4 rounded border border-white/50 shadow-inner">
                        <p className="text-slate-900 text-base leading-relaxed font-mono font-medium uppercase min-h-[200px]">
                            {inspection.observations || 'SIN OBSERVACIONES. EL EQUIPO CUMPLE CON TODOS LOS REQUERIMIENTOS DE LA PROVIDENCIA 0141 DEL SENIAT.'}
                        </p>
                        <div className="border-t border-slate-200 pt-4 mt-8">
                            <p className="text-xs text-slate-500 italic max-w-lg">
                                Esta inspección certifica el correcto funcionamiento del dispositivo de transmisión de datos y la integridad de la memoria fiscal y de auditoría.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 flex gap-8 justify-end bg-slate-50 h-32 items-end pb-4">
                <div className="border-t border-slate-400 w-64 flex flex-col pt-2 text-center">
                    <span className="font-bold text-xs uppercase text-slate-800">{inspection.inspector}</span>
                    <span className="text-[9px] uppercase text-slate-500 font-bold">Firma y Sello Inspector Actuante</span>
                </div>
            </div>
        </div>
    );
}

// --- Specific Icons ---
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

function ToolIcon({ size, className }: { size: number; className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
    );
}

function ShieldCheckIcon({ size, className }: { size: number; className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /><path d="m9 12 2 2 4-4" />
        </svg>
    );
}

function DownloadIcon({ size, className }: { size: number; className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
        </svg>
    );
}
