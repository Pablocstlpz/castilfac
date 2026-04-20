export interface Cliente {
  id: number;
  empresa_id: number;
  nombre_empresa_o_particular: string;
  nif_cif?: string; // El '?' significa que puede ser undefined/null
  telefono?: string;
  email?: string;
  tipo_cliente: 'particular' | 'empresa' | 'vip' | 'mayorista';
  descuento_fijo: number;
  direccion?: string;
  fecha_creacion: Date | string; // Sequelize devuelve string ISO, pero podemos manejarlo como Date
  fecha_actualizacion: Date | string;
  deleted_at?: Date | string | null;
}
