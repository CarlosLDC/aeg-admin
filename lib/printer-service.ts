import { FiscalPrinter, TechnicalReview, AnnualInspection } from './mock-data';
import { supabase } from './supabase';

/**
 * Service to handle printer data fetching.
 * Hybrid Mode:
 * - REAL: empresas, sucursales (from Supabase)
 * - MOCK: printers, technical_reviews, annual_inspections (dynamically generated)
 */
export const printerService = {
  /**
   * Fetches a printer by its ID from the real "impresoras" table.
   */
  getPrinterById: async (id: string): Promise<FiscalPrinter | undefined> => {
    if (!supabase) return undefined;

    // Normalize ID: Remove synthetic prefixes (legacy or prototype)
    const cleanId = id.replace('mock-p-', '').replace('fp-', '');

    const { data: printer, error } = await supabase
      .from('impresoras')
      .select(`
        *,
        sucursal:sucursales (
          *,
          company:empresas (id, razon_social, rif, tipo_contribuyente)
        ),
        precintos (
          id, serial, color, estatus, created_at, fecha_instalacion, fecha_retiro
        )
      `)
      .eq('id', cleanId)
      .single();

    if (error || !printer) {
      console.error('Error fetching printer details:', error?.message);
      return undefined;
    }

    // Return mapped object
    return {
        ...printer,
        businessName: printer.sucursal?.company?.razon_social || 'SIN ASIGNAR',
        rif: printer.sucursal?.company?.rif || 'N/A',
        taxpayerType: printer.sucursal?.company?.tipo_contribuyente || 'N/A',
        address: printer.sucursal ? `${printer.sucursal.direccion}${printer.sucursal.ciudad ? ', ' + printer.sucursal.ciudad : ''}` : 'SIN UBICACIÓN',
        precintos: (printer.precintos || []).map((p: any) => ({ ...p, id: String(p.id) })),
        // Mock reviews and inspections for now until these tables exist
        technicalReviews: generateMockReviews(printer.id),
        annualInspections: generateMockInspections(printer.id)
    };
  },

  /**
   * Searches for printers in the "impresoras" table.
   */
  searchPrinters: async (query: string, page: number = 1, pageSize: number = 5): Promise<{ data: FiscalPrinter[], count: number }> => {
    if (!supabase) return { data: [], count: 0 };

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let request = supabase
      .from('impresoras')
      .select(`
        *,
        sucursal:sucursales (
          *,
          company:empresas (id, razon_social, rif, tipo_contribuyente)
        )
      `, { count: 'exact' });

    if (query) {
        // Search by serial_fiscal, or related company data through sucursales
        // Note: PostgREST allows searching across foreign tables using the table name or alias
        request = request.or(`serial_fiscal.ilike.%${query}%,sucursales.empresas.rif.ilike.%${query}%,sucursales.empresas.razon_social.ilike.%${query}%`);
    }

    const { data: printers, error, count } = await request
        .order('serial_fiscal', { ascending: true })
        .range(from, to);

    if (error) {
      console.error('Error searching printers:', error.message);
      return { data: [], count: 0 };
    }

    const mappedData = (printers || []).map(p => ({
        ...p,
        businessName: p.sucursal?.company?.razon_social || 'SIN ASIGNAR',
        rif: p.sucursal?.company?.rif || 'N/A',
        taxpayerType: p.sucursal?.company?.tipo_contribuyente || 'N/A',
        address: p.sucursal ? `${p.sucursal.direccion}${p.sucursal.ciudad ? ', ' + p.sucursal.ciudad : ''}` : 'SIN UBICACIÓN',
        precintos: [],
        technicalReviews: [],
        annualInspections: []
    }));

    return { data: mappedData, count: count || 0 };
  }
};

// --- Mock Generators for Hybrid View ---

function generateMockReviews(seed: any): TechnicalReview[] {
    const seedStr = String(seed);
    return [
        {
            id: `tr-mock-${seedStr.slice(0, 4)}`,
            date: '2024-12-10',
            serviceCenter: 'AEG Servicios Autorizados C.A.',
            centerRif: 'J-40582910-3',
            technician: 'Carlos Rodríguez',
            technicianId: 'V-15829301',
            interventionType: 'Mantenimiento Preventivo',
            zReportStart: '0004500',
            zReportEnd: '0004501',
            sealBroken: false,
            sealReplaced: false,
            description: 'Mantenimiento preventivo anual regular realizado con éxito.'
        }
    ];
}

function generateMockInspections(seed: any): AnnualInspection[] {
    const seedStr = String(seed);
    return [
        {
            id: `ai-mock-${seedStr.slice(0, 4)}`,
            date: '2025-01-20',
            serviceCenter: 'AEG Servicios Autorizados C.A.',
            centerRif: 'J-40582910-3',
            inspector: 'María Gonzalez (Fiscal)',
            status: 'passed',
            observations: 'Equipo opera conforme a la normativa vigente sin anomalías detectadas.'
        }
    ];
}
