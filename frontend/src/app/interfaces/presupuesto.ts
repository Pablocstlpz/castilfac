export interface MaterialDesglose {
  id: number;
  material_id: number;
  nombre_material_snapshot: string;
  cantidad_calculada: number;
  precio_congelado: number;
  factor_desperdicio: number;
  tipo_unidad: string;
  coste_total: number;
}

export interface ElementoPresupuesto {
  id: number;
  descripcion: string;
  cantidad: number;
  medida_ancho: number;
  medida_alto: number;
  tiempo_estimado_minutos: number;
  notas_fabricacion: string;
  orden: number;
  coste_linea: number;
  materiales_desglose: MaterialDesglose[];
}

export interface Presupuesto {
  id: number;
  empresa_id: number;
  numero_presupuesto: string;
  cliente_id: number;
  cliente_nombre: string;
  usuario_id: number;
  version?: number;
  coste_materiales?: number;
  coste_mano_obra?: number;
  otros_costes?: number;
  porcentaje_beneficio?: number;
  precio_sin_descuento?: number;
  descuento_aplicado?: number;
  motivo_descuento?: string | null;
  precio_final?: number;
  estado: 'borrador' | 'enviado' | 'aprobado' | 'rechazado' | 'caducado';
  valido_hasta?: string | null;
  fecha_creacion: string;
  fecha_envio?: string | null;
  fecha_respuesta?: string | null;
  fecha_actualizacion: string;
  notas_internas?: string | null;
  notas_cliente?: string | null;
  deleted_at?: string | null;
  elementos: ElementoPresupuesto[];
}
