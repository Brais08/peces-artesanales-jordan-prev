-- =====================================================================
--  Poteras artesanales Jordan Nito · Base de datos del catálogo
--  Ejecutar en Supabase → SQL Editor → New query → pegar todo → Run.
--  Se puede volver a ejecutar sin romper nada (no duplica datos).
-- =====================================================================

-- Esquema privado: funciones internas que no se exponen a la API pública
create schema if not exists private;
grant usage on schema private to anon, authenticated;

-- ---------------------------------------------------------------------
-- 1) Administradores: solo los usuarios de esta tabla pueden modificar
-- ---------------------------------------------------------------------
create table if not exists public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;
grant select on public.admins to authenticated;

drop policy if exists "admins: cada uno ve solo su fila" on public.admins;
create policy "admins: cada uno ve solo su fila" on public.admins
  for select to authenticated
  using (user_id = (select auth.uid()));

create or replace function private.is_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;
revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to anon, authenticated;

-- Valida la lista de colores: [["Nombre", "#lomo", "#cuerpo"], ...] (máx. 6)
create or replace function private.valid_variants(v jsonb)
returns boolean
language sql immutable
set search_path = ''
as $$
  select jsonb_typeof(v) = 'array'
     and jsonb_array_length(v) <= 6
     and not exists (
       select 1 from jsonb_array_elements(v) as e
       where not (
         jsonb_typeof(e) = 'array'
         and jsonb_array_length(e) = 3
         and char_length(coalesce(e->>0, '')) between 1 and 24
         and coalesce(e->>1, '') ~ '^#[0-9A-Fa-f]{6}$'
         and coalesce(e->>2, '') ~ '^#[0-9A-Fa-f]{6}$'
       )
     );
$$;
revoke all on function private.valid_variants(jsonb) from public;
grant execute on function private.valid_variants(jsonb) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 2) Catálogo de poteras
--    Todas las comprobaciones se hacen también aquí, en el servidor:
--    aunque alguien manipule la web, la base de datos rechaza datos raros.
-- ---------------------------------------------------------------------
create table if not exists public.products (
  id          text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(id) <= 40),
  name        text not null check (char_length(btrim(name)) between 2 and 60),
  cat         text not null check (cat in ('calamar', 'chipiron', 'sepia')),
  description text not null default '' check (char_length(description) <= 280),
  def_size    smallint not null default 4 check (def_size between 0 and 6),
  extra       numeric(6,2) not null default 0 check (extra between -20 and 200),
  sink        text not null default '' check (char_length(sink) <= 20),
  stock       integer not null default 0 check (stock between 0 and 9999),
  badge       text not null default '' check (char_length(badge) <= 24),
  badge_style text not null default '' check (badge_style in ('', 'new', 'limited')),
  serial      text not null default '' check (char_length(serial) <= 20),
  shape       text not null default 'calamar' check (shape in ('calamar', 'chipiron', 'sepia')),
  back        text not null default '#C2662D' check (back ~ '^#[0-9A-Fa-f]{6}$'),
  body        text not null default '#F4D9B8' check (body ~ '^#[0-9A-Fa-f]{6}$'),
  pattern     text not null default 'scales' check (pattern in ('scales', 'stripes', 'dots', 'none')),
  bg1         text not null default '#12345E' check (bg1 ~ '^#[0-9A-Fa-f]{6}$'),
  bg2         text not null default '#0A1A2F' check (bg2 ~ '^#[0-9A-Fa-f]{6}$'),
  photo_path  text check (photo_path is null or photo_path ~ '^[a-z0-9][a-z0-9/_.-]{0,120}\.(webp|jpg|jpeg|png)$'),
  variants    jsonb not null default '[]'::jsonb check (private.valid_variants(variants)),
  visible     boolean not null default true,
  sort        integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
  for each row execute function private.touch_updated_at();

alter table public.products enable row level security;
revoke all on public.products from anon, authenticated;
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;

drop policy if exists "products: todos ven las visibles" on public.products;
create policy "products: todos ven las visibles" on public.products
  for select to anon, authenticated
  using (visible or (select private.is_admin()));

drop policy if exists "products: solo admin crea" on public.products;
create policy "products: solo admin crea" on public.products
  for insert to authenticated
  with check ((select private.is_admin()));

drop policy if exists "products: solo admin edita" on public.products;
create policy "products: solo admin edita" on public.products
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

drop policy if exists "products: solo admin borra" on public.products;
create policy "products: solo admin borra" on public.products
  for delete to authenticated
  using ((select private.is_admin()));

-- ---------------------------------------------------------------------
-- 3) Fotos: carpeta pública de lectura; solo el admin sube o borra.
--    Máx. 2 MB y solo imágenes WebP, JPG o PNG.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-photos', 'product-photos', true, 2097152, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "fotos: admin ve" on storage.objects;
create policy "fotos: admin ve" on storage.objects
  for select to authenticated
  using (bucket_id = 'product-photos' and (select private.is_admin()));

drop policy if exists "fotos: admin sube" on storage.objects;
create policy "fotos: admin sube" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-photos' and (select private.is_admin()));

