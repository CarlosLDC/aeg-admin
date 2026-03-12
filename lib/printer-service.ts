import { FiscalPrinter, TechnicalReview, AnnualInspection } from './mock-data';
import { supabase } from './supabase';

/**
 * Service to handle printer data fetching.
 * Fully REAL: impresoras, sucursales, empresas, precintos,
 * servicios_tecnicos, inspecciones_anuales — all from Supabase.
 */
export const printerService = {
  /**
   * Fetches a printer by its ID from the real "impresoras" table,
   * including full service history and annual inspections.
   */
  getPrinterById: async (id: string): Promise<FiscalPrinter | undefined> => {
    if (!supabase) return undefined;

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
        ),
        servicios_tecnicos (
          *,
          centro:centros_servicio (nombre, rif),
          tecnico:tecnicos (nombre, apellido, cedula)
        ),
        inspecciones_anuales (
          *,
          centro:centros_servicio (nombre, rif),
          empleado:empleados (nombre, apellido)
        )
      `)
      .eq('id', cleanId)
      .single();

    if (error || !printer) {
      console.error('Error fetching printer details:', error?.message);
      return undefined;
    }

    const technicalReviews: TechnicalReview[] = (printer.servicios_tecnicos || []).map((s: any) => ({
      id: String(s.id),
      date: s.fecha_inicio ? s.fecha_inicio.split('T')[0] : (s.created_at?.split('T')[0] || ''),
      fechaSolicitud: s.fecha_solicitud || null,
      serviceCenter: s.centro?.nombre || 'N/A',
      centerRif: s.centro?.rif || 'N/A',
      technician: s.tecnico ? `${s.tecnico.nombre} ${s.tecnico.apellido}` : 'N/A',
      technicianId: s.tecnico?.cedula || 'N/A',
      interventionType: s.tipo || 'Mantenimiento Preventivo',
      zReportStart: String(s.reporte_z_inicial ?? ''),
      zReportEnd: String(s.reporte_z_final ?? ''),
      sealBroken: s.precinto_violentado || false,
      sealReplaced: !!s.id_precinto_instalado,
      description: s.falla_reportada || '',
      observaciones: s.observaciones || null,
      costo: s.costo ?? null,
      urlFotos: s.url_fotos || [],
      partsReplaced: [],
      startTime: s.fecha_inicio ? s.fecha_inicio.split('T')[1]?.substring(0, 5) : null,
      endTime: s.fecha_fin ? s.fecha_fin.split('T')[1]?.substring(0, 5) : null,
    }));

    const annualInspections: AnnualInspection[] = (printer.inspecciones_anuales || []).map((i: any) => ({
      id: String(i.id),
      date: i.fecha_inicio ? i.fecha_inicio.split('T')[0] : (i.created_at?.split('T')[0] || ''),
      serviceCenter: i.centro?.nombre || 'N/A',
      centerRif: i.centro?.rif || 'N/A',
      inspector: i.empleado ? `${i.empleado.nombre} ${i.empleado.apellido}` : 'N/A',
      tipo: i.tipo || null,
      precintoViolentado: i.precinto_violentado || false,
      status: (i.fecha_fin && new Date(i.fecha_fin) <= new Date()) ? 'passed' : 'pending',
      observations: i.observaciones || '',
      urlFotos: i.url_fotos || [],
      pdfUrl: i.url_fotos?.[0] || undefined,
      startTime: i.fecha_inicio ? i.fecha_inicio.split('T')[1]?.substring(0, 5) : null,
      endTime: i.fecha_fin ? i.fecha_fin.split('T')[1]?.substring(0, 5) : null,
    }));

    return {
      ...printer,
      registro_fiscal: printer.registro_fiscal || null,
      businessName: printer.sucursal?.company?.razon_social || 'SIN ASIGNAR',
      rif: printer.sucursal?.company?.rif || 'N/A',
      taxpayerType: printer.sucursal?.company?.tipo_contribuyente || 'N/A',
      address: printer.sucursal
        ? `${printer.sucursal.direccion}${printer.sucursal.ciudad ? ', ' + printer.sucursal.ciudad : ''}`
        : 'SIN UBICACIÓN',
      precintos: (printer.precintos || []).map((p: any) => ({ ...p, id: String(p.id) })),
      technicalReviews,
      annualInspections,
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
      address: p.sucursal
        ? `${p.sucursal.direccion}${p.sucursal.ciudad ? ', ' + p.sucursal.ciudad : ''}`
        : 'SIN UBICACIÓN',
      precintos: [],
      technicalReviews: [],
      annualInspections: [],
    }));

    return { data: mappedData, count: count || 0 };
  }
};
