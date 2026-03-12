export interface Precinto {
  id: string | number;
  serial: string;
  color: string;
  estatus: string;
  created_at: string;
  fecha_instalacion: string | null;
  fecha_retiro: string | null;
}

export interface TechnicalReview {
  id: string;
  date: string; // = fecha_inicio
  fechaSolicitud?: string | null;
  serviceCenter: string;
  centerRif: string;
  technician: string;
  technicianId: string;
  interventionType: 'Mantenimiento Preventivo' | 'Mantenimiento Correctivo' | 'Cambio de Alicuota' | 'Reparacion General' | 'Inicializacion';
  zReportStart: string;
  zReportEnd: string;
  sealBroken: boolean;
  sealReplaced: boolean;
  description: string; // = falla_reportada
  observaciones?: string | null;
  costo?: number | null;
  urlFotos?: string[];
  partsReplaced?: string[];
  startTime?: string | null;
  endTime?: string | null;
}

export interface AnnualInspection {
  id: string;
  date: string; // = fecha_inicio
  serviceCenter: string;
  centerRif: string;
  inspector: string;
  tipo?: string | null;
  precintoViolentado?: boolean;
  status: 'passed' | 'pending';
  observations: string;
  urlFotos?: string[];
  pdfUrl?: string;
  startTime?: string | null;
  endTime?: string | null;
}

export interface FiscalPrinter {
  id: string;
  id_modelo_impresora: string; 
  id_sucursal: string | null; 
  id_distribuidor: string | null; 
  id_compra: string | null; 
  id_software: string | null; 
  id_firmware: string | null; 
  serial_fiscal: string; 
  estatus: 'laboratorio' | 'asignada' | 'sin_asignar' | 'enajenada'; 
  precio_venta_final: number | null; 
  se_pago: boolean | null; 
  registro_fiscal?: string | null;

  // UI Fallback props (Transient)
  businessName: string | null;
  rif: string | null;
  taxpayerType: string | null;
  address: string | null;
  precintos: Precinto[];
  technicalReviews: TechnicalReview[];
  annualInspections: AnnualInspection[];
}

export const mockPrinters: FiscalPrinter[] = [
  {
    id: 'fp-1',
    serial_fiscal: 'GRA2041920',
    id_modelo_impresora: 'mod-aeg-7000',
    id_sucursal: 'suc-chacao-01',
    id_distribuidor: 'dist-master-ve',
    id_compra: 'cmp-2020-091',
    id_software: 'sw-pos-retail-v2',
    id_firmware: 'fw-aeg-v7.1',
    estatus: 'asignada',
    precio_venta_final: 850.00,
    se_pago: true,

    // Temp legacy props
    rif: 'J-12345678-9',
    businessName: 'Supermercados El Granero C.A.',
    taxpayerType: 'Contribuyente Especial',
    address: 'Av. Francisco de Miranda, Edif. Galipán, Chacao, Caracas',
    precintos: [
      {
        id: 'prec-1',
        serial: 'PRC-2024-0101',
        color: 'Rojo',
        estatus: 'activo',
        created_at: '2024-01-15T10:00:00Z',
        fecha_instalacion: '2024-01-15T10:00:00Z',
        fecha_retiro: null,
      },
      {
        id: 'prec-2',
        serial: 'PRC-2022-0034',
        color: 'Azul',
        estatus: 'retirado',
        created_at: '2022-06-01T08:30:00Z',
        fecha_instalacion: '2022-06-01T08:30:00Z',
        fecha_retiro: '2024-01-15T09:50:00Z',
      },
    ],
    technicalReviews: Array.from({ length: 3 }).map((_, i) => ({
      id: `tr-${3 - i}`,
      date: new Date(2025 - Math.floor(i / 3), 6 - i, 15).toISOString().split('T')[0],
      fechaSolicitud: new Date(2025 - Math.floor(i / 3), 6 - i, 10).toISOString().split('T')[0],
      serviceCenter: 'AEG Servicios Autorizados C.A.',
      centerRif: 'J-40582910-3',
      interventionType: i % 3 === 0 ? 'Mantenimiento Correctivo' : (i % 2 === 0 ? 'Mantenimiento Preventivo' : 'Reparacion General') as TechnicalReview['interventionType'],
      zReportStart: `${4500 + i}`,
      zReportEnd: `${4501 + i}`,
      sealBroken: i % 2 === 0,
      sealReplaced: i % 2 === 0,
      description: i % 2 === 0 ? 'Falla de impresion en cabezal termico' : 'Mantenimiento preventivo de rutina.',
      observaciones: i % 2 === 0 ? 'Se reemplazo cabezal y precinto.' : null,
      costo: i % 2 === 0 ? 120.00 : 50.00,
      urlFotos: [],
      technician: i % 2 === 0 ? 'Carlos Rodríguez' : 'Luis Perez',
      technicianId: i % 2 === 0 ? 'V-15829301' : 'V-18293041',
      partsReplaced: i % 2 === 0 ? ['Cabezal térmico'] : []
    })),
    annualInspections: Array.from({ length: 2 }).map((_, i) => ({
      id: `ai-${2 - i}`,
      date: new Date(2025 - i, 0, 20).toISOString().split('T')[0],
      serviceCenter: 'AEG Servicios Autorizados C.A.',
      centerRif: 'J-40582910-3',
      inspector: i % 2 === 0 ? 'María Gonzalez (Fiscal)' : 'José Silva (Fiscal)',
      tipo: 'Inspeccion Anual',
      precintoViolentado: false,
      status: 'passed' as const,
      observations: 'Equipo opera conforme a la normativa vigente sin anomalías detectadas.',
      urlFotos: []
    })),
  },
  {
    id: 'fp-2',
    serial_fiscal: 'GRA0005678',
    id_modelo_impresora: 'mod-aeg-5000',
    id_sucursal: 'suc-zulia-04',
    id_distribuidor: 'dist-occidente',
    id_compra: 'cmp-2023-142',
    id_software: 'sw-pos-resto-v4',
    id_firmware: 'fw-aeg-v5.3',
    estatus: 'laboratorio',
    precio_venta_final: 600.00,
    se_pago: false,

    // Temp legacy props
    rif: 'J-98765432-1',
    businessName: 'Restaurant El Solar de los Abuelos',
    taxpayerType: 'Contribuyente Ordinario',
    address: 'Calle 72 con Av. Bella Vista, Maracaibo, Zulia',
    precintos: [
      {
        id: 'prec-3',
        serial: 'PRC-2023-0087',
        color: 'Verde',
        estatus: 'activo',
        created_at: '2023-11-10T14:00:00Z',
        fecha_instalacion: '2023-11-10T14:00:00Z',
        fecha_retiro: null,
      }
    ],
    technicalReviews: [
      {
        id: 'tr-3',
        date: '2023-11-10',
        serviceCenter: 'Sistemas Integrales Ve.',
        centerRif: 'J-50192839-1',
        technician: 'Pedro Mendoza',
        technicianId: 'V-19283746',
        interventionType: 'Mantenimiento Preventivo',
        zReportStart: '0001024',
        zReportEnd: '0001025',
        sealBroken: false,
        sealReplaced: false,
        description: 'Mantenimiento y limpieza de cabezal',
      }
    ],
    annualInspections: [
      {
        id: 'ai-2',
        date: '2024-05-15',
        serviceCenter: 'Sistemas Integrales Ve.',
        centerRif: 'J-50192839-1',
        inspector: 'Ana Silva',
        status: 'passed',
        observations: 'Equipo aprobado según normativa vigente.',
        pdfUrl: '/demo.pdf'
      }
    ],
  },
];
