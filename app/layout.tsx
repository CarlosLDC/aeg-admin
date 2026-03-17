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
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const router = useRouter();
  const pathname = usePathname();

  // 1. Theme Logic
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initialTheme = savedTheme || 'light';
    setTheme(initialTheme);

    const applyTheme = (t: 'light' | 'dark') => {
      const root = document.documentElement;
      if (t === 'dark') root.classList.add('dark');
      else root.classList.remove('dark');
    };

    applyTheme(initialTheme);
  }, []);

  // Set page title
  useEffect(() => {
    document.title = 'Libros Fiscales - AEG';
  }, []);

  // 2. Initial Session Sync
  useEffect(() => {
    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          // If local session is corrupted or refresh token missing, forcefully sign out to clear storage
          if (error.message.includes('Refresh Token')) {
            // Silence this specific error as it's common when session expires or is cleared
            await supabase.auth.signOut();
            setUser(null);
          } else {
            console.error("Auth session error:", error.message);
          }
        } else {
          setUser(session?.user ?? null);
        }
      } catch (e) {
        console.error("Auth init exception:", e);
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
    const nextTheme: 'light' | 'dark' = theme === 'light' ? 'dark' : 'light';

    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);

    const root = document.documentElement;
    if (nextTheme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
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
                <img src="/aeg-logo.png" alt="AEG Logo" className="h-10 w-auto logo-theme-aware" />
              </Link>

              {/* Toolbar */}
              <div className="flex items-center gap-4">
                {/* Theme Toggle */}
                <button
                  onClick={cycleTheme}
                  className="p-2.5 rounded-xl text-muted hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900"
                  title={`Tema: ${theme === 'dark' ? 'Oscuro' : 'Claro'}`}
                >
                  {theme === 'light' && <MoonIcon size={18} />}
                  {theme === 'dark' && <SunIcon size={18} />}
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

