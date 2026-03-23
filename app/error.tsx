'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <main className="flex-1 flex items-center justify-center py-32 px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-100 dark:border-red-800/50">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Ocurrió un error
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8">
          Algo salió mal. Intente de nuevo o contacte a soporte si el problema persiste.
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all active:scale-95"
        >
          Reintentar
        </button>
      </div>
    </main>
  );
}
