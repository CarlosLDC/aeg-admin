'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { LockIcon, EyeIcon, EyeOffIcon } from '@/components/icons';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            router.push('/');
            router.refresh();
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[60vh] px-4 py-12 flex-1 animate-in fade-in duration-700">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-800 p-8 md:p-10 transition-colors">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50 transition-colors">
                        <LockIcon size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors">Bienvenido de nuevo</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 transition-colors">Ingrese sus credenciales para acceder al portal</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1 transition-colors">Correo Electrónico</label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-900 dark:text-white placeholder:text-slate-400 font-mono"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1 transition-colors">Contraseña</label>
                        <div className="relative group">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-900 dark:text-white placeholder:text-slate-400 font-mono"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-accent dark:hover:text-blue-400 transition-colors p-1"
                                title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                            >
                                {showPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-xl border border-red-100 dark:border-red-900/30 animate-in fade-in zoom-in duration-300">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:bg-blue-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/10 active:scale-[0.98]"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Iniciando sesión...
                            </span>
                        ) : "Entrar al Sistema"}
                    </button>
                </form>

                <p className="mt-10 text-center text-slate-400 dark:text-slate-500 text-sm transition-colors font-light">
                    Contacte a un administrador de AEG para conseguir acceso
                </p>
            </div>
        </div>
    );
}

