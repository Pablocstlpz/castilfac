# Documentación: Módulo de Impresión — Hoja de Fabricación (Taller)

**Proyecto:** CastilFac — ERP para carpintería metálica y cristalería
**Fecha de implementación:** 2026-05-14
**Angular:** 21 | **jsPDF:** ^4.2.1 | **jspdf-autotable:** ^5.0.7

---

## 1. Archivos creados / modificados

| Archivo | Acción | Descripción |
|---|---|---|
| `src/app/services/pdf.ts` | **CREADO** | Servicio Angular inyectable con la lógica completa de generación de PDF |
| `src/app/components/inicioadmin/presupuestos/formulario-presupuesto/formulario-presupuesto.ts` | **MODIFICADO** | Import + inyección de `PdfService`, nuevo método `imprimirTaller()` |
| `src/app/components/inicioadmin/presupuestos/formulario-presupuesto/formulario-presupuesto.html` | **MODIFICADO** | Botón "Imprimir Taller" en la botonera sticky, visible solo en modo edición |

---

## 2. Lógica de la "Hoja de Corte": el motor de cálculo de milímetros

### 2.1 Conversión de unidades: metros → milímetros

Las medidas en el formulario se almacenan en **metros** (`medida_ancho`, `medida_alto`). Para el taller, la unidad operativa es el **milímetro**, ya que las sierras y máquinas de corte trabajan en esa escala de precisión.

La conversión es trivial pero crítica: se multiplica por 1000 y se redondea al entero más cercano para evitar decimales imposibles en las instrucciones de corte.

```typescript
const anchoMm = Math.round((Number(el.medida_ancho) || 0) * 1000);
const altoMm  = Math.round((Number(el.medida_alto)  || 0) * 1000);
```

**Ejemplo:** `medida_ancho: 1.2` → `anchoMm: 1200` (1200 mm = 1,20 m ✓)

### 2.2 Derivación del tipo de cálculo desde `tipo_unidad`

El campo `tipo_unidad` de cada material (almacenado en `materialesLista` y en `mat.tipo_unidad` dentro del desglose) determina cómo se fabrica ese componente. El servicio lo abstrae en un tipo semántico `TipoCalculo`:

```typescript
type TipoCalculo = 'perimetro' | 'area' | 'por_metro_ancho';

private derivarTipoCalculo(tipoUnidad: string): TipoCalculo {
  if (tipoUnidad === 'metros_lineales') return 'perimetro';
  if (tipoUnidad === 'metros_cuadrados') return 'area';
  return 'por_metro_ancho';
}
```

| `tipo_unidad` (backend) | `TipoCalculo` (PDF) | Uso típico en taller |
|---|---|---|
| `metros_lineales` | `perimetro` | Perfiles de aluminio, junquillos, tapajuntas |
| `metros_cuadrados` | `area` | Cristales, paneles, láminas |
| `unidades`, `kilogramos`, `litros` | `por_metro_ancho` | Tornillería, sellantes, accesorios |

### 2.3 Generación de la instrucción de corte con multiplicación por cantidad

La cantidad del elemento (`el.cantidad`) representa cuántas unidades iguales se fabrican (ej: 3 ventanas idénticas). Las piezas de corte se **multiplican** por esa cantidad:

```typescript
private instruccionCorte(tipoCalculo, anchoMm, altoMm, cantidad): string {
  switch (tipoCalculo) {
    case 'perimetro': {
      const n = 2 * cantidad;       // 2 horizontales + 2 verticales × cant.
      return `${n} de ${anchoMm}mm y ${n} de ${altoMm}mm`;
    }
    case 'area':
      return `${cantidad} vidrio${cantidad !== 1 ? 's' : ''} de ${anchoMm}mm x ${altoMm}mm`;
    default:
      return `${cantidad} de ${anchoMm}mm`;
  }
}
```

**Ejemplos con cantidad = 2 (dos ventanas de 1200 x 900 mm):**

| Tipo | Instrucción generada |
|---|---|
| Perfil aluminio (perímetro) | `4 de 1200mm y 4 de 900mm` |
| Cristal (área) | `2 vidrios de 1200mm x 900mm` |
| Accesorio (por unidad) | `2 de 1200mm` |

