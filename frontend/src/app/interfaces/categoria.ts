export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string | null;
  orden?: number;
  activo?: boolean;
  fecha_creacion: string; // ISO date string
}
