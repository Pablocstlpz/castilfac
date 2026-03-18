export interface Pedido {
    id: number;
    empresa_id: number;
    numero_pedido: string;
    presupuesto_id: number;
    cliente_id: number;
    estado_fabricacion: 'pendiente' | 'en_fabricacion' | 'fabricado' | 'entregado' | 'instalado' | 'finalizado' | 'cancelado';
    fecha_pedido: Date;
    fecha_inicio_estimada: Date | null;
    fecha_entrega_estimada: Date | null;
    fecha_entrega_real: Date | null;
    fecha_instalacion: Date | null;
    importe_acordado: number;
    importe_pagado: number;
    operario_asignado_id: number | null;
    notas_operario: string | null;
    fecha_creacion: Date;
    fecha_actualizacion: Date;
    cliente_nombre: string;
    cliente_direccion: string | null;
  }