import express from "express";
import cors from "cors";
import helmet from "helmet";

import { PORT, FRONTEND_URL } from "./config.js";
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
//Cargar asociaciones Sequelize (efecto secundario del import).
import "./models/associations.js";

const app = express();

//---- Cabeceras de seguridad ----------------------------------------------
//helmet pone Content-Security-Policy, X-Content-Type-Options, etc.
//Como esto es API JSON (no sirve HTML), desactivamos CSP para no estorbar a Swagger
//o paginas de error embebidas; el resto de cabeceras quedan activas.
app.use(helmet({ contentSecurityPolicy: false }));

//---- CORS ----------------------------------------------------------------
//Lista blanca de origenes permitidos. Se construye a partir de FRONTEND_URL
//(.env) y de localhost para entorno de desarrollo. Si FRONTEND_URL no esta
//definido, no se autoriza ningun origen externo -> mas seguro por defecto.
const ORIGENES_PERMITIDOS = [
  FRONTEND_URL,
  "http://localhost:4200",
  "http://localhost:4000",
].filter(Boolean);

const corsOption = {
  origin: (origin, callback) => {
    //Peticiones sin Origin (curl, server-to-server, mismo origin) se permiten.
    if (!origin) return callback(null, true);
    if (ORIGENES_PERMITIDOS.includes(origin)) return callback(null, true);
    //Si no esta en la lista, lo rechazamos en vez de devolver "*".
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

// El webhook de Stripe necesita el body en crudo ANTES de express.json()
app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), webhookStripe);

app.use(express.json());

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
app.use("/api", authRoutes);

app.get("/", (req, res) => {
  res.json({ message: "API REST con Express.js" });
});

app.use((req, res) => {
  res.status(404).json({ message: "Página no encontrada" });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
