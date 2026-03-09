import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AEG | Portal de Auditoría Fiscal',
  description: 'Sistema de verificación y control de libros fiscales electrónicos autorizado por el SENIAT.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-slate-50 text-slate-900`}>
        <div className="min-h-screen flex flex-col">

          {/* Pristine Header */}
          <header className="bg-white border-b border-slate-200/60 sticky top-0 z-50 backdrop-blur-xl bg-white/80">
            <div className="container mx-auto px-6 h-16 flex items-center justify-between">

              {/* Home Link via Logo */}
              <Link href="/" className="flex items-center gap-3 group hover:opacity-80 transition-opacity cursor-pointer">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 group-hover:scale-105 transition-transform">
                  <span className="font-bold text-lg leading-none tracking-tighter">A</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-extrabold text-xl tracking-tight text-slate-900">AEG</span>
                  <span className="text-slate-300 font-light">|</span>
                  <span className="text-slate-500 font-medium text-sm hidden sm:inline-block">Portal de Auditoría Fiscal</span>
                </div>
              </Link>

              {/* Removed decorative links/buttons to simplify UI for auditors */}

            </div>
          </header>

          <div className="flex-1 w-full py-12">
            {children}
          </div>

          <footer className="bg-white border-t border-slate-200/60 py-8 mt-auto">
            <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-slate-400 text-xs gap-4">
              <p>&copy; 2026 AEG Tecnologías. Todos los derechos reservados.</p>
              <div className="flex gap-4">
                <a href="#" className="hover:text-slate-600 transition-colors">Términos Legales</a>
                <a href="#" className="hover:text-slate-600 transition-colors">Privacidad</a>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
