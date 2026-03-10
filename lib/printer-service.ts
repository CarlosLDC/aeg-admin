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
   * Reconstructs a FiscalPrinter object using a branch ID and mock operational data.
   */
  getPrinterById: async (id: string): Promise<FiscalPrinter | undefined> => {
    if (!supabase) return undefined;

    // Extract sucursal ID from our composite mock ID (e.g., "mock-p-[id]")
    const sucursalId = id.startsWith('mock-p-') ? id.replace('mock-p-', '') : id;

    const { data: branch, error } = await supabase
      .from('sucursales')
      .select(`
        *,
        company:empresas (*)
      `)
      .eq('id', sucursalId)
      .single();

    if (error || !branch) {
      console.error('Error fetching branch for details:', error?.message);
      return undefined;
    }

    const branchIdStr = String(branch.id);

    // Return hybrid object
    return {
        id: `mock-p-${branchIdStr}`,
        businessName: branch.company?.razon_social || 'Desconocido',
        rif: branch.company?.rif || 'Desconocido',
        address: `${branch.direccion}${branch.ciudad ? ', ' + branch.ciudad : ''}`,
        serial: `AEG${branchIdStr.padStart(7, '0')}`,
        model: 'AEG-7000-PRO',
        registrationDate: '2023-01-01',
        status: 'activo' as 'activo' | 'inactivo',
        // Mock reviews and inspections
        technicalReviews: generateMockReviews(branchIdStr),
        annualInspections: generateMockInspections(branchIdStr)
    };
  },

  /**
   * Searches for businesses/branches and returns them as "Fiscal Printers" for the UI.
   * Supports pagination.
   */
  searchPrinters: async (query: string, page: number = 1, pageSize: number = 5): Promise<{ data: FiscalPrinter[], count: number }> => {
    if (!supabase) return { data: [], count: 0 };

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let request = supabase
      .from('sucursales')
      .select(`
        *,
        company:empresas (*)
      `, { count: 'exact' });

    if (query) {
        // Search in company rif, company razon_social, or branch address
        request = request.or(`company.rif.ilike.%${query}%,company.razon_social.ilike.%${query}%,direccion.ilike.%${query}%`);
    }

    const { data: branches, error, count } = await request
        .order('id', { ascending: true }) // Stable sort for pagination
        .range(from, to);

    if (error) {
      console.error('Error searching businesses/branches:', error.message, error.details);
      return { data: [], count: 0 };
    }

    const mappedData = (branches || []).map(branch => {
        const branchIdStr = String(branch.id);
        return {
            id: `mock-p-${branchIdStr}`,
            businessName: branch.company?.razon_social || 'Desconocido',
            rif: branch.company?.rif || 'Desconocido',
            address: `${branch.direccion}${branch.ciudad ? ', ' + branch.ciudad : ''}`,
            serial: `AEG${branchIdStr.padStart(7, '0')}`,
            model: 'AEG-7000-PRO',
            registrationDate: '2023-01-01',
            status: 'activo' as 'activo' | 'inactivo',
            technicalReviews: [],
            annualInspections: []
        };
    });

    return { data: mappedData, count: count || 0 };
  }
};

// --- Mock Generators for Hybrid View ---

function generateMockReviews(seed: string): TechnicalReview[] {
    return [
        {
            id: `tr-mock-${seed.slice(0, 4)}`,
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

function generateMockInspections(seed: string): AnnualInspection[] {
    return [
        {
            id: `ai-mock-${seed.slice(0, 4)}`,
            date: '2025-01-20',
            serviceCenter: 'AEG Servicios Autorizados C.A.',
            centerRif: 'J-40582910-3',
            inspector: 'María Gonzalez (Fiscal)',
            status: 'passed',
            observations: 'Equipo opera conforme a la normativa vigente sin anomalías detectadas.'
        }
    ];
}
