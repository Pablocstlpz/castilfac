# ✅ Solución a la Auditoría — Bloques 1 y 2

> **Fecha**: 2026-05-15
> **Bloques aplicados**: 🔴 Bloque 1 — *Detener la hemorragia* y 🟠 Bloque 2 — *Tenant isolation* (auditoria.md §5)
> **Estado**: Implementado. La API ya exige JWT en todas las rutas operativas; los hashes y tokens internos dejan de viajar al cliente; el registro ya no permite auto-activarse la suscripción; **un usuario solo puede leer/modificar recursos de su propia empresa**.

Este archivo documenta uno a uno los cambios aplicados, qué hace cada uno y por qué.

---

## 0. Resumen ejecutivo

Antes:
- `GET /api/usuarios` y similares devolvían la BD entera con hash `bcrypt` y `reset_token`.
- Cualquier persona sin autenticación podía leer / modificar / borrar datos de cualquier empresa.
- El registro permitía marcarse `suscripcion_activa: true` desde el navegador.

Después:
- Login (tradicional y Google) firma un **JWT** y devuelve `{ accessToken, usuario }`.
- Todos los modelos sensibles (`Usuario`, `Empresa`) tienen un `toJSON()` que filtra `password`, `reset_token`, `reset_token_expira` y `token_verificacion`.
- Todas las rutas operativas exigen `autenticarToken` + `checkSuscripcion`.
- El alta de empresa ignora `suscripcion_activa`, `activo`, `email_verificado`, `token_verificacion` y `fecha_vencimiento` del body (los gestiona el servidor o Stripe).
- `POST /usuarios` se cierra a admins; el flujo público de registro usa un endpoint nuevo, `POST /usuarios/registro-inicial`, con tres invariantes (empresa existe, no verificada, sin usuarios).
- El frontend tiene ahora un **interceptor** que inyecta `Authorization: Bearer <token>` y captura 401/403.

---

## 1. Backend

### 1.1 [`backend/src/config.js`](backend/src/config.js)
**Qué**: exporta `REFRESH_SECRET_KEY`.
**Por qué**: `auth.middleware.js` ya lo importaba, pero `config.js` no lo exportaba → `verificarRefreshToken` usaba `undefined`. Ahora cae al `SECRET_KEY` si no hay variable propia, así no rompe entornos antiguos.

### 1.2 [`backend/src/middlewares/auth.middleware.js`](backend/src/middlewares/auth.middleware.js)
**Qué**:
- Usa el `SECRET_KEY` importado (antes leía `process.env.SECRET_KEY` directamente).
- Elimina el `console.log(usuario)` que filtraba payloads JWT a los logs.
- Endurece el parsing de `Authorization`: valida que llegue como `Bearer <token>` antes de verificar.
- Devuelve **401** (en vez de 403) cuando no hay token o está caduco — semánticamente correcto y permite al interceptor distinguir "sesión perdida" de "rol incorrecto".
- `autorizarRol(...)` ahora acepta tanto string como array (`autorizarRol('admin')` y `autorizarRol(['admin','superadmin'])`), y comprueba `req.user.rol` (antes leía `req.user.role`, campo que ni siquiera existe).
- Sube `ACCESS_TOKEN_EXPIRY` de `15m` a `8h` porque todavía no hay flujo de refresh: si lo dejábamos en 15 min, cada admin tendría que volver a logarse durante la jornada.

### 1.3 [`backend/src/middlewares/checkSuscripcion.middleware.js`](backend/src/middlewares/checkSuscripcion.middleware.js)
**Qué**: cambia el comportamiento *fail-open* a *fail-closed*.
- Antes: si la consulta a la BD fallaba, llamaba a `next()` y dejaba pasar la petición.
- Ahora: cualquier excepción devuelve `500` y bloquea.
- Además, prioriza `empresa_id` del JWT (`req.user.empresa_id`) sobre el de la URL, para evitar que un usuario consulte recursos de otra empresa pasando un `empresa_id` distinto en la URL.

