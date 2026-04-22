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

const app = express();

const corsOption = {
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
app.use(cors(corsOption)); //habilitar cors

app.use(express.json()); // Para parsear JSON en el body

// Usar las rutas directas); // No necesitas añadir un prefijo aquí
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

app.get("/", (req, res) => {
  res.json({
    message: "API REST con Express.js",
  });
});
// Manejar rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({ message: "Página no encontrada" });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
