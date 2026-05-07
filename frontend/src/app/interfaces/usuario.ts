export interface Usuario {
    id: number;
    empresa_id: number;
    nombre: string;
    email: string;
    password: string;
    rol: string;
    activo: boolean;
    fecha_creacion: Date;
    fecha_actualizacion: Date;
    deleted_at: Date | null;
}
