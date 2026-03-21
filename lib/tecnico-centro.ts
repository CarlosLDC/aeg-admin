import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Fila unificada (equivalente a la antigua vista_tecnicos_centros) para selects de técnico + centro.
 * Construida desde `tecnicos` + `empleados` + `centros_servicio` + `sucursales` + `empresas`.
 */
export type TecnicoCentroRow = {
  tecnico_id: number;
  centro_servicio_id: number;
  empleado_id: number;
  empleado_nombre: string;
  empleado_cedula: string | null;
  empresa_razon_social: string | null;
  empresa_rif: string | null;
  sucursal_ciudad: string | null;
};

type EmpRow = { id: number; nombre: string | null; cedula: string | null };
type CompRow = { razon_social: string | null; rif: string | null };
type SucRow = { ciudad: string | null; empresas: CompRow | CompRow[] | null };
type CentroRow = { id: number; sucursales: SucRow | SucRow[] | null };

function first<T>(x: T | T[] | null | undefined): T | null {
  if (x == null) return null;
  return Array.isArray(x) ? (x[0] ?? null) : x;
}

type TecnicoJoinRow = {
  id: number;
  id_centro_servicio: number;
  id_empleado: number | null;
  empleados: EmpRow | EmpRow[] | null;
  centros_servicio: CentroRow | CentroRow[] | null;
};

function mapTecnicoRow(row: TecnicoJoinRow): TecnicoCentroRow {
  const emp = first(row.empleados);
  const centro = first(row.centros_servicio);
  const suc = first(centro?.sucursales ?? null);
  const comp = first(suc?.empresas ?? null);
  return {
    tecnico_id: row.id,
    centro_servicio_id: row.id_centro_servicio,
    empleado_id: emp?.id ?? row.id_empleado ?? 0,
    empleado_nombre: emp?.nombre ?? '',
    empleado_cedula: emp?.cedula ?? null,
    empresa_razon_social: comp?.razon_social ?? null,
    empresa_rif: comp?.rif ?? null,
    sucursal_ciudad: suc?.ciudad ?? null,
  };
}

const TECNICOS_SELECT = `
  id,
  id_centro_servicio,
  id_empleado,
  empleados (id, nombre, cedula),
  centros_servicio (
    id,
    sucursales (
      ciudad,
      empresas (razon_social, rif)
    )
  )
`;

/**
 * Lista todos los técnicos con datos de empleado y centro (para formularios).
 */
export async function fetchTecnicosCentro(supabase: SupabaseClient): Promise<TecnicoCentroRow[]> {
  const { data, error } = await supabase.from('tecnicos').select(TECNICOS_SELECT);

  if (error) {
    console.error('fetchTecnicosCentro:', error.message);
    return [];
  }

  return ((data as unknown) as TecnicoJoinRow[] | null)?.map(mapTecnicoRow) ?? [];
}

/**
 * Subconjunto por IDs de técnico (p. ej. enriquecimiento del libro fiscal).
 */
export async function fetchTecnicosCentroByIds(
  supabase: SupabaseClient,
  tecnicoIds: number[]
): Promise<TecnicoCentroRow[]> {
  if (tecnicoIds.length === 0) return [];

  const { data, error } = await supabase.from('tecnicos').select(TECNICOS_SELECT).in('id', tecnicoIds);

  if (error) {
    console.error('fetchTecnicosCentroByIds:', error.message);
    return [];
  }

  return ((data as unknown) as TecnicoJoinRow[] | null)?.map(mapTecnicoRow) ?? [];
}

export type DirectorioEmpleadoRow = {
  empleado_id: number;
  empleado_nombre: string | null;
  empleado_cedula: string | null;
  empresa_razon_social: string | null;
  empresa_rif: string | null;
  sucursal_ciudad: string | null;
};

/**
 * Filas de vista_directorio_empleados (inspectores / empleados en formularios).
 */
export async function fetchDirectorioEmpleados(
  supabase: SupabaseClient
): Promise<DirectorioEmpleadoRow[]> {
  const { data, error } = await supabase.from('vista_directorio_empleados').select(`
    empleado_id,
    empleado_nombre,
    empleado_cedula,
    empresa_razon_social,
    empresa_rif,
    sucursal_ciudad
  `);

  if (error) {
    console.error('fetchDirectorioEmpleados:', error.message);
    return [];
  }

  return (data as DirectorioEmpleadoRow[] | null) ?? [];
}

export async function fetchDirectorioEmpleadosByIds(
  supabase: SupabaseClient,
  empleadoIds: number[]
): Promise<DirectorioEmpleadoRow[]> {
  if (empleadoIds.length === 0) return [];

  const { data, error } = await supabase
    .from('vista_directorio_empleados')
    .select(
      `
    empleado_id,
    empleado_nombre,
    empleado_cedula,
    empresa_razon_social,
    empresa_rif,
    sucursal_ciudad
  `
    )
    .in('empleado_id', empleadoIds);

  if (error) {
    console.error('fetchDirectorioEmpleadosByIds:', error.message);
    return [];
  }

  return (data as DirectorioEmpleadoRow[] | null) ?? [];
}
