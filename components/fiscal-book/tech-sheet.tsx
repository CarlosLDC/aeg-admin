import type { TechnicalReview, FiscalPrinter } from '@/lib/types';
import { NoData } from '@/components/no-data';
import { formatTimestamp } from '@/lib/fiscal-helpers';

export function SingleTechSheet({ review, printer }: { review: TechnicalReview; printer: FiscalPrinter }) {
  return (
    <div className="space-y-12">
      <section>
        <h2 className="text-[11px] uppercase tracking-widest font-black text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-100 dark:border-slate-900">1. DATOS DEL SERVICIO</h2>
        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border border-slate-100 dark:border-slate-900 transition-colors">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Centro de Servicio Técnico Autorizado</label>
              <p className="text-slate-900 dark:text-white font-black uppercase text-xs tracking-tight">{review.serviceCenter || <NoData />}</p>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">RIF Centro de Servicio</label>
              <p className="font-mono text-slate-900 dark:text-white text-xs font-black uppercase tracking-tight">{review.centerRif || <NoData />}</p>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Fecha de Solicitud</label>
              <p className="font-mono text-slate-900 dark:text-white text-xs font-black uppercase tracking-tight">{review.fechaSolicitud || <NoData />}</p>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Fecha de Inicio</label>
              <p className="font-mono text-slate-900 dark:text-white text-xs font-black uppercase tracking-tight">{review.startDate || review.date || <NoData />}</p>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Fecha de Fin</label>
              <p className="font-mono text-slate-900 dark:text-white text-xs font-black uppercase tracking-tight">{review.endDate || <NoData />}</p>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Primera Reporte Z</label>
              <p className="font-mono text-slate-900 dark:text-white text-xs font-black uppercase tracking-tight">{review.zReportStart || <NoData />}</p>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Fecha y Hora de Primer Reporte Z</label>
              <p className="font-mono text-slate-900 dark:text-white text-xs font-black uppercase tracking-tight">{formatTimestamp(review.zReportTimestampStart) || <NoData />}</p>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Último Reporte Z</label>
              <p className="font-mono text-slate-900 dark:text-white text-xs font-black uppercase tracking-tight">{review.zReportEnd || <NoData />}</p>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Fecha y Hora de Último Reporte Z</label>
              <p className="font-mono text-slate-900 dark:text-white text-xs font-black uppercase tracking-tight">{formatTimestamp(review.zReportTimestampEnd) || <NoData />}</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-[11px] uppercase tracking-widest font-black text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-100 dark:border-slate-900">2. GESTIÓN DE PRECINTOS</h2>
        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border border-slate-100 dark:border-slate-900 transition-colors">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Serial del Precinto Actual</label>
              <p className="font-mono text-slate-900 dark:text-white text-xs font-black uppercase tracking-tight">{review.currentSealSerial || <NoData />}</p>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">¿Precinto Violentado?</label>
              <p className={`font-black text-xs uppercase tracking-tight ${review.sealBroken ? 'text-red-500' : 'text-emerald-500'}`}>{review.sealBroken ? 'SÍ' : 'NO'}</p>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">¿Se Cambió el Precinto?</label>
              <p className={`font-black text-xs uppercase tracking-tight ${review.sealReplaced ? 'text-blue-500' : 'text-slate-400'}`}>{review.sealReplaced ? 'SÍ' : 'NO'}</p>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Serial del Nuevo Precinto</label>
              <p className="font-mono text-slate-900 dark:text-white text-xs font-black uppercase tracking-tight">{review.newSealSerial || <NoData />}</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-[11px] uppercase tracking-widest font-black text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-100 dark:border-slate-900">3. DETALLES DE LA INTERVENCIÓN</h2>
        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border border-slate-100 dark:border-slate-900 transition-colors">
          <div>
            <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Falla Reportada y Acción Realizada</label>
            <p className="text-slate-700 dark:text-slate-300 font-medium text-sm leading-relaxed uppercase bg-white/50 dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 whitespace-pre-wrap">
              {review.description || <NoData />}
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-[11px] uppercase tracking-widest font-black text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-100 dark:border-slate-900">4. CIERRE Y RESPONSABILIDADES</h2>
        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border border-slate-100 dark:border-slate-900 transition-colors">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Técnico Autorizado</label>
              <p className="text-slate-900 dark:text-white font-black uppercase text-xs tracking-tight">{review.technician || <NoData />}</p>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Persona que Recibe</label>
              <p className="text-slate-900 dark:text-white font-black uppercase text-xs tracking-tight">{printer.businessName || <NoData />}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
