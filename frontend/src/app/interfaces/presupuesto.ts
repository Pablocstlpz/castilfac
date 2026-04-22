export interface Presupuesto {
  id: number;
  empresa_id: number;
  numero_presupuesto: string;
  cliente_id: number;
  usuario_id: number;
  version?: number;
  coste_materiales?: number;
  coste_mano_obra?: number;
  otros_costes?: number;
  detalle_otros_costes?: string | null;
  porcentaje_beneficio?: number;
  precio_sin_descuento?: number;
  descuento_aplicado?: number;
  motivo_descuento?: string | null;
  precio_final?: number;
  estado: 'borrador' | 'enviado' | 'aprobado' | 'rechazado' | 'aceptado' | 'anulado' | 'facturado';
  valido_hasta?: string | null;
  fecha_creacion: string;
  fecha_envio?: string | null;
  fecha_respuesta?: string | null;
  fecha_actualizacion: string;
  notas_internas?: string | null;
  notas_cliente?: string | null;
  deleted_at?: string | null;
}