### 1.4 [`backend/src/models/usuario.model.js`](backend/src/models/usuario.model.js) y [`backend/src/models/empresa.model.js`](backend/src/models/empresa.model.js)
**Qué**: se añade un `Modelo.prototype.toJSON` que elimina los campos sensibles antes de serializar.
- `Usuario.toJSON` filtra `password`, `reset_token`, `reset_token_expira`.
- `Empresa.toJSON` filtra `token_verificacion`.

**Por qué**: cualquier `res.json(usuario)` o `JSON.stringify(empresa)` pasa ahora por este filtro automáticamente, sin tocar cada controlador. La propiedad sigue accesible en memoria (`usuario.password`) para que `bcrypt.compare` funcione en el login.

### 1.5 [`backend/src/controllers/usuarios.controller.js`](backend/src/controllers/usuarios.controller.js)
**Cambios funcionales**:
- `getUsuarioCorreoContraseña` (login):
  - Genera un **JWT** con `{ id, rol, empresa_id }`.
  - Devuelve `{ accessToken, usuario }` (antes devolvía sólo `usuario`, hash incluido).
- **Nuevo controlador** `crearAdminInicial` (endpoint público `POST /usuarios/registro-inicial`):
  - Comprueba que la empresa exista, **no esté verificada** y **no tenga aún usuarios**.
  - Fuerza `rol = 'admin'` aunque el cliente mande otro valor.
  - Sirve para que el registro funcione **sin abrir POST `/usuarios`** al mundo.

### 1.6 [`backend/src/controllers/auth.controller.js`](backend/src/controllers/auth.controller.js) (login Google)
**Qué**: mismo cambio que el login tradicional — genera JWT y devuelve `{ accessToken, usuario }`. Limpia el `console.log(error)` por un `console.error('[loginGoogle] error:', error)`.

### 1.7 [`backend/src/controllers/empresas.controller.js`](backend/src/controllers/empresas.controller.js)
**Whitelist en `createEmpresa`**:
- Sólo lee del body `nombre_comercial`, `razon_social`, `nif`, `email`, `telefono`, `direccion`, `codigo_postal`, `ciudad`, `provincia`, `logo_url`.
- Los campos críticos los pone el servidor:
  - `suscripcion_activa = false`
  - `activo = true`
  - `email_verificado = false`
  - `token_verificacion = randomUUID()`
  - `fecha_vencimiento = hoy + 14 días`
- Resuelve **CRIT-03** (privilege escalation): ya no se puede registrar una empresa con suscripción premium activa.

**Whitelist en `updateEmpresa`**:
- Ignora `suscripcion_activa`, `fecha_vencimiento`, `activo`, `email_verificado`, `token_verificacion` aunque vengan en el body.
- Sólo Stripe / flujo de verificación / superadmin pueden tocar esos campos.

### 1.8 Rutas protegidas
Aplicación de `autenticarToken` y `autorizarRol(...)` (y `checkSuscripcion` donde toca):

