'use client';

import { useState, useRef } from 'react';
import { FiscalPrinter } from '@/lib/mock-data';
import { printerService } from '@/lib/printer-service';
import Link from 'next/link';

export default function SearchPage() {
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'serial' | 'rif'>('serial');
  const [results, setResults] = useState<FiscalPrinter[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  // Pagination & Scrolling
  const resultsRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 5;

  // Search Normalization
  const handleSearchTermChange = (value: string) => {
    // Uppercase + alphanumeric only
    const normalized = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setSearchTerm(normalized);
  };

  const performSearch = async (page: number, isNewSearch: boolean = false) => {
    setLoading(true);
    if (isNewSearch) setHasSearched(true);

    try {
      const { data, count } = await printerService.searchPrinters(searchTerm, page, PAGE_SIZE);
      setResults(data);
      setTotalCount(count);
      setCurrentPage(page);

      // Scroll to results top on page change
      if (!isNewSearch && resultsRef.current) {
        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (error) {
      console.error("Error searching printers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(1, true);
  };

  const handlePageChange = (newPage: number) => {
    performSearch(newPage);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <main className="container mx-auto px-6 max-w-4xl py-12 md:py-20 flex-1 flex flex-col justify-center">

      <div className="text-center mb-16 space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Auditoría de Equipo Fiscal
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
          Verificación segura del historial de mantenimiento y estatus operativo en la red AEG, autorizada por el SENIAT.
        </p>
      </div>

      {/* Search Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl p-6 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-800 mb-16 relative overflow-hidden transition-colors">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 dark:bg-blue-900/10 rounded-full blur-3xl -z-10 opacity-60 translate-x-1/2 -translate-y-1/2" />

        <form onSubmit={handleSearch} className="relative z-10 flex flex-col md:flex-row gap-4 items-center">

          {/* Segmented Control */}
          <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl w-full md:w-auto h-14 border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setSearchType('serial')}
              className={`flex-1 md:w-36 rounded-lg font-medium text-sm transition-all duration-200 ${searchType === 'serial'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
            >
              Serial
            </button>
            <button
              type="button"
              onClick={() => setSearchType('rif')}
              className={`flex-1 md:w-36 rounded-lg font-medium text-sm transition-all duration-200 ${searchType === 'rif'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
            >
              RIF
            </button>
          </div>

          {/* Premium Input */}
          <div className="relative w-full group flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder={searchType === 'serial' ? 'Ej: GRA0000123' : 'Ej: J123456789'}
                value={searchTerm}
                onChange={(e) => handleSearchTermChange(e.target.value)}
                className="w-full h-14 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-5 text-lg outline-none transition-all duration-300 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-300 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-slate-900 dark:text-white placeholder:text-slate-400 font-medium font-mono"
              />
              <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                <SearchIcon size={20} />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="h-14 w-full md:w-auto px-8 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:bg-blue-400 text-white font-semibold rounded-xl transition-all shadow-sm shadow-blue-500/10 active:scale-[0.95] flex items-center justify-center gap-2 min-w-[140px]"
            >
              {loading ? "Buscando..." : "Auditar"}
            </button>
          </div>

        </form>
      </div>

      <p className="mt-[-1rem] md:mt-[-2.5rem] mb-12 text-center text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-[0.2em] animate-in fade-in slide-in-from-top-2 duration-1000">
        Deja el campo vacío para ver todos los resultados
      </p>

      {/* Results Area */}
      {hasSearched && (
        <div ref={resultsRef} className="animate-in fade-in slide-in-from-bottom-4 duration-500 scroll-mt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 px-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Resultados Centrales</h2>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                {totalCount} Total
              </span>
              {totalPages > 1 && (
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-800/30 whitespace-nowrap">
                  Página {currentPage} de {totalPages}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-4 mb-20">
            {results.length > 0 ? (
              <>
                {results.map((printer) => (
                  <Link
                    key={printer.id}
                    href={`/fiscal-book/${printer.id}`}
                    className="block bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md dark:hover:shadow-blue-900/10 transition-all group relative overflow-hidden"
                  >
                    {/* Hover Accent Line */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2 md:space-y-1">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {printer.businessName}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 md:gap-3 text-sm">
                          <span className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-md font-mono border border-slate-100 dark:border-slate-700">
                            RIF: {printer.rif}
                          </span>
                          <span className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-md font-mono border border-slate-100 dark:border-slate-700">
                            SN: {printer.serial_fiscal}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-row items-center justify-between md:justify-end w-full md:w-auto gap-4 mt-2 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                        {/* Status Badge mapping for real DB values */}
                        <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border ${printer.estatus === 'asignada'
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/30'
                          : printer.estatus === 'laboratorio'
                            ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/30'
                            : printer.estatus === 'sin_asignar'
                              ? 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/30'
                          }`}>
                          {printer.estatus.replace('_', ' ')}
                        </span>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:border-blue-100 dark:group-hover:border-blue-800/50 transition-all shrink-0">
                          <ArrowRight size={20} />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}

                {/* Simplified Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-8 py-6">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1 || loading}
                      className="px-6 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-white transition-all shadow-sm flex items-center gap-2 group"
                    >
                      <ArrowRight size={16} className="rotate-180" />
                      Anterior
                    </button>

                    <div className="flex flex-wrap items-center justify-center gap-2 px-4 py-2 bg-slate-100/50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                        // Only show current, first, last, and neighbors
                        if (p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1) {
                          return (
                            <button
                              key={p}
                              onClick={() => handlePageChange(p)}
                              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === p
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-110'
                                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                                }`}
                            >
                              {p}
                            </button>
                          );
                        } else if (p === currentPage - 2 || p === currentPage + 2) {
                          return <span key={p} className="text-slate-300 dark:text-slate-700 text-xs">...</span>;
                        }
                        return null;
                      })}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages || loading}
                      className="px-6 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-white transition-all shadow-sm flex items-center gap-2 group"
                    >
                      Siguiente
                      <ArrowRight size={16} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-500 dark:text-slate-400 transition-colors">
                {loading ? "Buscando en la base de datos central..." : "No se encontraron equipos fiscales con los parámetros indicados. Prueba dejando el campo vacío para ver todos los registros."}
              </div>
            )}
          </div>
        </div>
      )}

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
