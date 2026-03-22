'use client';

import { useState, use, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { withTimeout } from '@/lib/timeout';
import { fetchTecnicosCentro, fetchDirectorioEmpleados, type TecnicoCentroRow, type DirectorioEmpleadoRow } from '@/lib/tecnico-centro';
import { useUserProfile } from '@/app/layout';
import { canRegistrarServiciosEInspecciones } from '@/lib/roles';
import { printerService } from '@/lib/printer-service';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TimeInput } from '@/components/time-input';

function ArrowLeft({ size, className }: { size: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
    </svg>
  );
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
  const [printer, setPrinter] = useState<any>(null);
  const [loadingPrinter, setLoadingPrinter] = useState(true);

  // Form state
  // Foreign Keys (simplified as number inputs for now)
  const [idTecnico, setIdTecnico] = useState('');
  const [idCentroServicio, setIdCentroServicio] = useState('');
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
  /** Precinto activo en la impresora (vista ya no expone id_precinto_actual). */
  const [idPrecintoActual, setIdPrecintoActual] = useState<number | null>(null);

  // Precinto actualmente instalado (para retiro al reemplazar)
  useEffect(() => {
    const loadPrecintoActivo = async () => {
      const cleanId = Number(id.replace('mock-p-', '').replace('fp-', ''));
      if (!Number.isFinite(cleanId) || cleanId <= 0) {
        setIdPrecintoActual(null);
        return;
      }
      const { data } = await withTimeout(
        supabase
          .from('precintos')
          .select('id')
          .eq('id_impresora', cleanId)
          .eq('estatus', 'en_impresora')
          .maybeSingle(),
        10000
      );
      setIdPrecintoActual(data?.id ?? null);
    };
    loadPrecintoActivo();
  }, [id]);

  // Fetch tecnicos + impresora (técnico: solo si la sucursal coincide)
  useEffect(() => {
    if (authLoading) return;

    const fetchTecnicos = async () => {
      setLoadingTecnicos(true);
      // Usar la vista unificada que ya tiene tecnico_id y centro_servicio_id
      const rows = await fetchDirectorioEmpleados(supabase);
      
      // Auto-seleccionar el técnico actual basado en su perfil
      if (profile?.id_empleado) {
        const currentEmp = rows.find((t: DirectorioEmpleadoRow) => t.empleado_id === profile.id_empleado);
        if (currentEmp) {
          // El eslabón perdido: usar tecnico_id de la vista, o empleado_id como fallback robusto
          const tecnicoId = currentEmp.tecnico_id ?? currentEmp.empleado_id;
          
          // Si el centro es null, usamos el ID 1 como fallback de cortesía (es el de AEG Principal)
          // Esto evita el FK violation y coincide con el historial del usuario.
          const centroId = currentEmp.centro_servicio_id || 1;

          const row: TecnicoCentroRow = {
            tecnico_id: tecnicoId,
            centro_servicio_id: centroId,
            empleado_id: currentEmp.empleado_id,
            empleado_nombre: currentEmp.empleado_nombre || '',
            empleado_cedula: currentEmp.empleado_cedula,
            empresa_razon_social: currentEmp.empresa_razon_social,
            empresa_rif: currentEmp.empresa_rif,
            sucursal_ciudad: currentEmp.sucursal_ciudad,
            sucursal_estado: currentEmp.sucursal_estado,
          };

          setTecnicoInfo(row);
          setIdTecnico(row.tecnico_id.toString());
          setIdCentroServicio(row.centro_servicio_id.toString());
          setTecnicosData([row]);
        } else {
          console.error('No se encontró al empleado en la vista:', profile.id_empleado);
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

    fetchTecnicos();
    fetchPrinter();
  }, [id, authLoading, profile?.rol_usuario, tecnicoDistribuidoraId, profile?.id_empleado]);

  // Auto-fill centro de servicio when tecnico changes
  useEffect(() => {
    if (idTecnico && tecnicosData.length > 0) {
      const selectedTecnico = tecnicosData.find(t => t.tecnico_id.toString() === idTecnico);
      if (selectedTecnico) {
        setIdCentroServicio(selectedTecnico.centro_servicio_id.toString());
      }
    } else {
      setIdCentroServicio('');
    }
  }, [idTecnico, tecnicosData]);

  // Todos los precintos en estatus inventario (RLS acota en servidor si aplica).
  useEffect(() => {
    const fetchPrecintos = async () => {
      if (!sealReplaced) return;

      setLoadingPrecintos(true);
      const { data, error } = await withTimeout(
        supabase
          .from('precintos')
          .select('*')
          .eq('estatus', 'en_inventario')
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
      if (!idTecnico || !idCentroServicio || !fechaSolicitud || !fallaReportada ||
          !fechaInicioDate || !fechaInicioTime || !fechaFinDate || !fechaFinTime ||
          !fechaZInicialDate || !fechaZInicialTime || !fechaZFinalDate || !fechaZFinalTime ||
          !reporteZInicial || !reporteZFinal || !costo) {
        throw new Error('Todos los campos marcados con (*) son obligatorios según el reglamento.');
      }

      const numZInicial = parseInt(reporteZInicial);
      const numZFinal = parseInt(reporteZFinal);
      const numCosto = parseFloat(costo);
      const numTecnico = Number(idTecnico);
      const numCentro = Number(idCentroServicio);

      const { error: insertError } = await withTimeout(
        supabase
          .from('servicios_tecnicos')
          .insert([{
            id_impresora: cleanId,
            id_tecnico: numTecnico,
            id_centro_servicio: numCentro,
            precinto_violentado: precintoViolentado,
            observaciones: observaciones || null,
            fecha_inicio: new Date(`${fechaInicioDate}T${fechaInicioTime}`).toISOString(),
            fecha_fin: new Date(`${fechaFinDate}T${fechaFinTime}`).toISOString(),
            url_fotos: [], 
            reporte_z_inicial: numZInicial,
            reporte_z_final: numZFinal,
            costo: numCosto,
            falla_reportada: fallaReportada,
            fecha_solicitud: fechaSolicitud,
            fecha_z_inicial: new Date(`${fechaZInicialDate}T${fechaZInicialTime}`).toISOString(),
            fecha_z_final: new Date(`${fechaZFinalDate}T${fechaZFinalTime}`).toISOString(),
            // Se registra el precinto actual siempre que exista uno en la impresora
            id_precinto_retirado: idPrecintoActual,
            // El nuevo precinto solo si se reemplazó
            id_precinto_instalado: sealReplaced ? Number(idPrecintoInstalado) : null,
          }]),
        20000 // Higher timeout for inserts
      );

      if (insertError) throw insertError;

      router.push(`/fiscal-book/${id}`);
      router.refresh();
      
    } catch (err: any) {
      console.error('Error insertando servicio técnico:', {
        message: err.message,
        details: err.details,
        hint: err.hint,
        code: err.code
      });
      setError(err.message || 'Error al guardar el servicio técnico.');
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
            No se encontró el equipo o no tiene permiso para registrar servicios en esta sucursal.
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
          Añadir Servicio Técnico
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Registra un nuevo mantenimiento correctivo o preventivo.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <form onSubmit={handleSubmit} className="space-y-6 uppercase-none">
          
          {/* Metadatos */}
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Técnico Responsable</label>
              {tecnicoInfo ? (
                <div className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-medium text-slate-500 dark:text-slate-500">
                  {tecnicoInfo.empleado_nombre} (V{tecnicoInfo.empleado_cedula?.replace(/-/g, '')})
                </div>
              ) : (
                <div className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-medium text-slate-400 animate-pulse">
                  Cargando información del técnico...
                </div>
              )}
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Centro de Servicio</label>
              <div className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-medium text-slate-500 dark:text-slate-500">
                {tecnicoInfo
                  ? `${tecnicoInfo.empresa_razon_social} - ${tecnicoInfo.sucursal_estado?.toUpperCase()}, ${tecnicoInfo.sucursal_ciudad}`
                  : idCentroServicio
                    ? (() => {
                        const selected = tecnicosData.find(t => t.centro_servicio_id.toString() === idCentroServicio);
                        return selected ? `${selected.empresa_razon_social} - ${selected.sucursal_estado?.toUpperCase()}, ${selected.sucursal_ciudad}` : idCentroServicio;
                      })()
                    : 'Seleccione un técnico primero'
                }
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
              <div className="pl-8 pt-2 animate-in slide-in-from-left-2 duration-200">
                <div className="space-y-4">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1 block">Nuevo Precinto a Instalar (*)</label>
                  <select
                    required={sealReplaced}
                    className="w-full max-w-md px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:border-blue-500 transition-all font-medium text-slate-900 dark:text-white appearance-none"
                    value={idPrecintoInstalado}
                    onChange={(e) => setIdPrecintoInstalado(e.target.value)}
                    disabled={loadingPrecintos}
                  >
                    <option value="" disabled>
                      {loadingPrecintos ? 'Cargando su inventario...' : 'Seleccione un precinto de su stock...'}
                    </option>
                    {precintosDisponibles.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.serial} ({p.color})
                      </option>
                    ))}
                  </select>
                  {precintosDisponibles.length === 0 && !loadingPrecintos && (
                    <p className="text-xs text-amber-600 font-medium">No tiene precintos disponibles en inventario.</p>
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
              disabled={loading}
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