| Router | Rutas públicas | Rutas que pasan a exigir JWT |
|---|---|---|
| [`usuarios.route.js`](backend/src/routes/usuarios.route.js) | `POST /usuarios/login`, `POST /usuarios/registro-inicial`, `POST /usuarios/recuperar-password`, `POST /usuarios/restablecer-password` | resto. Listados/CRUD: `admin`/`superadmin`. `DELETE /usuarios/correo/:correo`: `superadmin`. |
| [`empresas.route.js`](backend/src/routes/empresas.route.js) | `POST /empresas`, `GET /empresas/verificar/:token`, `POST /empresas/reenviar-verificacion`, `GET /empresas/nif/:nif` | resto. `GET /empresas` y `DELETE *`: `superadmin`. |
| [`auth.route.js`](backend/src/routes/auth.route.js) | `POST /auth/google` | — |
| [`clientes.route.js`](backend/src/routes/clientes.route.js) | — | todo: JWT + `checkSuscripcion` |
| [`pedidos.route.js`](backend/src/routes/pedidos.route.js) | — | todo: JWT + `checkSuscripcion`. `GET /pedidos` (listado global): `superadmin`. |
| [`presupuestos.route.js`](backend/src/routes/presupuestos.route.js) | — | todo: JWT + `checkSuscripcion` |
| [`materiales.route.js`](backend/src/routes/materiales.route.js) | — | todo: JWT + `checkSuscripcion` |
| [`preciosEmpresa.route.js`](backend/src/routes/preciosEmpresa.route.js) | — | todo: JWT + `checkSuscripcion` |
| [`plantillasMateriales.route.js`](backend/src/routes/plantillasMateriales.route.js) | — | todo: JWT + `checkSuscripcion` |
| [`plantillasProductos.routes.js`](backend/src/routes/plantillasProductos.routes.js) | — | todo: JWT + `checkSuscripcion` |
| [`historialPreciosEmpresa.route.js`](backend/src/routes/historialPreciosEmpresa.route.js) | — | todo: JWT + `checkSuscripcion` |
| [`historialPreciosBase.route.js`](backend/src/routes/historialPreciosBase.route.js) | — | JWT (es catálogo común, no requiere suscripción) |
| [`elementos.route.js`](backend/src/routes/elementos.route.js) | — | JWT |
| [`elementosMateriales.route.js`](backend/src/routes/elementosMateriales.route.js) | — | JWT |
| [`categorias.route.js`](backend/src/routes/categorias.route.js) | — | JWT |
| [`suscripcion.route.js`](backend/src/routes/suscripcion.route.js) | — | JWT (sin `checkSuscripcion`: este endpoint sirve precisamente para consultar la suscripción) |
| [`stripe.route.js`](backend/src/routes/stripe.route.js) | `POST /stripe/webhook` | `/stripe/crear-sesion` y `/stripe/verificar-sesion`: JWT (sin `checkSuscripcion`, porque el usuario llega aquí justo cuando no tiene suscripción). |

Esto resuelve **CRIT-01** (la API ya no es pública) y **CRIT-06** (`checkSuscripcion` está conectado).

---

## 2. Frontend

### 2.1 [`frontend/src/app/services/authentication.ts`](frontend/src/app/services/authentication.ts)
**Qué**:
- Guarda usuario y `accessToken` en `sessionStorage` (claves separadas).
- Método nuevo `guardarSesion({ accessToken, usuario })` para el flujo nuevo del backend.
- Método `obtenerToken()` para que el interceptor lo lea.
- `guardarUsuarioSesion(...)` se mantiene por compatibilidad con código antiguo.
- `cerrarSesion()` ya borra también el token (usa `sessionStorage.clear()`).

### 2.2 [`frontend/src/app/interceptors/auth.interceptor.ts`](frontend/src/app/interceptors/auth.interceptor.ts) (nuevo)
**Qué hace**:
1. Inyecta `Authorization: Bearer <token>` en todas las peticiones excepto en una lista explícita de rutas públicas (`/usuarios/login`, `/usuarios/registro-inicial`, `/usuarios/recuperar-password`, `/usuarios/restablecer-password`, `/auth/google`, `/empresas/reenviar-verificacion`, `/empresas/verificar/`, `/stripe/webhook`, y `POST /empresas`).
2. Si el backend responde **401** (token caducado o inválido) y la petición no era pública, ejecuta `cerrarSesion()` y redirige a `/sesioncerrada`.
3. Si el backend responde **403**:
   - Con `tipo: "SUSCRIPCION_REQUERIDA"` → redirige a `/stripe-pagos`.
   - En cualquier otro caso → redirige a `/nopermisos`.

### 2.3 [`frontend/src/app/app.config.ts`](frontend/src/app/app.config.ts)
**Qué**: añade `provideHttpClient(withInterceptors([authInterceptor]))`.

> **Nota**: el proyecto no tenía `provideHttpClient` explícito en absoluto. Lo añadimos para registrar el interceptor de forma idiomática (Angular 21).

