-- =============================================================================
-- servicios_tecnicos: centro opcional + id_distribuidora
-- =============================================================================
--
-- Si su tabla YA coincide con el DDL del proyecto (id_centro_servicio NULL,
-- id_distribuidora NULL + FK a distribuidoras), puede OMITIR todo el SQL de
-- abajo y solo recargar la caché del esquema del API si PostgREST no ve la
-- columna:
--   Supabase → Project Settings → Data API → «Reload schema»
--
-- =============================================================================
-- 1) Proyectos antiguos: columna, FK y centro nullable
--    (ADD COLUMN / FK son idempotentes; DROP NOT NULL es seguro si ya es NULL)
-- =============================================================================

ALTER TABLE public.servicios_tecnicos
  ADD COLUMN IF NOT EXISTS id_distribuidora bigint NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'servicios_tecnicos_id_distribuidora_fkey'
  ) THEN
    ALTER TABLE public.servicios_tecnicos
      ADD CONSTRAINT servicios_tecnicos_id_distribuidora_fkey
      FOREIGN KEY (id_distribuidora) REFERENCES public.distribuidoras (id);
  END IF;
END $$;

ALTER TABLE public.servicios_tecnicos
  ALTER COLUMN id_centro_servicio DROP NOT NULL;

-- =============================================================================
-- 2) OPCIONAL: integridad en BD (la app ya exige centro O distribuidora)
--    Fallará si existen filas con id_centro_servicio e id_distribuidora NULL.
-- =============================================================================

ALTER TABLE public.servicios_tecnicos
  DROP CONSTRAINT IF EXISTS servicios_tecnicos_centro_o_distribuidora_chk;

ALTER TABLE public.servicios_tecnicos
  ADD CONSTRAINT servicios_tecnicos_centro_o_distribuidora_chk
  CHECK (
    id_centro_servicio IS NOT NULL
    OR id_distribuidora IS NOT NULL
  );