---

## 3. Estructura de datos que recibe el PDF

El método `generarHojaFabricacion` recibe dos parámetros:

### `presupuesto: any`

```typescript
{
  numero_presupuesto: string;  // Ej: "PRE-1715672400000"
  cliente_nombre:    string;   // Ej: "Reformas García S.L."
  fecha_creacion:    string;   // ISO date string
  elementos: [
    {
      descripcion:             string;   // Ej: "Ventana corredera Salón"
      cantidad:                number;   // Ej: 2
      medida_ancho:            number;   // En metros. Ej: 1.2
      medida_alto:             number;   // En metros. Ej: 0.9
      notas_fabricacion:       string;   // Ej: "Prestar atención al descuadre"
      materiales_desglose: [
        {
          material_id:              number;  // FK al catálogo
          nombre_material_snapshot: string;  // Nombre congelado al guardar
          tipo_unidad:              string;  // 'metros_lineales' | 'metros_cuadrados' | ...
        }
      ]
    }
  ]
}
```

> **Importante:** El PDF **no imprime** ningún campo económico (`precio_final`, `coste_materiales`, `porcentaje_beneficio`, etc.). El documento es exclusivamente operativo para el taller.

### `materialesLista: MaterialConPrecio[]`

Lista maestra de materiales de la empresa, usada para hacer lookup del `tipo_unidad` real (por si el snapshot del desglose difiriese del catálogo vigente). Parámetro `this.materialesLista` del formulario.

---

## 4. Flujo de ejecución (del clic al PDF)

```
[Usuario] clic "Imprimir Taller"
    ↓
FormularioPresupuesto.imprimirTaller()
    ↓
PdfService.generarHojaFabricacion(presupuesto, materialesLista)
    ↓
  1. Crea instancia jsPDF (A4, portrait, mm)
  2. Dibuja cabecera azul corporativa con datos de referencia
  3. Por cada elemento del presupuesto:
     a. Dibuja barra de título (slate-800) con descripción, cantidad y tamaño en mm
     b. Por cada material del desglose:
        - Lookup tipo_unidad en materialesLista
        - Deriva TipoCalculo
        - Genera instrucción de corte con cantidad multiplicada
     c. Renderiza tabla con autoTable
     d. Si hay notas_fabricacion, las imprime en cursiva bajo la tabla
  4. Añade pie de página en todas las páginas (número de página, aviso confidencial)
  5. doc.save() → descarga el archivo en el navegador
```

---

## 5. Posibles mejoras futuras

### 5.1 Corto plazo (calidad del documento)

- **Logotipo de empresa:** Añadir `doc.addImage(logoBase64, ...)` en la cabecera para personalizar por empresa en un entorno multi-tenant.
- **Código QR o código de barras:** Incrustar el `numero_presupuesto` como QR para trazabilidad en el taller (librería `qrcode` + `doc.addImage`).
- **Soporte de saltos de página automáticos en autoTable:** Activar la opción `showHead: 'everyPage'` en `jspdf-autotable` para que las cabeceras de tabla se repitan en cada página.

### 5.2 Medio plazo (nuevas funcionalidades)

- **Hoja de Presupuesto para el cliente:** Método separado `generarPresupuestoCliente()` que sí incluya precios pero omita las instrucciones de corte.
- **Plantillas por tipo de empresa:** Configurar colores y logo desde los ajustes de empresa (`empresa.color_primario`, `empresa.logo_url`).
- **Exportación a HTML para previsualización:** Usar `doc.output('datauristring')` para mostrar un `<iframe>` con previsualización antes de descargar.
- **Idioma de la instrucción:** Para carpinterías con operarios de otros países, permitir seleccionar idioma de las etiquetas del documento.

### 5.3 Largo plazo (integración)

- **Envío directo al taller:** Integrar con la API del backend para guardar el PDF como adjunto en el pedido (`POST /pedidos/:id/documentos`).
- **Firma digital del operario:** Tras fabricar, el operario firma el PDF en el móvil como comprobante de que el trabajo fue completado.
- **Historial de impresiones:** Registrar en base de datos cuándo y quién imprimió cada hoja de fabricación para auditoría.
