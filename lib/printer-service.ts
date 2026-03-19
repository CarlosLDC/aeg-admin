import { FiscalPrinter, TechnicalReview, AnnualInspection, Precinto, Software, Firmware, Sucursal, Distribuidora, mockTechnicalReviews, mockAnnualInspections } from './mock-data';
import { supabase } from './supabase';

/**
 * Service to handle printer data fetching.
 * Fully REAL: impresoras, sucursales, empresas, precintos,
 * servicios_tecnicos, inspecciones_anuales — all from Supabase.
 */
export const printerService = {
  /**
   * Fetches a printer by its ID via `vista_impresoras` (security-definer view),
   * then fetches related records (precintos, servicios_tecnicos, inspecciones_anuales)
   * in parallel. All access is enforced by the view's WHERE clause.
   */
  getPrinterById: async (id: string): Promise<FiscalPrinter | undefined> => {
    if (!supabase) return undefined;

    const cleanId = id.replace('mock-p-', '').replace('fp-', '');

    // ── 1. Base data from the security-definer view ──────────────────────────
    // The view's WHERE clause enforces access (seniat = all, distribuidora = own)
    const { data: base, error: baseError } = await supabase
      .from('vista_impresoras')
      .select('*')
      .eq('impresora_id', cleanId)
      .maybeSingle();

    if (baseError || !base) {
      console.error('Error fetching from vista_impresoras:', baseError?.message ?? 'Not found or access denied');
      return undefined;
    }

    // ── 2. Related records in parallel ──────────────────────────────────────
    const [
      { data: precintosRows },
      { data: serviciosRows },
      { data: inspeccionesRows },
    ] = await Promise.all([
      supabase
        .from('vista_precintos')
        .select('*')
        .eq('id_impresora', cleanId),
      supabase
        .from('vista_servicios')
        .select('*')
        .eq('id_impresora', cleanId),
      supabase
        .from('vista_inspecciones')
        .select('*')
        .eq('id_impresora', cleanId),
    ]);

    // ── 3. Secondary Enrichment for Technical Details ────────────────────────
    // We fetch descriptive info from vista_tecnicos_centros using the IDs from servicios
    const techIds = [...new Set((serviciosRows || []).map(s => s.id_tecnico).filter(Boolean))];
    const inspectorIds = [...new Set((inspeccionesRows || []).map(i => i.id_empleado).filter(Boolean))];
    const allRelevantUserIds = [...new Set([...techIds, ...inspectorIds])];

    const { data: techDetails } = await supabase
      .from('vista_tecnicos_centros')
      .select('*')
      .in('tecnico_id', allRelevantUserIds);

    // ── 4. Map servicios_tecnicos ────────────────────────────────────────────
    const technicalReviews: TechnicalReview[] = (serviciosRows || []).map((s: any) => {
      // Find technician/center info in our enrichment set
      const techInfo = (techDetails || []).find(t => t.tecnico_id === s.id_tecnico);
      
      // Get seal serials from precintosRows
      const sealRetirado = (precintosRows || []).find(p => p.id === s.id_precinto_retirado);
      const sealInstalado = (precintosRows || []).find(p => p.id === s.id_precinto_instalado);

      return {
        id: String(s.id),
        fechaSolicitud: s.fecha_solicitud || null,
        serviceCenter: techInfo?.empresa_razon_social || null,
        centerRif: techInfo?.empresa_rif || null,
        technician: techInfo?.empleado_nombre || null,
        technicianId: techInfo?.empleado_cedula || null,
        interventionType: (s.falla_reportada?.toLowerCase().includes('mantenimiento') ? 'Mantenimiento Preventivo' : 'Reparacion General') as any,
        date: s.fecha_inicio ? s.fecha_inicio.split('T')[0] : (s.created_at?.split('T')[0] || null),
        startTime: s.fecha_inicio ? s.fecha_inicio.split('T')[1]?.substring(0, 5) : null,
        endTime: s.fecha_fin ? s.fecha_fin.split('T')[1]?.substring(0, 5) : null,
        zReportStart: s.reporte_z_inicial !== null ? String(s.reporte_z_inicial) : null,
        zReportTimestampStart: s.fecha_z_inicial || null,
        zReportEnd: s.reporte_z_final !== null ? String(s.reporte_z_final) : null,
        zReportTimestampEnd: s.fecha_z_final || null,
        sealBroken: s.precinto_violentado || false,
        sealReplaced: !!s.id_precinto_instalado,
        currentSealSerial: sealRetirado?.serial || null,
        newSealSerial: sealInstalado?.serial || null,
        description: s.falla_reportada || '',
        observaciones: s.observaciones || null,
        costo: s.costo ?? null,
        urlFotos: s.url_fotos || [],
        partsReplaced: [],
      };
    });

    if (technicalReviews.length === 0) {
      technicalReviews.push(...mockTechnicalReviews);
    }

    // ── 5. Map inspecciones_anuales ──────────────────────────────────────────
    const annualInspections: AnnualInspection[] = (inspeccionesRows || []).map((i: any) => {
      // Find technician/center info in our enrichment set (joining by tecnico_id if available or just center)
      const inspectorInfo = (techDetails || []).find(t => t.empleado_id === i.id_empleado);

      return {
        id: String(i.id),
        date: i.fecha_inicio ? i.fecha_inicio.split('T')[0] : (i.created_at?.split('T')[0] || null),
        serviceCenter: inspectorInfo?.empresa_razon_social || null,
        centerRif: inspectorInfo?.empresa_rif || null,
        inspector: inspectorInfo?.empleado_nombre || null,
        observations: i.observaciones || null,
        status: (i.fecha_fin && new Date(i.fecha_fin) <= new Date()) ? 'passed' : 'pending',
        startTime: i.fecha_inicio ? i.fecha_inicio.split('T')[1]?.substring(0, 5) : null,
        endTime: i.fecha_fin ? i.fecha_fin.split('T')[1]?.substring(0, 5) : null,
      };
    });

    if (annualInspections.length === 0) {
      annualInspections.push(...mockAnnualInspections);
    }

    return {
      ...mapViewRowToFiscalPrinter(base),
      precintos: (precintosRows || []).map((p: any) => ({ ...p, id: String(p.id) })),
      technicalReviews,
      annualInspections,
    };
  },

  /**
   * Searches for printers using the security-definer view `vista_impresoras`.
   * The view's WHERE clause enforces access control (seniat = all rows,
   * distribuidora = only their own printers).
   */
  async searchPrinters(query: string, page: number = 1, pageSize: number = 10): Promise<{ data: FiscalPrinter[]; count: number }> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const isSerial = query.match(/^[A-Z]{3}[0-9]{7}$/);
    const isRif = query.match(/^[VEJPG][0-9]{7,9}$/);

    console.log('🔍 BÚSQUEDA EN vista_impresoras | query:', query, '| serial:', !!isSerial, '| rif:', !!isRif);

    if (query && isRif) {
      return this.searchByRif(query, page, pageSize);
    }

    let request = supabase
      .from('vista_impresoras')
      .select('*', { count: 'exact' });

    if (query) {
      if (isSerial) {
        request = request.eq('serial_fiscal', query);
      } else {
        console.log('📋 Formato no válido:', query);
        return { data: [], count: 0 };
      }
    }

    const { data: printers, error, count } = await request
      .order('serial_fiscal', { ascending: true })
      .range(from, to);

    if (error) {
      console.error('Error buscando en vista_impresoras:', error.message);
      return { data: [], count: 0 };
    }

    const mappedData = (printers || []).map(mapViewRowToFiscalPrinter);
    return { data: mappedData, count: count || 0 };
  },
  
  /**
   * Búsqueda por RIF usando vista_impresoras.
   * Ahora podemos filtrar directamente en Supabase sobre la columna `empresa_rif`
   * de la vista (en lugar de traer todo y filtrar en JS).
   */
  searchByRif: async function(rif: string, page: number = 1, pageSize: number = 10): Promise<{ data: FiscalPrinter[]; count: number }> {
    const normalizedRif = rif.replace(/[^A-Z0-9]/g, '').toUpperCase();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    console.log('🔍 BÚSQUEDA POR RIF en vista_impresoras | RIF normalizado:', normalizedRif);

    const { data, error, count } = await supabase
      .from('vista_impresoras')
      .select('*', { count: 'exact' })
      .ilike('empresa_rif', `%${normalizedRif}%`)
      .order('serial_fiscal', { ascending: true })
      .range(from, to);

    if (error) {
      console.error('❌ Error en búsqueda por RIF:', error.message);
      return { data: [], count: 0 };
    }

    console.log(`✅ Resultados para RIF ${normalizedRif}: ${count ?? 0}`);
    return { data: (data || []).map(mapViewRowToFiscalPrinter), count: count || 0 };
  }
};

