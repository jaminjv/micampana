-- =============================================================================
-- Mi Campaña · Esquema inicial (Supabase / PostgreSQL)
--
-- Principios:
--   * Los permisos se aplican en la base de datos (RLS), no solo en la app.
--   * Las propuestas publicadas no se pueden borrar; cada edición guarda versión.
--   * Los datos personales de ciudadanos y colaboradores solo los ve quien debe.
--   * Todo cambio sensible queda en auditoría.
-- =============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Catálogos (los administra la plataforma)
-- ---------------------------------------------------------------------------

-- Organizaciones políticas con personería jurídica vigente (registro del CNE).
create table partidos (
  id          text primary key,
  nombre      text not null,
  sigla       text,
  logo_url    text,
  vigente     boolean not null default true,
  actualizado timestamptz not null default now()
);

-- DIVIPOLA (DANE)
create table departamentos (
  codigo text primary key,           -- 2 dígitos
  nombre text not null
);

create table municipios (
  codigo       text primary key,     -- 5 dígitos
  nombre       text not null,
  departamento text not null references departamentos(codigo),
  capital      boolean not null default false
);
create index on municipios (departamento);

-- Comunas, corregimientos, barrios y veredas. Varían por municipio;
-- una campaña puede crear o ajustar las suyas (campana_id no nulo).
create type tipo_zona as enum ('comuna', 'corregimiento', 'barrio', 'vereda', 'sector', 'subregion');

create table zonas (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null,
  tipo       tipo_zona not null,
  municipio  text references municipios(codigo),
  padre      uuid references zonas(id),
  campana_id uuid,                    -- null = zona oficial compartida
  creado     timestamptz not null default now()
);
create index on zonas (municipio, tipo);

-- ---------------------------------------------------------------------------
-- Personas
-- ---------------------------------------------------------------------------

-- Perfil de cualquier usuario autenticado (Supabase Auth, ingreso por celular).
create table perfiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  nombre           text not null,
  cedula           text,                          -- visible solo para su dueño y verificadores
  departamento     text references departamentos(codigo),
  municipio        text references municipios(codigo),
  comuna           uuid references zonas(id),
  barrio           uuid references zonas(id),
  autorizo_datos   timestamptz,                   -- fecha de la autorización expresa
  es_admin         boolean not null default false,
  creado           timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Campañas (aspirantes y candidatos)
-- ---------------------------------------------------------------------------

create type etapa as enum ('aspirante', 'candidato');
create type cargo as enum ('gobernacion', 'asamblea', 'alcaldia', 'concejo');
create type tipo_aval as enum ('partido', 'coalicion', 'firmas');
create type tipo_lista as enum ('preferente', 'cerrada');
create type modo_uso as enum ('solo_mensajes', 'campana_completa');
create type estado_verificacion as enum ('sin_enviar', 'pendiente', 'verificado', 'rechazado');

create table campanas (
  id                  uuid primary key default gen_random_uuid(),
  titular             uuid not null references perfiles(id),
  usuario             text not null unique check (usuario ~ '^[a-z0-9_]{3,20}$'),
  nombre_publico      text not null,
  etapa               etapa not null default 'aspirante',
  cargo               cargo not null,
  departamento        text not null references departamentos(codigo),
  municipio           text references municipios(codigo),  -- null en Gobernación y Asamblea
  tipo_aval           tipo_aval,
  grupo_significativo text,
  tipo_lista          tipo_lista,
  numero              smallint check (numero between 1 and 999),
  modo                modo_uso not null default 'campana_completa',
  agrupar_subregiones boolean not null default false,
  verificacion        estado_verificacion not null default 'sin_enviar',
  soporte_url         text,            -- aval o constancia de inscripción (almacenamiento privado)
  cupo_por_lider      smallint not null default 15,
  creado              timestamptz not null default now(),
  -- Reglas de coherencia
  constraint municipio_segun_cargo check (
    (cargo in ('alcaldia', 'concejo') and municipio is not null) or
    (cargo in ('gobernacion', 'asamblea') and municipio is null)
  ),
  constraint aval_de_candidato check (etapa = 'aspirante' or tipo_aval is not null),
  constraint lista_solo_corporaciones check (
    cargo in ('asamblea', 'concejo') or (tipo_lista is null and numero is null)
  ),
  constraint firmas_con_nombre check (tipo_aval is distinct from 'firmas' or grupo_significativo is not null)
);

-- Partidos que avalan la campaña (uno, o varios si es coalición).
create table campana_partidos (
  campana_id uuid references campanas(id) on delete cascade,
  partido_id text references partidos(id),
  primary key (campana_id, partido_id)
);

