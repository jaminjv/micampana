-- =============================================================================
-- nexo · Reacciones (a favor / en contra) y comentarios en las publicaciones
-- del feed.
--
-- Ejecutar después de 0005_equipo.sql.
-- Cada persona ve solo su propia reacción; el público ve los totales.
-- El nombre y el barrio de quien comenta los pone la base de datos, para que
-- nadie pueda comentar a nombre de otro.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Reacciones: una por persona y publicación (1 = a favor, -1 = en contra)
-- ---------------------------------------------------------------------------

alter table publicaciones add column a_favor int not null default 0;
alter table publicaciones add column en_contra int not null default 0;

create table reacciones (
  publicacion_id uuid not null references publicaciones(id) on delete cascade,
  perfil_id      uuid not null default auth.uid() references perfiles(id) on delete cascade,
  valor          smallint not null check (valor in (1, -1)),
  creada         timestamptz not null default now(),
  primary key (publicacion_id, perfil_id)
);

alter table reacciones enable row level security;

create policy "ver mis reacciones" on reacciones for select using (perfil_id = auth.uid());
create policy "reaccionar" on reacciones for insert with check (
  perfil_id = auth.uid() and exists (select 1 from publicaciones p where p.id = publicacion_id and not p.oculta)
);
create policy "cambiar mi reacción" on reacciones for update using (perfil_id = auth.uid()) with check (perfil_id = auth.uid());
create policy "quitar mi reacción" on reacciones for delete using (perfil_id = auth.uid());

-- Solo se puede cambiar el valor de la reacción.
revoke update on reacciones from authenticated, anon;
grant update (valor) on reacciones to authenticated;

-- Los totales los lleva un trigger (nadie puede editarlos: publicaciones no tiene permiso de actualizar).
create function contar_reacciones() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    update publicaciones set
      a_favor = greatest(a_favor - (old.valor = 1)::int, 0),
      en_contra = greatest(en_contra - (old.valor = -1)::int, 0)
    where id = old.publicacion_id;
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    update publicaciones set
      a_favor = a_favor + (new.valor = 1)::int,
      en_contra = en_contra + (new.valor = -1)::int
    where id = new.publicacion_id;
  end if;
  return null;
end;
$$;

create trigger reacciones_contar after insert or update or delete on reacciones
  for each row execute function contar_reacciones();

-- ---------------------------------------------------------------------------
-- Comentarios
-- ---------------------------------------------------------------------------

create table comentarios (
  id             uuid primary key default gen_random_uuid(),
  publicacion_id uuid not null references publicaciones(id) on delete cascade,
  perfil_id      uuid not null default auth.uid() references perfiles(id) on delete cascade,
  autor_nombre   text not null default '',
  lugar          text,
  de_campana     boolean not null default false,
  texto          text not null check (char_length(btrim(texto)) between 1 and 500),
  oculto         boolean not null default false,
  creado         timestamptz not null default now()
);
create index on comentarios (publicacion_id, creado);

-- Campaña dueña de una publicación.
create function campana_de_publicacion(p uuid) returns uuid language sql stable security definer set search_path = public as $$
  select campana_id from publicaciones where id = p;
$$;

-- Quien comenta: el candidato de la publicación (como campaña) o un ciudadano
-- registrado. Su nombre se muestra corto ("Rosa C.") y con su barrio o municipio.
create function firmar_comentario() returns trigger language plpgsql security definer set search_path = public as $$
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
    new.autor_nombre := (select nombre_publico from campanas where id = c);
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
  new.lugar := coalesce(
    (select 'Barrio ' || nombre from zonas where id = per.barrio),
    (select nombre from municipios where codigo = per.municipio)
  );
  return new;
end;
$$;

create trigger comentarios_firmar before insert on comentarios
  for each row execute function firmar_comentario();

alter table comentarios enable row level security;

-- Los ocultos solo los ven su autor y el candidato.
create policy "ver comentarios" on comentarios for select using (
  (not oculto and exists (select 1 from publicaciones p where p.id = publicacion_id and not p.oculta))
  or perfil_id = auth.uid()
  or es_titular(campana_de_publicacion(publicacion_id))
);
create policy "comentar" on comentarios for insert with check (
  perfil_id = auth.uid() and exists (select 1 from publicaciones p where p.id = publicacion_id and not p.oculta)
);
-- El candidato puede ocultar comentarios ofensivos de sus publicaciones (y
-- volver a mostrarlos). Su autor sigue viéndolo, con el aviso de que se ocultó.
create policy "ocultar comentarios" on comentarios for update
  using (es_titular(campana_de_publicacion(publicacion_id)))
  with check (es_titular(campana_de_publicacion(publicacion_id)));
create policy "borrar mi comentario" on comentarios for delete using (perfil_id = auth.uid());

revoke update on comentarios from authenticated, anon;
grant update (oculto) on comentarios to authenticated;
