export interface Empresa {
    id: number;
    nombre_comercial: string;
    razon_social: string;
    nif: string;
    email: string;
    telefono: string;
    direccion: string;
    codigo_postal: string;
    ciudad: string;
    provincia: string;
    suscripcion_activa: boolean;
    fecha_vencimiento: Date;
    activo: boolean;
    logo_url: string;
    fecha_registro: Date;
    fecha_actualizacion: Date;
}
