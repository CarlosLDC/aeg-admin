// ─── Types ────────────────────────────────────────────────────────────────────

export interface Printer {
    serial: string
    model: string
    status: 'Activo' | 'En Mantenimiento' | 'Inactivo'
    company: string
    rif: string
    address: string
    phone: string
    installDate: string
}

export interface TechnicalService {
    id: string
    serial: string
    date: string
    type: string
    technician: string
    duration: string
    observations: string
    status: 'Completado' | 'En Proceso' | 'Pendiente'
    nextService?: string
}

export interface AnnualInspection {
    id: string
    serial: string
    year: number
    date: string
    inspector: string
    delegation: string
    resolutionNumber: string
    status: 'Aprobado' | 'Observaciones' | 'Rechazado'
    observations: string
    nextInspection: string
}

// ─── Printers ─────────────────────────────────────────────────────────────────

export const PRINTERS: Record<string, Printer> = {
    AEG0001: {
        serial: 'AEG0001',
        model: 'AEG-P80',
        status: 'Activo',
        company: 'Inversiones C&A, C.A.',
        rif: 'J123456780',
        address: 'Av. Francisco de Miranda, Torre Europa, Piso 4, Caracas',
        phone: '0212-555-1234',
        installDate: '2022-03-15',
    },
    AEG0002: {
        serial: 'AEG0002',
        model: 'AEG-T200',
        status: 'Activo',
        company: 'Inversiones C&A, C.A.',
        rif: 'J123456780',
        address: 'Av. Francisco de Miranda, Torre Europa, Piso 4, Caracas',
        phone: '0212-555-1234',
        installDate: '2022-05-20',
    },
    AEG0003: {
        serial: 'AEG0003',
        model: 'AEG-T200',
        status: 'En Mantenimiento',
        company: 'Comercial del Sur, C.A.',
        rif: 'G200012341',
        address: 'Calle Comercio, Local 12, Maracaibo, Zulia',
        phone: '0261-444-9876',
        installDate: '2023-01-10',
    },
    AEG0004: {
        serial: 'AEG0004',
        model: 'AEG-R100',
        status: 'Activo',
        company: 'Distribuidora Norte, S.A.',
        rif: 'J987654321',
        address: 'Zona Industrial, Galpón 8, Valencia, Carabobo',
        phone: '0241-333-5678',
        installDate: '2021-11-01',
    },
}

// ─── RIF Index ────────────────────────────────────────────────────────────────

export const RIF_INDEX: Record<string, string[]> = {
    J123456780: ['AEG0001', 'AEG0002'],
    G200012341: ['AEG0003'],
    J987654321: ['AEG0004'],
}

// ─── Technical Services per Serial ────────────────────────────────────────────

