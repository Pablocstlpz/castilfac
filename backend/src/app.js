import express from "express";
import cors from "cors";
import helmet from "helmet";

import { PORT, FRONTEND_URL, validarConfig } from "./config.js";

//valido que el .env tenga todo lo necesario antes de empezar a importar nada mas
//asi si falta alguna variable critica el proceso muere antes de levantar la API
validarConfig();
import { empresasRoutes } from "./routes/empresas.route.js";
import { usuariosRoutes } from "./routes/usuarios.route.js";
import { pedidosRoutes } from "./routes/pedidos.route.js";
import { clientesRoutes } from "./routes/clientes.route.js";
import { categoriasRoutes } from "./routes/categorias.route.js";
import { materialesRoutes } from "./routes/materiales.route.js";
import { preciosEmpresaRoutes } from "./routes/preciosEmpresa.route.js";
import { plantillasProductosRoutes } from "./routes/plantillasProductos.routes.js";
import { plantillasMaterialesRoutes } from "./routes/plantillasMateriales.route.js";
import { presupuestosRoutes } from "./routes/presupuestos.route.js";
import { elementosRoutes } from "./routes/elementos.route.js";
import { elementosMaterialesRoutes } from "./routes/elementosMateriales.route.js";
import { historialPreciosBaseRoutes } from "./routes/historialPreciosBase.route.js";
import { historialPreciosEmpresaRoutes } from "./routes/historialPreciosEmpresa.route.js";
import { suscripcionRoutes } from "./routes/suscripcion.route.js";
import { stripeRoutes } from "./routes/stripe.route.js";
import { webhookStripe } from "./controllers/stripe.controller.js";
import { authRoutes } from "./routes/auth.route.js";
//cargo las asociaciones de Sequelize por efecto secundario del import
import "./models/associations.js";

const app = express();

//trust proxy: si la API esta detras de un reverse-proxy (nginx, cloudflare, traefik...)
//express necesita saberlo para leer la IP real del cliente desde X-Forwarded-For
//sin esto express-rate-limit cuenta TODAS las peticiones contra la IP del proxy y bloquea a todos a la vez
//valor 1 = confio en UN unico proxy directo (lo habitual); si hay mas saltos hay que subirlo
app.set("trust proxy", 1);

//helmet pone cabeceras de seguridad como X-Content-Type-Options, X-Frame-Options, HSTS, etc.
//desactivo CSP porque esta API solo sirve JSON y la CSP por defecto rompe paginas de error embebidas
//cuando empecemos a servir HTML embebido habra que activarla con una politica a medida
app.use(helmet({ contentSecurityPolicy: false }));

//CORS: lista blanca de origenes permitidos
//la formo con FRONTEND_URL del .env mas localhost en los puertos de dev de Angular y SSR
//normalizo quitando barras finales para que coincida aunque FRONTEND_URL o el Origin lleven "/"
const normalizarOrigen = (url) => (url ? String(url).replace(/\/+$/, "") : url);

const ORIGENES_PERMITIDOS = [
  FRONTEND_URL,
  "http://localhost:4200",
  "http://localhost:4000",
]
  .filter(Boolean)
  .map(normalizarOrigen);

const corsOption = {
  origin: (origin, callback) => {
    //peticiones sin Origin (curl, server-to-server, mismo origin) las dejo pasar
    if (!origin) return callback(null, true);
    if (ORIGENES_PERMITIDOS.includes(normalizarOrigen(origin))) return callback(null, true);
    //si el origin no esta en la whitelist lo rechazo en vez de devolver "*"
    return callback(new Error(`Origin no permitido por CORS: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Empresa-Id",
    "stripe-signature",
  ],
  credentials: true,
};
app.use(cors(corsOption));

//el webhook de Stripe necesita el body en CRUDO antes de express.json() para poder verificar la firma
app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), webhookStripe);

app.use(express.json());

//auth antes que el resto: login google y refresh son publicos y viven solo aqui
app.use("/api", authRoutes);

app.use("/api", empresasRoutes);
app.use("/api", usuariosRoutes);
app.use("/api", pedidosRoutes);
app.use("/api", clientesRoutes);
app.use("/api", categoriasRoutes);
app.use("/api", materialesRoutes);
app.use("/api", preciosEmpresaRoutes);
app.use("/api", plantillasProductosRoutes);
app.use("/api", plantillasMaterialesRoutes);
app.use("/api", presupuestosRoutes);
app.use("/api", elementosRoutes);
app.use("/api", elementosMaterialesRoutes);
app.use("/api", historialPreciosBaseRoutes);
app.use("/api", historialPreciosEmpresaRoutes);
app.use("/api", suscripcionRoutes);
app.use("/api", stripeRoutes);

//ruta basica para comprobar que la API responde
app.get("/", (req, res) => {
  res.json({ message: "API REST con Express.js" });
});

//handler 404 para cualquier ruta que no haya matcheado arriba
app.use((req, res) => {
  res.status(404).json({ message: "Página no encontrada" });
});

// Manejador de errores global: captura cualquier error pasado con next(err) o
// lanzado de forma sincrona en un middleware. Sin esto Express devuelve HTML por defecto.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("[error]", err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ message: "Error interno del servidor" });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
