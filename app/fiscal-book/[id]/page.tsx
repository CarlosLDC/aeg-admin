'use client';

import { useState, use, useEffect, useRef, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUserProfile } from '@/app/layout';
import { canRegistrarServiciosEInspecciones } from '@/lib/roles';
import { FiscalPrinter, TechnicalReview, AnnualInspection } from '@/lib/types';
import { printerService } from '@/lib/printer-service';
import { truncateVersion, getActiveSealSerial, formatRegistroCreado } from '@/lib/fiscal-helpers';
import { ArrowLeft, ArrowRight, DownloadIcon, MenuIcon, XIcon, PlusIcon } from '@/components/icons';
import { InfoPage } from '@/components/fiscal-book/info-page';
import { SingleTechSheet } from '@/components/fiscal-book/tech-sheet';
import { SingleInspectionSheet } from '@/components/fiscal-book/inspection-sheet';
import { EmptyState } from '@/components/fiscal-book/empty-state';
import Link from 'next/link';
import jsPDF from 'jspdf';

function FiscalBookDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const searchParams = useSearchParams();
    const router = useRouter();
    const { profile, loading: authLoading, tecnicoDistribuidoraId } = useUserProfile();
    const [printer, setPrinter] = useState<FiscalPrinter | undefined>(undefined);
    const [loading, setLoading] = useState(true);

    // Core States
    const [viewMode, setViewMode] = useState<'info' | 'tech' | 'inspection'>('info');
    const [currentPage, setCurrentPage] = useState(0);

    const [techFilterQuery, setTechFilterQuery] = useState('');
    const [techFilterYear, setTechFilterYear] = useState<string>('all');
    const [inspFilterQuery, setInspFilterQuery] = useState('');
    const [inspFilterYear, setInspFilterYear] = useState<string>('all');
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

    const queryString = searchParams.toString();

    /** Tras crear un servicio/inspección: ?tab=…&registro=id → abre esa página y limpia la URL. */
    useEffect(() => {
        if (!printer) return;
        const tab = searchParams.get('tab');
        const registro = searchParams.get('registro');
        if (tab !== 'tech' && tab !== 'inspection') return;

        setViewMode(tab);
        const fullList =
            tab === 'tech' ? printer.technicalReviews : printer.annualInspections;
        let idx = 0;
        if (registro) {
            const i = fullList.findIndex((r) => r.id === registro);
            if (i >= 0) idx = i;
        }
        setCurrentPage(idx);
        setTechFilterQuery('');
        setTechFilterYear('all');
        setInspFilterQuery('');
        setInspFilterYear('all');
        router.replace(`/fiscal-book/${id}`, { scroll: false });
    }, [printer, queryString, id, router]);

    const techYearOptions = useMemo(() => {
        if (!printer) return [] as string[];
        const years = new Set<string>();
        for (const r of printer.technicalReviews) {
            const src = r.createdAt || r.date;
            if (src && typeof src === 'string' && src.length >= 4) {
                years.add(src.slice(0, 4));
            }
        }
        return [...years].sort();
    }, [printer]);

    const inspYearOptions = useMemo(() => {
        if (!printer) return [] as string[];
        const years = new Set<string>();
        for (const r of printer.annualInspections) {
            const src = r.createdAt || r.date;
            if (src && typeof src === 'string' && src.length >= 4) {
                years.add(src.slice(0, 4));
            }
        }
        return [...years].sort();
    }, [printer]);

    const filteredTechRecords = useMemo(() => {
        if (!printer) return [];
        let list = printer.technicalReviews;
        if (techFilterYear !== 'all') {
            list = list.filter((r) => {
                const src = r.createdAt || r.date;
                return src && String(src).startsWith(techFilterYear);
            });
        }
        const q = techFilterQuery.trim().toLowerCase();
        if (q) {
            list = list.filter(
                (r) =>
                    (r.description || '').toLowerCase().includes(q) ||
                    (r.technician || '').toLowerCase().includes(q) ||
                    (r.serviceCenter || '').toLowerCase().includes(q) ||
                    String(r.id).includes(q) ||
                    (r.fechaSolicitud || '').toLowerCase().includes(q)
            );
        }
        return list;
    }, [printer, techFilterYear, techFilterQuery]);

    const filteredInspectionRecords = useMemo(() => {
        if (!printer) return [];
        let list = printer.annualInspections;
        if (inspFilterYear !== 'all') {
            list = list.filter((r) => {
                const src = r.createdAt || r.date;
                return src && String(src).startsWith(inspFilterYear);
            });
        }
        const q = inspFilterQuery.trim().toLowerCase();
        if (q) {
            list = list.filter(
                (r) =>
                    (r.observations || '').toLowerCase().includes(q) ||
                    (r.inspector || '').toLowerCase().includes(q) ||
                    (r.serviceCenter || '').toLowerCase().includes(q) ||
                    String(r.id).includes(q) ||
                    (r.date || '').toLowerCase().includes(q)
            );
        }
        return list;
    }, [printer, inspFilterYear, inspFilterQuery]);
    
    // Auto-scroll to top on page or tab change
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentPage, viewMode]);

    // Navegación: una entrada por “página” (lista filtrada). Debe declararse antes de cualquier return
    // para no alterar el orden de Hooks entre “cargando” y “listo”.
    const records =
        viewMode === 'tech'
            ? filteredTechRecords
            : viewMode === 'inspection'
              ? filteredInspectionRecords
              : [];
    const totalPages = viewMode === 'info' ? 1 : records.length;

    useEffect(() => {
        if (viewMode === 'info') return;
        if (totalPages === 0) {
            if (currentPage !== 0) setCurrentPage(0);
            return;
        }
        if (currentPage > totalPages - 1) {
            setCurrentPage(totalPages - 1);
        }
    }, [viewMode, totalPages, currentPage]);

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

    const currentRecord =
        viewMode !== 'info' && totalPages > 0 ? records[currentPage] ?? null : null;

    const hasFullTech = printer.technicalReviews.length > 0;
    const hasFullInsp = printer.annualInspections.length > 0;
    const techFilteredEmpty = viewMode === 'tech' && hasFullTech && records.length === 0;
    const inspFilteredEmpty =
        viewMode === 'inspection' && hasFullInsp && records.length === 0;

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

    const libroFiltrosInner =
        viewMode === 'tech' || viewMode === 'inspection' ? (
            <>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 shrink-0">
                    Filtros
                </span>
                {viewMode === 'tech' ? (
                    <>
                        <input
                            type="search"
                            placeholder="Buscar (falla, técnico, centro, ID…)"
                            value={techFilterQuery}
                            onChange={(e) => {
                                setTechFilterQuery(e.target.value);
                                setCurrentPage(0);
                            }}
                            className="w-full md:flex-1 md:min-w-[160px] px-3 py-2 rounded-lg text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400"
                        />
                        <select
                            value={techFilterYear}
                            onChange={(e) => {
                                setTechFilterYear(e.target.value);
                                setCurrentPage(0);
                            }}
                            className="w-full md:w-auto md:min-w-[120px] px-3 py-2 rounded-lg text-sm font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                        >
                            <option value="all">Todos los años</option>
                            {techYearOptions.map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            ))}
                        </select>
                    </>
                ) : (
                    <>
                        <input
                            type="search"
                            placeholder="Buscar (observaciones, inspector, centro…)"
                            value={inspFilterQuery}
                            onChange={(e) => {
                                setInspFilterQuery(e.target.value);
                                setCurrentPage(0);
                            }}
                            className="w-full md:flex-1 md:min-w-[160px] px-3 py-2 rounded-lg text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400"
                        />
                        <select
                            value={inspFilterYear}
                            onChange={(e) => {
                                setInspFilterYear(e.target.value);
                                setCurrentPage(0);
                            }}
                            className="w-full md:w-auto md:min-w-[120px] px-3 py-2 rounded-lg text-sm font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                        >
                            <option value="all">Todos los años</option>
                            {inspYearOptions.map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            ))}
                        </select>
                    </>
                )}
                {(viewMode === 'tech'
                    ? techFilterQuery || techFilterYear !== 'all'
                    : inspFilterQuery || inspFilterYear !== 'all') ? (
                    <button
                        type="button"
                        onClick={() => {
                            setTechFilterQuery('');
                            setTechFilterYear('all');
                            setInspFilterQuery('');
                            setInspFilterYear('all');
                            setCurrentPage(0);
                        }}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline px-2 self-start md:self-auto"
                    >
                        Limpiar filtros
                    </button>
                ) : null}
            </>
        ) : null;

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

                {/* Móvil: pestañas, filtros y acciones dentro del menú hamburguesa */}
                {isMobileMenuOpen && (
                    <div className="md:hidden flex flex-col gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 animate-in fade-in duration-200">
                        {tabsMenu}
                        {libroFiltrosInner != null ? (
                            <div className="flex flex-col gap-2 w-full rounded-xl bg-slate-50/80 dark:bg-slate-900/40 p-3 border border-slate-200/80 dark:border-slate-700/80">
                                {libroFiltrosInner}
                            </div>
                        ) : null}
                        {actionMenu}
                    </div>
                )}

                {libroFiltrosInner != null ? (
                    <div className="no-print hidden md:flex mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex-row flex-wrap gap-2 items-center">
                        {libroFiltrosInner}
                    </div>
                ) : null}
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
                                    <>
                                        <div className="no-print mb-6 flex flex-wrap items-center gap-2 text-[11px]">
                                            <span className="inline-flex items-center rounded-md bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-2.5 py-1 font-mono font-bold tabular-nums">
                                                Pág. {String(currentPage + 1).padStart(2, '0')} /{' '}
                                                {String(totalPages).padStart(2, '0')}
                                            </span>
                                            <span className="inline-flex items-center rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/80 px-2.5 py-1 font-mono text-slate-700 dark:text-slate-300">
                                                Registro #{currentRecord.id}
                                            </span>
                                            {(currentRecord as TechnicalReview).createdAt ? (
                                                <span className="inline-flex items-center rounded-md border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 text-emerald-900 dark:text-emerald-200 font-semibold">
                                                    Creado:{' '}
                                                    {formatRegistroCreado(
                                                        (currentRecord as TechnicalReview).createdAt
                                                    )}
                                                </span>
                                            ) : null}
                                            {filteredTechRecords.length !== printer.technicalReviews.length ? (
                                                <span className="text-slate-500 dark:text-slate-400 font-medium">
                                                    (filtrado: {filteredTechRecords.length} de{' '}
                                                    {printer.technicalReviews.length})
                                                </span>
                                            ) : null}
                                        </div>
                                        <SingleTechSheet review={currentRecord as TechnicalReview} printer={printer} />
                                    </>
                                ) : (
                                    <EmptyState type="services" filtered={techFilteredEmpty} />
                                )
                            )}

                            {viewMode === 'inspection' && (
                                currentRecord ? (
                                    <>
                                        <div className="no-print mb-6 flex flex-wrap items-center gap-2 text-[11px]">
                                            <span className="inline-flex items-center rounded-md bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-2.5 py-1 font-mono font-bold tabular-nums">
                                                Pág. {String(currentPage + 1).padStart(2, '0')} /{' '}
                                                {String(totalPages).padStart(2, '0')}
                                            </span>
                                            <span className="inline-flex items-center rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/80 px-2.5 py-1 font-mono text-slate-700 dark:text-slate-300">
                                                Registro #{currentRecord.id}
                                            </span>
                                            {(currentRecord as AnnualInspection).createdAt ? (
                                                <span className="inline-flex items-center rounded-md border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 text-emerald-900 dark:text-emerald-200 font-semibold">
                                                    Creado:{' '}
                                                    {formatRegistroCreado(
                                                        (currentRecord as AnnualInspection).createdAt
                                                    )}
                                                </span>
                                            ) : null}
                                            {filteredInspectionRecords.length !== printer.annualInspections.length ? (
                                                <span className="text-slate-500 dark:text-slate-400 font-medium">
                                                    (filtrado: {filteredInspectionRecords.length} de{' '}
                                                    {printer.annualInspections.length})
                                                </span>
                                            ) : null}
                                        </div>
                                        <SingleInspectionSheet inspection={currentRecord as AnnualInspection} printer={printer} />
                                    </>
                                ) : (
                                    <EmptyState type="inspections" filtered={inspFilteredEmpty} />
                                )
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
}

export default function FiscalBookPage({ params }: { params: Promise<{ id: string }> }) {
    return (
        <Suspense
            fallback={
                <main className="container mx-auto px-4 py-32 max-w-4xl text-center flex-1 flex flex-col justify-center">
                    <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted font-medium">Cargando libro fiscal…</p>
                </main>
            }
        >
            <FiscalBookDetail params={params} />
        </Suspense>
    );
}

