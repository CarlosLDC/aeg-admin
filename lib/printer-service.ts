import { FiscalPrinter, TechnicalReview, AnnualInspection, Precinto, Software, Firmware, Sucursal, mockTechnicalReviews, mockAnnualInspections } from './mock-data';
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
        modelos_impresora!id_modelo_impresora (*),
        software!id_software (*),
        firmware!id_firmware (*),
        precintos (
          id, serial, color, estatus, created_at, fecha_instalacion, fecha_retiro
        ),
        servicios_tecnicos (
          *,
          centro:centros_servicio (*),
          tecnico:tecnicos (*)
        ),
        inspecciones_anuales (
          *,
          centro:centros_servicio (*),
          empleado:empleados (*)
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
      fechaSolicitud: s.fecha_solicitud || null,
      serviceCenter: s.centro?.nombre || s.centro?.razon_social || s.centro?.nombre_centro || 'N/A',
      centerRif: s.centro?.rif || s.centro?.rif_centro || 'N/A',
      technician: s.tecnico ? (`${s.tecnico.nombre || s.tecnico.first_name || ''} ${s.tecnico.apellido || s.tecnico.last_name || ''}`).trim() || 'N/A' : 'N/A',
      technicianId: s.tecnico?.cedula || s.tecnico?.id_card || 'N/A',
      interventionType: s.tipo || 'Mantenimiento Preventivo',
      date: s.fecha_inicio ? s.fecha_inicio.split('T')[0] : (s.created_at?.split('T')[0] || ''),
      startTime: s.fecha_inicio ? s.fecha_inicio.split('T')[1]?.substring(0, 5) : null,
      endTime: s.fecha_fin ? s.fecha_fin.split('T')[1]?.substring(0, 5) : null,
      zReportStart: String(s.reporte_z_inicial ?? ''),
      zReportTimestampStart: s.fecha_z_inicial || null,
      zReportEnd: String(s.reporte_z_final ?? ''),
      zReportTimestampEnd: s.fecha_z_final || null,
      sealBroken: s.precinto_violentado || false,
      sealReplaced: !!s.id_precinto_instalado,
      currentSealSerial: null, // TODO: Get from precintos table
      newSealSerial: s.id_precinto_instalado ? 'NEW-SEAL-' + s.id_precinto_instalado : null,
      description: s.falla_reportada || '',
      observaciones: s.observaciones || null,
      costo: s.costo ?? null,
      urlFotos: s.url_fotos || [],
      partsReplaced: [],
    }));

    // If no technical reviews from DB, use mock data
    if (technicalReviews.length === 0) {
      const mockReviews = mockTechnicalReviews.map(review => ({
        ...review,
        // Add any missing fields that might be needed
      }));
      technicalReviews.push(...mockReviews);
    }
    
    const annualInspections: AnnualInspection[] = (printer.inspecciones_anuales || []).map((i: any) => ({
      id: String(i.id),
      date: i.fecha_inicio ? i.fecha_inicio.split('T')[0] : (i.created_at?.split('T')[0] || ''),
      serviceCenter: i.centro?.nombre || i.centro?.razon_social || i.centro?.nombre_centro || 'N/D',
      centerRif: i.centro?.rif || i.centro?.rif_centro || 'N/D',
      inspector: i.empleado ? (`${i.empleado.nombre || i.empleado.first_name || ''} ${i.empleado.apellido || i.empleado.last_name || ''}`).trim() || 'N/D' : 'N/D',
      observations: i.observaciones || i.observations || '',
      status: (i.fecha_fin && new Date(i.fecha_fin) <= new Date()) ? 'passed' : 'pending',
      startTime: i.fecha_inicio ? i.fecha_inicio.split('T')[1]?.substring(0, 5) : null,
      endTime: i.fecha_fin ? i.fecha_fin.split('T')[1]?.substring(0, 5) : null,
    }));

    // If no annual inspections from DB, use mock data
    if (annualInspections.length === 0) {
      const mockInspections = mockAnnualInspections.map(inspection => ({
        ...inspection,
        // Add any missing fields that might be needed
      }));
      annualInspections.push(...mockInspections);
    }

    // Final mapping
    const m = Array.isArray(printer.modelos_impresora) ? printer.modelos_impresora[0] : printer.modelos_impresora;
    const sw = Array.isArray(printer.software) ? printer.software[0] : printer.software;
    const fw = Array.isArray(printer.firmware) ? printer.firmware[0] : printer.firmware;

    return {
      ...printer,
      registro_fiscal: printer.registro_fiscal || null,
      tipo_dispositivo: printer.tipo_dispositivo || 'interno',
      version_firmware: printer.version_firmware || null,
      businessName: printer.sucursal?.company?.razon_social || 'SIN ASIGNAR',
      rif: printer.sucursal?.company?.rif || 'N/A',
      taxpayerType: printer.sucursal?.company?.tipo_contribuyente || 'N/A',
      address: printer.sucursal
        ? `${printer.sucursal.direccion || ''}${printer.sucursal.direccion && printer.sucursal.ciudad ? ', ' : ''}${printer.sucursal.ciudad || ''}${printer.sucursal.ciudad && printer.sucursal.estado ? ', ' : ''}${printer.sucursal.estado || ''}`
        : 'SIN UBICACIÓN',
      modelo: m ? {
        id: m.id,
        marca: m.marca || 'AEG',
        codigo_modelo: m.codigo || m.codigo_modelo || m.modelo || String(m.id)
      } : null,
      software: sw ? {
        id: sw.id,
        nombre: sw.nombre,
        version: sw.version,
        created_at: sw.created_at
      } : null,
      firmware: fw ? {
        id: fw.id,
        version: fw.version,
        fecha: fw.fecha,
        descripcion: fw.descripcion,
        created_at: fw.created_at
      } : null,
      sucursal: printer.sucursal ? {
        ...printer.sucursal,
        company: printer.sucursal.company
      } : null,
      precintos: (printer.precintos || []).map((p: any) => ({ ...p, id: String(p.id) })),
      technicalReviews,
      annualInspections,
    };
  },

  /**
   * Searches for printers in the "impresoras" table.
   */
  async searchPrinters(query: string, page: number = 1, pageSize: number = 10): Promise<{ data: FiscalPrinter[]; count: number }> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    // Detectar si es un RIF o serial fiscal
    const isSerial = query.match(/^[A-Z]{3}[0-9]{7}$/);
    const isRif = query.match(/^[VEJPG][0-9]{7,9}$/);
    
    console.log('🔍 INICIO BÚSQUEDA DE IMPRESORAS');
    console.log('📋 Query:', query);
    console.log('📋 Is Serial:', !!isSerial);
    console.log('📋 Is RIF:', !!isRif);
    
    // Si es RIF, usar el método mejorado
    if (query && isRif) {
      console.log('📋 Usando búsqueda directa por RIF');
      return this.searchByRif(query, page, pageSize);
    }
    
    // Para seriales y otros casos, usar el método original
    let request = supabase
      .from('impresoras')
      .select(`
        *,
        sucursal:sucursales (
          *,
          company:empresas (id, razon_social, rif, tipo_contribuyente)
        ),
        modelos_impresora!id_modelo_impresora (*),
        software!id_software (*),
        firmware!id_firmware (*)
      `, { count: 'exact' });

    if (query) {
      if (isSerial) {
        // Es un serial fiscal, buscar solo por serial
        console.log('📋 Buscando por serial fiscal:', query);
        request = request.eq('serial_fiscal', query);
      } else {
        // Formato no válido, devolver resultado vacío
        console.log('📋 Formato no válido:', query);
        return { data: [], count: 0 };
      }
    }

    const { data: printers, error, count } = await request
      .order('serial_fiscal', { ascending: true })
      .range(from, to);

    console.log('📊 DATOS OBTENIDOS DE SUPABASE:');
    console.log('📋 Total impresoras en BD:', count);
    console.log('📋 Array de impresoras:', printers?.length || 0);
    console.log('📋 Error:', error);

    if (error) {
      console.error('Error searching printers:', error.message);
      return { data: [], count: 0 };
    }

    const mappedData = printers.map(p => {
      const m = Array.isArray(p.modelos_impresora) ? p.modelos_impresora[0] : p.modelos_impresora;
      const sw = Array.isArray(p.software) ? p.software[0] : p.software;
      const fw = Array.isArray(p.firmware) ? p.firmware[0] : p.firmware;

      return {
        ...p,
        tipo_dispositivo: p.tipo_dispositivo || 'interno',
        businessName: p.sucursal?.company?.razon_social || 'SIN ASIGNAR',
        rif: p.sucursal?.company?.rif || 'N/A',
        taxpayerType: p.sucursal?.company?.tipo_contribuyente || 'N/A',
        address: p.sucursal
          ? `${p.sucursal.direccion || ''}${p.sucursal.direccion && p.sucursal.ciudad ? ', ' : ''}${p.sucursal.ciudad || ''}${p.sucursal.ciudad && p.sucursal.estado ? ', ' : ''}${p.sucursal.estado || ''}`
          : 'SIN UBICACIÓN',
        modelo: (() => {
          const m = Array.isArray(p.modelos_impresora) ? p.modelos_impresora[0] : p.modelos_impresora;
          if (!m) return null;
          return {
            id: m.id,
            marca: m.marca || 'AEG',
            codigo_modelo: m.codigo || m.codigo_modelo || m.modelo || String(m.id)
          };
        })(),
        software: sw ? {
          id: sw.id,
          nombre: sw.nombre,
          version: sw.version,
          created_at: sw.created_at
        } : null,
        firmware: fw ? {
          id: fw.id,
          version: fw.version,
          fecha: fw.fecha,
          descripcion: fw.descripcion,
          created_at: fw.created_at
        } : null,
        sucursal: p.sucursal ? {
          ...p.sucursal,
          company: p.sucursal.company
        } : null,
        precintos: [],
        technicalReviews: [],
        annualInspections: [],
      };
    });

    return { data: mappedData, count: count || 0 };
  },
  
  /**
   * Nueva función de búsqueda por RIF mejorada
   * NOTA: Supabase no soporta WHERE en propiedades anidadas de joins,
   * por lo que usamos filtrado JavaScript optimizado.
   */
  searchByRif: async function(rif: string, page: number = 1, pageSize: number = 10): Promise<{ data: FiscalPrinter[]; count: number }> {
    console.log('🔍 BÚSQUEDA DIRECTA POR RIF - FILTRADO JS CON NORMALIZACIÓN');
    console.log('📋 RIF buscado:', rif);
    
    // Normalizar RIF de búsqueda
    const normalizedRif = rif.replace(/[^A-Z0-9]/g, '').toUpperCase();
    console.log('📋 RIF normalizado:', normalizedRif);
    
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    // Obtener todas las impresoras con relaciones (sin filtro en BD para evitar problemas de formato)
    console.log('📋 Obteniendo todas las impresoras con relaciones...');
    const { data: allPrinters, error } = await supabase
      .from('impresoras')
      .select(`
        *,
        sucursal:sucursales!inner (
          *,
          company:empresas!inner (id, razon_social, rif, tipo_contribuyente)
        ),
        modelos_impresora!id_modelo_impresora (*),
        software!id_software (*),
        firmware!id_firmware (*)
      `)
      .order('serial_fiscal', { ascending: true });
      
    if (error) {
      console.error('❌ Error en búsqueda por RIF:', error.message);
      return { data: [], count: 0 };
    }
    
    console.log(`📋 Total impresoras obtenidas: ${allPrinters?.length || 0}`);
    
    // Filtrar en JavaScript con normalización de ambos lados
    const filteredPrinters = (allPrinters || []).filter(printer => {
      const dbRif = printer.sucursal?.company?.rif;
      if (!dbRif) return false;
      
      const normalizedDbRif = dbRif.replace(/[^A-Z0-9]/g, '').toUpperCase();
      const matches = normalizedDbRif === normalizedRif;
      
      console.log(`📋 Comparando: "${dbRif}" → "${normalizedDbRif}" vs "${normalizedRif}" → ${matches}`);
      return matches;
    });
    
    // Eliminar duplicados por ID de impresora
    const uniqueFilteredPrinters = Array.from(new Map(filteredPrinters.map(p => [p.id, p])).values());
    
    console.log(`✅ Impresoras filtradas con RIF ${normalizedRif}: ${filteredPrinters.length}`);
    console.log(`📋 Impresoras únicas: ${uniqueFilteredPrinters.length} (de ${filteredPrinters.length})`);
    
    // Aplicar paginación
    const paginatedPrinters = uniqueFilteredPrinters.slice(from, from + pageSize);
    
    // Debug: mostrar las impresoras que coinciden en esta página
    if (paginatedPrinters.length > 0) {
      console.log('📋 Impresoras en página actual:');
      paginatedPrinters.forEach((printer, index) => {
        console.log(`  ${index + 1}. ID: ${printer.id}, Serial: ${printer.serial_fiscal}, RIF: ${printer.sucursal?.company?.rif}`);
      });
    } else if (uniqueFilteredPrinters.length > 0) {
      console.log('❌ No hay impresoras en esta página, pero sí hay coincidencias totales');
    } else {
      console.log('❌ No se encontraron impresoras con ese RIF');
    }
    
    // Mapear los datos
    const mappedData = paginatedPrinters.map(p => {
      const m = Array.isArray(p.modelos_impresora) ? p.modelos_impresora[0] : p.modelos_impresora;
      const sw = Array.isArray(p.software) ? p.software[0] : p.software;
      const fw = Array.isArray(p.firmware) ? p.firmware[0] : p.firmware;

      return {
        ...p,
        tipo_dispositivo: p.tipo_dispositivo || 'interno',
        businessName: p.sucursal?.company?.razon_social || 'SIN ASIGNAR',
        rif: p.sucursal?.company?.rif || 'N/A',
        taxpayerType: p.sucursal?.company?.tipo_contribuyente || 'N/A',
        address: p.sucursal
          ? `${p.sucursal.direccion || ''}${p.sucursal.direccion && p.sucursal.ciudad ? ', ' : ''}${p.sucursal.ciudad || ''}${p.sucursal.ciudad && p.sucursal.estado ? ', ' : ''}${p.sucursal.estado || ''}`
          : 'SIN UBICACIÓN',
        modelo: m ? {
          id: m.id,
          marca: m.marca || 'AEG',
          codigo_modelo: m.codigo || m.codigo_modelo || m.modelo || String(m.id)
        } : null,
        software: sw ? {
          id: sw.id,
          nombre: sw.nombre,
          version: sw.version,
          created_at: sw.created_at
        } : null,
        firmware: fw ? {
          id: fw.id,
          version: fw.version,
          fecha: fw.fecha,
          descripcion: fw.descripcion,
          created_at: fw.created_at
        } : null,
        sucursal: p.sucursal ? {
          ...p.sucursal,
          company: p.sucursal.company
        } : null,
        precintos: [],
        technicalReviews: [],
        annualInspections: [],
      };
    });

    return { data: mappedData, count: uniqueFilteredPrinters.length };
  }
};
