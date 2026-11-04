begin;
-- The Windows app already records both snapshots atomically when saving.
-- Read access follows the equipment rows visible to the caller under existing RLS.
alter table public.desktop_inventory_history enable row level security;
drop policy if exists desktop_history_read_visible_equipment on public.desktop_inventory_history;
create policy desktop_history_read_visible_equipment
on public.desktop_inventory_history for select to anon, authenticated
using (exists (
 select 1 from public.equipos e
 where upper(trim(e.serial)) = upper(trim(desktop_inventory_history.serial))
));
grant select on public.desktop_inventory_history to anon, authenticated;
create index if not exists desktop_history_serial_date_idx
on public.desktop_inventory_history (serial, recorded_at desc, id);
commit;