### 2.4 [`frontend/src/app/services/usuarios.ts`](frontend/src/app/services/usuarios.ts)
**Qué**:
- `getUsuarioCorreoContraseña` y `loginConGoogle` ahora tipan `Observable<{ accessToken: string; usuario: Usuario }>`.
- Nuevo método `registroInicial(usuario)` que llama a `POST /usuarios/registro-inicial` (público).

### 2.5 [`frontend/src/app/components/login-iniciarsesion/login/login.ts`](frontend/src/app/components/login-iniciarsesion/login/login.ts)
**Qué**: ambos flujos de login (`onSubmit` y Google) llaman a `authentication.guardarSesion(res)` (antes era `guardarUsuarioSesion`), por lo que el JWT queda persistido en sessionStorage para el interceptor.

### 2.6 [`frontend/src/app/components/registro-creacion/registro/registro.ts`](frontend/src/app/components/registro-creacion/registro/registro.ts)
**Qué**:
- Elimina el envío de `suscripcion_activa: true` (el backend lo ignora, pero limpiamos el cliente para no inducir a error).
- Usa **directamente** el id devuelto por `addEmpresa(...)` en vez de hacer un segundo viaje a `getEmpresaByNif` — un round-trip menos y un endpoint autenticado menos en el flujo público.
- Crea al admin inicial llamando a `usuarioServicios.registroInicial(usuario)` en vez de `addUsuario(usuario)`.
- El rollback "si falla el usuario, borra la empresa" se anota como *best-effort* (ahora `deleteEmpresaCorreo` exige rol superadmin, así que en el flujo público fallará — se resolverá en el Bloque 4 con un endpoint transaccional).

---

## 3. Listado plano de archivos modificados / creados

**Backend (modificados):**
1. `backend/src/config.js`
2. `backend/src/middlewares/auth.middleware.js`
3. `backend/src/middlewares/checkSuscripcion.middleware.js`
4. `backend/src/models/usuario.model.js`
5. `backend/src/models/empresa.model.js`
6. `backend/src/controllers/usuarios.controller.js`
7. `backend/src/controllers/auth.controller.js`
8. `backend/src/controllers/empresas.controller.js`
9. `backend/src/routes/usuarios.route.js`
10. `backend/src/routes/empresas.route.js`
11. `backend/src/routes/clientes.route.js`
12. `backend/src/routes/pedidos.route.js`
13. `backend/src/routes/presupuestos.route.js`
14. `backend/src/routes/materiales.route.js`
15. `backend/src/routes/categorias.route.js`
16. `backend/src/routes/preciosEmpresa.route.js`
17. `backend/src/routes/plantillasMateriales.route.js`
18. `backend/src/routes/plantillasProductos.routes.js`
19. `backend/src/routes/elementos.route.js`
20. `backend/src/routes/elementosMateriales.route.js`
21. `backend/src/routes/historialPreciosBase.route.js`
22. `backend/src/routes/historialPreciosEmpresa.route.js`
23. `backend/src/routes/suscripcion.route.js`
24. `backend/src/routes/stripe.route.js`

**Frontend (modificados):**
25. `frontend/src/app/app.config.ts`
26. `frontend/src/app/services/authentication.ts`
27. `frontend/src/app/services/usuarios.ts`
28. `frontend/src/app/components/login-iniciarsesion/login/login.ts`
29. `frontend/src/app/components/registro-creacion/registro/registro.ts`

**Frontend (nuevos):**
30. `frontend/src/app/interceptors/auth.interceptor.ts`

---

## 4. Cómo verificar que todo sigue funcionando

1. **Arranque del backend**: `cd backend && npm run dev` — debe levantar sin errores. Si tu `.env` no tiene `REFRESH_SECRET_KEY` no pasa nada: se cae a `SECRET_KEY`.
2. **Registro nuevo**:
   - Rellena el formulario en `/registro`.
   - El backend debe crear la empresa con `suscripcion_activa = false`, `email_verificado = false`, y `fecha_vencimiento = hoy + 14 días`.
   - Tras la respuesta de `POST /empresas`, el frontend llama directamente a `POST /usuarios/registro-inicial` con el `empresa_id` devuelto.
