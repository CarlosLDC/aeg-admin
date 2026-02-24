export interface Empresa {
  id: number;
  rif: string;
  razon_social: string;
  created_at: string;
}

export type EmpresaInsert = Omit<Empresa, 'id' | 'created_at'>;
export type EmpresaUpdate = Partial<EmpresaInsert>;

export interface Sucursal {
  id: number;
  id_empresa: number;
  ciudad: string;
  estado: string;
  direccion: string;
  telefono?: string;
  correo?: string;
  es_cliente: boolean;
  es_distribuidora: boolean;
  es_centro_servicio: boolean;
  created_at: string;
}

export type SucursalInsert = Omit<Sucursal, 'id' | 'created_at'>;
export type SucursalUpdate = Partial<SucursalInsert>;

export interface Usuario {
  id: string; // auth.uid()
  nombre: string;
  foto_perfil: string | null;
  rol: 'admin' | 'viewer';
  created_at: string;
}

export type UsuarioUpdate = Partial<Omit<Usuario, 'id' | 'created_at' | 'rol'>>;

export interface ModeloImpresora {
  id: number;
  marca: string;
  codigo_modelo: string;
  precio: number;
  providencia?: string;
  fecha_homologacion?: string;
  created_at: string;
}

export type ModeloImpresoraInsert = Omit<ModeloImpresora, 'id' | 'created_at'>;
export type ModeloImpresoraUpdate = Partial<ModeloImpresoraInsert>;
