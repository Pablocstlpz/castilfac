export interface PrecioEmpresa {
  id: number;
  empresa_id: number;
  material_id: number;
  precio_venta: number;
  porcentaje_merma?: number;
  usuario_id?: number | null;
  fecha_creacion: string; // ISO date string
  fecha_actualizacion: string; // ISO date string
}
