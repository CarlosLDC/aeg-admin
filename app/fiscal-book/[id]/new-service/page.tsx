'use client';

import { useState, use, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { withTimeout } from '@/lib/timeout';
import {
  fetchDirectorioEmpleados,
  mergeDirectorioRowsForEmpleado,
  resolveEmpleadoParaServicioTecnico,
  type TecnicoCentroRow,
  type DirectorioEmpleadoRow,
} from '@/lib/tecnico-centro';
import { useUserProfile } from '@/app/layout';
import { canRegistrarServiciosEInspecciones } from '@/lib/roles';
import { printerService } from '@/lib/printer-service';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TimeInput } from '@/components/time-input';
import { ArrowLeft } from '@/components/icons';
import { SuccessModal } from '@/components/success-modal';
import {
  parseLocalDateOnly,
  parseLocalDateTime,
  toIsoUtc,
  diffDaysInclusive,
} from '@/lib/datetime-local';

const MAX_SERVICE_DAYS = 8;

function formatCentroDisplay(r: {
  empresa_razon_social: string | null;
  sucursal_estado: string | null;
  sucursal_ciudad: string | null;
}) {
  const org = r.empresa_razon_social?.trim() || '—';
  const lugar = [r.sucursal_estado, r.sucursal_ciudad]
    .filter((x) => x != null && String(x).trim() !== '')
    .join(', ');
  return lugar ? `${org} — ${lugar}` : org;
}

/** Muestra sede (empresa + ubicación) y si el alta es bajo distribuidora sin centro en BD. */
function formatLugarServicio(r: TecnicoCentroRow) {
  const base = formatCentroDisplay(r);
  if (r.centro_servicio_id != null) return base;
  if (r.distribuidora_id != null) {
    return `${base} — Servicio bajo distribuidora (sin centro de servicio en sucursal)`;
  }
  return base;
}

