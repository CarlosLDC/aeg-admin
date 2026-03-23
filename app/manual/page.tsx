'use client';

import Link from 'next/link';
import { useUserProfile } from '@/app/layout';

export default function ManualPage() {
  const { profile, loading } = useUserProfile();
  const role = profile?.rol_usuario;

  if (loading) {
    return (
      <main className="container mx-auto px-6 py-16 max-w-4xl flex-1">
        <div className="animate-pulse text-slate-500 dark:text-slate-400">
          Cargando manual...
        </div>
      </main>
    );
  }

  if (role !== 'seniat' && role !== 'tecnico') {
    return (
      <main className="container mx-auto px-6 py-16 max-w-4xl flex-1">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Manual no disponible
          </h1>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            Esta sección no aplica para su perfil de usuario.
          </p>
          <Link
            href="/"
            className="inline-flex mt-6 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Volver al inicio
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-6 py-10 md:py-14 max-w-5xl flex-1">
      <section className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-slate-800 p-6 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
        <div className="mb-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
            Libro virtual AEG
          </p>
          <h1 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Manual de usuario
          </h1>
          <p className="mt-4 text-slate-600 dark:text-slate-300 leading-relaxed">
            Esta guía le explica, paso a paso y con lenguaje sencillo, cómo usar el sistema según su rol.
            Aquí verá qué puede hacer, cómo hacerlo y qué límites aplican.
          </p>
        </div>

        {role === 'seniat' && (
          <div className="space-y-8">
            <div className="rounded-xl border border-blue-100 dark:border-blue-800/40 bg-blue-50 dark:bg-blue-900/20 p-4">
              <h2 className="text-lg font-bold text-blue-900 dark:text-blue-200">Su rol: Auditor SENIAT</h2>
              <p className="mt-2 text-sm md:text-base text-blue-900/90 dark:text-blue-200/90 leading-relaxed">
                Usted tiene acceso de auditoría. Puede revisar toda la información de todos los equipos fiscales y su historial,
                pero no puede crear ni modificar registros.
              </p>
            </div>

            <section className="space-y-3">
              <h3 className="text-base font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                1) Buscar equipos fiscales
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Desde la pantalla principal, use el selector para elegir búsqueda por <strong>Serial</strong> o por <strong>RIF</strong>.
                Escriba el dato y pulse <strong>Auditar</strong>. El sistema valida el formato antes de buscar.
              </p>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Si deja el campo vacío y pulsa <strong>Auditar</strong>, verá el listado general de impresoras para revisión masiva.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                2) Auditar información del equipo
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                En resultados, haga clic sobre una impresora para abrir su libro fiscal. Allí encontrará:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-200 leading-relaxed">
                <li>Información base del equipo y del contribuyente.</li>
                <li>Historial de servicios técnicos.</li>
                <li>Historial de inspecciones anuales.</li>
                <li>Estatus actual del equipo y datos de precintos.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                3) Filtrar y navegar registros
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                En las pestañas de servicios e inspecciones puede usar filtros por año y texto para ubicar hallazgos puntuales
                (por técnico, centro de servicio, observaciones o ID). Use la paginación para recorrer cada registro.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                4) Exportar evidencia
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                En el libro fiscal puede descargar PDF para respaldo de auditoría. El archivo incluye la vista actual del libro o
                del registro seleccionado.
              </p>
            </section>

            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4">
              <p className="text-sm md:text-base text-slate-700 dark:text-slate-200 leading-relaxed">
                <strong>Límite del rol SENIAT:</strong> no verá opciones de crear servicios ni inspecciones. Su flujo es de
                consulta, verificación y auditoría integral.
              </p>
            </div>
          </div>
        )}

        {role === 'tecnico' && (
          <div className="space-y-8">
            <div className="rounded-xl border border-amber-100 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-900/20 p-4">
              <h2 className="text-lg font-bold text-amber-900 dark:text-amber-200">Su rol: Técnico</h2>
              <p className="mt-2 text-sm md:text-base text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
                Usted tiene acceso operativo. Puede consultar y registrar información técnica, pero solo sobre impresoras de su
                empresa/distribuidora.
              </p>
            </div>

            <section className="space-y-3">
              <h3 className="text-base font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                1) Buscar equipos de su empresa
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                En inicio, busque por <strong>Serial</strong> o <strong>RIF</strong>, o deje el campo vacío para listar su parque de
                equipos. El sistema solo mostrará impresoras asociadas a su distribuidora.
              </p>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Si no tiene distribuidora vinculada en su perfil, no podrá listar equipos hasta que esa asignación sea corregida.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                2) Revisar libro fiscal del equipo
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Abra una impresora desde resultados para revisar: datos base, historial de servicios, historial de inspecciones,
                estatus, precintos y fechas relevantes. Esta revisión le ayuda a decidir qué registro debe cargar.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                3) Crear un servicio técnico
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Dentro del libro, abra la pestaña <strong>Servicios</strong> y use el botón de agregar (<strong>+</strong>). Complete
                datos del centro, fechas, reportes Z, gestión de precintos y detalle de la intervención. Guarde el registro para que
                quede auditado en el historial.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                4) Crear una inspección anual
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                En la pestaña <strong>Inspecciones</strong>, use el botón de agregar (<strong>+</strong>). Registre fecha,
                inspector actuante, centro y observaciones de la inspección. Al guardar, el registro queda disponible para consulta
                y auditoría.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                5) Filtrar, navegar y exportar
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Use filtros por año y texto para conseguir registros específicos. Con la paginación navega entre registros uno a uno.
                Puede descargar PDF del contenido visible para soporte interno o entrega al cliente.
              </p>
            </section>

            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4">
              <p className="text-sm md:text-base text-slate-700 dark:text-slate-200 leading-relaxed">
                <strong>Límite del rol Técnico:</strong> no puede ver ni trabajar equipos de otras empresas; solo los vinculados a su
                distribuidora.
              </p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
