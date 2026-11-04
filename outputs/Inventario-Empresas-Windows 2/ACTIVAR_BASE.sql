-- Ejecutar una vez en el editor SQL del proyecto Supabase actual.
create table if not exists public.desktop_inventory_operators (
 user_id uuid primary key references auth.users(id)
);
alter table public.desktop_inventory_operators enable row level security;
revoke all on public.desktop_inventory_operators from anon, authenticated;
create table if not exists public.desktop_inventory_history (
 id uuid primary key default gen_random_uuid(),
 actor uuid not null,
 recorded_at timestamptz not null default now(),
 serial text not null,
 previous_data jsonb,
 current_data jsonb not null
);
alter table public.desktop_inventory_history enable row level security;
revoke all on public.desktop_inventory_history from anon, authenticated;

create or replace function public.desktop_inventory(p_serial text, p_data jsonb default null, p_expected jsonb default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
 old_row public.equipos%rowtype;
 new_row public.equipos%rowtype;
 matches integer;
 s text := upper(trim(p_serial));
begin
 if auth.uid() is null or not exists(select 1 from public.desktop_inventory_operators where user_id = auth.uid()) then
  raise exception 'Cuenta sin autorización para inventario. Contacta al administrador.';
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
 if matches = 1 then
  update public.equipos set
   nombre_codigo=p_data->>'nombre_codigo', marca=p_data->>'marca', modelo=p_data->>'modelo',
   cpu=p_data->>'cpu', ram=p_data->>'ram', disco_duro=p_data->>'disco_duro',
   sistema_operativo=p_data->>'sistema_operativo', empresa=p_data->>'empresa',
   usuario_nombre=p_data->>'usuario_nombre', usuario_email=p_data->>'usuario_email', tipo=p_data->>'tipo'
  where id=old_row.id returning * into new_row;
 else
  insert into public.equipos(id, created_at, serial, nombre_codigo, marca, modelo, cpu, ram, disco_duro, sistema_operativo, empresa, usuario_nombre, usuario_email, tipo, estado)
  values(gen_random_uuid(), now(), s, p_data->>'nombre_codigo', p_data->>'marca', p_data->>'modelo', p_data->>'cpu', p_data->>'ram', p_data->>'disco_duro', p_data->>'sistema_operativo', p_data->>'empresa', p_data->>'usuario_nombre', p_data->>'usuario_email', p_data->>'tipo', 'activo') returning * into new_row;
 end if;
 insert into public.desktop_inventory_history(actor,serial,previous_data,current_data)
 values(auth.uid(),s,case when matches=1 then to_jsonb(old_row) else null end,to_jsonb(new_row));
 return to_jsonb(new_row);
end $$;
revoke all on function public.desktop_inventory(text,jsonb,jsonb) from public, anon;
grant execute on function public.desktop_inventory(text,jsonb,jsonb) to authenticated;

-- Después de crear una cuenta en Authentication > Users, autorízala:
-- insert into public.desktop_inventory_operators(user_id)
-- select id from auth.users where email = 'CORREO_REAL_DEL_TECNICO'
-- on conflict do nothing;
