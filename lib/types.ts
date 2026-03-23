export type EstatusPrecinto = 'disponible' | 'en_impresora' | 'sustituido';

export interface Precinto {
  id: string | number;
  id_impresora: string | number | null;
  serial: string;
  color: string;
  estatus: EstatusPrecinto;
  created_at: string;
  fecha_instalacion: string | null;
  fecha_retiro: string | null;
}

export interface Software {
  id: string | number;
  nombre: string;
  version: string;
  created_at: string;
}

export interface Firmware {
  id: string | number;
  version: string;
  fecha: string;
  descripcion: string | null;
  created_at: string;
}

export interface Empresa {
  id: string | number;
  razon_social: string;
  rif: string;
  tipo_contribuyente: string;
}

export interface Sucursal {
  id: string | number;
  id_empresa: string | number;
  ciudad: string;
  estado: string;
  direccion: string | null;
  telefono: string | null;
  correo: string | null;
  es_cliente: boolean;
  es_distribuidora: boolean;
  es_centro_servicio: boolean;
  company: Empresa;
}

export interface TechnicalReview {
  id: string;
  /** ISO `created_at` del registro en BD (libro fiscal / ordenación). */
  createdAt?: string | null;
  fechaSolicitud?: string | null;
  serviceCenter: string | null;
  centerRif: string | null;
  technician: string | null;
  technicianId: string | null;
  interventionType: 'Mantenimiento Preventivo' | 'Mantenimiento Correctivo' | 'Cambio de Alicuota' | 'Reparacion General' | 'Inicializacion';
  startDate?: string | null;
  endDate?: string | null;
  date: string | null;
  startTime?: string | null;
  endTime?: string | null;
  zReportStart: string | null;
  zReportTimestampStart?: string | null;
  zReportEnd: string | null;
  zReportTimestampEnd?: string | null;
  sealBroken: boolean;
  sealReplaced: boolean;
  currentSealSerial?: string | null;
  newSealSerial?: string | null;
  description: string | null;
  observaciones?: string | null;
  costo?: number | null;
  urlFotos?: string[];
  partsReplaced?: string[];
}

export interface AnnualInspection {
  id: string;
  /** ISO `created_at` del registro en BD. */
  createdAt?: string | null;
  date: string | null;
  serviceCenter: string | null;
  centerRif: string | null;
  inspector: string | null;
  tipo?: string | null;
  precintoViolentado?: boolean;
  status: 'passed' | 'pending';
  observations: string | null;
  urlFotos?: string[];
  pdfUrl?: string;
  startTime?: string | null;
  endTime?: string | null;
}

export interface PrinterModel {
  id: string | number;
  marca: string;
  codigo_modelo: string;
  providencia?: string | null;
  fecha_homologacion?: string | null;
  precio: number;
}

export interface Distribuidora {
  id: string | number;
  sucursal: {
    id: string | number;
    ciudad: string;
    estado: string;
    direccion: string | null;
    telefono: string | null;
    correo: string | null;
    company: Empresa;
  } | null;
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
  tipo_dispositivo: 'interno' | 'externo';
  version_firmware?: string | null;
  created_at?: string | null;
  fecha_instalacion?: string | null;
  direccion_mac?: string | null;

  businessName: string | null;
  rif: string | null;
  taxpayerType: string | null;
  address: string | null;
  modelo?: PrinterModel | null;
  software?: Software | null;
  firmware?: Firmware | null;
  sucursal?: Sucursal | null;
  distribuidora?: Distribuidora | null;
  precintos: Precinto[];
  technicalReviews: TechnicalReview[];
  annualInspections: AnnualInspection[];
}
