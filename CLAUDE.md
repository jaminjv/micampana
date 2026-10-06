# Contexto para Claude Code

Lee primero `AGENTS.md` (reglas de Expo) y `README.md` (estado del proyecto).

- Idioma de la interfaz y del código de dominio: español de Colombia.
- La especificación funcional está en el documento "Mi Campaña — Especificación" y el diseño de todas las pantallas en el lienzo "Mi Campaña — Pantallas". Las pantallas nuevas siguen esa estructura, pero con la identidad de nexo (abajo); los colores del lienzo son anteriores a la marca.
- Identidad visual (nexo): usar solo los tokens de `src/theme.ts` (colores, `radius`, `shadow`, tipografía Outfit). Hay tema claro y oscuro: los estilos se crean con `estilos(() => ({ ... }))` (no `StyleSheet.create`) y los colores se leen al dibujar, nunca en constantes de módulo. Texto e inputs siempre con `Text` y `TextInput` de `@/components/Texto`, no los de react-native.
- Vistas del candidato: alto contraste, `Screen oscura` y `TopBar oscura` (Azul Noche); en pantalla ancha, barra lateral de `src/app/campana/_layout.tsx`. Vistas del ciudadano: fondo Gris Nube, tarjetas blancas, espacio generoso y acciones principales con `Button variant="accent"` (Naranja Coral).
- Las reglas de visibilidad por territorio viven en `src/data/repo.ts`; los permisos reales, en las políticas RLS de `supabase/migrations`.
- Instalar paquetes siempre con `npx expo install`.
- Antes de terminar una tarea: `npx tsc --noEmit`.
