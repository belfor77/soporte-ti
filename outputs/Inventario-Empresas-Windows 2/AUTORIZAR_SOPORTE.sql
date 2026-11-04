-- Ejecutar después de ACTIVAR_BASE.sql y de crear las dos cuentas en Authentication.
do $$
begin
 if (select count(*) from auth.users where lower(email) in ('omar.galvez@t-sales.cl','felipe.olivares@t-sales.cl')) <> 2 then
  raise exception 'Primero crea ambas cuentas: Omar y Felipe, en Authentication > Users.';
 end if;
 insert into public.desktop_inventory_operators(user_id)
 select id from auth.users where lower(email) in ('omar.galvez@t-sales.cl','felipe.olivares@t-sales.cl')
 on conflict do nothing;
end $$;
select u.email as cuenta_autorizada
from public.desktop_inventory_operators o join auth.users u on u.id=o.user_id;
