export function EmptyState({
  type,
  filtered,
}: {
  type: 'services' | 'inspections';
  /** Hay datos en el libro pero el filtro actual no muestra ninguno. */
  filtered?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-20 text-center">
      <div className="w-12 h-12 rounded-full border border-dashed border-slate-300 dark:border-slate-700 mb-4 flex items-center justify-center">
        <span className="text-xl grayscale opacity-30">📋</span>
      </div>
      <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
        {filtered ? 'Sin coincidencias' : 'Libro sin registros'}
      </h3>
      <p className="text-xs text-slate-300 dark:text-slate-600 mt-1 max-w-xs mx-auto">
        {filtered
          ? 'Ajuste o borre los filtros para ver más entradas.'
          : `No se han encontrado ${type === 'services' ? 'servicios' : 'inspecciones'}.`}
      </p>
    </div>
  );
}
