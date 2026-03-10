'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import { User } from '@supabase/supabase-js';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const router = useRouter();
  const pathname = usePathname();

  // 1. Theme Logic & Listeners
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
    const initialTheme = savedTheme || 'system';
    setTheme(initialTheme);

    const applyTheme = (t: 'light' | 'dark' | 'system') => {
      const root = document.documentElement;
      if (t === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) root.classList.add('dark');
        else root.classList.remove('dark');
      } else {
        if (t === 'dark') root.classList.add('dark');
        else root.classList.remove('dark');
      }
    };

    applyTheme(initialTheme);

    // Listener for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (localStorage.getItem('theme') === 'system' || !localStorage.getItem('theme')) {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // 2. Initial Session Sync
  useEffect(() => {
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (e) {
        console.error("Auth init error:", e);
      } finally {
        setLoading(false);
      }
    };
    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 3. Navigation Protection
  useEffect(() => {
    if (loading) return;

    if (!user && pathname !== '/login') {
      router.push('/login');
    } else if (user && pathname === '/login') {
      router.push('/');
    }
  }, [user, loading, pathname, router]);

  const cycleTheme = () => {
    let nextTheme: 'light' | 'dark' | 'system';
    if (theme === 'system') nextTheme = 'light';
    else if (theme === 'light') nextTheme = 'dark';
    else nextTheme = 'system';

    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);

    const root = document.documentElement;
    if (nextTheme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) root.classList.add('dark');
      else root.classList.remove('dark');
    } else {
      if (nextTheme === 'dark') root.classList.add('dark');
      else root.classList.remove('dark');
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <html lang="es" className="transition-colors duration-300">
      <body className={`${inter.className} bg-background text-foreground`}>
        <div className="min-h-screen flex flex-col">

          {/* Pristine Header */}
          <header className="bg-white/80 dark:bg-slate-950/80 border-b border-slate-200/60 dark:border-slate-800/60 sticky top-0 z-50 backdrop-blur-xl transition-colors">
            <div className="container mx-auto px-6 h-16 flex items-center justify-between">

              {/* Home Link via Logo */}
              <Link href="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><path d="M6 9V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5" /><rect x="6" y="14" width="12" height="8" rx="2" />
                  </svg>
                </div>
                <div>
                  <span className="text-lg font-black tracking-tighter text-slate-900 dark:text-white block leading-none">AEG</span>
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Portal Administrativo</span>
                </div>
              </Link>

              {/* Toolbar */}
              <div className="flex items-center gap-4">
                {/* Theme Toggle */}
                <button
                  onClick={cycleTheme}
                  className="p-2.5 rounded-xl text-muted hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200/50 dark:border-slate-800/50 shadow-sm bg-white dark:bg-slate-900"
                  title={`Tema: ${theme === 'system' ? 'Sistema' : (theme === 'dark' ? 'Oscuro' : 'Claro')}`}
                >
                  {theme === 'system' && <MonitorIcon size={18} />}
                  {theme === 'light' && <SunIcon size={18} />}
                  {theme === 'dark' && <MoonIcon size={18} />}
                </button>

                {/* User Menu / Logout */}
                {user && (
                  <div className="flex items-center gap-4">
                    <span className="text-muted text-sm hidden md:block">{user.email}</span>
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-foreground dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-all border border-slate-200 dark:border-slate-800"
                    >
                      Salir
                    </button>
                  </div>
                )}
              </div>

            </div>
          </header>

          <div className="flex-1 w-full flex flex-col">
            {loading && pathname !== '/login' ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-pulse text-muted font-medium">Cargando sesión...</div>
              </div>
            ) : (
              children
            )}
          </div>

          <footer className="bg-white dark:bg-slate-950 border-t border-slate-200/60 dark:border-slate-800/60 py-8 mt-auto transition-colors">
            <div className="container mx-auto px-6 text-center text-muted text-xs">
              <p>&copy; {new Date().getFullYear()} AEG. Todos los derechos reservados.</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

function MonitorIcon({ size }: { size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <line x1="8" x2="16" y1="21" y2="21" />
      <line x1="12" x2="12" y1="17" y2="21" />
    </svg>
  );
}

function SunIcon({ size }: { size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" /><path d="M12 20v2" /><path d="M4.93 4.93l1.41 1.41" /><path d="M17.66 17.66l1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="M4.93 19.07l1.41-1.41" /><path d="M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon({ size }: { size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}
