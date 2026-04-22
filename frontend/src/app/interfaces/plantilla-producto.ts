export interface PlantillaProducto {
  id: number;
  empresa_id: number;
  nombre: string;
  descripcion?: string | null;
  categoria_producto?: string | null;
  tiempo_fabricacion_base_minutos?: number;
  activo?: boolean;
  fecha_creacion: string; // ISO date string
}