3. **Login**:
   - Mete email y password.
   - DevTools → Network → `/usuarios/login`: la respuesta debe ser `{ accessToken: "...", usuario: { ... sin password ... } }`.
   - `sessionStorage` debe tener dos claves: `usuario_castilfac` y `token_castilfac`.
4. **Cualquier llamada autenticada** (ej. listar clientes): la pestaña Network debe mostrar `Authorization: Bearer ...`. Si manualmente borras `token_castilfac` en DevTools y refrescas la página, la siguiente petición devolverá `401` y el interceptor te llevará a `/sesioncerrada`.
5. **Comprobación de filtrado**: `GET /api/empresas/<id>` no debe traer `token_verificacion`; `GET /api/usuarios` (como admin) no debe traer `password` ni `reset_token`.
6. **Bypass del registro**: hacer un `curl` directo a `POST /api/empresas` mandando `"suscripcion_activa": true` ahora se ignora — la empresa queda creada con `false`.

---

## 5. Qué queda fuera del Bloque 1 (se aborda más abajo o en Bloques 3/4)

- ~~**Tenant isolation** (CRIT-04)~~ → resuelto en **Bloque 2** (sección 7 de este documento).
- **Validators**: se mantienen los `cursos.validator.js` zombie. Se limpian en el **Bloque 3**.
- **Bug `formulario-usuario.ts` (hash en el input password)**: pendiente del **Bloque 3**.
- **Rate limiting, helmet, bcrypt 12, CORS con origin restringido**: **Bloque 4**.
- **Endpoint transaccional `POST /empresas/registro`** que cree empresa + admin en una sola transacción y retire el rollback manual de `registro.ts`: **Bloque 4**.

---

## 6. Riesgos conocidos del cambio (Bloque 1)

- **Sesiones existentes**: los usuarios que tenían sesión abierta antes del despliegue NO tienen JWT en `sessionStorage` → su próxima petición autenticada recibe 401 y el interceptor los lleva a `/sesioncerrada`. Es el comportamiento esperado, sólo hay que avisar.
- **TTL del access token**: 8 h. Aceptable mientras no haya refresh. Si quieres reducirlo a 15 min, hay que implementar el refresh flow antes (ya está la función `generarRefreshToken` lista).
- **Webhook de Stripe**: sigue público (correcto). Continúa montado dos veces (en `app.js` y en `stripe.route.js`) — la primera registro gana y la segunda se ignora. No es un bug, pero conviene limpiar en el Bloque 4.

---

## 7. Bloque 2 — Tenant isolation

> **Objetivo**: que un usuario con un JWT válido no pueda leer, modificar ni borrar recursos de otra empresa. Antes del Bloque 1 cualquiera podía; tras el Bloque 1 sólo lo podía hacer un usuario logado de cualquier empresa. Tras el Bloque 2 cada usuario queda confinado a su `empresa_id`.

### 7.0 Idea general

Se introduce un helper compartido [`backend/src/utils/tenant.js`](backend/src/utils/tenant.js) con tres funciones que cubren los tres patrones que aparecen una y otra vez en los controladores:

1. **`assertEmpresaIdParam(req, res, nombreParam)`** — la URL trae `:empresa_id` (o `:id` cuando el endpoint es "por empresa"). Comprueba que coincide con `req.user.empresa_id`. Si no, devuelve 403.
2. **`assertOwnsRecurso(req, res, recurso)`** — tras un `findByPk(...)`, valida que el recurso pertenece a la empresa del JWT. Si no, devuelve **404** a propósito (en vez de 403) para no filtrar la existencia de IDs ajenos.
3. **`empresaIdEfectivo(req)`** — al crear recursos, se ignora cualquier `empresa_id` que venga del body y se usa el del JWT. Excepción: `superadmin` puede pasarlo explícitamente.

