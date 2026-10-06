-- =============================================================================
-- Mi Campaña · Equipo: invitaciones, coordinadores, líderes, colaboradores,
-- tareas con evidencia y visitas propuestas por líderes.
--
-- Ejecutar después de 0004_soportes.sql.
-- Cada nivel ve su trabajo y el de quienes tiene a cargo.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Territorio, nombre y funciones en membresías e invitaciones
-- ---------------------------------------------------------------------------

alter table membresias add column nombre text not null default '';
alter table membresias add column nivel nivel_alcance;
alter table membresias add column alcance_ids text[] not null default '{}';
alter table membresias add column alcance_texto text not null default '';

alter table invitaciones add column nivel nivel_alcance;
alter table invitaciones add column alcance_ids text[] not null default '{}';
alter table invitaciones add column alcance_texto text not null default '';
alter table invitaciones add column delegado_agenda boolean not null default false;
alter table invitaciones add column delegado_aprobaciones boolean not null default false;
alter table invitaciones add column creada_por uuid references perfiles(id);
alter table invitaciones add column creada timestamptz not null default now();

alter table colaboradores add column barrio_texto text not null default '';

-- ---------------------------------------------------------------------------
-- Funciones de apoyo
-- ---------------------------------------------------------------------------

-- Membresías activas de quien usa la app.
create function mis_membresias() returns setof uuid language sql stable security definer as $$
  select id from membresias where perfil_id = auth.uid() and activo and (vence is null or vence > now());
$$;

-- ¿Puede poner visitas en la agenda? El titular o un coordinador con la agenda delegada.
create function puede_agendar(c uuid) returns boolean language sql stable security definer as $$
  select es_titular(c) or exists (
    select 1 from membresias where campana_id = c and perfil_id = auth.uid() and activo
      and rol = 'coordinador' and delegado_agenda
  );
$$;

-- ¿Puede aprobar colaboradores? El titular o un coordinador con esa función delegada.
create function puede_aprobar(c uuid) returns boolean language sql stable security definer as $$
  select es_titular(c) or exists (
    select 1 from membresias where campana_id = c and perfil_id = auth.uid() and activo
      and rol = 'coordinador' and delegado_aprobaciones
  );
$$;

-- ¿Es coordinador de este líder (su superior)?
create function coordina_a(lider uuid) returns boolean language sql stable security definer as $$
  select exists (select 1 from membresias where id = lider and superior in (select mis_membresias()));
$$;

-- ---------------------------------------------------------------------------
-- Invitaciones
-- ---------------------------------------------------------------------------

-- Ven las invitaciones el titular y quien las creó como superior.
create policy "ver invitaciones" on invitaciones for select using (
  es_titular(campana_id) or superior in (select mis_membresias())
);

-- Crear una invitación. El titular invita coordinadores (máx. 3 si es aspirante)
-- y marketing; un coordinador invita líderes a su cargo. Solo el titular delega funciones.
create function crear_invitacion(
  p_codigo text, p_campana uuid, p_rol rol_equipo, p_nivel nivel_alcance, p_ids text[], p_texto text,
  p_superior uuid, p_agenda boolean, p_aprobaciones boolean
) returns text language plpgsql security definer as $$
declare
  titular boolean := es_titular(p_campana);
  etapa_campana etapa;
begin
  select etapa into etapa_campana from campanas where id = p_campana;
  if p_rol = 'lider' then
    if not (titular or (p_superior in (select mis_membresias())
            and exists (select 1 from membresias where id = p_superior and rol = 'coordinador' and campana_id = p_campana))) then
      raise exception 'Solo el candidato o un coordinador pueden invitar líderes.';
    end if;
    if etapa_campana = 'aspirante' then
      raise exception 'Como aspirante solo puedes tener coordinadores. Al ser candidato se habilitan los líderes.';
    end if;
  else
    if not titular then
      raise exception 'Solo el candidato puede invitar coordinadores y equipo de marketing.';
    end if;
    if p_rol = 'coordinador' and etapa_campana = 'aspirante' and (
      (select count(*) from membresias where campana_id = p_campana and rol = 'coordinador' and activo) +
      (select count(*) from invitaciones where campana_id = p_campana and rol = 'coordinador' and usada_por is null and vence > now())
    ) >= 3 then
      raise exception 'Como aspirante puedes tener hasta 3 coordinadores.';
    end if;
  end if;

  insert into invitaciones (codigo, campana_id, rol, superior, nivel, alcance_ids, alcance_texto,
                            delegado_agenda, delegado_aprobaciones, creada_por)
  values (upper(p_codigo), p_campana, p_rol, p_superior, p_nivel, coalesce(p_ids, '{}'), coalesce(p_texto, ''),
          titular and p_agenda, titular and p_aprobaciones, auth.uid());
  return upper(p_codigo);
end $$;

