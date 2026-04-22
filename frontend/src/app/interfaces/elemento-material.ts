export interface ElementoMaterial {
  id?: number;
  elemento_id: number;
  material_id: number;
  nombre_material_snapshot: string;
  cantidad_calculada: number;
  precio_congelado: number;
  descuento_aplicado?: number | null;
  coste_total?: number | null;
}
