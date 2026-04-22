export interface PlantillaMaterial {
  id: number;
  plantilla_id: number;
  material_id: number;
  tipo_calculo: 'perimetro' | 'area' | 'fijo' | 'por_metro_ancho' | 'por_metro_largo';
  cantidad_fija?: number | null;
  factor_desperdicio?: number;
}
