export interface HistorialPrecioBase {
  id?: number;
  material_id: number;
  precio_anterior?: number | null;
  precio_nuevo: number;
  usuario_admin_id?: number | null;
  motivo?: string | null;
  fecha_registro?: string;
}