export default function NewTechnicalService({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { profile, loading: authLoading, tecnicoDistribuidoraId } = useUserProfile();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // View Data
  const [tecnicosData, setTecnicosData] = useState<TecnicoCentroRow[]>([]);
  const [loadingTecnicos, setLoadingTecnicos] = useState(true);
  const [tecnicoLoadError, setTecnicoLoadError] = useState<string | null>(null);
  const [printer, setPrinter] = useState<any>(null);
  const [loadingPrinter, setLoadingPrinter] = useState(true);

  // Form state
  // Foreign Keys (simplified as number inputs for now)
  const [idTecnico, setIdTecnico] = useState('');
  const [idCentroServicio, setIdCentroServicio] = useState('');
  /** Presente cuando el servicio se registra con `servicios_tecnicos.id_distribuidora` (sucursal distribuidora sin `centros_servicio`). */
  const [idDistribuidora, setIdDistribuidora] = useState('');
  const [tecnicoInfo, setTecnicoInfo] = useState<TecnicoCentroRow | null>(null);
  
  // Dates
  const [fechaSolicitud, setFechaSolicitud] = useState('');
  
  const [fechaInicioDate, setFechaInicioDate] = useState('');
  const [fechaInicioTime, setFechaInicioTime] = useState('');

  const [fechaFinDate, setFechaFinDate] = useState('');
  const [fechaFinTime, setFechaFinTime] = useState('');

  const [fechaZInicialDate, setFechaZInicialDate] = useState('');
  const [fechaZInicialTime, setFechaZInicialTime] = useState('');

  const [fechaZFinalDate, setFechaZFinalDate] = useState('');
  const [fechaZFinalTime, setFechaZFinalTime] = useState('');
  
  // Texts & Numbers
  const [fallaReportada, setFallaReportada] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [reporteZInicial, setReporteZInicial] = useState('');
  const [reporteZFinal, setReporteZFinal] = useState('');
  const [costo, setCosto] = useState('');
  
  // Booleans
  const [precintoViolentado, setPrecintoViolentado] = useState(false);
  const [sealReplaced, setSealReplaced] = useState(false);
  const [idPrecintoInstalado, setIdPrecintoInstalado] = useState('');
  const [precintosDisponibles, setPrecintosDisponibles] = useState<any[]>([]);
  const [loadingPrecintos, setLoadingPrecintos] = useState(false);
  const [idPrecintoActual, setIdPrecintoActual] = useState<number | null>(null);
  const [serialPrecintoActual, setSerialPrecintoActual] = useState<string | null>(null);

  const [successOpen, setSuccessOpen] = useState(false);
  const [successRecordId, setSuccessRecordId] = useState<string | null>(null);

  useEffect(() => {
    const loadPrecintoActivo = async () => {
      const cleanId = Number(id.replace('mock-p-', '').replace('fp-', ''));
      if (!Number.isFinite(cleanId) || cleanId <= 0) {
        setIdPrecintoActual(null);
        setSerialPrecintoActual(null);
        return;
      }
      const { data } = await withTimeout(
        supabase
          .from('precintos')
          .select('id, serial')
          .eq('id_impresora', cleanId)
          .eq('estatus', 'en_impresora')
          .maybeSingle(),
        10000
      );
      setIdPrecintoActual(data?.id ?? null);
      setSerialPrecintoActual(data?.serial ?? null);
    };
    loadPrecintoActivo();
  }, [id]);

  // Fetch tecnicos + impresora (técnico: solo si la sucursal coincide)
  useEffect(() => {
    if (authLoading) return;

    const fetchTecnicos = async () => {
      setLoadingTecnicos(true);
      setTecnicoLoadError(null);
      setTecnicoInfo(null);
      setTecnicosData([]);
      setIdTecnico('');
      setIdCentroServicio('');
      setIdDistribuidora('');

      const rows = await fetchDirectorioEmpleados(supabase);
      const empId = profile?.id_empleado;
      if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG_SERVICIO_TECNICO === '1') {
        const coinciden = empId != null ? rows.filter((r) => r.empleado_id === empId) : [];
        console.info('[servicio-tecnico] new-service: fetchTecnicos', {
          id_empleado_perfil: empId ?? null,
          totalFilasDirectorio: rows.length,
          filasMismoEmpleado: coinciden.length,
        });
      }

      if (profile?.id_empleado == null) {
        setTecnicoLoadError(
          'Su perfil no tiene un empleado vinculado. Contacte al administrador para asociar su usuario a un empleado.'
        );
        setLoadingTecnicos(false);
        return;
      }

      const currentEmp = mergeDirectorioRowsForEmpleado(rows, profile.id_empleado);
      if (!currentEmp) {
        setTecnicoLoadError(
          'No figura en el directorio de empleados o no tiene permisos de acceso. Verifique su registro en el sistema.'
        );
        setLoadingTecnicos(false);
        return;
      }

      const validado = await resolveEmpleadoParaServicioTecnico(
        supabase,
        profile.id_empleado,
        currentEmp
      );
      if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG_SERVICIO_TECNICO === '1') {
        console.info('[servicio-tecnico] new-service: resultado resolve', {
          ok: validado.ok,
          ...(validado.ok
            ? {
                tecnicoId: validado.tecnicoId,
                centroServicioId: validado.centroServicioId,
                distribuidoraId: validado.distribuidoraId,
              }
            : { mensaje: validado.message }),
        });
      }
      if (!validado.ok) {
        setTecnicoLoadError(validado.message);
        setLoadingTecnicos(false);
        return;
      }

      const row: TecnicoCentroRow = {
        tecnico_id: validado.tecnicoId,
        centro_servicio_id: validado.centroServicioId,
        distribuidora_id: validado.distribuidoraId,
        empleado_id: currentEmp.empleado_id,
        empleado_nombre: currentEmp.empleado_nombre || '',
        empleado_cedula: currentEmp.empleado_cedula,
        empresa_razon_social: currentEmp.empresa_razon_social,
        empresa_rif: currentEmp.empresa_rif,
        sucursal_ciudad: currentEmp.sucursal_ciudad,
        sucursal_estado: currentEmp.sucursal_estado,
      };

      setTecnicoInfo(row);
      setIdTecnico(String(row.tecnico_id));
      setIdCentroServicio(
        row.centro_servicio_id != null ? String(row.centro_servicio_id) : ''
      );
      setIdDistribuidora(
        row.distribuidora_id != null ? String(row.distribuidora_id) : ''
      );
      setTecnicosData([row]);

      setLoadingTecnicos(false);
    };

    const fetchPrinter = async () => {
      setLoadingPrinter(true);
      const row = await printerService.getPrinterById(id, {
        restrictToDistribuidoraId:
          profile?.rol_usuario === 'tecnico' ? tecnicoDistribuidoraId ?? null : undefined,
      });
      setPrinter(row ?? null);
      setLoadingPrinter(false);
    };

    fetchTecnicos();
    fetchPrinter();
  }, [id, authLoading, profile?.rol_usuario, tecnicoDistribuidoraId, profile?.id_empleado]);

  // Auto-fill centro / distribuidora cuando cambia el técnico seleccionado
  useEffect(() => {
    if (idTecnico && tecnicosData.length > 0) {
      const selectedTecnico = tecnicosData.find((t) => t.tecnico_id.toString() === idTecnico);
      if (selectedTecnico?.centro_servicio_id != null) {
        setIdCentroServicio(String(selectedTecnico.centro_servicio_id));
      } else {
        setIdCentroServicio('');
      }
      if (selectedTecnico?.distribuidora_id != null) {
        setIdDistribuidora(String(selectedTecnico.distribuidora_id));
      } else {
        setIdDistribuidora('');
      }
    } else {
      setIdCentroServicio('');
      setIdDistribuidora('');
    }
  }, [idTecnico, tecnicosData]);

  useEffect(() => {
    const fetchPrecintos = async () => {
      if (!sealReplaced) return;

      setLoadingPrecintos(true);
      const { data, error } = await withTimeout(
        supabase
          .from('precintos')
          .select('*')
          .eq('estatus', 'disponible')
          .order('serial', { ascending: true }),
        10000
      );

      if (!error && data) {
        setPrecintosDisponibles(data);
      }
      setLoadingPrecintos(false);
    };

    fetchPrecintos();
  }, [sealReplaced]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await withTimeout(supabase.auth.getUser(), 8000);
      if (!user) {
        throw new Error('No se encontró una sesión activa.');
      }

      // Clean ID for database
      const cleanId = Number(id.replace('mock-p-', '').replace('fp-', ''));

      // Strict Validation for NOT NULL fields
      if (!idTecnico || !fechaSolicitud || !fallaReportada ||
          !fechaInicioDate || !fechaInicioTime || !fechaFinDate || !fechaFinTime ||
          !fechaZInicialDate || !fechaZInicialTime || !fechaZFinalDate || !fechaZFinalTime ||
          !reporteZInicial || !reporteZFinal || !costo) {
        throw new Error('Todos los campos marcados con (*) son obligatorios según el reglamento.');
      }

      const numZInicial = parseInt(reporteZInicial, 10);
      const numZFinal = parseInt(reporteZFinal, 10);
      const numCosto = parseFloat(costo);
      const numTecnico = Number(idTecnico);
      const rawCentro = idCentroServicio.trim();
      const rawDist = idDistribuidora.trim();
      const numCentro =
        rawCentro === '' ? null : Number(rawCentro);
      const numDist =
        rawDist === '' ? null : Number(rawDist);

      if (!Number.isFinite(numZInicial) || !Number.isFinite(numZFinal)) {
        throw new Error('Los números de Reporte Z deben ser valores numéricos enteros.');
      }
      if (!Number.isFinite(numCosto) || numCosto < 0) {
        throw new Error('El costo debe ser un número mayor o igual a cero.');
      }
      if (!Number.isFinite(numTecnico) || numTecnico <= 0) {
        throw new Error('Datos de técnico inválidos.');
      }
      const centroOk = numCentro != null && Number.isFinite(numCentro) && numCentro > 0;
      const distOk = numDist != null && Number.isFinite(numDist) && numDist > 0;
      if (!centroOk && !distOk) {
        throw new Error(
          'Debe indicarse un centro de servicio o una distribuidora para el registro (datos del directorio).'
        );
      }
      if (rawCentro !== '' && !centroOk) {
        throw new Error('Identificador de centro de servicio inválido.');
      }
      if (rawDist !== '' && !distOk) {
        throw new Error('Identificador de distribuidora inválido.');
      }

      if (profile?.id_empleado == null) {
        throw new Error(
          'Su sesión no tiene un empleado vinculado. Vuelva a iniciar sesión o contacte al administrador.'
        );
      }

      const dirOk = await withTimeout(
        resolveEmpleadoParaServicioTecnico(supabase, profile.id_empleado),
        20000
      );
      if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG_SERVICIO_TECNICO === '1') {
        console.info('[servicio-tecnico] handleSubmit: revalidación', {
          ok: dirOk.ok,
          id_empleado: profile.id_empleado,
          ...(dirOk.ok
            ? {
                tecnicoId: dirOk.tecnicoId,
                centroServicioId: dirOk.centroServicioId,
                distribuidoraId: dirOk.distribuidoraId,
              }
            : { mensaje: dirOk.message }),
          estadoFormTecnico: numTecnico,
          estadoFormCentro: numCentro,
          estadoFormDistribuidora: numDist,
        });
      }
      if (!dirOk.ok) {
        throw new Error(dirOk.message);
      }
      if (numTecnico !== dirOk.tecnicoId) {
        throw new Error(
          'El técnico no coincide con el directorio. Actualice la página e intente de nuevo.'
        );
      }
      if (dirOk.centroServicioId != null) {
        if (numCentro !== dirOk.centroServicioId) {
          throw new Error(
            'El centro de servicio no coincide con el directorio. Actualice la página e intente de nuevo.'
          );
        }
      } else if (numCentro != null && numCentro > 0) {
        throw new Error(
          'No debe indicarse centro de servicio para este usuario. Actualice la página e intente de nuevo.'
        );
      }
      if (dirOk.distribuidoraId != null) {
        if (numDist !== dirOk.distribuidoraId) {
          throw new Error(
            'La distribuidora no coincide con el directorio. Actualice la página e intente de nuevo.'
          );
        }
      } else if (numDist != null && numDist > 0) {
        throw new Error(
          'No debe indicarse distribuidora para este usuario. Actualice la página e intente de nuevo.'
        );
      }

      const solicitud = parseLocalDateOnly(fechaSolicitud, 'Fecha de solicitud');
      if (!solicitud.ok) throw new Error(solicitud.error);

      const inicioSrv = parseLocalDateTime(
        fechaInicioDate,
        fechaInicioTime,
        'Inicio de servicio'
      );
      if (!inicioSrv.ok) throw new Error(inicioSrv.error);

      const finSrv = parseLocalDateTime(fechaFinDate, fechaFinTime, 'Fin de servicio');
      if (!finSrv.ok) throw new Error(finSrv.error);

      const zIni = parseLocalDateTime(
        fechaZInicialDate,
        fechaZInicialTime,
        'Fecha y hora del Reporte Z inicial'
      );
      if (!zIni.ok) throw new Error(zIni.error);

      const zFin = parseLocalDateTime(
        fechaZFinalDate,
        fechaZFinalTime,
        'Fecha y hora del Reporte Z final'
      );
      if (!zFin.ok) throw new Error(zFin.error);

      const start = inicioSrv.value;
      const end = finSrv.value;
      const zStart = zIni.value;
      const zEnd = zFin.value;

      // --- Coherencia temporal del servicio ---
      if (end.getTime() < start.getTime()) {
        throw new Error('La fecha y hora de fin de servicio no puede ser anterior al inicio.');
      }

      const diffDays = diffDaysInclusive(start, end);
      if (diffDays > MAX_SERVICE_DAYS) {
        throw new Error(
          `Un servicio técnico no puede durar más de ${MAX_SERVICE_DAYS} días según el reglamento.`
        );
      }

      // La solicitud no debe ser posterior al fin del servicio
      if (solicitud.value.getTime() > end.getTime()) {
        throw new Error('La fecha de solicitud no puede ser posterior al fin del servicio.');
      }

      // Reportes Z: orden temporal
      if (zEnd.getTime() < zStart.getTime()) {
        throw new Error('La fecha y hora del Reporte Z final no puede ser anterior al Reporte Z inicial.');
      }

      // Reportes Z dentro del período de servicio (inclusive)
      if (zStart.getTime() < start.getTime() || zEnd.getTime() > end.getTime()) {
        throw new Error(
          'Las fechas y horas de los Reportes Z deben estar dentro del período de inicio y fin del servicio.'
        );
      }

      if (numZFinal < numZInicial) {
        throw new Error('El número de Reporte Z final no puede ser menor al inicial.');
      }

      if (sealReplaced && !idPrecintoInstalado) {
        throw new Error('Debe seleccionar el nuevo precinto a instalar.');
      }

      const nuevoPrecintoId = sealReplaced && idPrecintoInstalado
        ? Number(idPrecintoInstalado)
        : null;

      // Solo se puede instalar un precinto que siga en estatus «disponible» (evita datos obsoletos / condiciones de carrera)
      if (nuevoPrecintoId != null) {
        if (idPrecintoActual != null && nuevoPrecintoId === idPrecintoActual) {
          throw new Error('El precinto a instalar no puede ser el mismo que el precinto actual en la impresora.');
        }
        const { data: precintoOk, error: precintoCheckErr } = await withTimeout(
          supabase
            .from('precintos')
            .select('id')
            .eq('id', nuevoPrecintoId)
            .eq('estatus', 'disponible')
            .maybeSingle(),
          10000
        );
        if (precintoCheckErr) throw precintoCheckErr;
        if (!precintoOk) {
          throw new Error(
            'El precinto seleccionado ya no está disponible. Actualice la página y elija otro de la lista.'
          );
        }
      }

      const insertPayload: Record<string, unknown> = {
            id_impresora: cleanId,
            id_tecnico: numTecnico,
            precinto_violentado: precintoViolentado,
            observaciones: observaciones || null,
            fecha_inicio: toIsoUtc(start),
            fecha_fin: toIsoUtc(end),
            url_fotos: [], 
            reporte_z_inicial: numZInicial,
            reporte_z_final: numZFinal,
            costo: numCosto,
            falla_reportada: fallaReportada,
            fecha_solicitud: fechaSolicitud.trim(),
            fecha_z_inicial: toIsoUtc(zStart),
            fecha_z_final: toIsoUtc(zEnd),
            // Se registra el precinto actual siempre que exista uno en la impresora
            id_precinto_retirado: idPrecintoActual,
            // El nuevo precinto solo si se reemplazó
            id_precinto_instalado: nuevoPrecintoId,
      };
      if (centroOk) insertPayload.id_centro_servicio = numCentro;
      if (distOk) insertPayload.id_distribuidora = numDist;

      const { data: insertedService, error: insertError } = await withTimeout(
        supabase
          .from('servicios_tecnicos')
          .insert([insertPayload])
          .select('id')
          .maybeSingle(),
        20000 // Higher timeout for inserts
      );

      if (insertError) {
        const em = String((insertError as { message?: string }).message ?? '');
        if (
          em.includes('id_distribuidora') &&
          (em.includes('schema cache') || em.includes('Could not find'))
        ) {
          throw new Error(
            'En Supabase falta la columna id_distribuidora en servicios_tecnicos o el API no ha refrescado el esquema. ' +
              'Ejecute el script docs/sql/servicios_tecnicos_distribuidora.sql en el SQL Editor y luego use ' +
              'Project Settings → Data API → Reload schema.'
          );
        }
        throw insertError;
      }
      // `maybeSingle`: si RLS permite INSERT pero no devolver la fila, no falla con PGRST116
      const servicioInsertadoId = insertedService?.id as number | undefined;

      const revertirPrecintoRetirado = async () => {
        if (idPrecintoActual == null) return;
        await withTimeout(
          supabase
            .from('precintos')
            .update({
              estatus: 'en_impresora' as const,
              id_impresora: cleanId,
              fecha_retiro: null,
            })
            .eq('id', idPrecintoActual),
          10000
        );
      };

      const eliminarServicioInsertado = async () => {
        if (servicioInsertadoId == null) return;
        await withTimeout(
          supabase.from('servicios_tecnicos').delete().eq('id', servicioInsertadoId),
          10000
        );
      };

      // --- Actualizar estatus de precintos ---
      const ahora = toIsoUtc(end);

      if (sealReplaced && nuevoPrecintoId != null) {
        let precintoRetiradoMarcado = false;

        // Precinto viejo: sustituido (desvinculado de la impresora)
        if (idPrecintoActual != null) {
          const { error: retiroErr } = await withTimeout(
            supabase
              .from('precintos')
              .update({
                estatus: 'sustituido' as const,
                fecha_retiro: ahora,
                id_impresora: null,
              })
              .eq('id', idPrecintoActual),
            10000
          );
          if (retiroErr) {
            await eliminarServicioInsertado();
            throw retiroErr;
          }
          precintoRetiradoMarcado = true;
        }

        // Precinto nuevo: solo si sigue «disponible» (actualización atómica en base de datos)
        const { data: instalados, error: instalErr } = await withTimeout(
          supabase
            .from('precintos')
            .update({
              estatus: 'en_impresora' as const,
              id_impresora: cleanId,
              fecha_instalacion: ahora,
            })
            .eq('id', nuevoPrecintoId)
            .eq('estatus', 'disponible')
            .select('id'),
          10000
        );
        if (instalErr) {
          if (precintoRetiradoMarcado) await revertirPrecintoRetirado();
          await eliminarServicioInsertado();
          throw instalErr;
        }
        if (!instalados?.length) {
          if (precintoRetiradoMarcado) await revertirPrecintoRetirado();
          await eliminarServicioInsertado();
          throw new Error(
            'El precinto seleccionado ya no está disponible (otro usuario pudo asignarlo). Actualice la página y elija otro.'
          );
        }
      }

      setSuccessRecordId(
        servicioInsertadoId != null ? String(servicioInsertadoId) : null
      );
      setSuccessOpen(true);
    } catch (err: any) {
      console.error('Error insertando servicio técnico:', {
        message: err.message,
        details: err.details,
        hint: err.hint,
        code: err.code
      });
      setError(err.message || 'Error al guardar el servicio técnico.');
    } finally {
      // Siempre: en éxito antes no se llamaba y la UI quedaba en «Guardando…» indefinidamente
      setLoading(false);
    }
  };

  if (!authLoading && profile && !canRegistrarServiciosEInspecciones(profile)) {
    return (
      <main className="container mx-auto px-4 py-12 max-w-3xl flex-1 flex flex-col">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-8 text-center">
          <p className="text-slate-800 dark:text-slate-200 font-semibold mb-4">
            Solo usuarios con rol <strong>técnico</strong> pueden registrar servicios en el libro fiscal.
          </p>
          <Link href={`/fiscal-book/${id}`} className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
            Volver al libro fiscal
          </Link>
        </div>
      </main>
    );
  }

  if (authLoading || loadingPrinter || loadingTecnicos) {
    return (
      <main className="container mx-auto px-4 py-32 max-w-3xl flex-1 flex flex-col justify-center text-center">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted font-medium">Cargando datos del equipo…</p>
      </main>
    );
  }

  if (!printer) {
    return (
      <main className="container mx-auto px-4 py-12 max-w-3xl flex-1 flex flex-col">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-8 text-center">
          <p className="text-slate-800 dark:text-slate-200 font-semibold mb-4">
            No se encontró el equipo o no tiene permiso para registrar servicios en esta sucursal.
          </p>
          <Link href={`/fiscal-book/${id}`} className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
            Volver al libro fiscal
          </Link>
        </div>
      </main>
    );
  }

  if (tecnicoLoadError) {
    return (
      <main className="container mx-auto px-4 py-12 max-w-3xl flex-1 flex flex-col">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-8 text-center">
          <p className="text-slate-800 dark:text-slate-200 font-semibold mb-2">No se puede registrar el servicio</p>
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">{tecnicoLoadError}</p>
          <Link href={`/fiscal-book/${id}`} className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
            Volver al libro fiscal
          </Link>
        </div>
      </main>
    );
  }

  const goToLibroTrasExito = () => {
    const rid = successRecordId;
    setSuccessOpen(false);
    setSuccessRecordId(null);
    const q = rid
      ? `?tab=tech&registro=${encodeURIComponent(rid)}`
      : '?tab=tech';
    router.push(`/fiscal-book/${id}${q}`);
    router.refresh();
  };

  return (
    <main className="container mx-auto px-4 py-12 max-w-3xl flex-1 flex flex-col">
      <SuccessModal
        open={successOpen}
        title="Servicio registrado"
        message="El servicio técnico se guardó correctamente. Podrá verlo en el libro fiscal en la pestaña Servicios, en la página del registro creado."
        primaryLabel="Ver en el libro"
        onPrimary={goToLibroTrasExito}
        secondaryLabel="Permanecer aquí"
        onSecondary={() => {
          setSuccessOpen(false);
          setSuccessRecordId(null);
        }}
      />
      <div className="mb-8">
        <Link href={`/fiscal-book/${id}`} className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors mb-4">
          <ArrowLeft size={18} />
          <span className="text-sm font-medium">Volver al libro</span>
        </Link>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
          Añadir Servicio Técnico
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Registra un nuevo mantenimiento correctivo o preventivo.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <form
          onSubmit={handleSubmit}
          className="space-y-6 uppercase-none"
          aria-disabled={!tecnicoInfo}
        >
          
          {/* Metadatos */}
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Técnico Responsable</label>
              {tecnicoInfo ? (
                <div className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-medium text-slate-500 dark:text-slate-500">
                  {tecnicoInfo.empleado_nombre} (V{tecnicoInfo.empleado_cedula?.replace(/-/g, '')})
                </div>
              ) : (
                <div className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-medium text-slate-400">
                  Sin datos de técnico
                </div>
              )}
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                Centro de servicio / Distribuidora
              </label>
              <div className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-medium text-slate-500 dark:text-slate-500">
                {tecnicoInfo
                  ? formatLugarServicio(tecnicoInfo)
                  : idCentroServicio
                    ? (() => {
                        const selected = tecnicosData.find(
                          (t) =>
                            t.centro_servicio_id != null &&
                            String(t.centro_servicio_id) === idCentroServicio
                        );
                        return selected ? formatLugarServicio(selected) : `Centro #${idCentroServicio}`;
                      })()
                    : idDistribuidora
                      ? (() => {
                          const selected = tecnicosData.find(
                            (t) =>
                              t.distribuidora_id != null &&
                              String(t.distribuidora_id) === idDistribuidora
                          );
                          return selected
                            ? formatLugarServicio(selected)
                            : `Distribuidora #${idDistribuidora}`;
                        })()
                      : '—'}
              </div>
            </div>
          </div>

          <div className="border-b border-slate-100 dark:border-slate-800" />

          {/* Fechas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Fecha de Solicitud</label>
              <input
                type="date"
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:border-blue-500 transition-all font-medium text-slate-900 dark:text-white [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                value={fechaSolicitud}
                onChange={(e) => setFechaSolicitud(e.target.value)}
              />
            </div>
            <div />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 lg:col-span-1">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Inicio de Servicio</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  required
                  className="w-2/3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:border-blue-500 transition-all font-medium text-slate-900 dark:text-white [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                  value={fechaInicioDate}
                  onChange={(e) => setFechaInicioDate(e.target.value)}
                />
                <TimeInput
                  required
                  value={fechaInicioTime}
                  onChange={(e) => setFechaInicioTime(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-4 lg:col-span-1">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Fin de Servicio</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  required
                  className="w-2/3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:border-blue-500 transition-all font-medium text-slate-900 dark:text-white [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                  value={fechaFinDate}
                  onChange={(e) => setFechaFinDate(e.target.value)}
                />
                <TimeInput
                  required
                  value={fechaFinTime}
                  onChange={(e) => setFechaFinTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Reporte Z y Fechas Z */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Reporte Z Inicial Column */}
            <div className="flex flex-col gap-2">
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Reporte Z Inicial</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-slate-400 dark:text-slate-500 font-bold">#</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:border-blue-500 transition-all font-medium font-mono text-slate-900 dark:text-white placeholder:text-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="000123"
                    value={reporteZInicial}
                    onChange={(e) => setReporteZInicial(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex gap-2 items-center">
                <input
                  type="date"
                  required
                  className="w-2/3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:border-blue-500 transition-all font-medium text-slate-900 dark:text-white [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                  value={fechaZInicialDate}
                  onChange={(e) => setFechaZInicialDate(e.target.value)}
                />
                <TimeInput
                  required
                  value={fechaZInicialTime}
                  onChange={(e) => setFechaZInicialTime(e.target.value)}
                />
              </div>
            </div>

            {/* Reporte Z Final Column */}
            <div className="flex flex-col gap-2">
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Reporte Z Final</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-slate-400 dark:text-slate-500 font-bold">#</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:border-blue-500 transition-all font-medium font-mono text-slate-900 dark:text-white placeholder:text-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="000124"
                    value={reporteZFinal}
                    onChange={(e) => setReporteZFinal(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex gap-2 items-center">
                <input
                  type="date"
                  required
                  className="w-2/3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:border-blue-500 transition-all font-medium text-slate-900 dark:text-white [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                  value={fechaZFinalDate}
                  onChange={(e) => setFechaZFinalDate(e.target.value)}
                />
                <TimeInput
                  required
                  value={fechaZFinalTime}
                  onChange={(e) => setFechaZFinalTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="border-b border-slate-100 dark:border-slate-800" />

          {/* Detalles del Servicio */}
          <div className="space-y-6">
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Costo Total</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-slate-400 dark:text-slate-500 font-bold">$</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:border-blue-500 transition-all font-medium font-mono text-slate-900 dark:text-white placeholder:text-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="0.00"
                  value={costo}
                  onChange={(e) => setCosto(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Falla Reportada</label>
              <textarea
                required
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:border-blue-500 transition-all font-medium text-slate-900 dark:text-white placeholder:text-slate-400"
                placeholder="Describa la falla reportada o motivo del servicio..."
                value={fallaReportada}
                onChange={(e) => setFallaReportada(e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Observaciones (Opcional)</label>
              <textarea
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:border-blue-500 transition-all font-medium text-slate-900 dark:text-white placeholder:text-slate-400"
                placeholder="Cualquier observación adicional de lo realizado..."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="precinto_violentado"
                className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700 dark:bg-slate-800 cursor-pointer"
                checked={precintoViolentado}
                onChange={(e) => setPrecintoViolentado(e.target.checked)}
              />
              <label htmlFor="precinto_violentado" className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                ¿Se encontró el precinto violentado?
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="seal_replaced"
                className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700 dark:bg-slate-800 cursor-pointer"
                checked={sealReplaced}
                onChange={(e) => setSealReplaced(e.target.checked)}
              />
              <label htmlFor="seal_replaced" className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                ¿Se reemplazó el precinto?
              </label>
            </div>

            {sealReplaced && (
              <div className="pl-8 pt-2 animate-in slide-in-from-left-2 duration-200 space-y-4">
                {serialPrecintoActual && (
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm">
                    <span className="text-amber-700 dark:text-amber-400 font-medium">
                      Precinto actual a retirar:
                    </span>
                    <span className="font-mono font-bold text-amber-900 dark:text-amber-200">{serialPrecintoActual}</span>
                    <span className="text-amber-500 dark:text-amber-500 text-xs">(pasará a sustituido)</span>
                  </div>
                )}
                {!serialPrecintoActual && !idPrecintoActual && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                    Este equipo no tiene precinto activo registrado. Solo se instalará el nuevo.
                  </p>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1 block">Nuevo Precinto a Instalar (*)</label>
                  <select
                    required={sealReplaced}
                    className="w-full max-w-md px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:border-blue-500 transition-all font-medium text-slate-900 dark:text-white appearance-none"
                    value={idPrecintoInstalado}
                    onChange={(e) => setIdPrecintoInstalado(e.target.value)}
                    disabled={loadingPrecintos}
                  >
                    <option value="" disabled>
                      {loadingPrecintos ? 'Cargando precintos disponibles...' : 'Seleccione un precinto disponible...'}
                    </option>
                    {precintosDisponibles.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.serial} ({p.color})
                      </option>
                    ))}
                  </select>
                  {precintosDisponibles.length === 0 && !loadingPrecintos && (
                    <p className="text-xs text-amber-600 font-medium">No hay precintos con estatus «disponible». Registre uno primero.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-xl border border-red-100 dark:border-red-900/30">
              {error}
            </div>
          )}

          <div className="pt-4 flex items-center justify-end gap-3">
            <Link
              href={`/fiscal-book/${id}`}
              className="px-6 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading || !tecnicoInfo}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? 'Guardando...' : 'Guardar Servicio'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
