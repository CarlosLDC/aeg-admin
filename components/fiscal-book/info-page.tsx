import type { FiscalPrinter } from '@/lib/types';
import { NoData } from '@/components/no-data';
import { InfoIcon } from '@/components/icons';
import { truncateVersion, getActiveSealSerial } from '@/lib/fiscal-helpers';

export function InfoPage({ printer }: { printer: FiscalPrinter }) {
  return (
    <div className="space-y-12">
      <section>
        <h2 className="text-[11px] uppercase tracking-widest font-black text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-100 dark:border-slate-900">1. DATOS DEL FABRICANTE</h2>
        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border border-slate-100 dark:border-slate-900 transition-colors">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Razón Social</label>
              <p className="text-slate-900 dark:text-white font-black uppercase text-lg">ALPHA ENGINEER GROUP, C.A.</p>
            </div>
            <div className="md:col-span-2">
              <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">RIF</label>
              <p className="font-mono text-slate-900 dark:text-white text-xs font-black uppercase tracking-tight">J504594369</p>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Estado</label>
              <p className="text-slate-900 dark:text-white font-black uppercase text-xs tracking-tight">MIRANDA</p>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Ciudad</label>
              <p className="text-slate-900 dark:text-white font-black uppercase text-xs tracking-tight">LOS TEQUES</p>
            </div>
            <div className="md:col-span-2">
              <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Domicilio fiscal</label>
              <p className="text-slate-700 dark:text-slate-300 font-medium text-sm leading-relaxed uppercase">AVENIDA BICENTENARIO, REDOMA DEL TAMBOR, EDIFICIO VERACRUZ, PISO 1, LOCAL N° 3</p>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">TELÉFONO</label>
              <p className="font-mono text-slate-900 dark:text-white text-xs font-black uppercase tracking-tight">584242913038</p>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">CORREO</label>
              <p className="font-mono text-slate-900 dark:text-white text-xs font-black tracking-tight">soportealphavzla@gmail.com</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-[11px] uppercase tracking-widest font-black text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-100 dark:border-slate-900">2. DATOS DEL ENAJENADOR</h2>
        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border border-slate-100 dark:border-slate-900 transition-colors">
          {printer.distribuidora?.sucursal ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Razón Social</label>
                <p className="text-slate-900 dark:text-white font-black uppercase text-lg">{printer.distribuidora.sucursal.company?.razon_social || <NoData />}</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">RIF</label>
                <p className="font-mono text-slate-900 dark:text-white text-xs font-black uppercase tracking-tight">{printer.distribuidora.sucursal.company?.rif || <NoData />}</p>
              </div>
              <div>
                <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Estado</label>
                <p className="text-slate-900 dark:text-white font-black uppercase text-xs tracking-tight">{printer.distribuidora.sucursal.estado || <NoData />}</p>
              </div>
              <div>
                <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Ciudad</label>
                <p className="text-slate-900 dark:text-white font-black uppercase text-xs tracking-tight">{printer.distribuidora.sucursal.ciudad || <NoData />}</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Dirección</label>
                <p className="text-slate-700 dark:text-slate-300 font-medium text-sm leading-relaxed uppercase">{printer.distribuidora.sucursal.direccion || <NoData />}</p>
              </div>
              <div>
                <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Teléfono</label>
                <p className="font-mono text-slate-900 dark:text-white text-xs font-black uppercase tracking-tight">{printer.distribuidora.sucursal.telefono || <NoData />}</p>
              </div>
              <div>
                <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Correo</label>
                <p className="font-mono text-slate-900 dark:text-white text-xs font-black tracking-tight">{printer.distribuidora.sucursal.correo || <NoData />}</p>
              </div>
            </div>
          ) : (
            <p className="text-slate-400 dark:text-slate-600 text-sm italic">Sin enajenador registrado.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-[11px] uppercase tracking-widest font-black text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-100 dark:border-slate-900">3. DATOS DEL CONTRIBUYENTE/USUARIO</h2>
        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border border-slate-100 dark:border-slate-900 transition-colors">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Razón Social</label>
              <p className="text-slate-900 dark:text-white font-black uppercase text-lg">{printer.businessName || <NoData />}</p>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">RIF</label>
              <p className="font-mono text-slate-900 dark:text-white text-xs font-black uppercase tracking-tight">{printer.rif || <NoData />}</p>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Tipo de Contribuyente</label>
              <p className="text-slate-900 dark:text-white font-black text-xs uppercase tracking-tight">{printer.taxpayerType ? printer.taxpayerType.toUpperCase() : <NoData />}</p>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Estado</label>
              <p className="text-slate-900 dark:text-white font-black uppercase text-xs tracking-tight">{printer.sucursal?.estado || <NoData />}</p>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Ciudad</label>
              <p className="text-slate-900 dark:text-white font-black uppercase text-xs tracking-tight">{printer.sucursal?.ciudad || <NoData />}</p>
            </div>
            <div className="md:col-span-2">
              <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Domicilio Fiscal</label>
              <p className="text-slate-700 dark:text-slate-300 font-medium text-sm leading-relaxed uppercase">{printer.address || <NoData />}</p>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Teléfono</label>
              <p className="font-mono text-slate-900 dark:text-white text-xs font-black uppercase tracking-tight">{printer.sucursal?.telefono || <NoData />}</p>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Correo</label>
              <p className="font-mono text-slate-900 dark:text-white text-xs font-black tracking-tight">{printer.sucursal?.correo || <NoData />}</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-[11px] uppercase tracking-widest font-black text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-100 dark:border-slate-900">4. DATOS DEL LUGAR DE INSTALACIÓN</h2>
        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border border-slate-100 dark:border-slate-900 transition-colors">
          <p className="text-slate-400 dark:text-slate-600 text-sm italic">El lugar de instalación es el domicilio fiscal del contribuyente.</p>
        </div>
      </section>

      <section>
        <h2 className="text-[11px] uppercase tracking-widest font-black text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-100 dark:border-slate-900">5. DATOS DE LA MÁQUINA FISCAL</h2>
        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border border-slate-100 dark:border-slate-900 transition-colors">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Número de Registro (serial)</label>
              <p className="font-mono text-slate-900 dark:text-white text-xs font-black uppercase tracking-tight">{printer.serial_fiscal || <NoData />}</p>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Tipo de Dispositivo Fiscal</label>
              <p className="font-mono text-slate-900 dark:text-white text-xs font-black uppercase tracking-tight">{printer.tipo_dispositivo || <NoData />}</p>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Marca</label>
              <p className="text-slate-900 dark:text-white font-black uppercase text-xs tracking-tight">{printer.modelo?.marca || <NoData />}</p>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Modelo</label>
              <p className="text-slate-900 dark:text-white font-black uppercase text-xs tracking-tight">{printer.modelo?.codigo_modelo || <NoData />}</p>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Serial del Precinto</label>
              <p className="font-mono text-slate-900 dark:text-white text-xs font-black uppercase tracking-tight">
                {getActiveSealSerial(printer) || <NoData />}
              </p>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Fecha de Instalación</label>
              <p className="font-mono text-slate-900 dark:text-white text-xs font-black uppercase tracking-tight">
                {(printer.fecha_instalacion || printer.created_at) ? new Date((printer.fecha_instalacion || printer.created_at) as string).toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : <NoData />}
              </p>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Versión del Firmware</label>
              <div className="inline-flex items-center gap-1.5 group relative cursor-help">
                <p className="font-mono text-slate-900 dark:text-white font-black text-sm m-0">
                  {truncateVersion(printer.version_firmware) || <NoData />}
                </p>
                {printer.version_firmware && (
                  <>
                    <InfoIcon
                      size={14}
                      className="text-slate-400 dark:text-slate-500 hover:text-blue-500 transition-colors flex-shrink-0 relative -top-[1px]"
                    />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-50 pointer-events-none shadow-xl border border-slate-200 dark:border-slate-700 translate-y-1 group-hover:translate-y-0">
                      Versión completa: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{printer.version_firmware}</span>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white dark:border-t-slate-800" />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-[11px] uppercase tracking-widest font-black text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-100 dark:border-slate-900">6. DATOS DEL SOFTWARE</h2>
        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border border-slate-100 dark:border-slate-900 transition-colors">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Nombre</label>
              <p className="font-mono text-slate-900 dark:text-white text-xs font-black uppercase tracking-tight">{printer.software?.nombre || <NoData />}</p>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 block mb-1">Versión</label>
              <p className="font-mono text-slate-900 dark:text-white text-xs font-black uppercase tracking-tight">{printer.software?.version || <NoData />}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
