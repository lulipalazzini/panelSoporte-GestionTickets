# Panel de Soporte — Gestión de Tickets

Aplicación de gestión de tickets de soporte técnico construida con Angular 17. Permite listar, filtrar, crear, editar y comentar tickets dentro de la misma sesión.

## Cómo correr el proyecto

```bash
npm install
npm start
```

La app queda disponible en `http://localhost:4200`.

> No hace falta configurar nada más. No hay backend ni base de datos real.

---

## Estructura del proyecto

```
src/app/
├── core/
│   ├── guards/          # pendingChangesGuard (CanDeactivate)
│   ├── interceptors/    # errorInterceptor (HTTP)
│   └── services/        # ThemeService
├── features/
│   └── tickets/
│       ├── data-access/ # TicketService (mock)
│       └── pages/       # Lista, detalle y formulario de tickets
└── shared/
    └── models/          # Interfaces: Ticket, Comment
```

---

## Lo que hace y cómo funciona

- **Listado** con filtros por estado, prioridad, categoría y responsable, buscador con debounce y ordenamiento.
- **Detalle** del ticket con cambio de estado, prioridad y sección de comentarios.
- **Formulario** de creación y edición con validación reactiva y guard para evitar perder cambios sin guardar.
- **Tema claro/oscuro** con toggle en la barra superior. La preferencia se guarda en `localStorage` y se respeta `prefers-color-scheme` del sistema operativo si es la primera visita.

---

## Datos de prueba

La app arranca con **50 tickets generados automáticamente** en memoria. Los datos no persisten entre sesiones: todo vive mientras la pestaña del navegador está abierta. Si recargás la página, los tickets vuelven a su estado inicial y los cambios que hayas hecho (crear, editar, comentar) se pierden.

Esto es una simplificación intencional para no necesitar un backend. En una app real existiría una API y los cambios se guardarían en base de datos.

---

## Decisiones y trade-offs

**Sin backend**
Todo el "servidor" es un array en memoria dentro de `TicketService`. Los métodos simulan latencia con `delay()` de RxJS para que la experiencia de carga sea realista.

**Paginación client-side**
El servicio filtra, ordena y pagina los 50 tickets directamente en memoria. Para un volumen mayor lo correcto sería delegar eso al servidor y paginar con parámetros en la URL de la API. Aquí no tenía sentido añadir esa complejidad.

**Estado en signals + RxJS, sin NgRx**
El estado de cada página se maneja con signals de Angular y streams de RxJS. Es suficiente para una app de esta escala y mucho más fácil de seguir que un store global.

**Filtros sincronizados con query params**
Cada cambio de filtro, ordenamiento o página actualiza la URL. Así, si copiás el link o recargás la página, los filtros quedan exactamente igual. También permite volver de la vista de detalle y recuperar el estado de la lista.

**Guard de cambios sin guardar**
Al salir del formulario con cambios sin guardar aparece un `confirm()` del navegador. Es la solución más simple posible; en producción se usaría un modal propio.

**Tema oscuro sin librerías**
El toggle agrega/quita la clase `dark-theme` en el `body`. El cambio de colores lo hacen las variables CSS definidas en `styles.scss`. No hay dependencia externa de ningún tipo.