export const TECHNICAL_SERVICES: Record<string, TechnicalService[]> = {
    AEG0001: [
        {
            id: 'TS-AEG0001-005',
            serial: 'AEG0001',
            date: '2026-02-15',
            type: 'Reparación de Cabezal de Impresión',
            technician: 'Ing. Luis Méndez',
            duration: '3 horas',
            observations: 'Se sustituyó el cabezal de impresión térmico dañado por desgaste. Se realizaron pruebas de impresión con resultados satisfactorios. Equipo operativo al 100%.',
            status: 'Completado',
            nextService: '2026-08-15',
        },
        {
            id: 'TS-AEG0001-004',
            serial: 'AEG0001',
            date: '2026-01-20',
            type: 'Mantenimiento Preventivo',
            technician: 'Ing. Juan Pérez',
            duration: '1 hora 30 min',
            observations: 'Limpieza interna general, revisión de rodillos de papel, calibración del sensor de corte. Se actualizó la tabla de impuestos IVA al 16%. Funcionamiento normal.',
            status: 'Completado',
            nextService: '2026-07-20',
        },
        {
            id: 'TS-AEG0001-003',
            serial: 'AEG0001',
            date: '2025-11-05',
            type: 'Actualización de Firmware',
            technician: 'Ing. María García',
            duration: '45 minutos',
            observations: 'Actualización de firmware a versión 4.2.1. Corrección de bug en generación de reportes Z con montos superiores a 1M VEF. Se verificó compatibilidad con SENIAT.',
            status: 'Completado',
            nextService: '2026-05-05',
        },
        {
            id: 'TS-AEG0001-002',
            serial: 'AEG0001',
            date: '2025-08-15',
            type: 'Mantenimiento Correctivo',
            technician: 'Ing. Roberto Díaz',
            duration: '2 horas',
            observations: 'Diagnóstico y reemplazo de fuente de alimentación. El equipo presentaba apagados intermitentes. Componente original reemplazado por parte certificada AEG.',
            status: 'Completado',
            nextService: '2026-02-15',
        },
        {
            id: 'TS-AEG0001-001',
            serial: 'AEG0001',
            date: '2025-04-10',
            type: 'Instalación y Puesta en Marcha',
            technician: 'Ing. Juan Pérez',
            duration: '2 horas 30 min',
            observations: 'Instalación inicial del equipo. Configuración de parámetros fiscales según resolución SENIAT. Registro del número de serie ante el organismo. Formas de pago configuradas.',
            status: 'Completado',
        },
    ],
    AEG0002: [
        {
            id: 'TS-AEG0002-003',
            serial: 'AEG0002',
            date: '2026-01-10',
            type: 'Mantenimiento Preventivo',
            technician: 'Ing. María García',
            duration: '1 hora',
            observations: 'Revisión general de mecanismos. Limpieza del cabezal y sensor de papel. Verificación de memoria fiscal. Sin anomalías detectadas.',
            status: 'Completado',
            nextService: '2026-07-10',
        },
        {
            id: 'TS-AEG0002-002',
            serial: 'AEG0002',
            date: '2025-06-20',
            type: 'Actualización de Firmware',
            technician: 'Ing. Luis Méndez',
            duration: '45 minutos',
            observations: 'Actualización a firmware 4.1.8. Mejoras en emisión de facturas electrónicas. Compatible con nueva normativa SENIAT 2025.',
            status: 'Completado',
            nextService: '2025-12-20',
        },
        {
            id: 'TS-AEG0002-001',
            serial: 'AEG0002',
            date: '2022-06-01',
            type: 'Instalación y Puesta en Marcha',
            technician: 'Ing. Juan Pérez',
            duration: '2 horas',
            observations: 'Instalación en punto de venta 2 del establecimiento. Configuración de dos impuestos: IVA 16% y exento. Registro ante SENIAT completado.',
            status: 'Completado',
        },
    ],
    AEG0003: [
        {
            id: 'TS-AEG0003-002',
            serial: 'AEG0003',
            date: '2026-03-01',
            type: 'Mantenimiento Correctivo',
            technician: 'Ing. Roberto Díaz',
            duration: '4 horas',
            observations: 'Equipo presenta error E-05 en sensor de temperatura. Se ordena sustitución de componente. Equipo en estado de mantenimiento hasta recibir repuesto.',
            status: 'En Proceso',
        },
        {
            id: 'TS-AEG0003-001',
            serial: 'AEG0003',
            date: '2023-02-01',
            type: 'Instalación y Puesta en Marcha',
            technician: 'Ing. María García',
            duration: '3 horas',
            observations: 'Instalación y configuración completa para establecimiento comercial. Configuración de alícuotas según normativa vigente. Pruebas de impresión aprobadas.',
            status: 'Completado',
        },
    ],
    AEG0004: [
        {
            id: 'TS-AEG0004-003',
            serial: 'AEG0004',
            date: '2025-12-10',
            type: 'Mantenimiento Preventivo',
            technician: 'Ing. Luis Méndez',
            duration: '1 hora 15 min',
            observations: 'Mantenimiento preventivo semestral. Todo en orden. Próximo mantenimiento programado para junio 2026.',
            status: 'Completado',
            nextService: '2026-06-10',
        },
        {
            id: 'TS-AEG0004-002',
            serial: 'AEG0004',
            date: '2024-06-15',
            type: 'Mantenimiento Preventivo',
            technician: 'Ing. Juan Pérez',
            duration: '1 hora',
            observations: 'Limpieza y ajuste de componentes. Verificación de reportes Z de los últimos 6 meses. Sin novedades.',
            status: 'Completado',
            nextService: '2024-12-15',
        },
        {
            id: 'TS-AEG0004-001',
            serial: 'AEG0004',
            date: '2021-12-01',
            type: 'Instalación y Puesta en Marcha',
            technician: 'Ing. Roberto Díaz',
            duration: '2 horas',
            observations: 'Instalación inicial. Modelo AEG-R100 con soporte para impresión de tickets y facturas A4. Registro ante SENIAT completado correctamente.',
            status: 'Completado',
        },
    ],
}

