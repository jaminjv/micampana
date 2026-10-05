-- =============================================================================
-- Mi Campaña · Ajustes para conectar la app
--
-- Ejecutar después de 0001_esquema_inicial.sql.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Corrección: guardar la versión anterior al corregir una propuesta
-- ---------------------------------------------------------------------------

-- propuesta_versiones solo tiene permiso de lectura, así que el trigger debe
-- escribir con los permisos de su dueño. Nadie más puede escribir versiones.
alter function versionar_propuesta() security definer;

-- ---------------------------------------------------------------------------
-- Campos que usa la app
-- ---------------------------------------------------------------------------

-- Lecturas de cada propuesta (cuántas veces la vieron ciudadanos en un perfil).
alter table propuestas add column lecturas int not null default 0;
-- Fecha en que se marcó como retirada, visible junto a la explicación.
alter table propuestas add column retirada_el timestamptz;

-- Barrio o municipio de quien escribe, para que el equipo sepa de dónde llega
-- el aporte sin poder leer el perfil completo del ciudadano.
alter table aportes add column lugar text not null default '';

-- Número de seguidores, público en el perfil. Lo mantiene un trigger porque
-- la tabla seguidores solo la puede leer cada ciudadano para sí mismo.
alter table campanas add column seguidores int not null default 0;

-- ---------------------------------------------------------------------------
-- Permisos que faltaban
-- ---------------------------------------------------------------------------

-- Los borradores sí se pueden borrar (el trigger impide borrar lo publicado).
create policy "equipo borra borradores" on propuestas for delete using (
  es_equipo(campana_id) and estado = 'borrador'
);

-- El seguidor y el titular no pueden cambiar a mano el contador de seguidores
-- ni las lecturas: solo los triggers y funciones de abajo.
create function proteger_contadores_campana() returns trigger language plpgsql as $$
begin
  if new.seguidores is distinct from old.seguidores and current_setting('micampana.contador', true) is distinct from 'si' then
    new.seguidores := old.seguidores;
  end if;
  return new;
end $$;

create trigger campanas_contadores before update on campanas
  for each row execute function proteger_contadores_campana();

create function proteger_lecturas() returns trigger language plpgsql as $$
begin
  if new.lecturas is distinct from old.lecturas and current_setting('micampana.contador', true) is distinct from 'si' then
    new.lecturas := old.lecturas;
  end if;
  return new;
end $$;

create trigger propuestas_lecturas before update on propuestas
  for each row execute function proteger_lecturas();

-- ---------------------------------------------------------------------------
-- Contadores
-- ---------------------------------------------------------------------------

create function actualizar_seguidores() returns trigger language plpgsql security definer as $$
begin
  perform set_config('micampana.contador', 'si', true);
  if tg_op = 'INSERT' then
    update campanas set seguidores = seguidores + 1 where id = new.campana_id;
  else
    update campanas set seguidores = greatest(seguidores - 1, 0) where id = old.campana_id;
  end if;
  perform set_config('micampana.contador', 'no', true);
  return null;
end $$;

create trigger seguidores_contar after insert or delete on seguidores
  for each row execute function actualizar_seguidores();

-- Suma una lectura a las propuestas publicadas que un ciudadano vio.
create function contar_lecturas(ids uuid[]) returns void language plpgsql security definer as $$
begin
  if auth.uid() is null then
    return;
  end if;
  perform set_config('micampana.contador', 'si', true);
  update propuestas set lecturas = lecturas + 1 where id = any(ids) and estado = 'publicada';
  perform set_config('micampana.contador', 'no', true);
end $$;

revoke execute on function contar_lecturas(uuid[]) from public, anon;
grant execute on function contar_lecturas(uuid[]) to authenticated;
