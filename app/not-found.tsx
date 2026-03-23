import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex-1 flex items-center justify-center py-32 px-4">
      <div className="text-center max-w-md">
        <h1 className="text-7xl font-black text-slate-200 dark:text-slate-800 mb-4">404</h1>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Página no encontrada
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8">
          La página que buscas no existe o fue movida.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all active:scale-95"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