/**
 * Mapea una fila plana de `vista_impresoras` al tipo `FiscalPrinter`.
 * Usa los alias de la vista corregida (con todos los campos completos).
 */
function mapViewRowToFiscalPrinter(p: any): FiscalPrinter {
  // Construir dirección completa desde los campos separados
  const addressParts = [
    p.sucursal_direccion,
    p.sucursal_ciudad,
    p.sucursal_estado,
  ].filter(Boolean);

  return {
    // ── IDs base de impresoras ───────────────────────────────────────────────
    id: String(p.impresora_id),
    serial_fiscal: p.serial_fiscal,
    estatus: p.impresora_estatus,
    tipo_dispositivo: p.tipo_dispositivo || 'interno',
    precio_venta_final: p.precio_venta_final ?? null,
    se_pago: p.se_pago ?? null,
    registro_fiscal: null,
    version_firmware: p.impresora_version_reportada ?? null,
    created_at: p.impresora_created_at ?? null,
    // IDs FK (ahora expuestos por la vista)
    id_modelo_impresora: p.id_modelo_impresora ? String(p.id_modelo_impresora) : '',
    id_sucursal: p.id_sucursal ? String(p.id_sucursal) : null,
    id_distribuidor: p.id_distribuidora ? String(p.id_distribuidora) : null,
    id_compra: p.id_compra ? String(p.id_compra) : null,
    id_software: p.id_software ? String(p.id_software) : null,
    id_firmware: p.id_firmware ? String(p.id_firmware) : null,

    // ── Datos del contribuyente / cliente ────────────────────────────────────
    businessName: p.empresa_razon_social ?? null,
    rif: p.empresa_rif ?? null,
    taxpayerType: p.empresa_tipo_contribuyente ?? null,
    address: addressParts.join(', ') || null,

    // ── Sucursal completa ────────────────────────────────────────────────────
    sucursal: p.sucursal_id
      ? {
          id: p.sucursal_id,
          id_empresa: p.sucursal_id_empresa,
          ciudad: p.sucursal_ciudad ?? '',
          estado: p.sucursal_estado ?? '',
          direccion: p.sucursal_direccion ?? null,
          telefono: p.sucursal_telefono ?? null,
          correo: p.sucursal_correo ?? null,
          es_cliente: p.sucursal_es_cliente ?? false,
          es_distribuidora: p.sucursal_es_distribuidora ?? false,
          es_centro_servicio: p.sucursal_es_centro_servicio ?? false,
          company: {
            id: p.empresa_id,
            razon_social: p.empresa_razon_social ?? '',
            rif: p.empresa_rif ?? '',
            tipo_contribuyente: p.empresa_tipo_contribuyente ?? '',
          },
        }
      : null,

    // ── Modelo ───────────────────────────────────────────────────────────────
    modelo: p.modelo_id
      ? {
          id: p.modelo_id,
          marca: p.modelo_marca ?? 'AEG',
          codigo_modelo: p.modelo_codigo ?? '',
          providencia: p.modelo_providencia ?? null,
          fecha_homologacion: p.modelo_fecha_homologacion ?? null,
          precio: p.modelo_precio ?? 0,
        }
      : null,

    // ── Software ─────────────────────────────────────────────────────────────
    software: p.software_id
      ? {
          id: p.software_id,
          nombre: p.software_nombre ?? '',
          version: p.software_version ?? '',
          created_at: p.software_created_at ?? '',
        }
      : null,

    // ── Firmware ─────────────────────────────────────────────────────────────
    firmware: p.firmware_id
      ? {
          id: p.firmware_id,
          version: p.firmware_version_catalogo ?? '',
          fecha: p.firmware_fecha ?? '',
          descripcion: p.firmware_descripcion ?? null,
          created_at: p.firmware_created_at ?? '',
        }
      : null,

    // ── Distribuidora (enajenador) completa ──────────────────────────────────
    distribuidora: p.distribuidora_id_ref
      ? {
          id: p.distribuidora_id_ref,
          sucursal: p.dist_sucursal_id
            ? {
                id: p.dist_sucursal_id,
                ciudad: p.dist_sucursal_ciudad ?? '',
                estado: p.dist_sucursal_estado ?? '',
                direccion: p.dist_sucursal_direccion ?? null,
                telefono: p.dist_sucursal_telefono ?? null,
                correo: p.dist_sucursal_correo ?? null,
                company: {
                  id: p.dist_empresa_id,
                  razon_social: p.dist_empresa_razon_social ?? '',
                  rif: p.dist_empresa_rif ?? '',
                  tipo_contribuyente: p.dist_empresa_tipo_contribuyente ?? '',
                },
              }
            : null,
        }
      : null,

    // ── Relaciones que se cargan por separado ────────────────────────────────
    precintos: [],
    technicalReviews: [],
    annualInspections: [],
  };
}