Y un cuarto helper auxiliar:
4. **`esSuperadmin(req)`** — `req.user.rol === 'superadmin'`, usado para los *bypasses* legítimos.

Todos los helpers son *fail-safe*: tras detectar el problema, envían la respuesta de error y devuelven `false`. El controlador hace `if (!assertX(...)) return;` y se evita una ráfaga de `if/else` anidados.

### 7.1 [`backend/src/controllers/clientes.controller.js`](backend/src/controllers/clientes.controller.js) (reescrito)
- `getClientesByEmpresa`: `assertEmpresaIdParam(req, res, "empresa_id")` antes de leer.
- `getClienteById` / `updateCliente` / `deleteCliente`: `assertOwnsRecurso(req, res, cliente)` tras el `findByPk`.
- `addCliente`: ignora `empresa_id` del body; usa `empresaIdEfectivo(req)`.
- **Resuelve el comentario `//FALTAN VALIDACIONES`** del fichero original con un único validador centralizado `validarPayloadCliente(payload, { paraCrear })` que cubre:
  - `tipo_cliente` ∈ `['particular','empresa','vip','mayorista']`.
  - `nombre_empresa_o_particular`: 1–255 chars.
  - `email`: ≤ 255 chars y contiene `@`.
  - `telefono`: regex `^\+?[1-9]\d{6,14}$`.
  - `nif_cif`: regex permisiva alfanumérica 8–12 (cubre DNI/NIE/CIF, no descartamos clientes particulares).
  - `descuento_fijo`: 0–100.
  - `direccion`: ≤ 500 chars.
- Listados vacíos ahora devuelven **200 + `[]`** (antes devolvían 404, lo que tiraba el cliente HTTP del frontend).

### 7.2 [`backend/src/controllers/pedidos.controller.js`](backend/src/controllers/pedidos.controller.js) (reescrito)
Patrón complejo: las URLs mezclan `:id` que tan pronto es pedido, como operario, como cliente, como empresa.
- `getPedidoById` / `updatePedido` / `deletePedido` / `marcarComoFabricado`: `assertOwnsRecurso(req, res, pedido)` tras el `findByPk`.
- `getPedidosByEmpresa` / `getFinanzasByEmpresa`: el `:id` es empresa_id → `assertEmpresaIdParam(req, res, "id")`.
- `getPedidosByOperario` / `getPedidosHistorialByOperario`:
  - Validan que el operario referenciado pertenezca a la misma empresa (`validarOperarioDeMiEmpresa`).
  - **Extra**: si el solicitante tiene rol `operario`, sólo puede ver SUS propios pedidos — antes podía pedir el listado de cualquier otro operario de su empresa pasándole otro id.
- `getPedidosByCliente`: valida que el cliente sea de mi empresa (`validarClienteDeMiEmpresa`).
- `existePedidoDePresupuesto`: si el pedido encontrado no es de mi empresa, devuelve `{ existe: false }` (en vez de filtrar que sí existe en otra empresa).
- `createPedido`:
  - `empresa_id` viene del JWT, no del body.
  - Valida que el `cliente_id` y el `operario_asignado_id` (si llega) son de la misma empresa antes de crear.
- `updatePedido`:
  - Idem: si cambias `cliente_id` o `operario_asignado_id`, deben ser de la misma empresa que el pedido.

### 7.3 [`backend/src/controllers/presupuestos.controller.js`](backend/src/controllers/presupuestos.controller.js)
- `patchEstadoPresupuesto` / `getPresupuestoById`: `assertOwnsRecurso(req, res, presupuesto)`.
- `getPresupuestos` (`GET /empresas/:id/presupuestos`): `assertEmpresaIdParam(req, res, "id")`. Lista vacía → 200 + `[]`.
- `createPresupuesto`:
  - `empresa_id` se toma del JWT (`empresaIdEfectivo(req)`).
  - Se valida que el `cliente_id` referenciado sea de la misma empresa antes de abrir la transacción.
