# Mi Campaña

App móvil (Android y iPhone) para gestionar campañas políticas en Colombia y conectar a los candidatos con los ciudadanos.
El nombre es provisional: se cambia en `src/config.ts` y `app.json`.

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
| Conexión real a Supabase (hoy usa datos de prueba) | Pendiente |
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

El React Compiler está apagado en `app.json` (`experiments.reactCompiler`) porque guardaría en memoria las consultas a los datos de prueba, que se modifican en el sitio. Al conectar Supabase se puede volver a encender.

## Conectar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En el editor SQL, ejecuta `supabase/migrations/0001_esquema_inicial.sql` y luego `supabase/seed.sql`.
3. Copia `.env.example` como `.env` y pon la URL y la clave pública (anon key) del proyecto.
4. Reemplaza las funciones de `src/data/repo.ts` por consultas con el cliente de `src/lib/supabase.ts`. Las pantallas no cambian.

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
    panel.tsx          Panel del aspirante o candidato
    ciudadano/         Registro del ciudadano
    (ciudadano)/       Pestañas: feed, aportar, buscar, actividad
    campana/           Herramientas del candidato: propuestas, publicar en el feed, voces ciudadanas
    candidato/         Perfil público del candidato
    escribir/          Escribir un aporte
  components/          Interfaz compartida (ui.tsx, cards.tsx, ListPicker.tsx)
  data/                Tipos, catálogos, datos de prueba y repo.ts (acceso a datos)
  state/               Estado de la sesión y orden de pasos del registro
  lib/                 Cliente de Supabase y fechas
  theme.ts             Colores y tipografía provisionales (cambiar aquí la identidad)
  config.ts            Nombre de la app y variables de Supabase
supabase/
  migrations/          Esquema SQL con permisos por fila
  seed.sql             Partidos y municipios de ejemplo
```

## Siguientes pasos sugeridos

1. Conectar Supabase con ingreso por celular (código SMS).
2. Lado candidato: agenda del día (pestaña Hoy), compromisos de visitas y "A compromiso" desde un aporte.
3. Versión coordinador: aprobaciones de colaboradores, agenda delegada del candidato, tareas por territorio.
4. Versión líder comunal: tareas, mi gente con fotos, material con calendario, modo sin conexión.
5. Versión marketing: material de eventos en tiempo real y envío a la red.
