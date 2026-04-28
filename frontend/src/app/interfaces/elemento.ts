export interface Elemento {
  id?: number;
  presupuesto_id: number;
  orden?: number | null;
  tipo_producto?: string | null;
  descripcion: string;
  medida_ancho: number;
  medida_alto: number;
  cantidad?: number | null;
  tiempo_estimado_minutos?: number | null;
  notas_fabricacion?: string | null;
  coste_linea?: number | null;
  fecha_creacion?: string;
}
