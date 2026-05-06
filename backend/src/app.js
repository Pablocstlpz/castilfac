import express from "express";
import cors from "cors";

import { PORT } from "./config.js";
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

const app = express();

const corsOption = {
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Empresa-Id", "stripe-signature"],
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

app.get("/", (req, res) => {
  res.json({ message: "API REST con Express.js" });
});

app.use((req, res) => {
  res.status(404).json({ message: "Página no encontrada" });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
