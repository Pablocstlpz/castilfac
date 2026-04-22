export interface HistorialPrecioEmpresa {
  id?: number;
  precio_empresa_id: number;
  empresa_id: number;
  material_id: number;
  precio_anterior?: number | null;
  precio_nuevo: number;
  usuario_id?: number | null;
  motivo?: string | null;
  fecha_registro?: string;
}
