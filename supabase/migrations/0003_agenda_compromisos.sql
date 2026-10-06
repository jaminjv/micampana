-- =============================================================================
-- Mi Campaña · Agenda y compromisos
--
-- Ejecutar después de 0002_conexion_app.sql.
-- La agenda es interna de la campaña: solo la ve su equipo. Lo que se quiera
-- anunciar a los ciudadanos se publica aparte como evento público.
-- =============================================================================

create type tipo_actividad as enum ('visita', 'evento', 'reunion', 'debate', 'caravana', 'medios', 'otro');
create type estado_actividad as enum ('programada', 'realizada', 'cancelada');

create table actividades (
  id                   uuid primary key default gen_random_uuid(),
  campana_id           uuid not null references campanas(id) on delete cascade,
  tipo                 tipo_actividad not null,
  titulo               text not null,
  fecha                timestamptz not null,
  lugar                text not null,
  nivel                nivel_alcance not null,
  alcance_ids          text[] not null,
  alcance_texto        text not null,
  responsable          text,
  estado               estado_actividad not null default 'programada',
  asistentes_esperados int check (asistentes_esperados >= 0),
  asistentes_reales    int check (asistentes_reales >= 0),
  notas                text,
  evento_id            uuid references eventos(id) on delete set null,
  creado_por           uuid references perfiles(id),
  creado               timestamptz not null default now()
);
create index on actividades (campana_id, fecha);

-- Compromisos programáticos con comunidades (nunca beneficios individuales por votos).
create type estado_compromiso as enum ('registrado', 'en_estudio', 'incluido', 'descartado');

create table compromisos (
  id            uuid primary key default gen_random_uuid(),
  campana_id    uuid not null references campanas(id) on delete cascade,
  que           text not null check (char_length(que) between 5 and 600),
  con_quien     text not null,
  nivel         nivel_alcance not null,
  alcance_ids   text[] not null,
  alcance_texto text not null,
  estado        estado_compromiso not null default 'registrado',
  actividad_id  uuid references actividades(id) on delete set null,
  aporte_id     uuid references aportes(id) on delete set null,
  propuesta_id  uuid references propuestas(id) on delete set null,
  registrado_por uuid references perfiles(id),
  creado        timestamptz not null default now()
);
create index on compromisos (campana_id, estado);

alter table actividades enable row level security;
alter table compromisos enable row level security;

-- Agenda: la ve y la gestiona el equipo de la campaña (titular y miembros activos).
create policy "equipo ve agenda" on actividades for select using (es_equipo(campana_id));
create policy "equipo crea actividades" on actividades for insert with check (
  es_equipo(campana_id) and (select etapa from campanas where id = campana_id) = 'candidato'
);
create policy "equipo edita actividades" on actividades for update using (es_equipo(campana_id)) with check (es_equipo(campana_id));
create policy "titular borra actividades" on actividades for delete using (es_titular(campana_id));

-- Compromisos: el equipo los ve y registra; no se borran (se marcan como descartados).
create policy "equipo ve compromisos" on compromisos for select using (es_equipo(campana_id));
create policy "equipo registra compromisos" on compromisos for insert with check (
  es_equipo(campana_id) and (select etapa from campanas where id = campana_id) = 'candidato'
);
create policy "equipo actualiza compromisos" on compromisos for update using (es_equipo(campana_id)) with check (es_equipo(campana_id));
