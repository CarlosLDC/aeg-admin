export interface TechnicalReview {
  id: string;
  date: string;
  serviceCenter: string;
  centerRif: string;
  technician: string;
  technicianId: string;
  interventionType: 'Mantenimiento Preventivo' | 'Mantenimiento Correctivo' | 'Cambio de Alícuota' | 'Reparación General' | 'Inicialización';
  zReportStart: string;
  zReportEnd: string;
  sealBroken: boolean;
  sealReplaced: boolean;
  description: string;
  partsReplaced?: string[];
}

export interface AnnualInspection {
  id: string;
  date: string;
  serviceCenter: string;
  centerRif: string;
  inspector: string;
  status: 'passed' | 'pending';
  observations: string;
  pdfUrl?: string;
}

export interface FiscalPrinter {
  id: string;
  businessName: string;
  rif: string;
  serial: string;
  model: string;
  registrationDate: string;
  address: string;
  status: 'activo' | 'inactivo';
  technicalReviews: TechnicalReview[];
  annualInspections: AnnualInspection[];
}

export const mockPrinters: FiscalPrinter[] = [
  {
    id: 'fp-1',
    serial: 'AEG-PRO-204192',
    rif: 'J-12345678-9',
    businessName: 'Supermercados El Granero C.A.',
    address: 'Av. Francisco de Miranda, Edif. Galipán, Chacao, Caracas',
    model: 'AEG-7000-PRO',
    registrationDate: '2020-01-15',
    status: 'activo',
    technicalReviews: Array.from({ length: 25 }).map((_, i) => ({
      id: `tr-${25 - i}`,
      date: new Date(2025 - Math.floor(i / 5), 11 - (i % 12), 15).toISOString().split('T')[0],
      serviceCenter: 'AEG Servicios Autorizados C.A.',
      centerRif: 'J-40582910-3',
      interventionType: i % 3 === 0 ? 'Mantenimiento Correctivo' : (i % 2 === 0 ? 'Mantenimiento Preventivo' : 'Reparación General'),
      zReportStart: `000${4500 + i}`,
      zReportEnd: `000${4501 + i}`,
      sealBroken: i % 4 === 0,
      sealReplaced: i % 4 === 0,
      description: i % 3 === 0 ? 'Cambio de memoria fiscal por saturación, se reemplazó precinto.' : (i % 2 === 0 ? 'Mantenimiento preventivo anual regular.' : 'Calibración de cabezal térmico por falla de impresión.'),
      technician: i % 2 === 0 ? 'Carlos Rodríguez' : 'Luis Perez',
      technicianId: i % 2 === 0 ? 'V-15829301' : 'V-18293041',
      partsReplaced: i % 3 === 0 ? ['Memoria Estática 2GB', 'Precinto Seguridad'] : []
    })),
    annualInspections: Array.from({ length: 12 }).map((_, i) => ({
      id: `ai-${12 - i}`,
      date: new Date(2025 - i, 0, 20).toISOString().split('T')[0],
      serviceCenter: 'AEG Servicios Autorizados C.A.',
      centerRif: 'J-40582910-3',
      inspector: i % 2 === 0 ? 'María Gonzalez (Fiscal)' : 'José Silva (Fiscal)',
      status: i > 0 || Math.random() > 0.1 ? 'passed' : 'pending',
      observations: i % 4 === 0 ? 'Precinto de seguridad en perfecto estado. Equipo cumple Providencia 0141.' : 'Equipo opera conforme a la normativa vigente sin anomalías detectadas.'
    }))
  },
  {
    id: '2',
    serial: 'AEG-H0005678',
    rif: 'J-98765432-1',
    businessName: 'Restaurant El Solar de los Abuelos',
    address: 'Calle 72 con Av. Bella Vista, Maracaibo, Zulia',
    model: 'AEG-5000-MINI',
    registrationDate: '2023-06-20',
    status: 'activo',
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
