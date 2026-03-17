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

// Helper function to find the active seal
const getActiveSealSerial = (printer: FiscalPrinter) => {
    if (!printer.precintos || printer.precintos.length === 0) {
        return 'SIN PRECINTO ACTIVO';
    }
    
    const activeSeal = printer.precintos.find(precinto => 
        precinto.id_impresora !== null && precinto.estatus === 'en_impresora'
    );
    
    return activeSeal ? activeSeal.serial : 'SIN PRECINTO ACTIVO';
};

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
    const records = viewMode === 'tech'
        ? printer.technicalReviews
        : viewMode === 'inspection'
            ? printer.annualInspections
            : [];
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
            let y = 25;

            // Header
            // Background for header
            doc.setFillColor(245, 245, 245); // Light gray background
            doc.rect(margin - 5, y - 5, 190, 20, 'F'); // Rectangle for header background, wider

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(24);
            doc.setTextColor(0, 0, 0); // Black
            doc.text('AEG', margin, y);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(80, 80, 80); // Dark gray
            doc.text('ALPHA ENGINEER GROUP, C.A.', margin, y + 5);
            doc.setFontSize(8);
            doc.text('RIF: J-40582910-3 | CONTROL FISCAL SENIAT 0141', margin, y + 10);

            // Serial Box in PDF (Slightly smaller)
            doc.setDrawColor(200, 200, 200);
            doc.setFillColor(252, 252, 252);
            doc.roundedRect(150, y - 5, 40, 15, 1, 1, 'FD');

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(120, 120, 120);
            doc.text('SERIAL FISCAL', 188, y, { align: 'right' });
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0);
            doc.text(printer.serial_fiscal, 188, y + 6, { align: 'right' });

            doc.setDrawColor(100, 100, 100); // Gray line
            doc.setLineWidth(0.2); // Thinner line
            doc.line(margin, y + 15, 200 - margin, y + 15);

            y = y + 25;

            // Function to add page if needed
            const checkPageBreak = () => {
                if (y > 250) {
                    doc.addPage();
                    y = 25;
                }
            };

            // Section 1: DATOS DEL FABRICANTE
            doc.setFillColor(250, 250, 250); // Very light gray
            doc.rect(margin - 2, y - 2, 170, 8, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text('1. DATOS DEL FABRICANTE', margin, y);
            y += 10;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(60, 60, 60); // Medium gray
            doc.text('Razón Social: ALPHA ENGINEER GROUP, C.A.', margin, y); y += 6;
            doc.text('RIF: J504594369', margin, y); y += 6;
            doc.text('Teléfono: +58 4242913038', margin, y); y += 6;
            doc.text('Domicilio Fiscal: AVENIDA BICENTENARIO, REDOMA DEL TAMBOR, EDIFICIO VERACRUZ, PISO 1, LOCAL N° 3', margin, y); y += 6;
            doc.text('Ciudad: LOS TEQUES', margin, y); y += 6;
            doc.text('Estado: MIRANDA', margin, y); y += 6;
            doc.text('Correo: soportealphavzla@gmail.com', margin, y); y += 10;

            checkPageBreak();

            // Section 2: DATOS DEL ENAJENADOR
            doc.setFillColor(250, 250, 250);
            doc.rect(margin - 2, y - 2, 170, 8, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text('2. DATOS DEL ENAJENADOR', margin, y);
            y += 10;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(60, 60, 60);
            if (printer.distribuidora?.sucursal) {
                const dist = printer.distribuidora.sucursal;
                doc.text(`Razón Social: ${dist.company?.razon_social || 'N/A'}`, margin, y); y += 6;
                doc.text(`RIF: ${dist.company?.rif || 'N/A'}`, margin, y); y += 6;
                doc.text(`Tipo de Contribuyente: ${dist.company?.tipo_contribuyente || 'N/A'}`, margin, y); y += 6;
                if (dist.direccion) { doc.text(`Dirección: ${dist.direccion}`, margin, y); y += 6; }
                doc.text(`Ciudad: ${dist.ciudad || 'N/A'}`, margin, y); y += 6;
                doc.text(`Estado: ${dist.estado || 'N/A'}`, margin, y); y += 6;
                if (dist.telefono) { doc.text(`Teléfono: ${dist.telefono}`, margin, y); y += 6; }
                if (dist.correo) { doc.text(`Correo: ${dist.correo}`, margin, y); y += 6; }
            } else {
                doc.text('Sin enajenador registrado.', margin, y); y += 6;
            }
            y += 4;

            checkPageBreak();

            // Section 3: DATOS DEL CONTRIBUYENTE/USUARIO
            doc.setFillColor(250, 250, 250);
            doc.rect(margin - 2, y - 2, 170, 8, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text('3. DATOS DEL CONTRIBUYENTE/USUARIO', margin, y);
            y += 10;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(60, 60, 60);
            doc.text(`Razón Social: ${printer.businessName || 'N/A'}`, margin, y); y += 6;
            doc.text(`RIF: ${printer.rif || 'N/A'}`, margin, y); y += 6;
            doc.text(`Tipo de Contribuyente: ${printer.taxpayerType || 'N/A'}`, margin, y); y += 6;
            doc.text(`Domicilio Fiscal: ${printer.address || 'N/A'}`, margin, y); y += 6;
            doc.text(`Ciudad: ${printer.sucursal?.ciudad || 'N/A'}`, margin, y); y += 6;
            doc.text(`Estado: ${printer.sucursal?.estado || 'N/A'}`, margin, y); y += 10;

            checkPageBreak();

            // Section 4: DATOS DEL LUGAR DE INSTALACIÓN
            doc.setFillColor(250, 250, 250);
            doc.rect(margin - 2, y - 2, 170, 8, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text('4. DATOS DEL LUGAR DE INSTALACIÓN', margin, y);
            y += 10;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(60, 60, 60);
            doc.text(`Dirección: ${printer.sucursal?.direccion || 'N/A'}`, margin, y); y += 6;
            doc.text(`Ciudad: ${printer.sucursal?.ciudad || 'N/A'}`, margin, y); y += 6;
            doc.text(`Estado: ${printer.sucursal?.estado || 'N/A'}`, margin, y); y += 6;
            doc.text(`Teléfono: ${printer.sucursal?.telefono || 'N/A'}`, margin, y); y += 6;
            doc.text(`Correo Electrónico: ${printer.sucursal?.correo || 'N/A'}`, margin, y); y += 10;

            checkPageBreak();

            // Section 5: DATOS DE LA MÁQUINA FISCAL
            doc.setFillColor(250, 250, 250);
            doc.rect(margin - 2, y - 2, 170, 8, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text('5. DATOS DE LA MÁQUINA FISCAL', margin, y);
            y += 10;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(60, 60, 60);
            doc.text(`Número de Registro (serial): ${printer.serial_fiscal}`, margin, y); y += 6;
            doc.text(`Marca: ${printer.modelo?.marca || 'N/A'}`, margin, y); y += 6;
            doc.text(`Modelo: ${printer.modelo?.codigo_modelo || 'N/A'}`, margin, y); y += 6;
            const activeSeal = getActiveSealSerial(printer);
            doc.text(`Serial del Precinto: ${activeSeal}`, margin, y); y += 6;
            doc.text(`Fecha de Instalación: ${printer.created_at ? new Date(printer.created_at).toLocaleDateString('es-VE') : 'N/A'}`, margin, y); y += 6;
            doc.text(`Tipo de Dispositivo Fiscal: ${printer.tipo_dispositivo}`, margin, y); y += 6;
            doc.text(`Versión del Firmware: ${printer.version_firmware || 'N/A'}`, margin, y); y += 10;

            // Section 6: DATOS DEL SOFTWARE
            doc.setFillColor(250, 250, 250);
            doc.rect(margin - 2, y - 2, 170, 8, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text('6. DATOS DEL SOFTWARE', margin, y);
            y += 10;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(60, 60, 60);
            doc.text(`Nombre: ${printer.software?.nombre || 'N/A'}`, margin, y); y += 6;
            doc.text(`Versión: ${printer.software?.version || 'N/A'}`, margin, y); y += 10;

            // --- PAGE 2: DETAILS ---
            if (viewMode !== 'info' && currentRecord) {
                doc.addPage();
                y = 25;

                // Re-draw header on new page
                doc.setFillColor(245, 245, 245);
                doc.rect(margin - 5, y - 5, 190, 20, 'F');
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(24);
                doc.setTextColor(0, 0, 0);
                doc.text('AEG', margin, y);

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);
                doc.setTextColor(80, 80, 80);
                doc.text('ALPHA ENGINEER GROUP, C.A.', margin, y + 5);
                doc.setFontSize(8);
                doc.text('RIF: J-40582910-3 | CONTROL FISCAL SENIAT 0141', margin, y + 10);

                // Serial Box in PDF (Page 2 - Slightly smaller)
                doc.setDrawColor(200, 200, 200);
                doc.setFillColor(252, 252, 252);
                doc.roundedRect(150, y - 5, 40, 15, 1, 1, 'FD');

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                doc.setTextColor(120, 120, 120);
                doc.text('SERIAL FISCAL', 188, y, { align: 'right' });
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(11);
                doc.setTextColor(0, 0, 0);
                doc.text(printer.serial_fiscal, 188, y + 6, { align: 'right' });

                doc.setDrawColor(100, 100, 100);
                doc.setLineWidth(0.2);
                doc.line(margin, y + 15, 200 - margin, y + 15);

                y = y + 25;

                if (viewMode === 'tech') {
                    const tr = currentRecord as TechnicalReview;

                    // Section 1: DATOS DEL SERVICIO
                    doc.setFillColor(250, 250, 250);
                    doc.rect(margin - 2, y - 2, 170, 8, 'F');
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(12);
                    doc.setTextColor(0, 0, 0);
                    doc.text('1. DATOS DEL SERVICIO', margin, y);
                    y += 10;

                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(10);
                    doc.setTextColor(60, 60, 60);
                    doc.text(`Centro Autorizado: ${tr.serviceCenter}`, margin, y); y += 6;
                    doc.text(`RIF Centro: ${tr.centerRif}`, margin, y); y += 6;
                    doc.text(`Fecha de Solicitud: ${tr.fechaSolicitud || 'N/D'}`, margin, y); y += 6;
                    doc.text(`Fecha de Inicio: ${tr.date}`, margin, y); y += 6;
                    doc.text(`Fecha de Fin: ${tr.date}`, margin, y); y += 6;
                    doc.text(`Primera Reporte Z: ${tr.zReportStart}`, margin, y); y += 6;
                    doc.text(`Fecha y Hora de Primer Reporte Z: ${tr.zReportTimestampStart || 'N/D'}`, margin, y); y += 6;
                    doc.text(`Último Reporte Z: ${tr.zReportEnd}`, margin, y); y += 6;
                    doc.text(`Fecha y Hora de Último Reporte Z: ${tr.zReportTimestampEnd || 'N/D'}`, margin, y); y += 10;

                    checkPageBreak();

                    // Section 2: GESTIÓN DE PRECINTOS
                    doc.setFillColor(250, 250, 250);
                    doc.rect(margin - 2, y - 2, 170, 8, 'F');
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(12);
                    doc.setTextColor(0, 0, 0);
                    doc.text('2. GESTIÓN DE PRECINTOS', margin, y);
                    y += 10;

                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(10);
                    doc.setTextColor(60, 60, 60);
                    doc.text(`Serial del Precinto Actual: ${tr.currentSealSerial || 'N/D'}`, margin, y); y += 6;
                    doc.text(`¿Precinto Violentado?: ${tr.sealBroken ? 'SÍ' : 'NO'}`, margin, y); y += 6;
                    doc.text(`¿Se Cambió el Precinto?: ${tr.sealReplaced ? 'SÍ' : 'NO'}`, margin, y); y += 6;
                    doc.text(`Serial del Nuevo Precinto: ${tr.newSealSerial || 'N/D'}`, margin, y); y += 10;

                    checkPageBreak();

                    // Section 3: DETALLES DE LA INTERVENCIÓN
                    doc.setFillColor(250, 250, 250);
                    doc.rect(margin - 2, y - 2, 170, 8, 'F');
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(12);
                    doc.setTextColor(0, 0, 0);
                    doc.text('3. DETALLES DE LA INTERVENCIÓN', margin, y);
                    y += 10;

                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(10);
                    doc.setTextColor(60, 60, 60);
                    const description = tr.description || 'N/A';
                    const splitDesc = doc.splitTextToSize(description.toUpperCase(), 160);
                    doc.text(splitDesc, margin, y);
                    y += (Array.isArray(splitDesc) ? splitDesc.length : 1) * 6 + 10;

                    // Section 4: CIERRE Y RESPONSABILIDADES
                    doc.setFillColor(250, 250, 250);
                    doc.rect(margin - 2, y - 2, 170, 8, 'F');
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(12);
                    doc.setTextColor(0, 0, 0);
                    doc.text('4. CIERRE Y RESPONSABILIDADES', margin, y);
                    y += 25;

                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(8);
                    doc.setTextColor(60, 60, 60);
                    doc.text('TÉCNICO AUTORIZADO', margin + 35, y, { align: 'center' });
                    doc.text('PERSONA QUE RECIBE', 155, y, { align: 'center' });
                    doc.setDrawColor(100, 100, 100);
                    doc.setLineWidth(0.2);
                    doc.line(margin, y - 5, margin + 70, y - 5);
                    doc.line(120, y - 5, 120 + 70, y - 5);

                } else if (viewMode === 'inspection') {
                    const ai = currentRecord as AnnualInspection;

                    // Section 1: DATOS DEL CENTRO Y TÉCNICO
                    doc.setFillColor(250, 250, 250);
                    doc.rect(margin - 2, y - 2, 170, 8, 'F');
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(12);
                    doc.setTextColor(0, 0, 0);
                    doc.text('1. DATOS DEL CENTRO Y TÉCNICO', margin, y);
                    y += 10;

                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(10);
                    doc.setTextColor(60, 60, 60);
                    doc.text(`Centro de Servicio: ${ai.serviceCenter}`, margin, y); y += 6;
                    doc.text(`RIF Centro: ${ai.centerRif}`, margin, y); y += 6;
                    doc.text(`Fecha de Inspección: ${ai.date}`, margin, y); y += 6;
                    doc.text(`Inspector Actuante: ${ai.inspector}`, margin, y); y += 10;

                    checkPageBreak();

                    // Section 2: DETALLES DE LA INSPECCIÓN
                    doc.setFillColor(250, 250, 250);
                    doc.rect(margin - 2, y - 2, 170, 8, 'F');
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(12);
                    doc.setTextColor(0, 0, 0);
                    doc.text('2. DETALLES DE LA INSPECCIÓN', margin, y);
                    y += 10;

                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(10);
                    doc.setTextColor(60, 60, 60);
                    const observations = ai.observations || 'N/D';
                    const splitObs = doc.splitTextToSize(observations.toUpperCase(), 160);
                    doc.text(splitObs, margin, y);
                    y += (Array.isArray(splitObs) ? splitObs.length : 1) * 6 + 15;

                    // Firmas
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(8);
                    doc.setTextColor(80, 80, 80);
                    doc.text('FIRMA INSPECTOR', margin + 35, y, { align: 'center' });
                    doc.text('FIRMA CONTRIBUYENTE', 155, y, { align: 'center' });
                    doc.setDrawColor(100, 100, 100);
                    doc.setLineWidth(0.2);
                    doc.line(margin, y - 5, margin + 70, y - 5);
                    doc.line(120, y - 5, 120 + 70, y - 5);
                }
            }

            // Footer
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(120, 120, 120);
            doc.text(`Documento generado por Portal de Auditoría AEG - ${new Date().toLocaleString()}`, 105, 275, { align: 'center' });

            const filename = `${printer.serial_fiscal}-${new Date().getTime()}.pdf`;
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
                        width: 21.59cm !important;
                        height: 27.94cm !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        border: none !important;
                        box-shadow: none !important;
                        background: white !important;
                        color: black !important;
                    }
                    .print-content {
                        padding: 1.5cm 2cm !important;
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
            <div className="no-print w-full max-w-[900px] mb-6 flex flex-col md:flex-row gap-4 justify-between items-center bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl p-3 rounded-2xl border border-slate-200 dark:border-slate-800 transition-all sticky top-[68px] z-40 shadow-sm hover:shadow-md">

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
                </div>

                {/* Right: Actions (Spacer 2) */}
                <div className="flex-1 flex items-center justify-end gap-4 w-full md:w-auto">
                    {viewMode !== 'info' && totalPages > 0 && (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100/50 dark:bg-slate-800/20 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                            <button
                                onClick={handlePrev}
                                disabled={currentPage === 0}
                                className="h-8 w-8 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all shadow-sm"
                                title="Anterior"
                            >
                                <ArrowLeft size={14} />
                            </button>
                            <div className="h-8 px-3 flex items-center justify-center text-muted dark:text-slate-400 text-[10px] font-mono font-bold bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 transition-all">
                                {currentPage + 1} / {totalPages}
                            </div>
                            <button
                                onClick={handleNext}
                                disabled={currentPage === totalPages - 1}
                                className="h-8 w-8 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all shadow-sm"
                                title="Siguiente"
                            >
                                <ArrowRight size={14} />
                            </button>
                        </div>
                    )}
                    
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
                </div>
            </div>

            {/* Formal Record Sheet */}
            <div className="w-full overflow-x-auto pb-6">
                <div className="print-container w-full md:max-w-[21.59cm] bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 shadow-xl border border-slate-200 dark:border-slate-800 relative flex flex-col overflow-hidden transition-colors mx-auto">

                    {/* Content Area */}
                    <div className="print-content flex-1 px-6 py-8 md:px-16 md:py-14 relative z-10 flex flex-col">

                        {/* Official Banner - Simplified */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-900 dark:border-slate-100 pb-6 mb-10 gap-4 sm:gap-0">
                            <div>
                                <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                                    Libro de Control y Reparación
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold tracking-[0.2em] uppercase mt-1">
                                    Máquina Fiscal - Providencia SENIAT 0141
                                </p>
                            </div>
                            <div className="text-right flex flex-col items-end border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2 bg-slate-50 dark:bg-slate-900 transition-colors shadow-sm">
                                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-0.5">Serial Fiscal</span>
                                <span className="font-mono text-base font-black text-slate-900 dark:text-white leading-none">{printer.serial_fiscal}</span>
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
                <h2 className="text-[11px] uppercase tracking-widest font-black text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-100 dark:border-slate-900">1. DATOS DEL FABRICANTE</h2>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border border-slate-100 dark:border-slate-900 transition-colors">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Razón Social</label>
                            <p className="text-slate-900 dark:text-white font-black uppercase text-lg">ALPHA ENGINEER GROUP, C.A.</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">RIF</label>
                            <p className="font-mono text-slate-900 dark:text-white text-sm font-bold">J504594369</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">TELÉFONO</label>
                            <p className="font-mono text-slate-900 dark:text-white text-sm font-bold">+58 4242913038</p>
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Domicilio fiscal</label>
                            <p className="text-slate-700 dark:text-slate-300 font-medium text-sm">AVENIDA BICENTENARIO, REDOMA DEL TAMBOR, EDIFICIO VERACRUZ, PISO 1, LOCAL N° 3</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Ciudad</label>
                            <p className="text-slate-700 dark:text-slate-300 font-medium text-sm">LOS TEQUES</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Estado</label>
                            <p className="text-slate-700 dark:text-slate-300 font-medium text-sm">MIRANDA</p>
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">CORREO</label>
                            <p className="font-mono text-slate-900 dark:text-white text-sm font-bold">soportealphavzla@gmail.com</p>
                        </div>
                    </div>
                </div>
            </section>

            <section>
                <h2 className="text-[11px] uppercase tracking-widest font-black text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-100 dark:border-slate-900">2. DATOS DEL ENAJENADOR</h2>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border border-slate-100 dark:border-slate-900 transition-colors">
                    {printer.distribuidora?.sucursal ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Razón Social</label>
                                <p className="text-slate-900 dark:text-white font-black uppercase text-lg">{printer.distribuidora.sucursal.company?.razon_social || 'N/D'}</p>
                            </div>
                            <div>
                                <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">RIF</label>
                                <p className="font-mono text-slate-900 dark:text-white text-sm font-bold">{printer.distribuidora.sucursal.company?.rif || 'N/D'}</p>
                            </div>
                            <div>
                                <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Tipo de Contribuyente</label>
                                <p className="text-slate-700 dark:text-slate-300 font-medium text-sm">{printer.distribuidora.sucursal.company?.tipo_contribuyente || 'N/D'}</p>
                            </div>
                            {printer.distribuidora.sucursal.direccion && (
                                <div className="md:col-span-2">
                                    <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Dirección</label>
                                    <p className="text-slate-700 dark:text-slate-300 font-medium text-sm">{printer.distribuidora.sucursal.direccion}</p>
                                </div>
                            )}
                            <div>
                                <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Ciudad</label>
                                <p className="text-slate-700 dark:text-slate-300 font-medium text-sm">{printer.distribuidora.sucursal.ciudad || 'N/D'}</p>
                            </div>
                            <div>
                                <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Estado</label>
                                <p className="text-slate-700 dark:text-slate-300 font-medium text-sm">{printer.distribuidora.sucursal.estado || 'N/D'}</p>
                            </div>
                            {printer.distribuidora.sucursal.telefono && (
                                <div>
                                    <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Teléfono</label>
                                    <p className="font-mono text-slate-900 dark:text-white text-sm font-bold">{printer.distribuidora.sucursal.telefono}</p>
                                </div>
                            )}
                            {printer.distribuidora.sucursal.correo && (
                                <div>
                                    <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Correo</label>
                                    <p className="font-mono text-slate-900 dark:text-white text-sm font-bold">{printer.distribuidora.sucursal.correo}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-slate-400 dark:text-slate-600 text-sm italic">Sin enajenador registrado.</p>
                    )}
                </div>
            </section>

            <section>
                <h2 className="text-[11px] uppercase tracking-widest font-black text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-100 dark:border-slate-900">3. DATOS DEL CONTRIBUYENTE/USUARIO</h2>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border border-slate-100 dark:border-slate-900 transition-colors">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Razón Social</label>
                            <p className="text-slate-900 dark:text-white font-black uppercase text-lg">{printer.businessName}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">RIF</label>
                            <p className="font-mono text-slate-900 dark:text-white text-sm font-bold">{printer.rif}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Tipo de Contribuyente</label>
                            <p className="text-slate-700 dark:text-slate-300 font-medium text-sm">{printer.taxpayerType || 'N/A'}</p>
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Domicilio Fiscal</label>
                            <p className="text-slate-700 dark:text-slate-300 font-medium text-sm">{printer.address}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Ciudad</label>
                            <p className="text-slate-700 dark:text-slate-300 font-medium text-sm">{printer.sucursal?.ciudad || 'N/A'}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Estado</label>
                            <p className="text-slate-700 dark:text-slate-300 font-medium text-sm">{printer.sucursal?.estado || 'N/A'}</p>
                        </div>
                    </div>
                </div>
            </section>

            <section>
                <h2 className="text-[11px] uppercase tracking-widest font-black text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-100 dark:border-slate-900">4. DATOS DEL LUGAR DE INSTALACIÓN</h2>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border border-slate-100 dark:border-slate-900 transition-colors">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Dirección Completa</label>
                            <p className="text-slate-700 dark:text-slate-300 font-medium text-sm">{printer.sucursal?.direccion || 'N/D'}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Ciudad</label>
                            <p className="text-slate-700 dark:text-slate-300 font-medium text-sm">{printer.sucursal?.ciudad || 'N/D'}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Estado</label>
                            <p className="text-slate-700 dark:text-slate-300 font-medium text-sm">{printer.sucursal?.estado || 'N/D'}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Teléfono</label>
                            <p className="text-slate-700 dark:text-slate-300 font-medium text-sm">{printer.sucursal?.telefono || 'N/D'}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Correo Electrónico</label>
                            <p className="text-slate-700 dark:text-slate-300 font-medium text-sm">{printer.sucursal?.correo || 'N/D'}</p>
                        </div>
                    </div>
                </div>
            </section>

            <section>
                <h2 className="text-[11px] uppercase tracking-widest font-black text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-100 dark:border-slate-900">5. DATOS DE LA MÁQUINA FISCAL</h2>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border border-slate-100 dark:border-slate-900 transition-colors">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Número de Registro (serial)</label>
                            <p className="font-mono text-slate-900 dark:text-white text-sm font-bold">{printer.serial_fiscal || 'N/D'}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Tipo de Dispositivo Fiscal</label>
                            <p className="font-mono text-slate-900 dark:text-white text-sm font-bold uppercase">{printer.tipo_dispositivo || 'N/D'}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Marca</label>
                            <p className="text-slate-900 dark:text-white font-black uppercase text-sm">{printer.modelo?.marca || 'N/D'}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Modelo</label>
                            <p className="text-slate-900 dark:text-white font-black uppercase text-sm">{printer.modelo?.codigo_modelo || 'N/D'}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Serial del Precinto</label>
                            <p className="font-mono text-slate-900 dark:text-white text-sm font-bold">
                                {getActiveSealSerial(printer) || 'N/D'}
                            </p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Fecha de Instalación</label>
                            <p className="font-mono text-slate-900 dark:text-white text-sm font-bold">
                                {printer.created_at ? new Date(printer.created_at).toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/D'}
                            </p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Versión del Firmware</label>
                            <p className="font-mono text-slate-900 dark:text-white font-black text-sm">{printer.version_firmware || 'N/D'}</p>
                        </div>
                    </div>
                </div>
            </section>

            <section>
                <h2 className="text-[11px] uppercase tracking-widest font-black text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-100 dark:border-slate-900">6. DATOS DEL SOFTWARE</h2>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border border-slate-100 dark:border-slate-900 transition-colors">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Nombre</label>
                            <p className="font-mono text-slate-900 dark:text-white text-sm font-bold uppercase">{printer.software?.nombre || 'N/D'}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Versión</label>
                            <p className="font-mono text-slate-900 dark:text-white text-sm font-bold uppercase">{printer.software?.version || 'N/D'}</p>
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
                <h2 className="text-[11px] uppercase tracking-widest font-black text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-100 dark:border-slate-900">1. DATOS DEL SERVICIO</h2>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border border-slate-100 dark:border-slate-900 transition-colors">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Centro de Servicio Técnico Autorizado</label>
                            <p className="text-slate-900 dark:text-white font-black uppercase text-sm">{review.serviceCenter}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">RIF Centro de Servicio</label>
                            <p className="font-mono text-slate-900 dark:text-white text-sm font-bold">{review.centerRif}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Fecha de Solicitud</label>
                            <p className="font-mono text-slate-900 dark:text-white text-sm font-bold">{review.fechaSolicitud}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Fecha de Inicio</label>
                            <p className="font-mono text-slate-900 dark:text-white text-sm font-bold">{review.date}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Fecha de Fin</label>
                            <p className="font-mono text-slate-900 dark:text-white text-sm font-bold">{review.date}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Primera Reporte Z</label>
                            <p className="font-mono text-slate-900 dark:text-white text-sm font-bold">{review.zReportStart}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Fecha y Hora de Primer Reporte Z</label>
                            <p className="font-mono text-slate-900 dark:text-white text-sm font-bold">{review.zReportTimestampStart}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Último Reporte Z</label>
                            <p className="font-mono text-slate-900 dark:text-white text-sm font-bold">{review.zReportEnd}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Fecha y Hora de Último Reporte Z</label>
                            <p className="font-mono text-slate-900 dark:text-white text-sm font-bold">{review.zReportTimestampEnd}</p>
                        </div>
                    </div>
                </div>
            </section>

            <section>
                <h2 className="text-[11px] uppercase tracking-widest font-black text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-100 dark:border-slate-900">2. GESTIÓN DE PRECINTOS</h2>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border border-slate-100 dark:border-slate-900 transition-colors">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Serial del Precinto Actual</label>
                            <p className="font-mono text-slate-900 dark:text-white text-sm font-bold">{review.currentSealSerial || 'SIN PRECINTO ACTIVO'}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">¿Precinto Violentado?</label>
                            <p className={`font-black text-sm uppercase ${review.sealBroken ? 'text-red-500' : 'text-emerald-500'}`}>{review.sealBroken ? 'SÍ' : 'NO'}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">¿Se Cambió el Precinto?</label>
                            <p className={`font-black text-sm uppercase ${review.sealReplaced ? 'text-blue-500' : 'text-slate-400'}`}>{review.sealReplaced ? 'SÍ' : 'NO'}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Serial del Nuevo Precinto</label>
                            <p className="font-mono text-slate-900 dark:text-white text-sm font-bold">{review.newSealSerial || 'N/A'}</p>
                        </div>
                    </div>
                </div>
            </section>

            <section>
                <h2 className="text-[11px] uppercase tracking-widest font-black text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-100 dark:border-slate-900">3. DETALLES DE LA INTERVENCIÓN</h2>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border border-slate-100 dark:border-slate-900 transition-colors">
                    <div>
                        <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Falla Reportada y Acción Realizada</label>
                        <p className="text-slate-800 dark:text-slate-200 font-medium text-sm leading-relaxed uppercase bg-white/50 dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 whitespace-pre-wrap">
                            {review.description || 'SIN DESCRIPCIÓN'}
                        </p>
                    </div>
                </div>
            </section>

            <section>
                <h2 className="text-[11px] uppercase tracking-widest font-black text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-100 dark:border-slate-900">4. CIERRE Y RESPONSABILIDADES</h2>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border border-slate-100 dark:border-slate-900 transition-colors">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Técnico Autorizado</label>
                            <p className="text-slate-900 dark:text-white font-black uppercase text-sm">{review.technician}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Persona que Recibe</label>
                            <p className="text-slate-900 dark:text-white font-black uppercase text-sm">{printer.businessName}</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

function SingleInspectionSheet({ inspection, printer }: { inspection: AnnualInspection, printer: FiscalPrinter }) {
    return (
        <div className="space-y-12">
            <section>
                <h2 className="text-[11px] uppercase tracking-widest font-black text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-100 dark:border-slate-900">1. DATOS DEL CENTRO Y TÉCNICO</h2>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border border-slate-100 dark:border-slate-900 transition-colors">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Centro de Servicio Técnico</label>
                            <p className="text-slate-900 dark:text-white font-black uppercase text-sm">{inspection.serviceCenter}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">RIF Centro de Servicio</label>
                            <p className="font-mono text-slate-900 dark:text-white text-sm font-bold">{inspection.centerRif}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Fecha de Inspección</label>
                            <p className="font-mono text-slate-900 dark:text-white text-sm font-bold">{inspection.date}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Inspector Actuante</label>
                            <p className="text-slate-900 dark:text-white font-black uppercase text-sm">{inspection.inspector}</p>
                        </div>
                    </div>
                </div>
            </section>

            <section>
                <h2 className="text-[11px] uppercase tracking-widest font-black text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-100 dark:border-slate-900">2. DETALLES DE LA INSPECCIÓN</h2>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border border-slate-100 dark:border-slate-900 transition-colors">
                    <div>
                        <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Observaciones y Hallazgos</label>
                        <p className="text-slate-800 dark:text-slate-200 font-medium text-sm leading-relaxed uppercase bg-white/50 dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 whitespace-pre-wrap">
                            {inspection.observations || 'EL EQUIPO CUMPLE SATISFACTORIAMENTE CON TODOS LOS REQUERIMIENTOS TÉCNICOS Y LEGALES ESTABLECIDOS EN LA PROVIDENCIA 0141 DEL SENIAT.'}
                        </p>
                    </div>
                </div>
            </section>
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