-- Lo que ve quien escribe un código antes de unirse (sin ser aún del equipo).
create function ver_invitacion(p_codigo text) returns table (
  codigo text, rol rol_equipo, nivel nivel_alcance, alcance_ids text[], alcance_texto text, campana_id uuid,
  candidato_nombre text, cargo_texto text, delegado_agenda boolean, delegado_aprobaciones boolean, superior_nombre text
) language sql stable security definer as $$
  select i.codigo, i.rol, i.nivel, i.alcance_ids, i.alcance_texto, c.id, c.nombre_publico,
         case c.cargo when 'alcaldia' then 'Alcaldía' when 'concejo' then 'Concejo'
                      when 'gobernacion' then 'Gobernación' else 'Asamblea' end
           || coalesce(' · ' || (select nombre from municipios where codigo = c.municipio),
                       ' · ' || (select nombre from departamentos where codigo = c.departamento), ''),
         i.delegado_agenda, i.delegado_aprobaciones, s.nombre
  from invitaciones i
  join campanas c on c.id = i.campana_id
  left join membresias s on s.id = i.superior
  where i.codigo = upper(trim(p_codigo)) and i.usada_por is null and i.vence > now() and auth.uid() is not null;
$$;

-- Unirse con el código: crea la membresía con el rol, el territorio y las funciones de la invitación.
create function usar_invitacion(p_codigo text, p_nombre text) returns uuid language plpgsql security definer as $$
declare
  inv invitaciones;
  nuevo uuid;
begin
  if auth.uid() is null then raise exception 'Inicia sesión para unirte.'; end if;
  if char_length(trim(coalesce(p_nombre, ''))) < 3 then raise exception 'Escribe tu nombre.'; end if;

  select * into inv from invitaciones
    where codigo = upper(trim(p_codigo)) and usada_por is null and vence > now() for update;
  if not found then raise exception 'El código no existe, ya se usó o venció.'; end if;

  if exists (select 1 from membresias where campana_id = inv.campana_id and perfil_id = auth.uid() and activo) then
    raise exception 'Ya eres parte del equipo de esta campaña.';
  end if;

  insert into perfiles (id, nombre) values (auth.uid(), trim(p_nombre)) on conflict (id) do nothing;

  insert into membresias (campana_id, perfil_id, rol, superior, nombre, nivel, alcance_ids, alcance_texto,
                          delegado_agenda, delegado_aprobaciones)
  values (inv.campana_id, auth.uid(), inv.rol, inv.superior, trim(p_nombre), inv.nivel, inv.alcance_ids, inv.alcance_texto,
          inv.delegado_agenda, inv.delegado_aprobaciones)
  on conflict (campana_id, perfil_id, rol) do update
    set activo = true, superior = excluded.superior, nombre = excluded.nombre, nivel = excluded.nivel,
        alcance_ids = excluded.alcance_ids, alcance_texto = excluded.alcance_texto,
        delegado_agenda = excluded.delegado_agenda, delegado_aprobaciones = excluded.delegado_aprobaciones
  returning id into nuevo;

  update invitaciones set usada_por = auth.uid() where codigo = inv.codigo;
  return nuevo;
end $$;

