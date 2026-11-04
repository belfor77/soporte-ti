begin;
-- Ejecutar DESPUÉS de ACTIVAR_BASE.sql. Autoriza exclusivamente este paquete.
-- No publicar este archivo ni el ejecutable fuera del equipo de soporte.
create table if not exists public.desktop_inventory_keys (
 name text primary key,
 key_hash text not null unique,
 enabled boolean not null default true
);
alter table public.desktop_inventory_keys enable row level security;
revoke all on public.desktop_inventory_keys from public, anon, authenticated;
alter table public.desktop_inventory_history alter column actor drop not null;
-- Las operaciones portables no tienen un técnico identificado; no se les atribuye uno.
alter table public.equipos add column if not exists sede text;
create or replace function public.desktop_inventory_portable(p_serial text, p_key text, p_data jsonb default null, p_expected jsonb default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
 old_row public.equipos%rowtype;
 new_row public.equipos%rowtype;
 matches integer;
 s text := upper(trim(p_serial));
begin
 if p_key is null or not exists (
  select 1 from public.desktop_inventory_keys
  where key_hash = encode(sha256(convert_to(p_key, 'UTF8')), 'hex') and enabled
 ) then
  raise exception 'Este ejecutable no está autorizado. Activa ACTIVAR_SIN_SESION.sql o solicita una nueva copia a soporte.';
 end if;
 if s is null or length(s) < 3 or s in ('DESCONOCIDO','UNKNOWN','DEFAULT STRING','TO BE FILLED BY O.E.M.','NONE','N/A','SYSTEM SERIAL NUMBER','00000000') then
  raise exception 'El equipo no tiene una serie válida. Requiere revisión manual.';
 end if;
 perform pg_advisory_xact_lock(hashtextextended(s, 0));
 select count(*) into matches from public.equipos where upper(trim(serial)) = s;
 if matches > 1 then raise exception 'Hay registros duplicados de esta serie. Deben revisarse en la web.'; end if;
 select * into old_row from public.equipos where upper(trim(serial)) = s for update;
 if p_data is null then
  if matches = 0 then return null; end if;
  return to_jsonb(old_row);
 end if;
 if (matches = 0 and p_expected is not null) or (matches = 1 and to_jsonb(old_row) is distinct from p_expected) then
  raise exception 'El registro cambió desde la consulta. Detecta y consulta nuevamente antes de guardar.';
 end if;
 if p_data->>'empresa' is null or p_data->>'empresa' not in ('T-Sales','VPrime','Infinet') or coalesce(trim(p_data->>'usuario_nombre'),'') = '' or coalesce(p_data->>'usuario_email','') not like '%@%.%' or p_data->>'tipo' is null or p_data->>'tipo' not in ('laptop','escritorio','servidor') then
  raise exception 'Revisa la empresa, el tipo y los datos del responsable.';
 end if;
 if p_data ? 'sede' and not (
  (p_data->>'empresa' = 'T-Sales' and p_data->>'sede' in ('Agustinas 641, oficina 501, Santiago', 'Latadia 4602, Las Condes')) or
  (p_data->>'empresa' = 'VPrime' and p_data->>'sede' in ('Agustinas 641, oficina 501, Santiago', 'Eliodoro Yáñez 2318, Providencia')) or
  (p_data->>'empresa' = 'Infinet' and p_data->>'sede' = 'Fanor Velasco 85, oficina 201, Santiago')
 ) then raise exception 'Selecciona una sede válida para la empresa.'; end if;
 if p_data ? 'sede' and coalesce(trim(p_data->>'sede'),'') = '' then
  raise exception 'Selecciona una sede válida para la empresa.';
 end if;
 if matches = 1 then
  update public.equipos set
   sede=coalesce(p_data->>'sede',old_row.sede),
   nombre_codigo=p_data->>'nombre_codigo', marca=p_data->>'marca', modelo=p_data->>'modelo',
   cpu=p_data->>'cpu', ram=p_data->>'ram', disco_duro=p_data->>'disco_duro',
   sistema_operativo=p_data->>'sistema_operativo', empresa=p_data->>'empresa',
   usuario_nombre=p_data->>'usuario_nombre', usuario_email=p_data->>'usuario_email', tipo=p_data->>'tipo'
  where id=old_row.id returning * into new_row;
 else
  insert into public.equipos(id, created_at, serial, nombre_codigo, marca, modelo, cpu, ram, disco_duro, sistema_operativo, empresa, sede, usuario_nombre, usuario_email, tipo, estado)
  values(gen_random_uuid(), now(), s, p_data->>'nombre_codigo', p_data->>'marca', p_data->>'modelo', p_data->>'cpu', p_data->>'ram', p_data->>'disco_duro', p_data->>'sistema_operativo', p_data->>'empresa', p_data->>'sede', p_data->>'usuario_nombre', p_data->>'usuario_email', p_data->>'tipo', 'activo') returning * into new_row;
 end if;
 insert into public.desktop_inventory_history(actor,serial,previous_data,current_data)
 values(auth.uid(),s,case when matches=1 then to_jsonb(old_row) else null end,to_jsonb(new_row));
 return to_jsonb(new_row);
end $$;
revoke all on function public.desktop_inventory_portable(text,text,jsonb,jsonb) from public;
grant execute on function public.desktop_inventory_portable(text,text,jsonb,jsonb) to anon, authenticated;
insert into public.desktop_inventory_keys(name,key_hash,enabled)
values('soporte-portable-v2',encode(sha256(convert_to('mnBrfMilN--JoPRc8FsB3G5GbnsrVKleOckV9tbLxW0','UTF8')),'hex'),true)
on conflict(name) do update set key_hash=excluded.key_hash, enabled=true;
-- Para revocar todas las copias de este paquete:
-- update public.desktop_inventory_keys set enabled=false where name='soporte-portable-v2';

commit;
