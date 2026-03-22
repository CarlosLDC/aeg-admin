'use client';

import { useState, use, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { withTimeout } from '@/lib/timeout';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchDirectorioEmpleados, type DirectorioEmpleadoRow } from '@/lib/tecnico-centro';
import { useUserProfile } from '@/app/layout';
import { canRegistrarServiciosEInspecciones } from '@/lib/roles';
import { printerService } from '@/lib/printer-service';

function ArrowLeft({ size, className }: { size: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
    </svg>
  );
}

export default function NewAnnualInspection({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { profile, loading: authLoading, tecnicoDistribuidoraId } = useUserProfile();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // View Data
  const [inspectoresData, setInspectoresData] = useState<DirectorioEmpleadoRow[]>([]);
  const [loadingTecnicos, setLoadingTecnicos] = useState(true);
  const [printer, setPrinter] = useState<any>(null);
  const [loadingPrinter, setLoadingPrinter] = useState(true);

  // Form state
  const [idEmpleado, setIdEmpleado] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [precintoViolentado, setPrecintoViolentado] = useState(false);
  const [fechaInspeccion, setFechaInspeccion] = useState('');
  const [inspectorInfo, setInspectorInfo] = useState<DirectorioEmpleadoRow | null>(null);

  // Inspectores desde directorio de empleados (filtrado por rol en app si aplica)
  useEffect(() => {
    if (authLoading) return;

    const fetchInspectores = async () => {
      setLoadingTecnicos(true);
      const rows = await fetchDirectorioEmpleados(supabase);
      setInspectoresData(rows);
      
      // Auto-seleccionar el inspector actual si es técnico
      if (profile?.rol_usuario === 'tecnico' && profile.id_empleado) {
        const currentInspector = rows.find(t => t.empleado_id === profile.id_empleado);
        if (currentInspector) {
          setIdEmpleado(currentInspector.empleado_id.toString());
          setInspectorInfo(currentInspector);
        }
      }
      
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

    fetchInspectores();
    fetchPrinter();
  }, [id, authLoading, profile?.rol_usuario, tecnicoDistribuidoraId, profile?.id_empleado]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await withTimeout(supabase.auth.getUser(), 8000);
      if (!user) throw new Error('No se encontró una sesión activa.');

      // Ownership Check
      // Clean ID for database
      const cleanId = Number(id.replace('mock-p-', '').replace('fp-', ''));

      if (!idEmpleado || !fechaInspeccion) {
        throw new Error('Todos los campos marcados con (*) son obligatorios según el reglamento.');
      }

      const numEmpleado = Number(idEmpleado);

      const inspector = inspectorInfo || inspectoresData.find(t => t.empleado_id === numEmpleado);
      // const idCentroServicio = inspector?.centro_servicio_id; // Columna no existe en la tabla según el esquema proveído

      const { error: insertError } = await withTimeout(
        supabase
          .from('inspecciones_anuales')
          .insert([{
            id_impresora: cleanId,
            id_empleado: numEmpleado,
            observaciones: observaciones || null,
            precinto_violentado: precintoViolentado,
            url_fotos: [],
            fecha: fechaInspeccion,
          }]),
        20000 // Higher timeout for inserts
      );

      if (insertError) throw insertError;

      router.push(`/fiscal-book/${id}`);
      router.refresh();
      
    } catch (err: any) {
      console.error('Error insertando inspección anual:', {
        message: err.message,
        details: err.details,
        hint: err.hint,
        code: err.code
      });
      setError(err.message || 'Error al guardar la inspección anual.');
      setLoading(false);
    }
  };

  if (!authLoading && profile && !canRegistrarServiciosEInspecciones(profile)) {
    return (
      <main className="container mx-auto px-4 py-12 max-w-3xl flex-1 flex flex-col">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-8 text-center">
          <p className="text-slate-800 dark:text-slate-200 font-semibold mb-4">
            Solo usuarios con rol <strong>técnico</strong> pueden registrar inspecciones en el libro fiscal.
          </p>
          <Link href={`/fiscal-book/${id}`} className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
            Volver al libro fiscal
          </Link>
        </div>
      </main>
    );
  }

  if (authLoading || loadingPrinter) {
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
            No se encontró el equipo o no tiene permiso para registrar inspecciones en esta sucursal.
          </p>
          <Link href={`/fiscal-book/${id}`} className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
            Volver al libro fiscal
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-12 max-w-3xl flex-1 flex flex-col">
      <div className="mb-8">
        <Link href={`/fiscal-book/${id}`} className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors mb-4">
          <ArrowLeft size={18} />
          <span className="text-sm font-medium">Volver al libro</span>
        </Link>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
          Añadir Inspección Anual
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Registra una nueva revisión periódica por parte de inspector.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Metadatos */}
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-4">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Inspector Responsable</label>
              {inspectorInfo ? (
                <div className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-medium text-slate-500 dark:text-slate-500">
                  {inspectorInfo.empleado_nombre} (V{inspectorInfo.empleado_cedula?.replace(/-/g, '')})
                </div>
              ) : (
                <div className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-medium text-slate-400 animate-pulse">
                  Cargando información del inspector...
                </div>
              )}
            </div>

            <div className="space-y-4">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Sucursal / empresa (según directorio)</label>
              <div className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-medium text-slate-500 dark:text-slate-500">
                {inspectorInfo
                  ? `${inspectorInfo.empresa_razon_social} - ${inspectorInfo.sucursal_estado?.toUpperCase()}, ${inspectorInfo.sucursal_ciudad}`
                  : idEmpleado
                    ? (() => {
                        const selected = inspectoresData.find(t => t.empleado_id.toString() === idEmpleado);
                        return selected
                          ? `${selected.empresa_razon_social} - ${selected.sucursal_estado?.toUpperCase()}, ${selected.sucursal_ciudad}`
                          : '—';
                      })()
                    : 'Seleccione un inspector primero'
                }
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Fecha de inspección</label>
            <input
              type="date"
              required
              className="w-full max-w-xs px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:border-blue-500 transition-all font-medium text-slate-900 dark:text-white [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
              value={fechaInspeccion}
              onChange={(e) => setFechaInspeccion(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Observaciones / Resultados</label>
            <textarea
              required
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:border-blue-500 transition-all font-medium text-slate-900 dark:text-white placeholder:text-slate-400"
              placeholder="Describa a detalle las observaciones y resultados de la inspección..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
            />
          </div>

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
              disabled={loading}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? 'Guardando...' : 'Guardar Inspección'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
