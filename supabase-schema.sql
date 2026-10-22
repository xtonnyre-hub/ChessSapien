-- MindChess · ranking global. Ejecuta en Supabase → SQL Editor.
create table if not exists perfiles (
  id uuid primary key,
  nombre text not null check (char_length(nombre) between 1 and 24),
  elo int not null default 1200 check (elo between 0 and 4000),
  xp int not null default 0 check (xp >= 0),
  verificado boolean not null default false,
  actualizado timestamptz not null default now()
);
alter table perfiles enable row level security;
create policy "lectura publica" on perfiles for select using (true);
create policy "alta publica" on perfiles for insert with check (verificado = false);
create policy "edicion publica" on perfiles for update using (true) with check (true);
-- La insignia VERIFICADO ▲ solo se cambia desde el panel de Supabase (rol de servicio):
revoke insert, update on perfiles from anon, authenticated;
grant insert (id, nombre, elo, xp) on perfiles to anon, authenticated;
grant update (nombre, elo, xp) on perfiles to anon, authenticated;
-- Prototipo: cualquiera puede editar perfiles ajenos conociendo su id (uuid aleatorio).
-- Para producción, añade Supabase Auth y limita las políticas a auth.uid() = id.
