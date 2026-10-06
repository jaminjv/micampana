# Mi Campaña

**nexo**: app móvil (Android y iPhone) para gestionar campañas políticas en Colombia y conectar a los candidatos con los ciudadanos.
El nombre se cambia en `src/config.ts` y `app.json`. La identidad visual (colores, tipografía Outfit, esquinas y sombras) está en `src/theme.ts`; el logo y los íconos, en `assets/images` (`logo-nexo.png`, `icon.png`).

- **Especificación completa:** documento "Mi Campaña — Especificación" (Claude Docs).
- **Diseño de todas las pantallas:** lienzo "Mi Campaña — Pantallas" (Claude Design).

## Estado actual

| Parte | Estado |
| --- | --- |
| Bienvenida (ciudadano / aspirante o candidato / código de invitación) | Hecho |
| Registro de aspirante o candidato: etapa, cargo, territorio (municipios automáticos por departamento), aval (partido, coalición o firmas), lista y número (Asamblea y Concejo), @usuario | Hecho |
| Panel del aspirante o candidato, con herramientas bloqueadas según etapa y paso de aspirante a candidato | Hecho |
| Lado candidato: mis propuestas (borradores, advertencia de permanencia, correcciones con versión anterior visible, retirar con explicación, lecturas y barrios sin propuesta), publicar en el feed (evento, propuesta o mensaje por territorio), voces ciudadanas (filtrar y responder) | Hecho |
| Versión ciudadano: registro con autorización de datos, feed por región (cronológico y neutral), buscador con filtros (región, cargo, partido incluida coalición), perfil con "¿Qué propone para ti?" por barrio, comuna y ciudad, escribir aportes, mi actividad | Hecho |
| Esquema de base de datos Supabase con permisos por fila (RLS) | Hecho y probado en PostgreSQL |
| Conexión a Supabase: carga y guarda campañas, propuestas (con versiones y lecturas), feed, eventos, aportes, seguidores y "Asistiré" | Hecho y probado con PostgREST local |
| Ingreso por celular con código SMS (hoy cada teléfono entra con una cuenta anónima) | Pendiente |
| Subir el aval al pasar de aspirante a candidato (con Supabase, la base de datos lo exige) | Pendiente |
| Versiones de coordinador, líder comunal y marketing | Pendiente |
| Agenda, compromisos, sondeos, equipo y marketing (lado candidato) | Pendiente |
| Fotos y video en propuestas y piezas gráficas en eventos | Pendiente |

## Cómo correrla en tu celular

