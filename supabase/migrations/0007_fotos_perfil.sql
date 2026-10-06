-- =============================================================================
-- nexo · Fotos de perfil: ciudadanos, candidatos y equipo.
--
-- Ejecutar después de 0006_reacciones_comentarios.sql.
-- Las fotos de perfil son públicas (se ven en el feed y en los comentarios),
-- pero cada quien solo puede subir, cambiar o borrar las suyas.
-- Ruta: avatares/<id del usuario>/<archivo>.
-- =============================================================================

alter table perfiles add column foto text;
alter table campanas add column foto text;
alter table membresias add column foto text;
alter table comentarios add column autor_foto text;

-- Nadie puede ponerse como foto la de otra persona.
alter table perfiles add constraint foto_propia check (foto is null or split_part(foto, '/', 1) = id::text);
alter table campanas add constraint foto_del_titular check (foto is null or split_part(foto, '/', 1) = titular::text);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatares', 'avatares', true, 3145728, array['image/jpeg', 'image/png', 'image/heic', 'image/webp'])
on conflict (id) do nothing;

create policy "subir mi foto" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatares' and split_part(name, '/', 1) = auth.uid()::text);
create policy "cambiar mi foto" on storage.objects for update to authenticated
  using (bucket_id = 'avatares' and split_part(name, '/', 1) = auth.uid()::text);
create policy "borrar mi foto" on storage.objects for delete to authenticated
  using (bucket_id = 'avatares' and split_part(name, '/', 1) = auth.uid()::text);

-- Foto de la persona: queda en su perfil, en sus membresías y en sus comentarios.
create function poner_foto(p_ruta text) returns void language plpgsql security definer set search_path = public as $$
begin
  if p_ruta is not null and split_part(p_ruta, '/', 1) <> auth.uid()::text then
    raise exception 'Esa foto no es tuya.';
  end if;
  update perfiles set foto = p_ruta where id = auth.uid();
  update membresias set foto = p_ruta where perfil_id = auth.uid();
  update comentarios set autor_foto = p_ruta where perfil_id = auth.uid() and not de_campana;
end;
$$;

-- Foto pública de la campaña (la del candidato en el feed). Solo el titular.
create function poner_foto_campana(p_campana uuid, p_ruta text) returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from campanas where id = p_campana and titular = auth.uid()) then
    raise exception 'Solo el candidato puede cambiar la foto de su campaña.';
  end if;
  if p_ruta is not null and split_part(p_ruta, '/', 1) <> auth.uid()::text then
    raise exception 'Esa foto no es tuya.';
  end if;
  update campanas set foto = p_ruta where id = p_campana;
  update comentarios set autor_foto = p_ruta
    where de_campana and campana_de_publicacion(publicacion_id) = p_campana;
end;
$$;

revoke execute on function poner_foto(text) from public, anon;
revoke execute on function poner_foto_campana(uuid, text) from public, anon;
grant execute on function poner_foto(text) to authenticated;
grant execute on function poner_foto_campana(uuid, text) to authenticated;

-- Los comentarios nuevos llevan la foto de quien comenta.
create or replace function firmar_comentario() returns trigger language plpgsql security definer set search_path = public as $$
declare
  c   uuid := campana_de_publicacion(new.publicacion_id);
  per perfiles%rowtype;
  partes text[];
begin
  new.perfil_id := auth.uid();
  new.oculto := false;
  new.creado := now();
  if exists (select 1 from campanas where id = c and titular = auth.uid()) then
    new.de_campana := true;
    select nombre_publico, foto into new.autor_nombre, new.autor_foto from campanas where id = c;
    new.lugar := null;
    return new;
  end if;
  select * into per from perfiles where id = auth.uid();
  if per.id is null or per.autorizo_datos is null then
    raise exception 'Regístrate como ciudadano para comentar.';
  end if;
  partes := regexp_split_to_array(btrim(per.nombre), '\s+');
  new.de_campana := false;
  new.autor_nombre := partes[1] || case when array_length(partes, 1) > 1 then ' ' || left(partes[2], 1) || '.' else '' end;
  new.autor_foto := per.foto;
  new.lugar := coalesce(
    (select 'Barrio ' || nombre from zonas where id = per.barrio),
    (select nombre from municipios where codigo = per.municipio)
  );
  return new;
end;
$$;
