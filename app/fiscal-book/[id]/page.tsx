'use client';

import { useState, use, useEffect, useRef } from 'react';
import { useUserProfile } from '@/app/layout';
import { canRegistrarServiciosEInspecciones } from '@/lib/roles';
import { FiscalPrinter, TechnicalReview, AnnualInspection, Precinto } from '@/lib/mock-data';
import { printerService } from '@/lib/printer-service';
import Link from 'next/link';
import jsPDF from 'jspdf';

// Formatting Helper
const formatTimestamp = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    } catch {
        return dateStr;
    }
};

// Helper to chunk arrays
function chunkArray<T>(array: T[], size: number): T[][] {
    const chunked_arr = [];
    for (let i = 0; i < array.length; i += size) {
        chunked_arr.push(array.slice(i, i + size));
    }
    return chunked_arr;
}

const NoData = () => (
    <span className="text-slate-400 dark:text-slate-600 text-sm italic font-medium normal-case">N/D</span>
);

const InfoIcon = ({ size = 16, className = "", title }: { size?: number, className?: string, title?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        {title && <title>{title}</title>}
        <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
    </svg>
);

const truncateVersion = (version: string | null | undefined) => {
    if (!version) return null;
    const parts = version.split('.');
    if (parts.length > 1) {
        return parts.slice(0, -1).join('.');
    }
    return version;
};

// Helper function to find the active seal
const getActiveSealSerial = (printer: FiscalPrinter) => {
    if (!printer.precintos || printer.precintos.length === 0) {
        return null;
    }
    
    const activeSeal = printer.precintos.find(precinto => 
        precinto.id_impresora !== null && precinto.estatus === 'en_impresora'
    );
    
    return activeSeal ? activeSeal.serial : null;
};

export default function FiscalBookDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { profile, loading: authLoading, tecnicoDistribuidoraId } = useUserProfile();
    const [printer, setPrinter] = useState<FiscalPrinter | undefined>(undefined);
    const [loading, setLoading] = useState(true);

    // Core States
    const [viewMode, setViewMode] = useState<'info' | 'tech' | 'inspection'>('info');
    const [currentPage, setCurrentPage] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (authLoading) return;

        const loadData = async () => {
            setLoading(true);
            const data = await printerService.getPrinterById(id, {
                restrictToDistribuidoraId:
                    profile?.rol_usuario === 'tecnico' ? tecnicoDistribuidoraId ?? null : undefined,
            });
            setPrinter(data);
            setLoading(false);
        };
        loadData();
    }, [id, authLoading, profile?.rol_usuario, tecnicoDistribuidoraId]);

    if (authLoading || loading) {
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

            // Helper for PDF fields with N/D styling
            const drawField = (label: string, value: string | null | undefined, x: number, py: number) => {
                doc.setFont('helvetica', 'normal');
                doc.text(`${label}: `, x, py);
                const v = value || 'N/D';
                if (v === 'N/D') doc.setFont('helvetica', 'italic');
                doc.text(v, x + doc.getTextWidth(`${label}: `), py);
                doc.setFont('helvetica', 'normal');
                return doc.getTextWidth(`${label}: ${v}`);
            };

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
            doc.text(`Estado: MIRANDA    Ciudad: LOS TEQUES`, margin, y); y += 6;
            doc.text('Domicilio Fiscal: AVENIDA BICENTENARIO, REDOMA DEL TAMBOR, EDIFICIO VERACRUZ, PISO 1, LOCAL N° 3', margin, y); y += 6;
            doc.text('Teléfono: 584242913038    Correo: soportealphavzla@gmail.com', margin, y); y += 10;

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
                drawField('Razón Social', dist.company?.razon_social, margin, y); y += 6;
                drawField('RIF', dist.company?.rif, margin, y); y += 6;
                const estadoW = drawField('Estado', dist.estado, margin, y);
                drawField('    Ciudad', dist.ciudad, margin + estadoW, y); y += 6;
                drawField('Dirección', dist.direccion, margin, y); y += 6;
                const telW = drawField('Teléfono', dist.telefono, margin, y);
                drawField('    Correo', dist.correo, margin + telW, y); y += 6;
            } else {
                doc.setFont('helvetica', 'italic');
                doc.text('Sin enajenador registrado.', margin, y); y += 6;
                doc.setFont('helvetica', 'normal');
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
            drawField('Razón Social', printer.businessName, margin, y); y += 6;
            const rifW = drawField('RIF', printer.rif, margin, y);
            drawField('    Tipo de Contribuyente', printer.taxpayerType?.toUpperCase(), margin + rifW, y); y += 6;
            const estW = drawField('Estado', printer.sucursal?.estado, margin, y);
            drawField('    Ciudad', printer.sucursal?.ciudad, margin + estW, y); y += 6;
            drawField('Domicilio Fiscal', printer.address, margin, y); y += 6;
            const telCW = drawField('Teléfono', printer.sucursal?.telefono, margin, y);
            drawField('    Correo', printer.sucursal?.correo, margin + telCW, y); y += 10;

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
            doc.setFont('helvetica', 'italic');
            doc.text('El lugar de instalación es el domicilio fiscal del contribuyente.', margin, y); y += 10;
            doc.setFont('helvetica', 'normal');

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
            drawField('Marca', printer.modelo?.marca, margin, y); y += 6;
            drawField('Modelo', printer.modelo?.codigo_modelo, margin, y); y += 6;
            const activeSeal = getActiveSealSerial(printer);
            doc.text(`Serial del Precinto: ${activeSeal}`, margin, y); y += 6;
            drawField(
              'Fecha de Instalación',
              (printer.fecha_instalacion || printer.created_at)
                ? new Date((printer.fecha_instalacion || printer.created_at) as string).toLocaleDateString('es-VE')
                : null,
              margin,
              y
            );
            y += 6;
            doc.text(`Tipo de Dispositivo Fiscal: ${printer.tipo_dispositivo}`, margin, y); y += 6;
            drawField('Versión del Firmware', truncateVersion(printer.version_firmware), margin, y); y += 10;

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
            drawField('Nombre', printer.software?.nombre, margin, y); y += 6;
            drawField('Versión', printer.software?.version, margin, y); y += 10;

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
                    drawField('Centro Autorizado', tr.serviceCenter, margin, y); y += 6;
                    drawField('RIF Centro', tr.centerRif, margin, y); y += 6;
                    drawField('Fecha de Solicitud', tr.fechaSolicitud, margin, y); y += 6;
                    drawField('Fecha de Inicio', tr.date, margin, y); y += 6;
                    drawField('Fecha de Fin', tr.date, margin, y); y += 6;
                    drawField('Primera Reporte Z', tr.zReportStart, margin, y); y += 6;
                    drawField('Fecha y Hora de Primer Reporte Z', tr.zReportTimestampStart, margin, y); y += 6;
                    drawField('Último Reporte Z', tr.zReportEnd, margin, y); y += 6;
                    drawField('Fecha y Hora de Último Reporte Z', tr.zReportTimestampEnd, margin, y); y += 10;

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
                    drawField('Serial del Precinto Actual', tr.currentSealSerial, margin, y); y += 6;
                    doc.text(`¿Precinto Violentado?: ${tr.sealBroken ? 'SÍ' : 'NO'}`, margin, y); y += 6;
                    doc.text(`¿Se Cambió el Precinto?: ${tr.sealReplaced ? 'SÍ' : 'NO'}`, margin, y); y += 6;
                    drawField('Serial del Nuevo Precinto', tr.newSealSerial, margin, y); y += 10;

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
                    const description = tr.description || 'N/D';
                    if (description === 'N/D') doc.setFont('helvetica', 'italic');
                    const splitDesc = doc.splitTextToSize(description.toUpperCase(), 160);
                    doc.text(splitDesc, margin, y);
                    doc.setFont('helvetica', 'normal');
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
                    drawField('Centro de Servicio', ai.serviceCenter, margin, y); y += 6;
                    drawField('RIF Centro', ai.centerRif, margin, y); y += 6;
                    drawField('Fecha de Inspección', ai.date, margin, y); y += 6;
                    drawField('Inspector Actuante', ai.inspector, margin, y); y += 10;

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
                    if (observations === 'N/D') doc.setFont('helvetica', 'italic');
                    const splitObs = doc.splitTextToSize(observations.toUpperCase(), 160);
                    doc.text(splitObs, margin, y);
                    doc.setFont('helvetica', 'normal');
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

    const tabsMenu = (
        <div className="flex w-full md:w-auto overflow-x-auto hide-scrollbar bg-slate-200/50 dark:bg-slate-800/50 backdrop-blur p-1 rounded-xl shadow-inner snap-x">
            <button
                onClick={() => handleTabChange('info')}
                className={`px-4 py-2 text-sm whitespace-nowrap font-semibold rounded-lg transition-colors snap-start flex-1 md:flex-none ${viewMode === 'info' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-muted hover:text-foreground'}`}
            >
                Inf. Base
            </button>
            <button
                onClick={() => handleTabChange('tech')}
                className={`px-4 py-2 text-sm whitespace-nowrap font-semibold rounded-lg transition-colors snap-start flex-1 md:flex-none ${viewMode === 'tech' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-muted hover:text-foreground'}`}
            >
                Servicios ({printer.technicalReviews.length})
            </button>
            <button
                onClick={() => handleTabChange('inspection')}
                className={`px-4 py-2 text-sm whitespace-nowrap font-semibold rounded-lg transition-colors snap-start flex-1 md:flex-none ${viewMode === 'inspection' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-muted hover:text-foreground'}`}
            >
                Inspecciones ({printer.annualInspections.length})
            </button>
        </div>
    );

    const actionMenu = (
        <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto">
            {/* Pagination Control - Reverting to integrated Pill style */}
            {viewMode !== 'info' && totalPages > 0 ? (
                <div className="flex items-center bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                    <button
                        onClick={handlePrev}
                        disabled={currentPage === 0}
                        className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        title="Anterior"
                    >
                        <ArrowLeft size={14} />
                    </button>
                    <div className="px-3 flex items-center justify-center text-slate-600 dark:text-slate-300 text-[11px] font-mono font-bold tabular-nums">
                        {String(currentPage + 1).padStart(2, '0')} / {String(totalPages).padStart(2, '0')}
                    </div>
                    <button
                        onClick={handleNext}
                        disabled={currentPage === totalPages - 1}
                        className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        title="Siguiente"
                    >
                        <ArrowRight size={14} />
                    </button>
                </div>
            ) : <div />}
            
            {/* Actions (Add/Download) - Hidden in 'Inf. Base' as requested */}
            {viewMode !== 'info' && (
                <div className="flex items-center bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm group/actions">
                    {canRegistrarServiciosEInspecciones(profile) && (
                        <Link
                            href={`/fiscal-book/${id}/${viewMode === 'tech' ? 'new-service' : 'new-inspection'}`}
                            className="flex justify-center items-center h-7 w-7 rounded-lg transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700"
                            title={viewMode === 'tech' ? 'Añadir Servicio' : 'Añadir Inspección'}
                        >
                            <PlusIcon size={14} />
                        </Link>
                    )}

                    <button
                        onClick={downloadPDF}
                        disabled={isDownloading || records.length === 0}
                        className="flex justify-center items-center h-7 w-7 rounded-lg transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none"
                        title="Descargar PDF"
                    >
                        {isDownloading ? (
                            <div className="w-[12px] h-[12px] border-2 border-slate-500 border-t-transparent rounded-full animate-spin tabular-nums"></div>
                        ) : (
                            <DownloadIcon size={14} />
                        )}
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <main className="container mx-auto px-2 pt-6 pb-12 md:pt-8 md:pb-16 flex flex-col items-center min-h-screen">
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
            <div className="no-print w-full max-w-[900px] mb-6 md:mb-8 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl p-3 md:p-3 rounded-2xl border border-slate-200 dark:border-slate-800 sticky top-[68px] z-40 shadow-sm hover:shadow-md">
                
                {/* Top Row: Always visible */}
                <div className="flex justify-between items-center w-full">
                    <div className="flex-1 flex justify-start md:w-auto">
                        <Link href="/" className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors pl-2">
                            <ArrowLeft size={18} />
                            <span className="text-sm font-medium">Volver</span>
                        </Link>
                    </div>

                    {/* Desktop Center: Tabs (hidden on mobile) */}
                    <div className="hidden md:flex flex-none mx-4">
                        {tabsMenu}
                    </div>

                    {/* Desktop Right: Actions (hidden on mobile) */}
                    <div className="hidden md:flex flex-1 justify-end">
                        {actionMenu}
                    </div>

                    {/* Mobile Menu Toggle (visible on mobile only) */}
                    <div className="md:hidden flex justify-end">
                        <button 
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                            title="Opciones"
                        >
                            {isMobileMenuOpen ? <XIcon size={18} /> : <MenuIcon size={18} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Expanded Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden flex flex-col gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 animate-in fade-in duration-200">
                        {tabsMenu}
                        {actionMenu}
                    </div>
                )}
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
                        <div className="md:col-span-2">
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">RIF</label>
                            <p className="font-mono text-slate-900 dark:text-white text-xs font-black uppercase tracking-tight">J504594369</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Estado</label>
                            <p className="text-slate-900 dark:text-white font-black uppercase text-xs tracking-tight">MIRANDA</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Ciudad</label>
                            <p className="text-slate-900 dark:text-white font-black uppercase text-xs tracking-tight">LOS TEQUES</p>
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Domicilio fiscal</label>
                            <p className="text-slate-700 dark:text-slate-300 font-medium text-sm leading-relaxed uppercase">AVENIDA BICENTENARIO, REDOMA DEL TAMBOR, EDIFICIO VERACRUZ, PISO 1, LOCAL N° 3</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">TELÉFONO</label>
                            <p className="font-mono text-slate-900 dark:text-white text-xs font-black uppercase tracking-tight">584242913038</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">CORREO</label>
                            <p className="font-mono text-slate-900 dark:text-white text-xs font-black tracking-tight">soportealphavzla@gmail.com</p>
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
                                <p className="text-slate-900 dark:text-white font-black uppercase text-lg">{printer.distribuidora.sucursal.company?.razon_social || <NoData />}</p>
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">RIF</label>
                                <p className="font-mono text-slate-900 dark:text-white text-xs font-black uppercase tracking-tight">{printer.distribuidora.sucursal.company?.rif || <NoData />}</p>
                            </div>
                            <div>
                                <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Estado</label>
                                <p className="text-slate-900 dark:text-white font-black uppercase text-xs tracking-tight">{printer.distribuidora.sucursal.estado || <NoData />}</p>
                            </div>
                            <div>
                                <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Ciudad</label>
                                <p className="text-slate-900 dark:text-white font-black uppercase text-xs tracking-tight">{printer.distribuidora.sucursal.ciudad || <NoData />}</p>
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Dirección</label>
                                <p className="text-slate-700 dark:text-slate-300 font-medium text-sm leading-relaxed uppercase">{printer.distribuidora.sucursal.direccion || <NoData />}</p>
                            </div>
                            <div>
                                <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Teléfono</label>
                                <p className="font-mono text-slate-900 dark:text-white text-xs font-black uppercase tracking-tight">{printer.distribuidora.sucursal.telefono || <NoData />}</p>
                            </div>
                            <div>
                                <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Correo</label>
                                <p className="font-mono text-slate-900 dark:text-white text-xs font-black tracking-tight">{printer.distribuidora.sucursal.correo || <NoData />}</p>
                            </div>
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
                            <p className="text-slate-900 dark:text-white font-black uppercase text-lg">{printer.businessName || <NoData />}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">RIF</label>
                            <p className="font-mono text-slate-900 dark:text-white text-xs font-black uppercase tracking-tight">{printer.rif || <NoData />}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Tipo de Contribuyente</label>
                            <p className="text-slate-900 dark:text-white font-black text-xs uppercase tracking-tight">{printer.taxpayerType ? printer.taxpayerType.toUpperCase() : <NoData />}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Estado</label>
                            <p className="text-slate-900 dark:text-white font-black uppercase text-xs tracking-tight">{printer.sucursal?.estado || <NoData />}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Ciudad</label>
                            <p className="text-slate-900 dark:text-white font-black uppercase text-xs tracking-tight">{printer.sucursal?.ciudad || <NoData />}</p>
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Domicilio Fiscal</label>
                            <p className="text-slate-700 dark:text-slate-300 font-medium text-sm leading-relaxed uppercase">{printer.address || <NoData />}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Teléfono</label>
                            <p className="font-mono text-slate-900 dark:text-white text-xs font-black uppercase tracking-tight">{printer.sucursal?.telefono || <NoData />}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Correo</label>
                            <p className="font-mono text-slate-900 dark:text-white text-xs font-black tracking-tight">{printer.sucursal?.correo || <NoData />}</p>
                        </div>
                    </div>
                </div>
            </section>

            <section>
                <h2 className="text-[11px] uppercase tracking-widest font-black text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-100 dark:border-slate-900">4. DATOS DEL LUGAR DE INSTALACIÓN</h2>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border border-slate-100 dark:border-slate-900 transition-colors">
                    <p className="text-slate-400 dark:text-slate-600 text-sm italic">El lugar de instalación es el domicilio fiscal del contribuyente.</p>
                </div>
            </section>

            <section>
                <h2 className="text-[11px] uppercase tracking-widest font-black text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-100 dark:border-slate-900">5. DATOS DE LA MÁQUINA FISCAL</h2>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border border-slate-100 dark:border-slate-900 transition-colors">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Número de Registro (serial)</label>
                            <p className="font-mono text-slate-900 dark:text-white text-xs font-black uppercase tracking-tight">{printer.serial_fiscal || <NoData />}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Tipo de Dispositivo Fiscal</label>
                            <p className="font-mono text-slate-900 dark:text-white text-xs font-black uppercase tracking-tight">{printer.tipo_dispositivo || <NoData />}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Marca</label>
                            <p className="text-slate-900 dark:text-white font-black uppercase text-xs tracking-tight">{printer.modelo?.marca || <NoData />}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Modelo</label>
                            <p className="text-slate-900 dark:text-white font-black uppercase text-xs tracking-tight">{printer.modelo?.codigo_modelo || <NoData />}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Serial del Precinto</label>
                            <p className="font-mono text-slate-900 dark:text-white text-xs font-black uppercase tracking-tight">
                                {getActiveSealSerial(printer) || <NoData />}
                            </p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Fecha de Instalación</label>
                            <p className="font-mono text-slate-900 dark:text-white text-xs font-black uppercase tracking-tight">
                                {(printer.fecha_instalacion || printer.created_at) ? new Date((printer.fecha_instalacion || printer.created_at) as string).toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : <NoData />}
                            </p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Versión del Firmware</label>
                            <div className="inline-flex items-center gap-1.5 group relative cursor-help">
                                <p className="font-mono text-slate-900 dark:text-white font-black text-sm m-0">
                                    {truncateVersion(printer.version_firmware) || <NoData />}
                                </p>
                                {printer.version_firmware && (
                                    <>
                                        <InfoIcon 
                                            size={14} 
                                            className="text-slate-400 dark:text-slate-500 hover:text-blue-500 transition-colors flex-shrink-0 relative -top-[1px]" 
                                        />
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-50 pointer-events-none shadow-xl border border-slate-200 dark:border-slate-700 translate-y-1 group-hover:translate-y-0">
                                            Versión completa: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{printer.version_firmware}</span>
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white dark:border-t-slate-800" />
                                        </div>
                                    </>
                                )}
                            </div>
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
                            <p className="font-mono text-slate-900 dark:text-white text-xs font-black uppercase tracking-tight">{printer.software?.nombre || <NoData />}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Versión</label>
                            <p className="font-mono text-slate-900 dark:text-white text-xs font-black uppercase tracking-tight">{printer.software?.version || <NoData />}</p>
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
                            <p className="text-slate-900 dark:text-white font-black uppercase text-xs tracking-tight">{review.serviceCenter || <NoData />}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">RIF Centro de Servicio</label>
                            <p className="font-mono text-slate-900 dark:text-white text-xs font-black uppercase tracking-tight">{review.centerRif || <NoData />}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Fecha de Solicitud</label>
                            <p className="font-mono text-slate-900 dark:text-white text-xs font-black uppercase tracking-tight">{review.fechaSolicitud || <NoData />}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Fecha de Inicio</label>
                            <p className="font-mono text-slate-900 dark:text-white text-xs font-black uppercase tracking-tight">{review.date || <NoData />}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Fecha de Fin</label>
                            <p className="font-mono text-slate-900 dark:text-white text-xs font-black uppercase tracking-tight">{review.date || <NoData />}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Primera Reporte Z</label>
                            <p className="font-mono text-slate-900 dark:text-white text-xs font-black uppercase tracking-tight">{review.zReportStart || <NoData />}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Fecha y Hora de Primer Reporte Z</label>
                            <p className="font-mono text-slate-900 dark:text-white text-xs font-black uppercase tracking-tight">{formatTimestamp(review.zReportTimestampStart) || <NoData />}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Último Reporte Z</label>
                            <p className="font-mono text-slate-900 dark:text-white text-xs font-black uppercase tracking-tight">{review.zReportEnd || <NoData />}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Fecha y Hora de Último Reporte Z</label>
                            <p className="font-mono text-slate-900 dark:text-white text-xs font-black uppercase tracking-tight">{formatTimestamp(review.zReportTimestampEnd) || <NoData />}</p>
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
                            <p className="font-mono text-slate-900 dark:text-white text-xs font-black uppercase tracking-tight">{review.currentSealSerial || <NoData />}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">¿Precinto Violentado?</label>
                            <p className={`font-black text-xs uppercase tracking-tight ${review.sealBroken ? 'text-red-500' : 'text-emerald-500'}`}>{review.sealBroken ? 'SÍ' : 'NO'}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">¿Se Cambió el Precinto?</label>
                            <p className={`font-black text-xs uppercase tracking-tight ${review.sealReplaced ? 'text-blue-500' : 'text-slate-400'}`}>{review.sealReplaced ? 'SÍ' : 'NO'}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Serial del Nuevo Precinto</label>
                            <p className="font-mono text-slate-900 dark:text-white text-xs font-black uppercase tracking-tight">{review.newSealSerial || <NoData />}</p>
                        </div>
                    </div>
                </div>
            </section>

            <section>
                <h2 className="text-[11px] uppercase tracking-widest font-black text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-100 dark:border-slate-900">3. DETALLES DE LA INTERVENCIÓN</h2>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border border-slate-100 dark:border-slate-900 transition-colors">
                    <div>
                        <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Falla Reportada y Acción Realizada</label>
                        <p className="text-slate-700 dark:text-slate-300 font-medium text-sm leading-relaxed uppercase bg-white/50 dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 whitespace-pre-wrap">
                            {review.description || <NoData />}
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
                            <p className="text-slate-900 dark:text-white font-black uppercase text-xs tracking-tight">{review.technician || <NoData />}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Persona que Recibe</label>
                            <p className="text-slate-900 dark:text-white font-black uppercase text-xs tracking-tight">{printer.businessName || <NoData />}</p>
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
                            <p className="text-slate-900 dark:text-white font-black uppercase text-xs tracking-tight">{inspection.serviceCenter || <NoData />}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">RIF Centro de Servicio</label>
                            <p className="font-mono text-slate-900 dark:text-white text-xs font-black uppercase tracking-tight">{inspection.centerRif || <NoData />}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Fecha de Inspección</label>
                            <p className="font-mono text-slate-900 dark:text-white text-xs font-black uppercase tracking-tight">{inspection.date || <NoData />}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Inspector Actuante</label>
                            <p className="text-slate-900 dark:text-white font-black uppercase text-xs tracking-tight">{inspection.inspector || <NoData />}</p>
                        </div>
                    </div>
                </div>
            </section>

            <section>
                <h2 className="text-[11px] uppercase tracking-widest font-black text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-100 dark:border-slate-900">2. DETALLES DE LA INSPECCIÓN</h2>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border border-slate-100 dark:border-slate-900 transition-colors">
                    <div>
                        <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Observaciones y Hallazgos</label>
                        <p className="text-slate-700 dark:text-slate-300 font-medium text-sm leading-relaxed uppercase bg-white/50 dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 whitespace-pre-wrap">
                            {inspection.observations || <NoData />}
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

function MenuIcon({ size, className }: { size: number; className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>
        </svg>
    );
}

function XIcon({ size, className }: { size: number; className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
        </svg>
    );
}

function PlusIcon({ size, className }: { size: number; className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    );
}