-- ---------------------------------------------------------------------------
-- Equipo: coordinadores, líderes, marketing, y sus colaboradores
-- ---------------------------------------------------------------------------

create type rol_equipo as enum ('coordinador', 'lider', 'marketing');

create table membresias (
  id          uuid primary key default gen_random_uuid(),
  campana_id  uuid not null references campanas(id) on delete cascade,
  perfil_id   uuid not null references perfiles(id),
  rol         rol_equipo not null,
  superior    uuid references membresias(id),       -- coordinador del líder, etc.
  zona_id     uuid references zonas(id),
  municipio   text references municipios(codigo),   -- para coordinadores por municipio (Gobernación/Asamblea)
  delegado_agenda      boolean not null default false,  -- coordinador que maneja la agenda del candidato
  delegado_aprobaciones boolean not null default false, -- coordinador que autoriza equipos
  cupo        smallint,                              -- cupo propio del líder, si difiere del general
  vence       timestamptz,                           -- accesos temporales (marketing)
  activo      boolean not null default true,
  creado      timestamptz not null default now(),
  unique (campana_id, perfil_id, rol)
);

create table invitaciones (
  codigo     text primary key,
  campana_id uuid not null references campanas(id) on delete cascade,
  rol        rol_equipo not null,
  zona_id    uuid references zonas(id),
  municipio  text references municipios(codigo),
  superior   uuid references membresias(id),
  usada_por  uuid references perfiles(id),
  vence      timestamptz not null default now() + interval '14 days'
);

-- Colaboradores registrados por un líder (sin cuenta propia en el MVP).
create type estado_colaborador as enum ('por_verificar', 'activo', 'rechazado');

create table colaboradores (
  id               uuid primary key default gen_random_uuid(),
  campana_id       uuid not null references campanas(id) on delete cascade,
  lider            uuid not null references membresias(id),
  nombre           text not null,
  cedula           text not null,
  celular          text,
  fecha_nacimiento date not null check (fecha_nacimiento <= (current_date - interval '18 years')),
  barrio           uuid references zonas(id),
  ayuda_en         text[] not null default '{}',
  foto_rostro_url  text not null,     -- tomada con la cámara, almacenamiento privado
  foto_cedula_url  text not null,     -- visible solo para quien verifica
  autorizacion_firmada timestamptz not null,
  estado           estado_colaborador not null default 'por_verificar',
  aprobado_por     uuid references membresias(id),
  creado           timestamptz not null default now(),
  unique (campana_id, cedula)
);

-- ---------------------------------------------------------------------------
-- Contenido público: propuestas, eventos, publicaciones
-- ---------------------------------------------------------------------------

create type tema as enum ('Empleo', 'Vías', 'Salud', 'Seguridad', 'Educación', 'Medio ambiente', 'Otro');
create type nivel_alcance as enum ('departamento', 'municipio', 'comuna', 'barrio');

create table propuestas (
  id           uuid primary key default gen_random_uuid(),
  campana_id   uuid not null references campanas(id),
  titulo       text not null,
  resumen      text not null,
  tema         tema not null,
  nivel        nivel_alcance not null,
  alcance_ids  text[] not null,         -- códigos DIVIPOLA o ids de zona
  alcance_texto text not null,
  estado       text not null default 'borrador' check (estado in ('borrador', 'publicada', 'retirada')),
  redactada_por uuid references perfiles(id),
  publicada_el timestamptz,
  acepto_permanencia timestamptz,      -- el candidato marcó la advertencia antes de publicar
  retirada_motivo text,
  oculta_por_orden text,               -- solo admin, por orden judicial o electoral
  version      int not null default 1,
  creado       timestamptz not null default now()
);

-- Historial de versiones: cada edición de una propuesta publicada queda aquí.
create table propuesta_versiones (
  propuesta_id uuid references propuestas(id),
  version      int not null,
  titulo       text not null,
  resumen      text not null,
  guardada_el  timestamptz not null default now(),
  primary key (propuesta_id, version)
);

-- Una propuesta publicada no se puede borrar.
create function impedir_borrar_publicada() returns trigger language plpgsql as $$
begin
  if old.estado <> 'borrador' then
    raise exception 'Las propuestas publicadas no se pueden borrar. Puede marcarse como retirada.';
  end if;
  return old;
end $$;

create trigger propuestas_no_borrar before delete on propuestas
  for each row execute function impedir_borrar_publicada();

