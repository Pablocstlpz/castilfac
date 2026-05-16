//Asociaciones Sequelize centralizadas.
//
//Hasta ahora cada relacion empresa/usuario/cliente/pedido/etc se resolvia con
//findByPk manuales en los controllers. Declaramos las relaciones aqui (efecto
//secundario del import en app.js) para:
//
//  - poder usar `include: [Empresa]` en queries futuras sin tocar nada mas.
//  - tener una unica fuente de verdad de la cardinalidad de las FK.
//  - documentar la topologia del modelo de datos para quien lea el codigo.
//
//IMPORTANTE: NO usamos `as:` (alias) en ninguna asociacion porque eso obligaria
//a renombrar las consultas existentes (`include: [{ model: Empresa, as: '...' }]`).
//Al dejar el nombre por defecto, Sequelize usa el del modelo y todas las
//queries actuales siguen funcionando sin cambios.

import { Empresa } from "./empresa.model.js";
import { Usuario } from "./usuario.model.js";
import { Cliente } from "./cliente.model.js";
import { Pedido } from "./pedido.model.js";
import { Presupuesto } from "./presupuesto.model.js";
import { Elemento } from "./elemento.model.js";
import { ElementoMaterial } from "./elementoMaterial.model.js";
import { Material } from "./material.model.js";
import { Categoria } from "./categoria.model.js";
import { PrecioEmpresa } from "./precioEmpresa.model.js";
import { HistorialPrecioBase } from "./historialPrecioBase.model.js";
import { HistorialPrecioEmpresa } from "./historialPrecioEmpresa.model.js";
import { PlantillaProducto } from "./plantillaProducto.model.js";
import { PlantillaMaterial } from "./plantillaMaterial.model.js";

//---- Empresa -> Usuario / Cliente / Pedido / Presupuesto / Material / PrecioEmpresa ----
Empresa.hasMany(Usuario, { foreignKey: "empresa_id", onDelete: "CASCADE" });
Usuario.belongsTo(Empresa, { foreignKey: "empresa_id" });

Empresa.hasMany(Cliente, { foreignKey: "empresa_id", onDelete: "CASCADE" });
Cliente.belongsTo(Empresa, { foreignKey: "empresa_id" });

Empresa.hasMany(Pedido, { foreignKey: "empresa_id", onDelete: "CASCADE" });
Pedido.belongsTo(Empresa, { foreignKey: "empresa_id" });

Empresa.hasMany(Presupuesto, { foreignKey: "empresa_id", onDelete: "CASCADE" });
Presupuesto.belongsTo(Empresa, { foreignKey: "empresa_id" });

Empresa.hasMany(Material, { foreignKey: "empresa_id", onDelete: "CASCADE" });
Material.belongsTo(Empresa, { foreignKey: "empresa_id" });

Empresa.hasMany(PrecioEmpresa, { foreignKey: "empresa_id", onDelete: "CASCADE" });
PrecioEmpresa.belongsTo(Empresa, { foreignKey: "empresa_id" });

Empresa.hasMany(HistorialPrecioEmpresa, { foreignKey: "empresa_id", onDelete: "CASCADE" });
HistorialPrecioEmpresa.belongsTo(Empresa, { foreignKey: "empresa_id" });

Empresa.hasMany(PlantillaProducto, { foreignKey: "empresa_id" });
PlantillaProducto.belongsTo(Empresa, { foreignKey: "empresa_id" });

//---- Cliente -> Pedidos / Presupuestos ----
Cliente.hasMany(Pedido, { foreignKey: "cliente_id" });
Pedido.belongsTo(Cliente, { foreignKey: "cliente_id" });

Cliente.hasMany(Presupuesto, { foreignKey: "cliente_id" });
Presupuesto.belongsTo(Cliente, { foreignKey: "cliente_id" });

//---- Usuario -> Pedidos (operario asignado) / Presupuestos (autor) / Precios ----
Usuario.hasMany(Pedido, { foreignKey: "operario_asignado_id" });
Pedido.belongsTo(Usuario, { foreignKey: "operario_asignado_id" });

Usuario.hasMany(Presupuesto, { foreignKey: "usuario_id" });
Presupuesto.belongsTo(Usuario, { foreignKey: "usuario_id" });

Usuario.hasMany(PrecioEmpresa, { foreignKey: "usuario_id" });
PrecioEmpresa.belongsTo(Usuario, { foreignKey: "usuario_id" });

//---- Presupuesto -> Pedido / Elemento ----
Presupuesto.hasMany(Pedido, { foreignKey: "presupuesto_id" });
Pedido.belongsTo(Presupuesto, { foreignKey: "presupuesto_id" });

Presupuesto.hasMany(Elemento, { foreignKey: "presupuesto_id", onDelete: "CASCADE" });
Elemento.belongsTo(Presupuesto, { foreignKey: "presupuesto_id" });

//---- Elemento -> ElementoMaterial -> Material ----
Elemento.hasMany(ElementoMaterial, { foreignKey: "elemento_id", onDelete: "CASCADE" });
ElementoMaterial.belongsTo(Elemento, { foreignKey: "elemento_id" });

Material.hasMany(ElementoMaterial, { foreignKey: "material_id" });
ElementoMaterial.belongsTo(Material, { foreignKey: "material_id" });

Material.hasMany(PrecioEmpresa, { foreignKey: "material_id" });
PrecioEmpresa.belongsTo(Material, { foreignKey: "material_id" });

Material.hasMany(HistorialPrecioBase, { foreignKey: "material_id", onDelete: "CASCADE" });
HistorialPrecioBase.belongsTo(Material, { foreignKey: "material_id" });

Material.hasMany(HistorialPrecioEmpresa, { foreignKey: "material_id" });
HistorialPrecioEmpresa.belongsTo(Material, { foreignKey: "material_id" });

//---- Categoria -> Material ----
Categoria.hasMany(Material, { foreignKey: "categoria_id" });
Material.belongsTo(Categoria, { foreignKey: "categoria_id" });

//---- PlantillaProducto -> PlantillaMaterial -> Material ----
PlantillaProducto.hasMany(PlantillaMaterial, { foreignKey: "plantilla_id", onDelete: "CASCADE" });
PlantillaMaterial.belongsTo(PlantillaProducto, { foreignKey: "plantilla_id" });

Material.hasMany(PlantillaMaterial, { foreignKey: "material_id" });
PlantillaMaterial.belongsTo(Material, { foreignKey: "material_id" });
