/**
 * Roles en `public.perfiles.rol_usuario` (Postgres enum `roles_usuario`).
 */
export type RolUsuario = 'admin' | 'tecnico' | 'seniat';

/** Fila típica de `perfiles` usada en la app */
export type PerfilApp = {
  id: number;
  id_usuario: string;
  correo?: string | null;
  created_at?: string;
  rol_usuario: RolUsuario | null;
  id_empleado: number | null;
};

export function isTecnico(profile: PerfilApp | null | undefined): boolean {
  return profile?.rol_usuario === 'tecnico';
}

export function isAdminOrSeniat(profile: PerfilApp | null | undefined): boolean {
  const r = profile?.rol_usuario;
  return r === 'admin' || r === 'seniat';
}

/** Puede registrar servicios técnicos e inspecciones (antes “distribuidora”). */
export function canRegistrarServiciosEInspecciones(profile: PerfilApp | null | undefined): boolean {
  return isTecnico(profile);
}
