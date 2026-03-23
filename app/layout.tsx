'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { useEffect, useState, createContext, useContext } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { withTimeout } from '@/lib/timeout';
import { SunIcon, MoonIcon } from '@/components/icons';

const inter = Inter({ subsets: ['latin'] });

/** Alineado con `public.perfiles` (rol_usuario, id_empleado, …) */
export type UserProfile = {
  id: number;
  id_usuario: string;
  correo: string | null;
  created_at?: string;
  rol_usuario: 'admin' | 'tecnico' | 'seniat' | null;
  id_empleado: number | null;
};

export const UserProfileContext = createContext<{
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  /** Distribuidora del empleado vinculado; solo aplica si `rol_usuario === 'tecnico'`. */
  tecnicoDistribuidoraId: number | null;
}>({ user: null, profile: null, loading: true, tecnicoDistribuidoraId: null });

export function useUserProfile() {
  return useContext(UserProfileContext);
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tecnicoDistribuidoraId, setTecnicoDistribuidoraId] = useState<number | null>(null);

  const router = useRouter();
  const pathname = usePathname();
  const showManualLink = profile?.rol_usuario === 'seniat' || profile?.rol_usuario === 'tecnico';

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
    const lastProfileUserIdRef = { current: null as string | null };

    const fetchProfile = async (userId: string) => {
      try {
        const { data, error } = await withTimeout(
          supabase
            .from('perfiles')
            .select('*')
            .eq('id_usuario', userId)
            .maybeSingle(),
          30000
        );
        if (error) throw error;
        setProfile(data);

        let distribuidoraId: number | null = null;
        if (data?.rol_usuario === 'tecnico' && data.id_empleado != null) {
          console.log('[DEBUG] Consultando vista_directorio_empleados para empleado_id:', data.id_empleado);
          const { data: dirRows, error: dirErr } = await withTimeout(
            supabase
              .from('vista_directorio_empleados')
              .select('empleado_id, distribuidora_id, sucursal_id, empleado_nombre')
              .eq('empleado_id', data.id_empleado),
            30000
          );
          const dirRow =
            !dirErr && Array.isArray(dirRows)
              ? dirRows.find((r: { distribuidora_id?: number | null }) => r.distribuidora_id != null) ??
                dirRows[0]
              : null;
          console.log('[DEBUG] Resultado dirRow:', JSON.stringify(dirRow), 'error:', dirErr);
          if (!dirErr && dirRow?.distribuidora_id != null) {
            distribuidoraId = Number(dirRow.distribuidora_id);
          }
          console.log('[DEBUG] Técnico distribuidoraId final:', distribuidoraId);
        }
        setTecnicoDistribuidoraId(distribuidoraId);
      } catch (err) {
        console.error("[Auth] Error fetching profile:", err);
        setProfile(null);
        setTecnicoDistribuidoraId(null);
      } finally {
        // Ensure we don't block the UI if profile fetch fails or times out
        setLoading(false);
      }
    };

    let isInitialCallback = true;
    const timeoutId = window.setTimeout(() => {
      // Fallback: if the auth callback gets aborted/throttled, we don't want the UI
      // stuck forever behind "Cargando sesión...".
      if (isInitialCallback) {
        isInitialCallback = false;
        setLoading(false);
      }
    }, 6000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        const userId = currentUser.id;
        if (lastProfileUserIdRef.current !== userId) {
          lastProfileUserIdRef.current = userId;
          await fetchProfile(userId);
        } else {
          // If user exists but profile already fetched, stop loading
          setLoading(false);
        }
      } else {
        lastProfileUserIdRef.current = null;
        setProfile(null);
        setTecnicoDistribuidoraId(null);
        setLoading(false);
      }
    });

    return () => {
      window.clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  // 3. Navigation Protection
  useEffect(() => {
    if (loading) return;

    const isLogin = pathname === '/login';
    const isHome = pathname === '/';
    const isDistribuidoraRoute = pathname.startsWith('/distribuidora');

    if (!user && !isLogin) {
      router.push('/login');
    } else if (user && isLogin) {
      router.push('/');
    }
  }, [user, profile, loading, pathname, router]);

  const cycleTheme = () => {
    const nextTheme: 'light' | 'dark' = theme === 'light' ? 'dark' : 'light';

    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);

    const root = document.documentElement;
    if (nextTheme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  };

  const handleLogout = async () => {
    // 1. Optimistic UI: Clear React states immediately
    setUser(null);
    setProfile(null);
    setTecnicoDistribuidoraId(null);
    setLoading(false);
    
    // 2. Perform sign-out and wait for it (mostly to clear local storage)
    try {
      // scope: 'local' is fast as it primarily clears local storage
      await Promise.race([
        supabase.auth.signOut({ scope: 'local' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Signout timeout')), 1000))
      ]);
    } catch (err) {
      console.warn('Logout error or timeout:', err);
    }

    // 3. Final redirect (Full page reload to ensure clean state)
    window.location.href = '/login';
  };

  return (
    <html lang="es" className="transition-colors duration-300">
      <body className={`${inter.className} bg-background text-foreground`}>
        <div className="min-h-screen flex flex-col">

          {/* Pristine Header */}
          <header className="bg-white/80 dark:bg-slate-950/80 border-b border-slate-200/60 dark:border-slate-800/60 sticky top-0 z-50 backdrop-blur-xl transition-colors">
            <div className="container mx-auto px-6 h-16 flex items-center justify-between">

              <div className="flex items-center gap-3 md:gap-4">
                {/* Home Link via Logo */}
                <Link href="/" className="flex items-center gap-3 group">
                  <img src="/aeg-logo.png" alt="AEG Logo" className="h-10 w-auto logo-theme-aware" />
                </Link>
                {user && showManualLink && (
                  <Link
                    href="/manual"
                    className="inline-flex items-center px-2 py-1 md:px-2.5 rounded-md text-[11px] md:text-sm font-medium text-slate-500 dark:text-slate-400 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/70 hover:text-slate-700 dark:hover:text-slate-200 transition-all"
                  >
                    Manual
                  </Link>
                )}
              </div>

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
                    <span className="text-muted text-xs md:text-sm max-w-[100px] md:max-w-none truncate">{user.email}</span>
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
            <UserProfileContext.Provider value={{ user, profile, loading, tecnicoDistribuidoraId }}>
              {loading && pathname !== '/login' ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="animate-pulse text-muted font-medium">Cargando sesión...</div>
                </div>
              ) : (
                children
              )}
            </UserProfileContext.Provider>
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



