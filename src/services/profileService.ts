import { supabase } from '../lib/supabase';
import type { Usuario, UsuarioUpdate } from '../types/database';

export const profileService = {
  async getProfile(userId: string): Promise<Usuario | null> {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },

  async updateProfile(updates: UsuarioUpdate): Promise<void> {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("No hay sesión de usuario activa");
    
    const activeUserId = user.id;
    console.log("🚀 Iniciando updateProfile:");
    console.log("   - Payload:", updates);
    console.log("   - User ID:", activeUserId);

    // 1. Intentar UPDATE quirúrgico (sin tocar el rol)
    const { rol, ...safeUpdates } = updates as any;
    
    const { data, error, status } = await supabase
      .from('usuarios')
      .update(safeUpdates)
      .eq('id', activeUserId)
      .select();

    console.log("   - Respuesta Supabase:", { data, error, status });

    if (error) {
        if (error.code === '42501') throw new Error('Error de permisos (RLS) al actualizar.');
        throw new Error(`Error de base de datos: ${error.message}`);
    }

    // 2. Si data tiene algo, éxito total.
    if (data && data.length > 0) return;

    // 3. Si llegamos aquí, el UPDATE no afectó a nada. 
    // Vamos a ver EXACTAMENTE por qué.
    const { data: row } = await supabase
      .from('usuarios')
      .select('id, rol')
      .eq('id', activeUserId)
      .maybeSingle();

    if (!row) {
        throw new Error(
            'Tu perfil no existe en la tabla "public.usuarios". ' +
            'Estar registrado en la App no crea la fila automáticamente. ' +
            'Por favor, ejecuta el INSERT manual que te enviará el asistente.'
        );
    } else {
        throw new Error(
            'El perfil existe pero no se pudo modificar. ' +
            'Verifica que la política UPDATE incluya: USING (id = auth.uid())'
        );
    }
  },

  async uploadAvatar(userId: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    const filePath = fileName;

    const { error: uploadError } = await supabase.storage
      .from('perfiles')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('perfiles')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }
};
