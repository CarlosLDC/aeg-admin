import { supabase } from '../lib/supabase';
import type { Empresa, EmpresaInsert, EmpresaUpdate } from '../types/database';

export const empresasService = {
  async getEmpresas(): Promise<Empresa[]> {
    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async createEmpresa(empresa: EmpresaInsert): Promise<Empresa> {
    const { data, error } = await supabase
      .from('empresas')
      .insert(empresa)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateEmpresa(id: number, empresa: EmpresaUpdate): Promise<Empresa> {
    const { data, error } = await supabase
      .from('empresas')
      .update(empresa)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  async deleteEmpresa(id: number): Promise<void> {
    const { error } = await supabase
      .from('empresas')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
  },

  async deleteEmpresas(ids: number[]): Promise<void> {
    const { error } = await supabase
      .from('empresas')
      .delete()
      .in('id', ids);
      
    if (error) throw error;
  }
};