- `updatePresupuesto`:
  - Chequeo de pertenencia *en línea* (no podemos usar `assertOwnsRecurso` porque tenemos una transacción abierta y hay que hacer `rollback` antes de responder).
  - Si el body incluye `cliente_id`, se valida que sea de la misma empresa que el presupuesto.

### 7.4 [`backend/src/controllers/materiales.controller.js`](backend/src/controllers/materiales.controller.js)
Todas las rutas ya llevaban `:empresa_id` en la URL — añadimos `assertEmpresaIdParam(req, res, "empresa_id")` al principio de cada handler: `obtenerMateriales`, `obtenerMaterialesConPrecioEmpresa`, `obtenerMaterialPorId`, `toggleActivoMaterial`, `crearMaterial` (con `rollback` previo a la respuesta), `actualizarMaterial`, `eliminarMaterial`. Listas vacías → 200 + `[]`.

### 7.5 [`backend/src/controllers/preciosEmpresa.controller.js`](backend/src/controllers/preciosEmpresa.controller.js)
- `getPrecioEmpresa`: `assertEmpresaIdParam(req, res, "id")`.
- `actualizarPrecioPvp`: `empresa_id` se toma del JWT (antes venía del body — un body manipulado podía actualizar precios de otra empresa). Además se valida que el `material_id` recibido pertenezca a la misma empresa antes de crear el `PrecioEmpresa` y el registro de historial.

### 7.6 [`backend/src/controllers/historialPreciosEmpresa.controller.js`](backend/src/controllers/historialPreciosEmpresa.controller.js)
Antes devolvía **el historial completo del SaaS** a cualquier usuario autenticado. Ahora se filtra por `empresa_id = req.user.empresa_id` (un `superadmin` ve todo). Lista vacía → 200 + `[]`.

### 7.7 [`backend/src/controllers/plantillasProducto.controller.js`](backend/src/controllers/plantillasProducto.controller.js)
- `getPlantillasProducto`: era un catálogo común; se mantiene sin filtrado pero ahora devuelve `[]` en vez de 404 si está vacío.
- `getPlantillaProductoPorIdEmpresa`: `assertEmpresaIdParam(req, res, "id")` para que sólo veas las plantillas de tu empresa.

### 7.8 [`backend/src/controllers/suscripcion.controller.js`](backend/src/controllers/suscripcion.controller.js)
`verificarSuscripcion`: `assertEmpresaIdParam(req, res, "empresa_id")`. Antes se podía consultar el estado de la suscripción de cualquier empresa con sólo conocer su id.

### 7.9 [`backend/src/controllers/stripe.controller.js`](backend/src/controllers/stripe.controller.js)
- `crearSesionCheckout`: `empresa_id` se toma del JWT (no del body) — antes un usuario podía abrir una sesión de checkout pagando para otra empresa.
- `verificarSesionPago`: tras recuperar la sesión de Stripe, se comprueba que `session.metadata.empresa_id` coincida con la empresa del JWT. Si no, 403 — así un atacante con un `session_id` ajeno no puede disparar la activación de suscripción de otra empresa.

### 7.10 Tarea 7 del Bloque 2 — endpoints peligrosos
- `DELETE /usuarios/correo/:correo` y `DELETE /empresas/correo/:correo` ya se cerraron a `autorizarRol(['superadmin'])` en el Bloque 1 (sección 1.8). Se mantienen así.
- *2FA* queda fuera de scope (Bloque 4 / pendiente de decisión sobre proveedor TOTP).

---

## 8. Lista de archivos modificados (Bloque 2)

**Backend (nuevos):**
31. `backend/src/utils/tenant.js` — helpers de aislamiento multi-tenant.

**Backend (modificados):**
32. `backend/src/controllers/clientes.controller.js` — reescrito completo (tenant + validaciones).
33. `backend/src/controllers/pedidos.controller.js` — reescrito completo (tenant + permisos finos por rol).
34. `backend/src/controllers/presupuestos.controller.js`
35. `backend/src/controllers/materiales.controller.js`
36. `backend/src/controllers/preciosEmpresa.controller.js`
37. `backend/src/controllers/historialPreciosEmpresa.controller.js`
38. `backend/src/controllers/plantillasProducto.controller.js`
39. `backend/src/controllers/suscripcion.controller.js`
40. `backend/src/controllers/stripe.controller.js`

