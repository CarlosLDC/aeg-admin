import type { SupabaseClient } from '@supabase/supabase-js';
import { withTimeout } from './timeout';

const ST_LOG = '[servicio-tecnico]';

/** Logs de depuración: filtra la consola por `[servicio-tecnico]`. En producción, define `NEXT_PUBLIC_DEBUG_SERVICIO_TECNICO=1` para activarlos. */
function logServicioTecnico(phase: string, payload: Record<string, unknown>) {
  const on =
    process.env.NODE_ENV === 'development' ||
    process.env.NEXT_PUBLIC_DEBUG_SERVICIO_TECNICO === '1';
  if (!on) return;
  console.info(`${ST_LOG} ${phase}`, payload);
}

/**
 * Fila unificada (equivalente a la antigua vista_tecnicos_centros) para selects de técnico + centro.
 * Construida desde `tecnicos` + `empleados` + `centros_servicio` + `sucursales` + `empresas`.
 */
export type TecnicoCentroRow = {
  tecnico_id: number;
  /** Centro autorizado; null si el servicio se registra solo bajo {@link distribuidora_id}. */
  centro_servicio_id: number | null;
  /**
   * Distribuidora asociada a la sucursal del empleado (`vista_directorio_empleados.distribuidora_id`).
   * Permite registrar servicios cuando no existe fila en `centros_servicio` para esa sucursal.
   */
  distribuidora_id: number | null;
  empleado_id: number;
  empleado_nombre: string;
  empleado_cedula: string | null;
  empresa_razon_social: string | null;
  empresa_rif: string | null;
  sucursal_ciudad: string | null;
  sucursal_estado: string | null;
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
    distribuidora_id: null,
    empleado_id: emp?.id ?? row.id_empleado ?? 0,
    empleado_nombre: emp?.nombre ?? '',
    empleado_cedula: emp?.cedula ?? null,
    empresa_razon_social: comp?.razon_social ?? null,
    empresa_rif: comp?.rif ?? null,
    sucursal_ciudad: suc?.ciudad ?? null,
    sucursal_estado: null, // No disponible en el formato antiguo
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

export type DirectorioEmpleadoRow = {
  empleado_id: number;
  empleado_nombre: string | null;
  empleado_cedula: string | null;
  empresa_razon_social: string | null;
  empresa_rif: string | null;
  sucursal_ciudad: string | null;
  sucursal_estado: string | null;
  /** `sucursales.id` del empleado (en la vista: `s.id`). Útil si `centro_servicio_id` viene null y hay que resolver el centro por tabla. */
  sucursal_id?: number | null;
  centro_servicio_id: number | null;
  distribuidora_id: number | null;
  tecnico_id: number | null;
  distribuidor_id: number | null;
};

/**
 * Reglas estrictas solo con la vista (sin consultar `tecnicos`). Útil para listados;
 * en formularios de servicio use {@link resolveEmpleadoParaServicioTecnico}.
 */
export function validateDirectorioParaServicioTecnico(
  row: DirectorioEmpleadoRow | null | undefined
):
  | { ok: true; tecnicoId: number; centroServicioId: number | null; distribuidoraId: number | null }
  | { ok: false; message: string } {
  if (row == null) {
    return { ok: false, message: 'No se encontraron datos del empleado en el directorio.' };
  }
  if (
    row.tecnico_id == null ||
    !Number.isFinite(Number(row.tecnico_id)) ||
    Number(row.tecnico_id) <= 0
  ) {
    return {
      ok: false,
      message:
        'Su usuario no tiene ficha de técnico vinculada en el sistema. Contacte al administrador.',
    };
  }
  const hasCentro =
    row.centro_servicio_id != null &&
    Number.isFinite(Number(row.centro_servicio_id)) &&
    Number(row.centro_servicio_id) > 0;
  const hasDist =
    row.distribuidora_id != null &&
    Number.isFinite(Number(row.distribuidora_id)) &&
    Number(row.distribuidora_id) > 0;

  if (!hasCentro && !hasDist) {
    return {
      ok: false,
      message:
        'Su usuario no tiene centro de servicio ni distribuidora asignados en el directorio. Contacte al administrador.',
    };
  }
  return {
    ok: true,
    tecnicoId: Number(row.tecnico_id),
    centroServicioId: hasCentro ? Number(row.centro_servicio_id) : null,
    distribuidoraId: hasDist ? Number(row.distribuidora_id) : null,
  };
}

export async function fetchTecnicosCentro(supabase: SupabaseClient): Promise<TecnicoCentroRow[]> {
  const rows = await fetchDirectorioEmpleados(supabase);
  const out: TecnicoCentroRow[] = [];

  for (const r of rows) {
    const v = validateDirectorioParaServicioTecnico(r);
    if (!v.ok) continue;
    out.push({
      tecnico_id: v.tecnicoId,
      centro_servicio_id: v.centroServicioId,
      distribuidora_id: v.distribuidoraId,
      empleado_id: r.empleado_id,
      empleado_nombre: r.empleado_nombre || '',
      empleado_cedula: r.empleado_cedula,
      empresa_razon_social: r.empresa_razon_social,
      empresa_rif: r.empresa_rif,
      sucursal_ciudad: r.sucursal_ciudad,
      sucursal_estado: r.sucursal_estado,
    });
  }

  return out;
}

export async function fetchTecnicosCentroByIds(
  supabase: SupabaseClient,
  tecnicoIds: number[]
): Promise<TecnicoCentroRow[]> {
  if (tecnicoIds.length === 0) return [];

  // Usamos el listado completo desde la vista unificada
  const rows = await fetchDirectorioEmpleados(supabase);
  
  // Buscamos coincidencia en tecnico_id O en empleado_id (fallback robusto)
  return rows
    .filter(r => 
      (r.tecnico_id != null && tecnicoIds.includes(r.tecnico_id)) || 
      (r.empleado_id != null && tecnicoIds.includes(r.empleado_id))
    )
    .map(r => {
      // Si el tecnico_id es el que buscamos, lo usamos; si no, el empleado_id es el que actúa como técnico
      const effectiveId = (r.tecnico_id != null && tecnicoIds.includes(r.tecnico_id)) 
        ? r.tecnico_id 
        : r.empleado_id;

      return {
        tecnico_id: effectiveId!,
        centro_servicio_id:
          r.centro_servicio_id != null &&
          Number.isFinite(Number(r.centro_servicio_id)) &&
          Number(r.centro_servicio_id) > 0
            ? Number(r.centro_servicio_id)
            : null,
        distribuidora_id:
          r.distribuidora_id != null &&
          Number.isFinite(Number(r.distribuidora_id)) &&
          Number(r.distribuidora_id) > 0
            ? Number(r.distribuidora_id)
            : null,
        empleado_id: r.empleado_id,
        empleado_nombre: r.empleado_nombre || '',
        empleado_cedula: r.empleado_cedula,
        empresa_razon_social: r.empresa_razon_social,
        empresa_rif: r.empresa_rif,
        sucursal_ciudad: r.sucursal_ciudad,
        sucursal_estado: r.sucursal_estado,
      };
    });
}

/**
 * Filas de vista_directorio_empleados (inspectores / empleados en formularios).
 */
export async function fetchDirectorioEmpleados(
  supabase: SupabaseClient
): Promise<DirectorioEmpleadoRow[]> {
  const { data, error } = await withTimeout(
    supabase.from('vista_directorio_empleados').select(`
    empleado_id,
    empleado_nombre,
    empleado_cedula,
    empresa_razon_social,
    empresa_rif,
    sucursal_ciudad,
    sucursal_estado,
    sucursal_id,
    centro_servicio_id,
    distribuidora_id,
    tecnico_id,
    distribuidor_id
  `)
  );

  if (error) {
    console.error('fetchDirectorioEmpleados:', error.message);
    return [];
  }

  return (data as DirectorioEmpleadoRow[] | null) ?? [];
}

const DIRECTORIO_EMPLEADO_COLUMNS = `
    empleado_id,
    empleado_nombre,
    empleado_cedula,
    empresa_razon_social,
    empresa_rif,
    sucursal_ciudad,
    sucursal_estado,
    sucursal_id,
    centro_servicio_id,
    distribuidora_id,
    tecnico_id,
    distribuidor_id
  `;

/**
 * La vista puede devolver varias filas por empleado (p. ej. varios `centros_servicio` en la misma sucursal).
 * Elegimos la más útil como “plantilla” (nombre, sucursal…): prioridad a fila con técnico y con centro.
 */
export function pickBestDirectorioRowForEmpleado(
  rows: DirectorioEmpleadoRow[],
  empleadoId: number
): DirectorioEmpleadoRow | null {
  const matches = rows.filter((r) => r.empleado_id === empleadoId);
  if (matches.length === 0) return null;
  const score = (r: DirectorioEmpleadoRow) => {
    let s = 0;
    if (r.tecnico_id != null && Number(r.tecnico_id) > 0) s += 2;
    if (r.centro_servicio_id != null && Number(r.centro_servicio_id) > 0) s += 2;
    if (r.distribuidora_id != null && Number(r.distribuidora_id) > 0) s += 1;
    return s;
  };
  return [...matches].sort((a, b) => score(b) - score(a))[0] ?? null;
}

/**
 * Une todas las filas del mismo `empleado_id`: `tecnico_id` y `centro_servicio_id` pueden venir en filas distintas
 * (producto cartesiano de joins en la vista).
 */
export function mergeDirectorioRowsForEmpleado(
  rows: DirectorioEmpleadoRow[],
  empleadoId: number
): DirectorioEmpleadoRow | null {
  const matches = rows.filter((r) => r.empleado_id === empleadoId);
  if (matches.length === 0) return null;

  const base = pickBestDirectorioRowForEmpleado(rows, empleadoId);
  if (base == null) return null;

  let tecnico_id: number | null = null;
  let centro_servicio_id: number | null = null;
  let distribuidora_id: number | null = null;
  let sucursal_id: number | null = null;
  for (const r of matches) {
    if (tecnico_id == null && r.tecnico_id != null && Number(r.tecnico_id) > 0) {
      tecnico_id = Number(r.tecnico_id);
    }
    if (
      centro_servicio_id == null &&
      r.centro_servicio_id != null &&
      Number(r.centro_servicio_id) > 0
    ) {
      centro_servicio_id = Number(r.centro_servicio_id);
    }
    if (
      distribuidora_id == null &&
      r.distribuidora_id != null &&
      Number(r.distribuidora_id) > 0
    ) {
      distribuidora_id = Number(r.distribuidora_id);
    }
    if (sucursal_id == null && r.sucursal_id != null && Number(r.sucursal_id) > 0) {
      sucursal_id = Number(r.sucursal_id);
    }
    const lugarOk =
      centro_servicio_id != null || distribuidora_id != null;
    if (tecnico_id != null && lugarOk && sucursal_id != null) break;
  }

  logServicioTecnico('mergeDirectorioRowsForEmpleado', {
    empleadoId,
    filasCoincidentes: matches.length,
    resumenFilas: matches.map((r, i) => ({
      i,
      tecnico_id: r.tecnico_id ?? null,
      centro_servicio_id: r.centro_servicio_id ?? null,
      sucursal_id: r.sucursal_id ?? null,
      distribuidora_id: r.distribuidora_id ?? null,
    })),
    resultadoFusion: { tecnico_id, centro_servicio_id, distribuidora_id, sucursal_id },
  });

  return {
    ...base,
    tecnico_id,
    centro_servicio_id,
    distribuidora_id: distribuidora_id ?? base.distribuidora_id ?? null,
    sucursal_id: sucursal_id ?? base.sucursal_id ?? null,
  };
}

/** Una fila del directorio por `empleado_id` (p. ej. revalidar al guardar servicio técnico). */
export async function fetchDirectorioEmpleadoPorId(
  supabase: SupabaseClient,
  empleadoId: number
): Promise<DirectorioEmpleadoRow | null> {
  const { data, error } = await withTimeout(
    supabase
      .from('vista_directorio_empleados')
      .select(DIRECTORIO_EMPLEADO_COLUMNS)
      .eq('empleado_id', empleadoId)
  );

  if (error) {
    console.error(`${ST_LOG} fetchDirectorioEmpleadoPorId error`, {
      empleadoId,
      message: error.message,
      code: (error as { code?: string }).code,
    });
    return null;
  }

  const rows = (data as DirectorioEmpleadoRow[] | null) ?? [];
  logServicioTecnico('fetchDirectorioEmpleadoPorId', {
    empleadoId,
    filasDevueltasPorVista: rows.length,
  });
  return mergeDirectorioRowsForEmpleado(rows, empleadoId);
}

/**
 * Resolución para insertar en `servicios_tecnicos`.
 * Debe cumplirse: `centroServicioId != null` y/o `distribuidoraId != null` (según migración SQL en BD).
 */
export type ResolvedServicioTecnico =
  | {
      ok: true;
      tecnicoId: number;
      centroServicioId: number | null;
      distribuidoraId: number | null;
    }
  | { ok: false; message: string };

/**
 * Si la vista devuelve `centro_servicio_id` null (p. ej. RLS en el JOIN) pero el empleado tiene `sucursal_id`,
 * resolvemos el primer `centros_servicio.id` ligado a esa sucursal (misma lógica que el JOIN de la vista).
 */
async function lookupCentroServicioIdPorSucursal(
  supabase: SupabaseClient,
  sucursalId: number
): Promise<number | null> {
  const fkCols = ['id_sucursal', 'sucursal_id'] as const;
  for (const fk of fkCols) {
    const { data, error } = await withTimeout(
      supabase
        .from('centros_servicio')
        .select('id')
        .eq(fk, sucursalId)
        .order('id', { ascending: true })
        .limit(1)
        .maybeSingle(),
      10000
    );
    logServicioTecnico('lookupCentroServicioIdPorSucursal: intento', {
      sucursalId,
      columnaFk: fk,
      error: error?.message ?? null,
      code: (error as { code?: string } | null)?.code ?? null,
      fila: data ?? null,
    });
    if (error) {
      if (error.message?.includes('does not exist')) continue;
      return null;
    }
    if (data?.id != null) {
      const n = Number(data.id);
      if (Number.isFinite(n) && n > 0) return n;
    }
  }
  return null;
}

/**
 * Muchos despliegues ligan `centros_servicio` a la distribuidora (no a la misma sucursal que el empleado).
 * Se usa cuando el JOIN de la vista y el fallback por sucursal no devuelven fila (p. ej. RLS o distinto id_sucursal).
 */
async function lookupCentroServicioIdPorDistribuidora(
  supabase: SupabaseClient,
  distribuidoraId: number
): Promise<number | null> {
  const fkCols = ['id_distribuidora', 'distribuidora_id'] as const;
  for (const fk of fkCols) {
    const { data, error } = await withTimeout(
      supabase
        .from('centros_servicio')
        .select('id')
        .eq(fk, distribuidoraId)
        .order('id', { ascending: true })
        .limit(1)
        .maybeSingle(),
      10000
    );
    logServicioTecnico('lookupCentroServicioIdPorDistribuidora: intento', {
      distribuidoraId,
      columnaFk: fk,
      error: error?.message ?? null,
      code: (error as { code?: string } | null)?.code ?? null,
      fila: data ?? null,
    });
    if (error) {
      if (error.message?.includes('does not exist')) continue;
      return null;
    }
    if (data?.id != null) {
      const n = Number(data.id);
      if (Number.isFinite(n) && n > 0) return n;
    }
  }
  return null;
}

/** Si `centros_servicio` está ligado a la sucursal de la distribuidora (`distribuidoras.id_sucursal`), no a la del empleado. */
async function lookupCentroServicioIdPorSucursalDistribuidora(
  supabase: SupabaseClient,
  distribuidoraId: number,
  yaProbadaSucursalEmpleado: number | null
): Promise<number | null> {
  const { data: distRow, error } = await withTimeout(
    supabase.from('distribuidoras').select('id_sucursal').eq('id', distribuidoraId).maybeSingle(),
    10000
  );
  logServicioTecnico('lookupCentroServicioIdPorSucursalDistribuidora: distribuidoras', {
    distribuidoraId,
    error: error?.message ?? null,
    id_sucursal: distRow?.id_sucursal ?? null,
  });
  if (error || distRow?.id_sucursal == null) return null;
  const sid = Number(distRow.id_sucursal);
  if (!Number.isFinite(sid) || sid <= 0) return null;
  if (yaProbadaSucursalEmpleado != null && sid === yaProbadaSucursalEmpleado) {
    logServicioTecnico('lookupCentroServicioIdPorSucursalDistribuidora: omitido (misma sucursal que empleado)', {
      sid,
    });
    return null;
  }
  return lookupCentroServicioIdPorSucursal(supabase, sid);
}

/**
 * Resuelve `id_tecnico` e `id_centro_servicio` para `servicios_tecnicos` alineado a
 * `vista_directorio_empleados`: `tecnico_id` = `tecnicos.id`, `centro_servicio_id` = `centros_servicio.id`
 * vía join `cs.id_sucursal = empleado.sucursal` (no viene de la tabla `tecnicos`).
 *
 * 1) Fusiona todas las filas del directorio para ese empleado ({@link mergeDirectorioRowsForEmpleado}).
 * 2) Si aún falta `tecnico_id`, lee solo `tecnicos.id` probando `id_empleado` y `empleado_id` según el esquema.
 * 3) `centro_servicio_id` puede quedar null si la sucursal es distribuidora sin fila en `centros_servicio`;
 *    en ese caso se usa `distribuidora_id` de la vista para `servicios_tecnicos.id_distribuidora` (requiere columna en BD).
 *
 * @param cachedDirectorioRow Fila ya fusionada o parcial; si falta, se consulta el directorio de nuevo y se fusiona.
 */
export async function resolveEmpleadoParaServicioTecnico(
  supabase: SupabaseClient,
  empleadoId: number,
  cachedDirectorioRow?: DirectorioEmpleadoRow | null
): Promise<ResolvedServicioTecnico> {
  logServicioTecnico('resolve: inicio', {
    empleadoId,
    hayCacheDirectorio: cachedDirectorioRow != null,
    cacheTecnicoId: cachedDirectorioRow?.tecnico_id ?? null,
    cacheCentroId: cachedDirectorioRow?.centro_servicio_id ?? null,
    cacheDistribuidoraId: cachedDirectorioRow?.distribuidora_id ?? null,
    cacheSucursalId: cachedDirectorioRow?.sucursal_id ?? null,
  });

  let row = cachedDirectorioRow ?? null;
  if (row == null) {
    row = await fetchDirectorioEmpleadoPorId(supabase, empleadoId);
    logServicioTecnico('resolve: fila tras fetchDirectorioEmpleadoPorId', {
      empleadoId,
      filaNula: row == null,
      tecnico_id: row?.tecnico_id ?? null,
      centro_servicio_id: row?.centro_servicio_id ?? null,
      sucursal_id: row?.sucursal_id ?? null,
    });
  } else {
    const { data, error } = await withTimeout(
      supabase
        .from('vista_directorio_empleados')
        .select(DIRECTORIO_EMPLEADO_COLUMNS)
        .eq('empleado_id', empleadoId),
      10000
    );
    logServicioTecnico('resolve: refetch vista (había cache)', {
      empleadoId,
      errorVista: error?.message ?? null,
      filas: Array.isArray(data) ? data.length : 0,
    });
    if (!error) {
      const rows = (data as DirectorioEmpleadoRow[] | null) ?? [];
      const merged = mergeDirectorioRowsForEmpleado(rows, empleadoId);
      if (merged != null) row = merged;
    }
    logServicioTecnico('resolve: fila tras refetch+merge', {
      empleadoId,
      tecnico_id: row?.tecnico_id ?? null,
      centro_servicio_id: row?.centro_servicio_id ?? null,
      sucursal_id: row?.sucursal_id ?? null,
    });
  }

  if (row == null) {
    logServicioTecnico('resolve: FALLO sin fila directorio', { empleadoId });
    return { ok: false, message: 'No se encontraron datos del empleado en el directorio.' };
  }

  let tecnicoId: number | null = null;
  if (
    row.tecnico_id != null &&
    Number.isFinite(Number(row.tecnico_id)) &&
    Number(row.tecnico_id) > 0
  ) {
    tecnicoId = Number(row.tecnico_id);
  }

  let centroServicioId: number | null = null;
  if (
    row.centro_servicio_id != null &&
    Number.isFinite(Number(row.centro_servicio_id)) &&
    Number(row.centro_servicio_id) > 0
  ) {
    centroServicioId = Number(row.centro_servicio_id);
  }

  const sucursalIdParsed =
    row.sucursal_id != null &&
    Number.isFinite(Number(row.sucursal_id)) &&
    Number(row.sucursal_id) > 0
      ? Number(row.sucursal_id)
      : null;

  const distribuidoraIdParsed =
    row.distribuidora_id != null &&
    Number.isFinite(Number(row.distribuidora_id)) &&
    Number(row.distribuidora_id) > 0
      ? Number(row.distribuidora_id)
      : null;

  logServicioTecnico('resolve: tras parsear fila fusionada', {
    empleadoId,
    tecnicoIdDesdeVista: tecnicoId,
    centroServicioIdDesdeVista: centroServicioId,
    sucursalIdParsed,
    distribuidoraIdParsed,
  });

  if (centroServicioId == null && sucursalIdParsed != null) {
    const desdeTabla = await lookupCentroServicioIdPorSucursal(supabase, sucursalIdParsed);
    if (desdeTabla != null) {
      centroServicioId = desdeTabla;
      logServicioTecnico('resolve: centro por fallback centros_servicio × sucursal', {
        sucursalId: sucursalIdParsed,
        centroServicioId,
      });
    } else {
      logServicioTecnico('resolve: fallback × sucursal sin resultado (0 filas, error de columna o RLS)', {
        sucursalId: sucursalIdParsed,
      });
    }
  }

  if (centroServicioId == null && distribuidoraIdParsed != null) {
    const desdeDist = await lookupCentroServicioIdPorDistribuidora(supabase, distribuidoraIdParsed);
    if (desdeDist != null) {
      centroServicioId = desdeDist;
      logServicioTecnico('resolve: centro por fallback centros_servicio × distribuidora', {
        distribuidoraId: distribuidoraIdParsed,
        centroServicioId,
      });
    } else {
      logServicioTecnico('resolve: fallback × distribuidora sin resultado', {
        distribuidoraId: distribuidoraIdParsed,
      });
      const porSucursalDist = await lookupCentroServicioIdPorSucursalDistribuidora(
        supabase,
        distribuidoraIdParsed,
        sucursalIdParsed
      );
      if (porSucursalDist != null) {
        centroServicioId = porSucursalDist;
        logServicioTecnico('resolve: centro por sucursal de tabla distribuidoras', {
          distribuidoraId: distribuidoraIdParsed,
          centroServicioId,
        });
      }
    }
  }

  if (tecnicoId == null) {
    const empleadoCols = ['id_empleado', 'empleado_id'] as const;
    let lastError: { message: string } | null = null;
    for (const col of empleadoCols) {
      const { data: tech, error } = await withTimeout(
        supabase.from('tecnicos').select('id').eq(col, empleadoId).maybeSingle(),
        10000
      );
      logServicioTecnico('resolve: consulta tabla tecnicos', {
        empleadoId,
        columnaFiltro: col,
        error: error?.message ?? null,
        codigoError: (error as { code?: string } | null)?.code ?? null,
        filaDevuelta: tech ?? null,
      });
      if (error) {
        if (error.message?.includes('does not exist')) {
          lastError = error;
          continue;
        }
        console.error(`${ST_LOG} tecnicos consulta fatal`, {
          col,
          message: error.message,
          code: (error as { code?: string }).code,
        });
        return {
          ok: false,
          message:
            'No se pudo verificar la ficha de técnico en base de datos. Reintente o contacte al administrador.',
        };
      }
      if (tech?.id != null) {
        const tid = Number(tech.id);
        if (Number.isFinite(tid) && tid > 0) {
          tecnicoId = tid;
          break;
        }
      }
    }
    if (tecnicoId == null && lastError != null) {
      console.warn(`${ST_LOG} último error columna inexistente (esperado si solo existe id_empleado)`, {
        message: lastError.message,
      });
    }
  }

  if (tecnicoId == null) {
    logServicioTecnico('resolve: FALLO sin tecnicoId', {
      empleadoId,
      centroServicioId,
      hint: 'Revise: fila en public.tecnicos para id_empleado, JOIN en vista, y RLS SELECT en tecnicos.',
    });
    return {
      ok: false,
      message:
        'Su usuario no tiene ficha de técnico vinculada en el sistema. Contacte al administrador.',
    };
  }
  const distribuidoraParaServicio =
    distribuidoraIdParsed != null &&
    Number.isFinite(distribuidoraIdParsed) &&
    distribuidoraIdParsed > 0
      ? distribuidoraIdParsed
      : null;

  if (centroServicioId == null && distribuidoraParaServicio == null) {
    logServicioTecnico('resolve: FALLO sin centro ni distribuidora', {
      empleadoId,
      tecnicoId,
      sucursalIntentada: sucursalIdParsed,
      distribuidoraIntentada: distribuidoraIdParsed,
      hint:
        'Revise en Supabase: migración servicios_tecnicos (id_distribuidora + id_centro_servicio nullable), centros_servicio por sucursal, RLS, y fila distribuidoras para la sucursal del empleado.',
    });
    return {
      ok: false,
      message:
        'Su usuario no tiene centro de servicio ni distribuidora asignados para registrar el servicio. Contacte al administrador.',
    };
  }

  logServicioTecnico('resolve: OK', {
    empleadoId,
    tecnicoId,
    centroServicioId,
    distribuidoraId: distribuidoraParaServicio,
  });
  return {
    ok: true,
    tecnicoId,
    centroServicioId,
    distribuidoraId: distribuidoraParaServicio,
  };
}

export async function fetchDirectorioEmpleadosByIds(
  supabase: SupabaseClient,
  empleadoIds: number[]
): Promise<DirectorioEmpleadoRow[]> {
  if (empleadoIds.length === 0) return [];

  const { data, error } = await withTimeout(
    supabase
      .from('vista_directorio_empleados')
      .select(
        `
      empleado_id,
      empleado_nombre,
      empleado_cedula,
      empresa_razon_social,
      empresa_rif,
      sucursal_ciudad,
      sucursal_estado,
      sucursal_id,
      centro_servicio_id,
      distribuidora_id,
      tecnico_id,
      distribuidor_id
    `
      )
      .in('empleado_id', empleadoIds)
  );

  if (error) {
    console.error('fetchDirectorioEmpleadosByIds:', error.message);
    return [];
  }

  return (data as DirectorioEmpleadoRow[] | null) ?? [];
}