Necesitas [Node.js](https://nodejs.org) (versión 20 o más reciente) y la app **Expo Go** en tu celular.

```bash
npm install
npx expo start
```

Escanea el código QR que aparece en la terminal con la cámara (iPhone) o con Expo Go (Android). Teléfono y computador deben estar en la misma red wifi.

Para verla en el navegador: `npx expo start --web`.

Antes de dar algo por terminado: `npx tsc --noEmit` (revisión de tipos) y `npx expo lint`.

## Datos de prueba

Sin configurar Supabase, la app usa datos ficticios (`src/data/mock.ts`) de Caquetá y Florencia: cinco candidatos (alcaldía, gobernación en coalición, concejo con número, asamblea con número y una aspirante), propuestas, eventos y publicaciones. Para ver el feed con contenido, regístrate como ciudadano en **Caquetá → Florencia → Comuna 1 → El Prado**.

Para conocer las herramientas del candidato sin registrarte, toca **Ver una campaña de ejemplo** en la bienvenida: entras como Laura Gómez (Alcaldía de Florencia), con propuestas y aportes ciudadanos. Lo que publiques ahí lo ve el ciudadano de prueba en su feed y en el perfil de Laura.

Todo vive en memoria: al recargar la app se reinicia.

El React Compiler está apagado en `app.json` (`experiments.reactCompiler`) porque guardaría en memoria las consultas a las listas de datos, que la app modifica en el sitio (también con Supabase).

## Conectar Supabase

Sin las variables de `.env`, la app usa los datos de prueba. Con ellas, carga y guarda todo en tu proyecto de Supabase.

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor**, ejecuta en este orden, cada archivo completo: `supabase/migrations/0001_esquema_inicial.sql`, `supabase/migrations/0002_conexion_app.sql` y `supabase/seed.sql`.
3. En **Authentication → Sign In / Providers**, activa **Allow anonymous sign-ins**. Mientras no esté el ingreso por SMS, cada teléfono entra con una cuenta anónima que se conserva en el aparato (si se borran los datos de la app, se pierde).
4. En **Project Settings → API**, copia la **Project URL** y la clave pública (**anon** / **publishable**). Copia `.env.example` como `.env` y pon ahí esos dos valores. Nunca pongas la clave `service_role`: esa da acceso total y no debe ir en la app.
5. Detén la app (`Ctrl + C`) y vuelve a abrirla con `npx expo start`.

Cómo funciona: al abrir, `src/data/remoto.ts` inicia sesión y carga los datos en las listas en memoria que usan las pantallas; cada cambio se aplica en pantalla y se guarda en la base de datos en orden. Si algo no se guarda, aparece un aviso en rojo con el motivo. Los permisos los aplica la base de datos (RLS).

Antes de producción:
- Cargar la lista oficial de partidos con personería jurídica vigente del **CNE** en la tabla `partidos` (la del seed es de ejemplo).
- Cargar la **DIVIPOLA** completa del DANE (`departamentos`, `municipios`) con sus códigos oficiales.
- Validar con un abogado electoral la política de datos (Ley 1581 de 2012) y los límites de propaganda.

## Reglas que ya aplica la base de datos

- Las propuestas publicadas **no se pueden borrar**; cada edición guarda la versión anterior y solo se pueden marcar como retiradas.
- Publicar una propuesta exige que el candidato haya aceptado la advertencia de permanencia.
- Solo un administrador verifica campañas; pasar de aspirante a candidato exige soporte (aval o constancia).
- Un aspirante no puede publicar en el feed ni crear propuestas (no hace propaganda).
- Los colaboradores deben ser mayores de edad y tener autorización firmada y fotos; marketing nunca ve sus datos.
- Concejo y Alcaldía exigen municipio; Gobernación y Asamblea no; tipo de lista y número solo en corporaciones.

## Estructura

```
src/
  app/                 Pantallas (Expo Router; cada archivo es una ruta)
    index.tsx          Bienvenida
    registro/          Registro de aspirante o candidato, paso a paso
    ciudadano/         Registro del ciudadano
    (ciudadano)/       Pestañas: feed, aportar, buscar, actividad
    campana/           Panel y herramientas del candidato (propuestas, feed, voces); barra lateral en pantalla ancha
    candidato/         Perfil público del candidato
    escribir/          Escribir un aporte
  components/          Interfaz compartida (ui.tsx, cards.tsx, ListPicker.tsx)
  data/                Tipos, catálogos, datos de prueba y repo.ts (acceso a datos)
  state/               Estado de la sesión y orden de pasos del registro
  lib/                 Cliente de Supabase y fechas
  theme.ts             Identidad de nexo: colores, tipografía, esquinas y sombras
  config.ts            Nombre de la app y variables de Supabase
supabase/
  migrations/          Esquema SQL con permisos por fila
  seed.sql             Partidos y municipios de ejemplo
```

## Siguientes pasos sugeridos

1. Ingreso por celular con código SMS (requiere un proveedor de SMS en Supabase, p. ej. Twilio) y subir el aval al actualizar a candidato.
2. Lado candidato: agenda del día (pestaña Hoy), compromisos de visitas y "A compromiso" desde un aporte.
3. Versión coordinador: aprobaciones de colaboradores, agenda delegada del candidato, tareas por territorio.
4. Versión líder comunal: tareas, mi gente con fotos, material con calendario, modo sin conexión.
5. Versión marketing: material de eventos en tiempo real y envío a la red.