> **Nota**: el frontend no requiere cambios para el Bloque 2. Los componentes ya pasan `empresa_id` desde `Authentication.obtenerUsuarioSesion()`, así que cuando el backend rechace una URL con un `empresa_id` ajeno, el interceptor del Bloque 1 ya redirige a `/nopermisos`.

---

## 9. Verificación manual del Bloque 2

1. **Aislamiento de empresa**: con la sesión de un admin de empresa **A**, abre DevTools → Console y prueba:
   ```js
   fetch('/api/clientes/<id-empresa-B>', { headers: { Authorization: 'Bearer ' + sessionStorage.getItem('token_castilfac') }}).then(r => r.status)
   // -> 403 (antes: 200 con los clientes de B)
   ```
2. **Acceso a recursos cruzados**:
   ```js
   // <id-cliente-de-B> debe ser un id real de un cliente de la empresa B
   fetch('/api/clientes/id/<id-cliente-de-B>', { headers: { Authorization: 'Bearer ' + sessionStorage.getItem('token_castilfac') }}).then(r => r.status)
   // -> 404 (no 403, para no filtrar que ese id existe)
   ```
3. **Body manipulado al crear**:
   ```js
   fetch('/api/clientes', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       Authorization: 'Bearer ' + sessionStorage.getItem('token_castilfac'),
     },
     body: JSON.stringify({ empresa_id: 99999, nombre_empresa_o_particular: 'X', tipo_cliente: 'particular' })
   }).then(r => r.json())
   // El cliente se crea, PERO con tu empresa_id real, no 99999.
   ```
4. **Validaciones del Bloque 2 (clientes)**: prueba a crear un cliente con `tipo_cliente: 'cualquier-cosa'` → 400 con mensaje claro. Con `descuento_fijo: 9999` → 400. Con `telefono: 'abc'` → 400.
5. **Operario solo ve sus pedidos**: logado como operario id=5, prueba `GET /api/pedidos/operario/6` → 403.
6. **Stripe**: prueba a llamar `POST /api/stripe/verificar-sesion` con un `session_id` real pero de OTRA empresa → 403.

---

## 10. Riesgos conocidos del Bloque 2

- **Falsos 404 en superadmin**: si un superadmin pide un recurso que no existe, recibe 404 igual que si fuera de otra empresa. Es intencional: para usuarios normales evita enumerar IDs ajenos, y para superadmin el 404 sigue siendo correcto.
- **Validaciones de `clientes`**: la regex de `nif_cif` es deliberadamente permisiva (8–12 alfanuméricos) porque los clientes pueden ser particulares (DNI), empresas (CIF) o extranjeros (NIE/VAT). Si más adelante se quiere validación estricta tipo CIF español, conviene hacerlo en el frontend con dos campos separados.
- **`updatePresupuesto`**: el chequeo de pertenencia se hace *en línea* en vez de con `assertOwnsRecurso` porque hay transacción abierta. Es un caso aislado; el resto sigue usando el helper.
- **`historialPreciosBase`**: no se ha tocado, lo dejamos como catálogo común a todas las empresas (es el histórico de precios *base* de los materiales del catálogo global). Si en realidad cada empresa tiene su propio catálogo base, hay que añadir `empresa_id` al modelo `HistorialPrecioBase` y filtrar como en `HistorialPrecioEmpresa`.
- **`pedidos.controller.js` queries SQL crudas**: las consultas raw siguen siendo seguras gracias al filtro previo (`assertOwnsRecurso` o `assertEmpresaIdParam`). Sería más limpio meter el `WHERE empresa_id = ?` también dentro de la SQL, pero como ahora siempre hay un chequeo previo, el resultado neto es equivalente. Lo dejo así para no inflar el diff.
