# 🔍 Informe de Auditoría — Castilfac

> **Fecha**: 2026-05-15
> **Ámbito**: `backend/` (Express 5 + Sequelize 6) y `frontend/` (Angular 21)
> **Resultado**: 6 vulnerabilidades CRÍTICAS, 9 ALTAS, 12 MEDIAS, deuda técnica relevante.

---

## 1. 🛑 VULNERABILIDADES CRÍTICAS

### 1.1 [CRIT-01] La API NO aplica autenticación a ninguna ruta
El middleware [`autenticarToken`](backend/src/middlewares/auth.middleware.js#L30) y [`autorizarRol`](backend/src/middlewares/auth.middleware.js#L61) existen, pero **no se importan ni se usan en ningún `*.route.js`**.

```bash
$ grep -rn "autenticarToken\|autorizarRol" backend/src/routes/
# (sin resultados)
```

**Impacto**: Cualquier persona puede llamar `GET /api/usuarios`, `DELETE /api/usuarios/:id`, `PUT /api/empresas/:id`, etc. sin token. Es una API totalmente pública.

### 1.2 [CRIT-02] El endpoint de login NO devuelve un JWT — devuelve el objeto Usuario completo con el hash bcrypt
[`getUsuarioCorreoContraseña`](backend/src/controllers/usuarios.controller.js#L573) y [`loginGoogle`](backend/src/controllers/auth.controller.js#L66) ejecutan `res.status(200).json(usuario)` directamente sobre la instancia Sequelize. Esto envía al cliente:

- `password` (hash bcrypt)
- `reset_token`
- `reset_token_expira`
- `deleted_at`, `empresa_id`, etc.

El frontend ya tiene un parche cosmético en [`Authentication.guardarUsuarioSesion`](frontend/src/app/services/authentication.ts#L17) (`const { password, ...datosSesion } = usuario`), pero **el hash ya viajó por la red** y queda en la pestaña Network de DevTools, logs de proxies, Sentry, etc.

### 1.3 [CRIT-03] El registro permite que el cliente decida si tiene suscripción activa
[`createEmpresa`](backend/src/controllers/empresas.controller.js#L92) hace:

```js
suscripcion_activa: suscripcion_activa ?? false,
activo: activo ?? true,
```

Y de hecho [`registro.ts:175`](frontend/src/app/components/registro-creacion/registro/registro.ts#L175) manda `suscripcion_activa: true` desde el navegador. Cualquiera con un POST a `/api/empresas` se da de alta con suscripción premium activada — **bypass del flujo de pago Stripe**.

### 1.4 [CRIT-04] Sin scoping multi-tenant: cualquier empresa puede leer/editar/borrar datos de otra
Ningún controlador comprueba que `req.user.empresa_id === recurso.empresa_id`. En particular:

- [`getClienteById`](backend/src/controllers/clientes.controller.js#L43): devuelve cualquier cliente por id sin validar empresa.
- [`updateCliente`](backend/src/controllers/clientes.controller.js#L131): el comentario literal del fichero es `//FALTAN VALIDACIONES`. Confirmado.
- [`deleteEmpresaCorreo`](backend/src/controllers/empresas.controller.js#L449) y [`deleteUsuarioCorreo`](backend/src/controllers/usuarios.controller.js#L379) borran por email sin ninguna autenticación → cualquiera puede hacer un wipe masivo.
- Lo mismo ocurre con pedidos, presupuestos, plantillas, etc.

### 1.5 [CRIT-05] El guard de Angular es decorativo — la autorización vive en `sessionStorage`
[`authGuard`](frontend/src/app/guards/auth.guard.ts#L5), [`roleGuard`](frontend/src/app/guards/role.guard.ts#L5) y [`subscriptionGuard`](frontend/src/app/guards/subscription.guard.ts#L7) leen exclusivamente `sessionStorage.getItem('usuario_castilfac')`. Un atacante hace en consola:

```js
sessionStorage.setItem('usuario_castilfac', JSON.stringify({ id: 1, rol: 'admin', empresa_id: 1 }));
```

…y entra como admin de cualquier empresa. Como además la API no valida tokens (CRIT-01), las peticiones también funcionarán.

### 1.6 [CRIT-06] `checkSuscripcion` es fail-open Y no se monta en ninguna ruta
[`checkSuscripcion.middleware.js:43-48`](backend/src/middlewares/checkSuscripcion.middleware.js#L43):

```js
} catch (error) {
  console.log(error);
  next();   // ❌ permite el paso ante CUALQUIER error
}
```

Además, `grep -rn "checkSuscripcion" backend/src/routes/` no devuelve nada — el middleware no está conectado.

---

## 2. ⚠️ VULNERABILIDADES ALTAS

| ID | Fichero | Problema |
|---|---|---|
| HIGH-01 | [`empresas.controller.js`](backend/src/controllers/empresas.controller.js#L9) | `getEmpresas`, `getEmpresa`, `getEmpresaByNif`, `verificarEmailEmpresa` exponen `token_verificacion`. Con ese token cualquiera verifica el email de la empresa ajena. |
| HIGH-02 | [`usuarios.controller.js`](backend/src/controllers/usuarios.controller.js#L21) | `getUsuarios`/`getUsuario`/`getUsuarioPorEmpresa`/`createUsuario`/`updateUsuario` devuelven el hash bcrypt y `reset_token`. |
| HIGH-03 | [`auth.middleware.js:39`](backend/src/middlewares/auth.middleware.js#L39) | Usa `process.env.SECRET_KEY` en `jwt.verify`, pero **importa** `SECRET_KEY` arriba sin usarlo. Inconsistente. |
| HIGH-04 | [`auth.middleware.js:4`](backend/src/middlewares/auth.middleware.js#L4) | Importa `REFRESH_SECRET_KEY` de `config.js`, pero [`config.js`](backend/src/config.js) **no lo exporta** → `undefined`. `verificarRefreshToken` siempre fallaría cuando se use. |
| HIGH-05 | [`auth.middleware.js:45`](backend/src/middlewares/auth.middleware.js#L45) | `console.log(usuario)` imprime el payload del JWT en cada request → fuga en logs de producción. |
| HIGH-06 | [`app.js:26-31`](backend/src/app.js#L26) | CORS sin `origin` definido → permite cualquier origen (`*`). Para una API con cookies/Authorization esto es excesivo. |
| HIGH-07 | Toda la app | No hay rate limiting en `/usuarios/login`, `/usuarios/recuperar-password`, `/auth/google` ni `/empresas` → fuerza bruta y spam de emails sin coste. |
| HIGH-08 | `app.js` | Falta `helmet` / cabeceras de seguridad (CSP, HSTS, X-Content-Type-Options…). |
| HIGH-09 | [`solicitarRecuperacion`](backend/src/controllers/usuarios.controller.js#L429) | Aunque el mensaje es idéntico, hace `await Usuario.findOne` + `update` solo en la rama del usuario existente → **enumeración de cuentas por timing**. |

---

## 3. 🔁 INCONSISTENCIAS DE VALIDACIÓN (Frontend ↔ Backend)

### 3.1 Validators del backend = código zombie de otro proyecto
[`backend/src/validators/`](backend/src/validators/) contiene `cursos.validator.js`, `alumnos.validator.js`, `modulos.validator.js`, `calficaciones.validator.js` (sic) y `usuarios.validator.js`. **Ninguno se importa en ninguna ruta** y todos referencian un dominio educativo distinto. Peor, [`usuarios.validator.js`](backend/src/validators/usuarios.validator.js#L25) valida campos `name`, `role`, `active`, **que no existen en el modelo `Usuario`** (que usa `nombre`, `rol`).

> **Recomendación**: Borrar el directorio entero y reescribir con `express-validator` aplicado de verdad en las rutas.

### 3.2 Mismatch concretos campo a campo

| Campo | Backend (modelo + controlador) | Frontend | Conflicto |
|---|---|---|---|
| `Usuario.password` (crear) | mínimo 8 | `formulario-usuario.ts:54` → `Validators.minLength(6)` | FE deja pasar 6-7 chars; BE rechaza |
| `Usuario.password` (actualizar) | regex fuerte (`8+ / mayúscula / dígito / símbolo`) | sin regex | FE acepta passwords débiles que el BE rechaza con 400 sin explicación específica |
| `Usuario.email` | `validate.isEmail` en modelo **pero** controlador usa `email.includes("@")` | `Validators.email` | El check del controlador es trivialmente bypaseable: `"a@"` lo pasa |
| `Usuario.nombre` | `allowNull: true` (modelo) pero `if (!nombre)` en controlador | `Validators.required + maxLength(100)` | FE limita 100, modelo permite 200 |
| `Usuario.rol` | `ENUM('admin','operario')` | `'operario'` por defecto en form | OK |
| `Empresa.nif` | regex CIF estricta `^[A-HJNP-SUVW][0-9]{7}[0-9A-J]$` | regex laxa `^[A-Za-z][0-9]{8}$` | FE acepta DNI/NIE; BE devuelve 400 |
| `Empresa.suscripcion_activa` | aceptado del body (¡bug!) | enviado `true` desde registro | privilege escalation (CRIT-03) |
| `Empresa.email_verificado` | aceptado del body en update | — | un PUT puede marcarse `email_verificado: true` |
| `Cliente.empresa_id` | `allowNull: false` | nunca lo envía el form: lo añade el `.ts` desde sesión | OK funcionalmente pero el BE no lo valida |
| `Cliente.nombre_empresa_o_particular` | `allowNull: false` | `Validators.required` | OK |
| `Cliente.email` | `validate.isEmail` | `Validators.email` (no required) | OK |
| `Cliente.tipo_cliente` | `ENUM('particular','empresa','vip','mayorista')` | `Validators.required` con default | el BE no valida que llegue un valor de la lista |
| `Cliente.descuento_fijo` | `DECIMAL(5,2)` sin rango | `min(0) max(100)` | BE acepta 9999 |
| `Cliente.telefono` | sin patrón | sin patrón | inconsistente con `Empresa.telefono` que sí lo tiene |

### 3.3 Bug funcional en `formulario-usuario.ts`
[`formulario-usuario.ts:71`](frontend/src/app/components/inicioadmin/gestion-personal/formulario-usuario/formulario-usuario.ts#L71):

```ts
this.userForm.controls['password'].setValue(response.password);  // ❗ es el hash bcrypt
```

Al editar un usuario sin tocar el campo password:
1. El input muestra el **hash bcrypt** del backend (con DevTools se ve en claro).
2. Si admin pulsa "Guardar" sin cambiarlo, el backend recibe el hash, ejecuta `bcrypt.hash(hash, 10)` y guarda un **doble-hash** → el usuario queda fuera de su cuenta.

Aunque el field es `Validators.required` esto puede romper logins reales en producción.

### 3.4 Falta de sanitización
- Backend: ningún controlador hace `trim()`, `escape()` ni normaliza emails (`email.toLowerCase()`). El frontend tampoco.
- `addCliente`/`updateCliente` no validan **nada** (ni tipo, ni longitudes). Sequelize valida `isEmail`, pero el resto queda libre.
- No hay protección contra mass-assignment: `req.body` se desestructura entero y se pasa a `Sequelize.update()` (en empresas/clientes). Un atacante puede modificar `id`, `fecha_creacion`, etc.

---

## 4. 🧹 DEUDA TÉCNICA Y REFACTORIZACIÓN

### 4.1 Lógica duplicada (DRY)

| Patrón duplicado | Localizaciones | Sugerencia |
|---|---|---|
| Lógica de "comprobar suscripción + fecha vencimiento" | [`auth.controller.js:51-63`](backend/src/controllers/auth.controller.js#L51), [`checkSuscripcion.middleware.js:25-39`](backend/src/middlewares/checkSuscripcion.middleware.js#L25), `subscription.guard.ts:23-32` | Extraer a `utils/subscription.js` (backend) + servicio en frontend |
| `email.includes("@")` | usuarios.controller×3, empresas.controller×2 | Reemplazar por `validator.isEmail` o `express-validator` |
| Chequeo de existe-email-en-empresa-o-usuario | createUsuario, updateUsuario, createEmpresa, updateEmpresa | Helper `findEmailOwner(email)` |
| `getXxx` con 404 cuando el array es vacío | TODOS los `getXxx` controllers | Devolver 200 + `[]`; reservar 404 para id concreto inexistente |
| `private httpOptions = { headers: ... 'Content-Type': 'application/json' }` + `handleError` | TODOS los `services/*.ts` | Eliminar (Angular lo añade automáticamente para POST con objeto), centralizar en un `HttpInterceptor` + base service |
| Regex `^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$` | empresas.controller×4, registro.ts×3 | Constante compartida |
| `constructor(private fb: FormBuilder)` mezclado con `inject(...)` | login.ts, registro.ts, cliente-formulario.ts, formulario-usuario.ts | Usar `private fb = inject(FormBuilder)` para coherencia |

### 4.2 Métodos demasiado largos
- [`updateUsuario`](backend/src/controllers/usuarios.controller.js#L169) ≈ 160 líneas, mezcla validación + reglas de negocio + persistencia.
- [`createEmpresa`](backend/src/controllers/empresas.controller.js#L92) ≈ 170 líneas.
- [`registro.ts:onSubmit`](frontend/src/app/components/registro-creacion/registro/registro.ts#L158) ≈ 120 líneas con triple-nested `subscribe`. Debería ser `switchMap`/`forkJoin` y compensar fallos con una transacción en backend, no con "borra empresa si falla usuario".

### 4.3 Ausencia de asociaciones Sequelize
Los modelos no declaran `Empresa.hasMany(Usuario)`, `Cliente.belongsTo(Empresa)`, etc. Todo se resuelve con `findByPk` manual. Eso impide:
- usar `include:[Empresa]` en una sola query
- definir `onDelete: 'CASCADE'` declarativo
- migrar a un `toJSON` global con relaciones limpias

### 4.4 Modelo Usuario expone secretos por defecto
[`usuario.model.js`](backend/src/models/usuario.model.js#L29) no tiene `defaultScope` ni `toJSON` que filtre `password`, `reset_token`, `reset_token_expira`. **Solución recomendada** — añadir al modelo:

```js
defaultScope: { attributes: { exclude: ['password', 'reset_token', 'reset_token_expira'] } },
scopes: { withAuth: { attributes: { include: ['password'] } } },
```

…y usar `Usuario.scope('withAuth').findOne(...)` solo en login. Equivalente para `Empresa.token_verificacion`.

### 4.5 Otros puntos de deuda
- [`backend/package.json:19`](backend/package.json#L19): `"name": "04-servidor-mongodb"` (¡proyecto usa MySQL!).
- [`config.js`](backend/src/config.js): exporta `SECRET_KEY` pero no `REFRESH_SECRET_KEY`; `PORT` sin default → si falla `.env` el server no arranca con error claro.
- [`environments/enviroments.ts`](frontend/src/environments/enviroments.ts): nombre mal escrito (`enviroments` en lugar de `environments`), `production: true` y solo hay un environment (no hay `environment.development.ts`).
- [`login.ts:24`](frontend/src/app/components/login-iniciarsesion/login/login.ts#L24): `GOOGLE_CLIENT_ID` hardcodeado en el .ts (debería vivir en `environment`).
- Frontend sin `HttpInterceptor` para inyectar `Authorization` o capturar 401/403 globalmente.
- Frontend sin `ErrorHandler` global; cada componente hace su propio `console.error`.
- `console.log` profusos en backend (`console.log(usuario)`, `console.log(error)`) — deberían ir a un logger (pino/winston) con redacción de campos sensibles.
- `setTimeout(() => router.navigate(...), 700)` repetido para "loading screen" en login/registro: extraer a helper o usar guard de transición.
- bcrypt rounds = 10 — funcional, pero **recomendable subir a 12** (≈250 ms en CPU moderna) ya que el endpoint de login no hace rate limiting.

### 4.6 Modernización Angular 21 (estado actual)
- ✅ Standalone components en uso correcto, sin NgModules.
- ✅ Control flow `@if`/`@for` adoptado en plantillas (no encontré ningún `*ngIf`/`*ngFor`).
- ✅ `inject()` se usa mayoritariamente en componentes, guards y servicios.
- ⚠️ Excepción: 4 componentes mezclan `constructor(private fb: FormBuilder)` con `inject()` (login, registro, cliente-formulario, formulario-usuario). Unificar.
- ⚠️ `[ngClass]` y `[ngModel]` en `clientes.html` → ya hay alternativas (`class="..."` con bindings, `signals`), pero esto es estilístico.
- ⚠️ No se ven `signal()`/`computed()` en muchos componentes; `clientes.html` sí los usa (`busqueda()`, `filtroTipo()`, `clientesFiltrados()`) — usarlos también en formularios para alinear estilos.

---

## 5. 🎯 PLAN DE ACCIÓN PRIORIZADO

### 🔴 Bloque 1 — Detener la hemorragia (1-2 días)
1. **Aplicar JWT real**:
   - Hacer que `getUsuarioCorreoContraseña` y `loginGoogle` generen `accessToken` con `generarAccessToken({ id, rol, empresa_id })` y devuelvan `{ accessToken, usuario: usuarioSinSecretos }`.
   - Añadir `router.use(autenticarToken)` (o ruta por ruta) a TODOS los routers excepto: `/auth/google`, `/usuarios/login`, `/usuarios/recuperar-password`, `/usuarios/restablecer-password`, `/empresas` (POST de registro), `/empresas/verificar/:token`, `/empresas/reenviar-verificacion`, `/stripe/webhook`.
   - Añadir `autorizarRol(['admin'])` o `['admin','superadmin']` en los endpoints administrativos.
2. **Crear interceptor Angular** que añada `Authorization: Bearer <token>` desde sessionStorage en todas las peticiones, y maneje 401/403 redirigiendo a `/sesioncerrada`.
3. **`defaultScope` en `Usuario` y `Empresa`** para excluir `password`, `reset_token`, `reset_token_expira`, `token_verificacion` automáticamente. Login usa scope `withAuth`.
4. **Whitelist en createEmpresa/updateEmpresa**: ignorar `suscripcion_activa`, `activo`, `email_verificado`, `token_verificacion`, `fecha_vencimiento` del body. Esos campos solo los toca el flujo Stripe / verificación de email.
5. **Aplicar `checkSuscripcion`** a las rutas de admin (`/presupuestos`, `/pedidos`, `/clientes`, `/materiales`, etc.) y cerrar el fail-open (en `catch`, devolver 500 sin `next()`).

### 🟠 Bloque 2 — Tenant isolation (2-3 días)
6. Añadir helper `assertEmpresa(req, recurso)` y aplicarlo en cada controlador que reciba `:id` (clientes, pedidos, presupuestos, materiales, precios, plantillas, elementos). El `req.user.empresa_id` viene del JWT.
7. Quitar/proteger los endpoints `DELETE /usuarios/correo/:correo` y `DELETE /empresas/correo/:correo` (o requerir rol superadmin + 2FA).
8. Validar `tipo_cliente`, longitudes, regex en `clientes.controller.js` con `express-validator` o middlewares.

### 🟡 Bloque 3 — Validaciones consistentes (1-2 días)
9. Borrar `backend/src/validators/{cursos,alumnos,modulos,calficaciones,usuarios}.validator.js` y reescribir validators reales: `usuarios.validator.js`, `empresas.validator.js`, `clientes.validator.js`, conectándolos en las rutas.
10. Unificar regex (CIF, teléfono, código postal, ciudad) en `shared/regex.ts` (Angular) y `utils/regex.js` (backend).
11. Arreglar `formulario-usuario.ts`:
    - No `patchValue` de `password` en edición.
    - Cambiar `Validators.required` por `Validators.minLength(8)` opcional cuando hay `id`.
    - Backend en `updateUsuario` ya soporta password vacío → casa bien.
12. Subir `minLength(6)` → `minLength(8)` en formulario-usuario para alinearlo con backend.

### 🟢 Bloque 4 — Hardening y limpieza (paralelizable)
13. Añadir `helmet`, `express-rate-limit` (5 intentos / 15 min en `/usuarios/login`, `/recuperar-password`, `/auth/google`).
14. Configurar CORS con `origin: FRONTEND_URL` (no `*`).
15. Subir bcrypt rounds a 12.
16. Quitar `console.log(usuario)` del middleware; sustituir `console.log(error)` por logger con redacción.
17. Renombrar `enviroments.ts` → `environments.ts`, crear `environment.development.ts`, mover `GOOGLE_CLIENT_ID` a environment.
18. Corregir `name` en `backend/package.json`.
19. Crear `BaseHttpService` (frontend) que elimine los `httpOptions` y `handleError` duplicados (~14 servicios).
20. Reescribir `registro.ts:onSubmit` con `switchMap` y crear endpoint backend transaccional `POST /api/empresas/registro` que cree empresa+usuario en una sola transacción (elimina el rollback manual de "deleteEmpresaCorreo si falla addUsuario").
21. Definir asociaciones Sequelize (`hasMany`/`belongsTo`) para poder usar `include:[]` y cascadas.

---

## 6. 📌 RIESGOS DESCUBIERTOS NO COVERED EN BRIEF

- **Stripe webhook expuesto antes del middleware de auth (correcto)** pero no veo verificación de firma — habría que revisar `stripe.controller.js#webhookStripe` (no leído todavía).
- El flujo "registro borra empresas no verificadas con el mismo email/NIF" en [`createEmpresa:174-187`](backend/src/controllers/empresas.controller.js#L174) permite a un atacante hacer DoS de registros legítimos no verificados enviando POSTs con el mismo email — el legítimo pierde su registro previo.
- `Empresa.token_verificacion` se guarda en plano (no es un hash). Si alguien filtra la BD, puede verificar empresas ajenas.
- `reset_token` también se guarda en plano. Lo correcto es guardar `sha256(token)` y comparar.
