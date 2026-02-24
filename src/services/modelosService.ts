import { supabase } from '../lib/supabase';
import type { ModeloImpresora, ModeloImpresoraInsert, ModeloImpresoraUpdate } from '../types/database';
import { handleSupabaseError } from '../utils/errorUtils';

export const modelosService = {
  async getModelos(): Promise<ModeloImpresora[]> {
    const { data, error } = await supabase
      .from('modelos_impresora')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) handleSupabaseError(error, 'modelo');
    return data || [];
  },

  async createModelo(modelo: ModeloImpresoraInsert): Promise<ModeloImpresora> {
    const { data, error } = await supabase
      .from('modelos_impresora')
      .insert(modelo)
      .select()
      .single();
    
    if (error) handleSupabaseError(error, 'modelo');
    return data;
  },

  async updateModelo(id: number, modelo: ModeloImpresoraUpdate): Promise<ModeloImpresora> {
    const { data, error } = await supabase
      .from('modelos_impresora')
      .update(modelo)
      .eq('id', id)
      .select()
      .single();
      
    if (error) handleSupabaseError(error, 'modelo');
    return data;
  },

  async deleteModelos(ids: number[]): Promise<void> {
    const { error } = await supabase
      .from('modelos_impresora')
      .delete()
      .in('id', ids);
      
    if (error) handleSupabaseError(error, 'modelo');
  }
};
