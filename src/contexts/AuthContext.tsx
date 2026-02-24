import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Usuario } from '../types/database';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    profile: Usuario | null;
    loading: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Usuario | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (userId: string) => {
        try {
            console.log("🔍 Cargando perfil de usuario:", userId);
            const { data, error } = await supabase
                .from('usuarios')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            if (error) {
                console.error("❌ Error al cargar perfil:", error);
                throw error;
            }
            console.log("✅ Perfil cargado:", data);
            setProfile(data);
        } catch (error) {
            console.error('Error fetching profile:', error);
            setProfile(null);
        }
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.id);
        }
    };

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            const currentUser = session?.user || null;
            setUser(currentUser);
            if (currentUser) {
                fetchProfile(currentUser.id);
            }
            setLoading(false);
        });

        // Refresh session when returning to the tab
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                supabase.auth.getSession().then(({ data: { session } }) => {
                    if (session) {
                        setSession(session);
                        if (session.user) {
                            fetchProfile(session.user.id);
                        }
                    }
                });
            }
        };

        window.addEventListener('visibilitychange', handleVisibilityChange);

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                setSession(session);
                const currentUser = session?.user || null;
                setUser(currentUser);
                if (currentUser) {
                    await fetchProfile(currentUser.id);
                } else {
                    setProfile(null);
                }
                setLoading(false);
            }
        );

        return () => {
            subscription.unsubscribe();
            window.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ session, user, profile, loading, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
