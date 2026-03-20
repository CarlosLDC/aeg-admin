'use client';

import { useState, use, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
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

export default function NewAnnualInspection({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // View Data
  const [tecnicosData, setTecnicosData] = useState<any[]>([]);
  const [loadingTecnicos, setLoadingTecnicos] = useState(true);
  const [printer, setPrinter] = useState<any>(null);
  const [loadingPrinter, setLoadingPrinter] = useState(true);

  // Form state
  const [idEmpleado, setIdEmpleado] = useState('');
  const [idCentroServicio, setIdCentroServicio] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [precintoViolentado, setPrecintoViolentado] = useState(false);
  
  const [fechaInicioDate, setFechaInicioDate] = useState('');
  const [fechaInicioTime, setFechaInicioTime] = useState('');
  const [fechaFinDate, setFechaFinDate] = useState('');
  const [fechaFinTime, setFechaFinTime] = useState('');

  // Fetch tecnicos/inspectores on mount
  useEffect(() => {
    const fetchTecnicos = async () => {
      setLoadingTecnicos(true);
      const { data, error } = await supabase
        .from('vista_tecnicos_centros')
        .select('*');
      
      if (!error && data) {
        setTecnicosData(data);
      }
      setLoadingTecnicos(false);
    };

    const fetchPrinter = async () => {
      setLoadingPrinter(true);
      const { data, error } = await supabase
        .from('vista_impresoras')
        .select('*')
        .eq('impresora_id', id)
        .maybeSingle();
      
      if (data) {
        setPrinter(data);
      }
      setLoadingPrinter(false);
    };

    fetchTecnicos();
    fetchPrinter();
  }, [id]);

  // Auto-fill centro de servicio when empleado changes
  useEffect(() => {
    if (idEmpleado && tecnicosData.length > 0) {
      const selectedTecnico = tecnicosData.find(t => t.empleado_id.toString() === idEmpleado);
      if (selectedTecnico) {
        setIdCentroServicio(selectedTecnico.centro_servicio_id.toString());
      }
    } else {
      setIdCentroServicio('');
    }
  }, [idEmpleado, tecnicosData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No se encontró una sesión activa.');

      // Ownership Check
      const { data: profile } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id_usuario', user.id)
        .single();
      
      if (profile?.rol === 'distribuidora' && profile?.id_distribuidora != printer?.id_distribuidora) {
        throw new Error(`Este equipo (${printer?.serial_fiscal || 'N/A'}) no pertenece a su distribuidora.`);
      }

      // Clean ID for database
      const cleanId = Number(id.replace('mock-p-', '').replace('fp-', ''));

      // Strict Validation for NOT NULL fields
      if (!idEmpleado || !idCentroServicio || !fechaInicioDate || !fechaInicioTime || !fechaFinDate || !fechaFinTime) {
        throw new Error('Todos los campos marcados con (*) son obligatorios según el reglamento.');
      }

      const numEmpleado = Number(idEmpleado);
      const numCentro = Number(idCentroServicio);

      const { error: insertError } = await supabase
        .from('inspecciones_anuales')
        .insert([{
          id_impresora: cleanId,
          id_empleado: numEmpleado,
          id_centro_servicio: numCentro,
          observaciones: observaciones || null,
          precinto_violentado: precintoViolentado,
          fecha_inicio: new Date(`${fechaInicioDate}T${fechaInicioTime}`).toISOString(),
          fecha_fin: new Date(`${fechaFinDate}T${fechaFinTime}`).toISOString(),
          url_fotos: [],
        }]);

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
              <select
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none focus:border-blue-500 transition-all font-medium text-slate-900 dark:text-white appearance-none"
                value={idEmpleado}
                onChange={(e) => setIdEmpleado(e.target.value)}
                disabled={loadingTecnicos}
              >
                <option value="" disabled>
                  {loadingTecnicos ? 'Cargando inspectores...' : 'Seleccione un inspector...'}
                </option>
                {tecnicosData.map(t => (
                  <option key={t.empleado_id} value={t.empleado_id}>
                    {t.empleado_nombre} (V-{t.empleado_cedula}) - {t.empresa_razon_social}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Centro de Servicio</label>
              <div className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-medium text-slate-500 dark:text-slate-500 cursor-not-allowed">
                {idCentroServicio 
                  ? (() => {
                      const selected = tecnicosData.find(t => t.centro_servicio_id.toString() === idCentroServicio);
                      return selected ? `${selected.empresa_razon_social} - ${selected.sucursal_ciudad}` : idCentroServicio;
                    })()
                  : 'Seleccione un inspector primero'
                }
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Inicio de Inspección</label>
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
                  focusClassName="focus:border-blue-500"
                  value={fechaInicioTime}
                  onChange={(e) => setFechaInicioTime(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Fin de Inspección</label>
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
                  focusClassName="focus:border-blue-500"
                  value={fechaFinTime}
                  onChange={(e) => setFechaFinTime(e.target.value)}
                />
              </div>
            </div>
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