drop policy if exists "fotos: admin cambia" on storage.objects;
create policy "fotos: admin cambia" on storage.objects
  for update to authenticated
  using (bucket_id = 'product-photos' and (select private.is_admin()))
  with check (bucket_id = 'product-photos' and (select private.is_admin()));

drop policy if exists "fotos: admin borra" on storage.objects;
create policy "fotos: admin borra" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-photos' and (select private.is_admin()));

-- ---------------------------------------------------------------------
-- 4) Catálogo inicial (las 8 poteras de ejemplo). No duplica si ya existen.
-- ---------------------------------------------------------------------
insert into public.products (id, name, cat, def_size, extra, sink, stock, badge, badge_style, serial, shape, back, body, pattern, bg1, bg2, variants, sort) values
  ('rias', 'Potera Rías', 'calamar', 4, 0, '3,5 s/m', 12, 'Más vendida', '', '037/150', 'calamar', '#C2662D', '#F4D9B8', 'scales', '#12345E', '#0A1A2F',
   '[["Camarón","#C2662D","#F4D9B8"],["Gamba roja","#B3261E","#F6C9B8"],["Natural","#7A6A55","#E9DFCC"],["Flúor","#FFC21A","#FFF1B8"]]', 10),
  ('chipi-noche', 'Chipi Noche', 'chipiron', 1, 0, '4 s/m', 4, 'Nuevo', 'new', '012/100', 'chipiron', '#0A1A2F', '#9CC9E6', 'none', '#1D5FA8', '#12345E',
   '[["Noche","#0A1A2F","#9CC9E6"],["Lumo","#2F7D6D","#D9F2E6"],["Morado","#5B3A8C","#D9CCF0"],["Plata","#5E6878","#E4E8EC"]]', 20),
  ('sepiera-arena', 'Sepiera Arena', 'sepia', 3, 0, '2 s/m', 9, '', '', '088/150', 'sepia', '#B08A55', '#EFE6D6', 'dots', '#0F3B45', '#0A1A2F',
   '[["Arena","#B08A55","#EFE6D6"],["Alga","#2F7D6D","#D8E6D2"],["Oliva","#717556","#E6E1C9"],["Naranja","#FF6B4A","#FFD1BF"]]', 30),
  ('fluor', 'Calamar Flúor', 'calamar', 5, 0, '3,5 s/m', 15, '', '', '054/150', 'calamar', '#FF6B4A', '#FFC21A', 'stripes', '#12345E', '#0A1A2F',
   '[["Flúor","#FF6B4A","#FFC21A"],["Limón","#E3A300","#FFF1B8"],["Rosa","#D9577A","#FFC21A"],["Verde","#7BB342","#F4F7C8"]]', 40),
  ('chipi-sardina', 'Chipi Sardina', 'chipiron', 0, 0, '4 s/m', 7, '', '', '061/150', 'chipiron', '#1D5FA8', '#C9D6E3', 'scales', '#9CC9E6', '#1D5FA8',
   '[["Sardina","#1D5FA8","#C9D6E3"],["Plata","#5E6878","#E4E8EC"],["Verde","#2F7D6D","#D8E6D2"],["Rosa","#D9577A","#FFD9E2"]]', 50),
  ('sepiera-tigre', 'Sepiera Tigre', 'sepia', 4, 2, '2 s/m', 3, 'Serie limitada', 'limited', '007/050', 'sepia', '#2F7D6D', '#FFC21A', 'stripes', '#1D5FA8', '#0A1A2F',
   '[["Tigre","#2F7D6D","#FFC21A"],["Fuego","#FF6B4A","#FFC21A"],["Noche","#0A1A2F","#4E6E91"],["Camarón","#C2662D","#F4D9B8"]]', 60),
  ('nacar', 'Calamar Nácar', 'calamar', 6, 0, '3,5 s/m', 2, 'Últimas', '', '143/150', 'calamar', '#D9577A', '#FFD9E2', 'none', '#FFC21A', '#E3A300',
   '[["Nácar","#D9577A","#FFD9E2"],["Perla","#9CA9B8","#F6F3EC"],["Malva","#8E5BA8","#EBDDF3"],["Coral","#FF6B4A","#FFD1BF"]]', 70),
  ('chipi-limon', 'Chipi Limón', 'chipiron', 2, 0, '4 s/m', 10, '', '', '029/150', 'chipiron', '#E3A300', '#FFF1B8', 'dots', '#12345E', '#0A1A2F',
   '[["Limón","#E3A300","#FFF1B8"],["Lima","#7BB342","#E8F3C9"],["Naranja","#FF6B4A","#FFE7A0"],["Blanco","#9CC9E6","#F6F3EC"]]', 80)
on conflict (id) do nothing;

-- Al final hay que dar permisos de administrador a tu usuario con esta línea
-- (cambia el correo por el tuyo; tu usuario debe existir ya en Authentication):
--   insert into public.admins (user_id) select id from auth.users where email = 'TU_CORREO' on conflict do nothing;
