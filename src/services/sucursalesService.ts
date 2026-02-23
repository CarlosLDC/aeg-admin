import { supabase } from '../lib/supabase';
import type { Sucursal, SucursalInsert, SucursalUpdate } from '../types/database';

export const sucursalesService = {
  async getSucursales(): Promise<Sucursal[]> {
    const { data, error } = await supabase
      .from('sucursales')
      .select('*')
      .order('id', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async createSucursal(sucursal: SucursalInsert): Promise<Sucursal> {
    const { data, error } = await supabase
      .from('sucursales')
      .insert(sucursal)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateSucursal(id: number, sucursal: SucursalUpdate): Promise<Sucursal> {
    const { data, error } = await supabase
      .from('sucursales')
      .update(sucursal)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  async deleteSucursal(id: number): Promise<void> {
    const { error } = await supabase
      .from('sucursales')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
  },

  async deleteSucursales(ids: (number | string)[]): Promise<void> {
    const { error } = await supabase
      .from('sucursales')
      .delete()
      .in('id', ids);
      
    if (error) throw error;
  }
};
