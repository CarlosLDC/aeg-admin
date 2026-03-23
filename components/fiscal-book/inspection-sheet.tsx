import type { AnnualInspection, FiscalPrinter } from '@/lib/types';
import { NoData } from '@/components/no-data';

export function SingleInspectionSheet({ inspection }: { inspection: AnnualInspection; printer: FiscalPrinter }) {
  return (
    <div className="space-y-12">
      <section>
        <h2 className="text-[11px] uppercase tracking-widest font-black text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-100 dark:border-slate-900">1. DATOS DEL CENTRO Y TÉCNICO</h2>
        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border border-slate-100 dark:border-slate-900 transition-colors">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Centro de Servicio Técnico</label>
              <p className="text-slate-900 dark:text-white font-black uppercase text-xs tracking-tight">{inspection.serviceCenter || <NoData />}</p>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">RIF Centro de Servicio</label>
              <p className="font-mono text-slate-900 dark:text-white text-xs font-black uppercase tracking-tight">{inspection.centerRif || <NoData />}</p>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Fecha de Inspección</label>
              <p className="font-mono text-slate-900 dark:text-white text-xs font-black uppercase tracking-tight">{inspection.date || <NoData />}</p>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Inspector Actuante</label>
              <p className="text-slate-900 dark:text-white font-black uppercase text-xs tracking-tight">{inspection.inspector || <NoData />}</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-[11px] uppercase tracking-widest font-black text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-100 dark:border-slate-900">2. DETALLES DE LA INSPECCIÓN</h2>
        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border border-slate-100 dark:border-slate-900 transition-colors">
          <div>
            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Observaciones y Hallazgos</label>
            <p className="text-slate-700 dark:text-slate-300 font-medium text-sm leading-relaxed uppercase bg-white/50 dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 whitespace-pre-wrap">
              {inspection.observations || <NoData />}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
