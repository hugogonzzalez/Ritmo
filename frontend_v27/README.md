# Ritmo — frontend de conciertos

Panel de administración en Angular standalone para gestionar conciertos. Consume la API Express del proyecto `mi_proyecto`.

## Instalación y arranque

Necesitas Node.js compatible con Angular 21 y npm. Abre una terminal en esta carpeta y ejecuta:

```bash
npm install
npx ng serve
```

Abre <http://localhost:4200> cuando termine de compilar. También puedes arrancar el servidor con `npm start`.

Arranca MongoDB y el backend antes de usar las funciones que guardan datos. La dirección de la API está en `src/environments/environment.ts`.

## Rutas

- `/`: redirige al listado de conciertos.
- `/concerts`: listado de conciertos activos e inactivos.
- `/concerts/create`: crear un concierto.
- `/concerts/:slug`: consultar el detalle de un concierto.
- `/concerts/:slug/edit`: editar un concierto, incluso si está inactivo.

El panel permite consultar, crear, editar y eliminar conciertos, cambiar `status` y activar/desactivar con `isActive`. Los conciertos con `deletedAt` informado no aparecen en el listado. La aplicación todavía no incluye autenticación.

## Estructura principal

```text
src/app/
├── core/
│   ├── interceptors/     # Peticiones, errores y carga HTTP
│   ├── models/           # Modelos de API y concierto
│   ├── services/         # API central y servicios de interfaz/API
│   └── stores/           # Estado de conciertos con Signals
├── features/             # Áreas de la aplicación
│   ├── concerts/      # Administración de conciertos
│   │   ├── components/
│   │   │   ├── concert-card/concert-card.ts
│   │   │   ├── concert-form/concert-form.ts
│   │   │   └── concert-grid/concert-grid.ts
│   │   ├── pages/
│   │   │   ├── concert-create/concert-create.ts
│   │   │   ├── concert-detail/concert-detail.ts
│   │   │   ├── concert-edit/concert-edit.ts
│   │   │   └── concert-list/concert-list.ts
│   │   └── concerts.routes.ts
│   ├── users/
│   ├── hosts/
│   ├── categories/
│   ├── locations/
│   └── departures/      # Estructura reservada, sin API disponible aún
├── layouts/              # Main layout del panel
├── shared/components/    # Navbar, loader, estados y skeleton
└── app.config.ts, app.css, app.html, app.routes.ts, app.spec.ts, app.ts
```

Los recursos públicos se sirven desde la carpeta `public/` en la raíz del proyecto, igual que en la estructura de referencia.

Las llamadas HTTP pasan por `core/services/api.service.ts`, que usa `Promise` y `async/await`, con tiempo límite configurable e interceptores para petición, errores y carga. El estado del panel se mantiene con Angular Signals. Los formularios de administración usan Reactive Forms y muestran validaciones junto a los campos.

## Funciones conectadas

El panel está limitado a los endpoints de conciertos existentes en el backend (`/api/concerts`). No incluye gestión de usuarios, anfitriones, categorías, ubicaciones o salidas porque esa API no está disponible en este proyecto.
