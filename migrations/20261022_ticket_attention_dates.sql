-- Fechas reales para la toma del ticket y primera respuesta de soporte.
-- No modifica registros históricos ni inventa fechas. Ejecutar en la base del portal.
alter table public.tickets add column if not exists tomado_at timestamptz;
alter table public.tickets add column if not exists primera_respuesta_at timestamptz;
