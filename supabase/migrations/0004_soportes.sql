-- =============================================================================
-- Mi Campaña · Almacenamiento privado del aval o la constancia de inscripción
--
-- Ejecutar después de 0003_agenda_compromisos.sql.
-- Cada usuario sube a su propia carpeta: soportes/<id del usuario>/<archivo>.
-- Nadie más lo ve, salvo los administradores que verifican campañas.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('soportes', 'soportes', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png', 'image/heic', 'image/webp'])
on conflict (id) do nothing;

create policy "subir mi soporte" on storage.objects for insert to authenticated with check (
  bucket_id = 'soportes' and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "ver mi soporte" on storage.objects for select to authenticated using (
  bucket_id = 'soportes' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (select 1 from public.perfiles where id = auth.uid() and es_admin)
  )
);

-- La ruta del soporte que guarda una campaña debe ser de la carpeta de su titular.
alter table campanas add constraint soporte_del_titular check (
  soporte_url is null or split_part(soporte_url, '/', 1) = titular::text
);