// ─── Annual Inspections per Serial ────────────────────────────────────────────

export const ANNUAL_INSPECTIONS: Record<string, AnnualInspection[]> = {
    AEG0001: [
        {
            id: 'AI-AEG0001-2026',
            serial: 'AEG0001',
            year: 2026,
            date: '2026-01-10',
            inspector: 'Lic. Ana Lugo',
            delegation: 'SENIAT - Gerencia Regional Capital',
            resolutionNumber: 'GRC-2026-0047',
            status: 'Aprobado',
            observations: 'Equipo en perfectas condiciones. Memoria fiscal íntegra. Todos los reportes Z correlativosy sin saltos. Libro de control físico actualizado.',
            nextInspection: '2027-01-10',
        },
        {
            id: 'AI-AEG0001-2025',
            serial: 'AEG0001',
            year: 2025,
            date: '2025-01-15',
            inspector: 'Lic. Carlos Vera',
            delegation: 'SENIAT - Gerencia Regional Capital',
            resolutionNumber: 'GRC-2025-0031',
            status: 'Aprobado',
            observations: 'Inspección realizada sin novedad. Se solicitó actualización de firmware a la próxima visita de servicio técnico. Libro de servicio técnico al día.',
            nextInspection: '2026-01-15',
        },
        {
            id: 'AI-AEG0001-2024',
            serial: 'AEG0001',
            year: 2024,
            date: '2024-01-20',
            inspector: 'Lic. Pedro Salazar',
            delegation: 'SENIAT - Gerencia Regional Capital',
            resolutionNumber: 'GRC-2024-0018',
            status: 'Aprobado',
            observations: 'Inspección superada. Memoria fiscal sin alteraciones. Libro de control de reparaciones refleja 2 servicios técnicos en el año.',
            nextInspection: '2025-01-20',
        },
        {
            id: 'AI-AEG0001-2023',
            serial: 'AEG0001',
            year: 2023,
            date: '2023-01-25',
            inspector: 'Lic. Rosa Martínez',
            delegation: 'SENIAT - Delegación Caracas Centro',
            resolutionNumber: 'DCC-2023-0092',
            status: 'Aprobado',
            observations: 'Primera inspección anual del equipo. Documentación completa y al día. Libro de control presentado correctamente.',
            nextInspection: '2024-01-25',
        },
    ],
    AEG0002: [
        {
            id: 'AI-AEG0002-2026',
            serial: 'AEG0002',
            year: 2026,
            date: '2026-01-12',
            inspector: 'Lic. Ana Lugo',
            delegation: 'SENIAT - Gerencia Regional Capital',
            resolutionNumber: 'GRC-2026-0048',
            status: 'Aprobado',
            observations: 'Inspección superada satisfactoriamente. Reportes Z sin saltos. Libro de control de servicios técnicos actualizado con 2 entradas en el año.',
            nextInspection: '2027-01-12',
        },
        {
            id: 'AI-AEG0002-2025',
            serial: 'AEG0002',
            year: 2025,
            date: '2025-01-18',
            inspector: 'Lic. Carlos Vera',
            delegation: 'SENIAT - Gerencia Regional Capital',
            resolutionNumber: 'GRC-2025-0034',
            status: 'Observaciones',
            observations: 'Se levantó observación por ausencia de firma del técnico en la entrada TS-AEG0002-002 del libro de control. Se subsanó en el acto con la firma digital correspondiente.',
            nextInspection: '2026-01-18',
        },
        {
            id: 'AI-AEG0002-2023',
            serial: 'AEG0002',
            year: 2023,
            date: '2023-01-20',
            inspector: 'Lic. Rosa Martínez',
            delegation: 'SENIAT - Delegación Caracas Centro',
            resolutionNumber: 'DCC-2023-0095',
            status: 'Aprobado',
            observations: 'Primera inspección anual. Todo en orden.',
            nextInspection: '2024-01-20',
        },
    ],
    AEG0003: [
        {
            id: 'AI-AEG0003-2025',
            serial: 'AEG0003',
            year: 2025,
            date: '2025-02-10',
            inspector: 'Lic. Fernando Ríos',
            delegation: 'SENIAT - Gerencia Regional Zuliana',
            resolutionNumber: 'GRZ-2025-0011',
            status: 'Aprobado',
            observations: 'Inspección realizada sin novedades. Libro de control al día. Equipo en condiciones óptimas al momento de la inspección.',
            nextInspection: '2026-02-10',
        },
        {
            id: 'AI-AEG0003-2024',
            serial: 'AEG0003',
            year: 2024,
            date: '2024-02-05',
            inspector: 'Lic. Laura Urdaneta',
            delegation: 'SENIAT - Gerencia Regional Zuliana',
            resolutionNumber: 'GRZ-2024-0008',
            status: 'Aprobado',
            observations: 'Primera inspección. Todo conforme a la normativa vigente.',
            nextInspection: '2025-02-05',
        },
    ],
    AEG0004: [
        {
            id: 'AI-AEG0004-2026',
            serial: 'AEG0004',
            year: 2026,
            date: '2026-01-08',
            inspector: 'Lic. Gustavo Morales',
            delegation: 'SENIAT - Gerencia Regional Central',
            resolutionNumber: 'GRC2-2026-0022',
            status: 'Aprobado',
            observations: 'Cuarta inspección anual del equipo. Memoria fiscal íntegra. Libro de control con 2 servicios técnicos registrados en 2025.',
            nextInspection: '2027-01-08',
        },
        {
            id: 'AI-AEG0004-2025',
            serial: 'AEG0004',
            year: 2025,
            date: '2025-01-09',
            inspector: 'Lic. Gustavo Morales',
            delegation: 'SENIAT - Gerencia Regional Central',
            resolutionNumber: 'GRC2-2025-0014',
            status: 'Aprobado',
            observations: 'Inspección sin novedades. Todos los reportes consecutivos y en orden.',
            nextInspection: '2026-01-09',
        },
        {
            id: 'AI-AEG0004-2024',
            serial: 'AEG0004',
            year: 2024,
            date: '2024-01-12',
            inspector: 'Lic. Carmen Flores',
            delegation: 'SENIAT - Gerencia Regional Central',
            resolutionNumber: 'GRC2-2024-0007',
            status: 'Aprobado',
            observations: 'Equipo en buen estado. Documentación completa.',
            nextInspection: '2025-01-12',
        },
        {
            id: 'AI-AEG0004-2023',
            serial: 'AEG0004',
            year: 2023,
            date: '2023-01-15',
            inspector: 'Lic. Carmen Flores',
            delegation: 'SENIAT - Gerencia Regional Central',
            resolutionNumber: 'GRC2-2023-0003',
            status: 'Aprobado',
            observations: 'Segunda inspección anual. Sin observaciones. Libro de control presentado con la firma del técnico certificado AEG.',
            nextInspection: '2024-01-15',
        },
    ],
}
