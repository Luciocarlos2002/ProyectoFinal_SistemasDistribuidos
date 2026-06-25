# Rental POS — GUI 05 · Alquileres y Devoluciones

Frontend del módulo de Alquileres y Devoluciones del sistema distribuido Sakila (Grupo 5).

## Stack

- **Vite + React + TypeScript**
- **Tailwind CSS** + **shadcn/ui** (componentes base)
- **React Router v7** para routing SPA
- **lucide-react** para íconos
- **Sonner** para notificaciones toast
- Fuentes: **Inter** (base) + **JetBrains Mono** (datos numéricos)

## Cómo ejecutar

```bash
npm install
npm run dev
```

La app corre en `http://localhost:5173`.

## Mock layer

Todos los datos y llamadas a API están en `src/lib/api/`:

| Archivo | Contenido |
|---------|-----------|
| `src/lib/api/types.ts` | Tipos TypeScript (Staff, Customer, Rental, etc.) |
| `src/lib/api/mockData.ts` | Arrays de datos de prueba |
| `src/lib/api/index.ts` | Funciones mock (1 función = 1 endpoint real) |

Cada función mock espera ~700 ms para simular latencia de red y hacer visible los estados de carga (skeletons/spinners).

Para conectar el backend real: reemplaza las funciones en `src/lib/api/index.ts` con llamadas `fetch` al mismo endpoint — los nombres de función y tipos son 1:1 con la API real.

## Rutas

| Ruta | Pantalla |
|------|----------|
| `/` | POS: Nueva Renta y Devolución |
| `/consulta` | Consulta de préstamos con filtros |

La anulación (Screen 3) es un modal que se abre desde la tabla de Consulta al hacer clic en una fila ACTIVA.
