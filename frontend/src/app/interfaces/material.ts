export interface Material {
  id: number;
  categoria_id: number;
  codigo_interno?: string | null;
  nombre: string;
  descripcion?: string | null;
  tipo_unidad: 'metros_lineales' | 'metros_cuadrados' | 'unidades' | 'kilogramos' | 'litros';
  precio_base: number;
  porcentaje_merma_recomendado?: number;
  proveedor?: string | null;
  referencia_proveedor?: string | null;
  atributos_extra?: string | null;
  imagen_url?: string | null;
  activo?: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
  deleted_at?: string | null;
  usuario_id?: number | null;
}

export interface MaterialConPrecio extends Material {
  categoria_nombre: string;
  precio_venta: number;
  porcentaje_merma: number;
}
