export default function Loading() {
  return (
    <main className="flex-1 flex items-center justify-center py-32">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 dark:text-slate-400 font-medium">Cargando...</p>
      </div>
    </main>
  );
}
