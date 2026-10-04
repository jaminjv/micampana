# Contexto para Claude Code

Lee primero `AGENTS.md` (reglas de Expo) y `README.md` (estado del proyecto).

- Idioma de la interfaz y del código de dominio: español de Colombia.
- La especificación funcional está en el documento "Mi Campaña — Especificación" y el diseño de todas las pantallas en el lienzo "Mi Campaña — Pantallas". Las pantallas nuevas deben seguir ese diseño.
- Las reglas de visibilidad por territorio viven en `src/data/repo.ts`; los permisos reales, en las políticas RLS de `supabase/migrations`.
- Instalar paquetes siempre con `npx expo install`.
- Antes de terminar una tarea: `npx tsc --noEmit`.