-- Al editar una propuesta publicada, se guarda la versión anterior y sube el número.
create function versionar_propuesta() returns trigger language plpgsql as $$
begin
  if old.estado = 'publicada' and (new.titulo <> old.titulo or new.resumen <> old.resumen) then
    insert into propuesta_versiones (propuesta_id, version, titulo, resumen)
      values (old.id, old.version, old.titulo, old.resumen);
    new.version := old.version + 1;
  end if;
  if old.estado = 'retirada' and new.estado <> 'retirada' then
    raise exception 'Una propuesta retirada no vuelve a publicarse; crea una nueva.';
  end if;
  if new.estado = 'publicada' and new.acepto_permanencia is null then
    raise exception 'Para publicar, el candidato debe aceptar que la propuesta es permanente.';
  end if;
  return new;
end $$;

create trigger propuestas_versionar before update on propuestas
  for each row execute function versionar_propuesta();

create table eventos (
  id          uuid primary key default gen_random_uuid(),
  campana_id  uuid not null references campanas(id) on delete cascade,
  titulo      text not null,
  fecha       timestamptz not null,
  lugar       text not null,
  publico     boolean not null default true,
  nivel       nivel_alcance not null,
  alcance_ids text[] not null,
  alcance_texto text not null,
  creado      timestamptz not null default now()
);

create type tipo_publicacion as enum ('evento', 'propuesta', 'mensaje');

create table publicaciones (
  id           uuid primary key default gen_random_uuid(),
  campana_id   uuid not null references campanas(id) on delete cascade,
  tipo         tipo_publicacion not null,
  texto        text,
  evento_id    uuid references eventos(id),
  propuesta_id uuid references propuestas(id),
  pieza_url    text,
  nivel        nivel_alcance not null,
  alcance_ids  text[] not null,
  publicada_el timestamptz not null default now(),
  reportes     int not null default 0,
  oculta       boolean not null default false
);
create index on publicaciones (publicada_el desc);

-- ---------------------------------------------------------------------------
-- Interacción ciudadana
-- ---------------------------------------------------------------------------

create type tipo_aporte as enum ('idea', 'consejo', 'critica', 'solicitud');
create type estado_aporte as enum ('enviado', 'en_revision', 'respondido');

create table aportes (
  id          uuid primary key default gen_random_uuid(),
  campana_id  uuid not null references campanas(id) on delete cascade,
  autor       uuid not null references perfiles(id),
  tipo        tipo_aporte not null,
  tema        tema not null,
  texto       text not null check (char_length(texto) between 15 and 1000),
  estado      estado_aporte not null default 'enviado',
  respuesta   text,
  respondido_por uuid references perfiles(id),
  creado      timestamptz not null default now()
);

create table seguidores (
  campana_id uuid references campanas(id) on delete cascade,
  perfil_id  uuid references perfiles(id) on delete cascade,
  creado     timestamptz not null default now(),
  primary key (campana_id, perfil_id)
);

create table asistencias (
  evento_id uuid references eventos(id) on delete cascade,
  perfil_id uuid references perfiles(id) on delete cascade,
  primary key (evento_id, perfil_id)
);

-- ---------------------------------------------------------------------------
-- Auditoría
-- ---------------------------------------------------------------------------

