'use client';

import { useState } from 'react';
import { FiscalPrinter } from '@/lib/mock-data';
import { printerService } from '@/lib/printer-service';
import Link from 'next/link';

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'serial' | 'rif'>('serial');
  const [results, setResults] = useState<FiscalPrinter[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);

    if (searchTerm.length < 3) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      // The service already handles basic searching, we can pass the searchType if needed 
      // but for now the architecture is generic enough.
      const filtered = await printerService.searchPrinters(searchTerm);
      setResults(filtered);
    } catch (error) {
      console.error("Error searching printers:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container mx-auto px-6 max-w-4xl py-12 md:py-20">

      <div className="text-center mb-16 space-y-4">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
          Auditoría de Equipo Fiscal
        </h1>
        <p className="text-slate-500 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
          Verificación segura del historial de mantenimiento y estatus operativo en la red AEG, autorizada por el SENIAT.
        </p>
      </div>

      {/* Search Container */}
      <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-16 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -z-10 opacity-60 translate-x-1/2 -translate-y-1/2" />

        <form onSubmit={handleSearch} className="relative z-10 flex flex-col md:flex-row gap-6 items-center">

          {/* Segmented Control */}
          <div className="flex bg-slate-100/80 p-1 rounded-xl w-full md:w-auto h-14">
            <button
              type="button"
              onClick={() => setSearchType('serial')}
              className={`flex-1 md:w-36 rounded-lg font-medium text-sm transition-all duration-200 ${searchType === 'serial'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              Serial
            </button>
            <button
              type="button"
              onClick={() => setSearchType('rif')}
              className={`flex-1 md:w-36 rounded-lg font-medium text-sm transition-all duration-200 ${searchType === 'rif'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              RIF
            </button>
          </div>

          {/* Premium Input */}
          <div className="relative w-full group flex flex-col md:flex-row gap-4 h-14">
            <div className="relative flex-1 h-full">
              <input
                type="text"
                placeholder={searchType === 'serial' ? 'Ej: AEG-H0001234' : 'Ej: J-12345678-9'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-full bg-slate-50 border border-slate-200 rounded-xl px-5 text-lg outline-none transition-all duration-300 focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10 text-slate-900 placeholder:text-slate-400"
              />
              <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                <SearchIcon size={20} />
              </div>
            </div>
            {searchTerm.length >= 3 && (
              <button
                type="submit"
                className="h-full px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-sm active:scale-[0.98] hidden md:block"
              >
                Auditar
              </button>
            )}
          </div>

        </form>
      </div>

      {/* Results Area */}
      {hasSearched && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-6 px-2">
            <h2 className="text-xl font-bold text-slate-900">Resultados Centrales</h2>
            <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{results.length} encontrados</span>
          </div>

          <div className="space-y-4">
            {results.length > 0 ? (
              results.map((printer) => (
                <Link
                  key={printer.id}
                  href={`/fiscal-book/${printer.id}`}
                  className="block bg-white p-6 rounded-2xl border border-slate-100 hover:border-slate-300 hover:shadow-md transition-all group relative overflow-hidden"
                >
                  {/* Hover Accent Line */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-2">
                        {printer.businessName}
                      </h3>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="bg-slate-50 text-slate-600 px-2.5 py-1 rounded-md font-mono border border-slate-100">
                          RIF: {printer.rif}
                        </span>
                        <span className="bg-slate-50 text-slate-600 px-2.5 py-1 rounded-md font-mono border border-slate-100">
                          SN: {printer.serial}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border ${printer.status === 'activo'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                        {printer.status}
                      </span>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 border border-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-all">
                        <ArrowRight size={20} />
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-500">
                {searchTerm.length < 3
                  ? "Por favor, ingresa un criterio de búsqueda válido (mínimo 3 caracteres)."
                  : "No se encontraron equipos fiscales registrados en la red AEG con esos parámetros."}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Trust Context */}
      <div className="mt-20 text-center">
        <p className="text-sm font-medium text-slate-400 flex items-center justify-center gap-2">
          <LockIcon size={16} /> Base de datos inmutable. Conexión directa certificada por el SENIAT.
        </p>
      </div>
    </main>
  );
}

function SearchIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function ArrowRight({ size, className }: { size: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function LockIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