revoke execute on function crear_invitacion(text, uuid, rol_equipo, nivel_alcance, text[], text, uuid, boolean, boolean) from public, anon;
revoke execute on function ver_invitacion(text) from public, anon;
revoke execute on function usar_invitacion(text, text) from public, anon;
grant execute on function crear_invitacion(text, uuid, rol_equipo, nivel_alcance, text[], text, uuid, boolean, boolean) to authenticated;
grant execute on function ver_invitacion(text) to authenticated;
grant execute on function usar_invitacion(text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Colaboradores: cupo y aprobación por función delegada
-- ---------------------------------------------------------------------------

create function revisar_cupo() returns trigger language plpgsql security definer as $$
declare
  usados int;
  tope int;
begin
  select count(*) into usados from colaboradores where lider = new.lider and estado <> 'rechazado';
  select coalesce(m.cupo, c.cupo_por_lider) into tope
    from membresias m join campanas c on c.id = m.campana_id where m.id = new.lider;
  if usados >= tope then
    raise exception 'El cupo de colaboradores de este líder está lleno (% de %).', usados, tope;
  end if;
  return new;
end $$;

create trigger colaboradores_cupo before insert on colaboradores
  for each row execute function revisar_cupo();

-- Solo el titular o un coordinador con la función delegada aprueban o rechazan.
drop policy "coordinador aprueba" on colaboradores;
create policy "aprobar colaboradores" on colaboradores for update using (puede_aprobar(campana_id)) with check (puede_aprobar(campana_id));

-- ---------------------------------------------------------------------------
-- Agenda: solo el titular o un coordinador con la agenda delegada la modifican
-- ---------------------------------------------------------------------------

drop policy "equipo crea actividades" on actividades;
drop policy "equipo edita actividades" on actividades;
create policy "agendar actividades" on actividades for insert with check (
  puede_agendar(campana_id) and (select etapa from campanas where id = campana_id) = 'candidato'
);
create policy "editar agenda" on actividades for update using (puede_agendar(campana_id)) with check (puede_agendar(campana_id));

-- ---------------------------------------------------------------------------
-- Tareas con evidencia
-- ---------------------------------------------------------------------------

create table tareas (
  id                    uuid primary key default gen_random_uuid(),
  campana_id            uuid not null references campanas(id) on delete cascade,
  grupo                 uuid not null,
  titulo                text not null check (char_length(titulo) between 3 and 200),
  asignada_a            uuid not null references membresias(id) on delete cascade,
  asignada_por          uuid references membresias(id) on delete set null, -- null: la asignó el candidato
  fecha_limite          timestamptz,
  evidencia             boolean not null default false,
  estado                text not null default 'pendiente' check (estado in ('pendiente', 'reportada')),
  reporte_notas         text,
  reporte_cantidad      int check (reporte_cantidad >= 0),
  reporte_participantes uuid[] not null default '{}',
  reporte_fotos         text[] not null default '{}',
  reportada_el          timestamptz,
  creada                timestamptz not null default now(),
  constraint evidencia_con_foto check (estado = 'pendiente' or not evidencia or cardinality(reporte_fotos) > 0)
);
create index on tareas (asignada_a, estado);

alter table tareas enable row level security;

-- Ven una tarea: el titular, a quien se la asignaron y quien la asignó.
create policy "ver tareas" on tareas for select using (
  es_titular(campana_id) or asignada_a in (select mis_membresias()) or asignada_por in (select mis_membresias())
);
-- Asignan: el titular (a cualquiera de su equipo) o un coordinador (a sus líderes).
create policy "asignar tareas" on tareas for insert with check (
  (asignada_por is null and es_titular(campana_id)
     and exists (select 1 from membresias where id = asignada_a and campana_id = tareas.campana_id))
  or (asignada_por in (select mis_membresias()) and coordina_a(asignada_a))
);
-- Reporta quien la tiene; quien la asignó también puede corregirla.
create policy "reportar tareas" on tareas for update using (
  asignada_a in (select mis_membresias()) or asignada_por in (select mis_membresias()) or es_titular(campana_id)
);

-- ---------------------------------------------------------------------------
-- Visitas propuestas por líderes
-- ---------------------------------------------------------------------------

create table solicitudes_visita (
  id                   uuid primary key default gen_random_uuid(),
  campana_id           uuid not null references campanas(id) on delete cascade,
  propuesta_por        uuid not null references membresias(id) on delete cascade,
  lugar                text not null,
  fecha                timestamptz not null,
  nivel                nivel_alcance not null,
  alcance_ids          text[] not null,
  alcance_texto        text not null,
  asistentes_esperados int check (asistentes_esperados >= 0),
  temas                text[] not null default '{}',
  estado               text not null default 'pendiente' check (estado in ('pendiente', 'aprobada', 'rechazada')),
  actividad_id         uuid references actividades(id) on delete set null,
  motivo               text,
  creada               timestamptz not null default now()
);

alter table solicitudes_visita enable row level security;

create policy "ver visitas propuestas" on solicitudes_visita for select using (
  es_titular(campana_id) or propuesta_por in (select mis_membresias()) or coordina_a(propuesta_por)
);
create policy "proponer visitas" on solicitudes_visita for insert with check (
  propuesta_por in (select mis_membresias()) and estado = 'pendiente'
);
create policy "decidir visitas" on solicitudes_visita for update using (puede_agendar(campana_id)) with check (puede_agendar(campana_id));

-- ---------------------------------------------------------------------------
-- Fotos privadas del equipo: equipo/<id de la campaña>/...
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('equipo', 'equipo', false, 8388608, array['image/jpeg', 'image/png', 'image/heic', 'image/webp'])
on conflict (id) do nothing;

-- La primera carpeta de la ruta es el id de la campaña (si no es un id válido, no hay acceso).
create function campana_de_ruta(ruta text) returns uuid language sql immutable as $$
  select case when split_part(ruta, '/', 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
              then split_part(ruta, '/', 1)::uuid end;
$$;

-- Suben fotos los miembros activos y el titular de la campaña.
create policy "equipo sube fotos" on storage.objects for insert to authenticated with check (
  bucket_id = 'equipo' and public.es_equipo(public.campana_de_ruta(name))
);
-- Ven las fotos el titular, los coordinadores y quien las subió. Nunca marketing.
create policy "ver fotos del equipo" on storage.objects for select to authenticated using (
  bucket_id = 'equipo' and (
    public.es_titular(public.campana_de_ruta(name))
    or public.rol_en(public.campana_de_ruta(name)) = 'coordinador'
    or owner_id = auth.uid()::text
  )
);