create table auditoria (
  id       bigint generated always as identity primary key,
  quien    uuid references perfiles(id),
  tabla    text not null,
  registro text not null,
  accion   text not null,
  cuando   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Funciones de apoyo para permisos
-- ---------------------------------------------------------------------------

create function es_titular(c uuid) returns boolean language sql stable security definer as $$
  select exists (select 1 from campanas where id = c and titular = auth.uid());
$$;

create function rol_en(c uuid) returns rol_equipo language sql stable security definer as $$
  select rol from membresias where campana_id = c and perfil_id = auth.uid() and activo
    and (vence is null or vence > now()) limit 1;
$$;

create function es_equipo(c uuid) returns boolean language sql stable security definer as $$
  select es_titular(c) or rol_en(c) is not null;
$$;

-- Solo un administrador puede marcar una campaña como verificada o rechazada.
create function proteger_verificacion() returns trigger language plpgsql security definer as $$
begin
  if new.verificacion is distinct from old.verificacion
     and new.verificacion in ('verificado', 'rechazado')
     and not exists (select 1 from perfiles where id = auth.uid() and es_admin) then
    raise exception 'Solo un administrador puede verificar campañas.';
  end if;
  -- Pasar de aspirante a candidato exige soporte y deja la verificación pendiente.
  if old.etapa = 'aspirante' and new.etapa = 'candidato' then
    if new.soporte_url is null then
      raise exception 'Para ser candidato debes subir el aval o la constancia de inscripción.';
    end if;
    new.verificacion := 'pendiente';
  end if;
  return new;
end $$;

create trigger campanas_verificacion before update on campanas
  for each row execute function proteger_verificacion();

-- ---------------------------------------------------------------------------
-- Seguridad por fila (RLS)
-- ---------------------------------------------------------------------------

alter table perfiles enable row level security;
alter table campanas enable row level security;
alter table campana_partidos enable row level security;
alter table membresias enable row level security;
alter table colaboradores enable row level security;
alter table propuestas enable row level security;
alter table propuesta_versiones enable row level security;
alter table eventos enable row level security;
alter table publicaciones enable row level security;
alter table aportes enable row level security;
alter table seguidores enable row level security;
alter table asistencias enable row level security;
alter table partidos enable row level security;
alter table departamentos enable row level security;
alter table municipios enable row level security;
alter table zonas enable row level security;

-- Catálogos: lectura pública.
create policy "catalogo legible" on partidos for select using (true);
create policy "catalogo legible" on departamentos for select using (true);
create policy "catalogo legible" on municipios for select using (true);
create policy "zonas legibles" on zonas for select using (true);
create policy "equipo crea zonas" on zonas for insert with check (campana_id is not null and es_titular(campana_id));

-- Perfiles: cada quien ve y edita el suyo.
create policy "mi perfil" on perfiles for select using (id = auth.uid());
create policy "crear mi perfil" on perfiles for insert with check (id = auth.uid());
create policy "editar mi perfil" on perfiles for update using (id = auth.uid());

-- Campañas: perfil público visible para todos; solo el titular las edita.
create policy "campanas publicas" on campanas for select using (true);
create policy "crear mi campana" on campanas for insert with check (titular = auth.uid());
create policy "editar mi campana" on campanas for update using (titular = auth.uid())
  -- La verificación solo la cambia un administrador.
  with check (titular = auth.uid());
create policy "aval publico" on campana_partidos for select using (true);
create policy "titular define aval" on campana_partidos for all using (es_titular(campana_id)) with check (es_titular(campana_id));

-- Equipo: cada miembro ve su campaña; el titular y los coordinadores gestionan.
create policy "equipo ve equipo" on membresias for select using (es_equipo(campana_id) or perfil_id = auth.uid());
create policy "titular gestiona equipo" on membresias for all using (es_titular(campana_id)) with check (es_titular(campana_id));

-- Colaboradores: los ve el líder que los registró, su cadena hacia arriba y el titular.
-- Nunca marketing.
create policy "ver colaboradores" on colaboradores for select using (
  es_titular(campana_id) or rol_en(campana_id) = 'coordinador'
  or lider in (select id from membresias where perfil_id = auth.uid())
);
create policy "lider registra colaboradores" on colaboradores for insert with check (
  lider in (select id from membresias where perfil_id = auth.uid() and rol = 'lider' and activo)
);
create policy "coordinador aprueba" on colaboradores for update using (
  es_titular(campana_id) or rol_en(campana_id) = 'coordinador'
);

-- Propuestas: públicas cuando están publicadas o retiradas y no ocultas por orden.
create policy "propuestas publicas" on propuestas for select using (
  (estado in ('publicada', 'retirada') and oculta_por_orden is null) or es_equipo(campana_id)
);
create policy "equipo redacta" on propuestas for insert with check (
  es_equipo(campana_id) and estado = 'borrador'
  and (select etapa from campanas where id = campana_id) = 'candidato'
);
-- Solo el titular publica o edita una publicada.
create policy "titular publica" on propuestas for update using (es_titular(campana_id) or (es_equipo(campana_id) and estado = 'borrador'));
create policy "historial publico" on propuesta_versiones for select using (true);

create policy "eventos publicos" on eventos for select using (publico or es_equipo(campana_id));
create policy "equipo gestiona eventos" on eventos for all using (es_equipo(campana_id)) with check (es_equipo(campana_id));

-- Publicaciones: solo campañas en etapa candidato (el aspirante no hace propaganda).
create policy "feed publico" on publicaciones for select using (not oculta);
create policy "candidato publica" on publicaciones for insert with check (
  (es_titular(campana_id) or rol_en(campana_id) = 'marketing')
  and (select etapa from campanas where id = campana_id) = 'candidato'
);

-- Aportes: el autor ve los suyos; el equipo (excepto marketing) ve los de su campaña.
create policy "autor ve sus aportes" on aportes for select using (
  autor = auth.uid() or es_titular(campana_id) or rol_en(campana_id) in ('coordinador', 'lider')
);
create policy "ciudadano escribe" on aportes for insert with check (
  autor = auth.uid() and exists (select 1 from perfiles where id = auth.uid() and autorizo_datos is not null)
);
create policy "equipo responde" on aportes for update using (es_titular(campana_id) or rol_en(campana_id) = 'coordinador');

create policy "seguir" on seguidores for all using (perfil_id = auth.uid()) with check (perfil_id = auth.uid());
create policy "asistir" on asistencias for all using (perfil_id = auth.uid()) with check (perfil_id = auth.uid());
