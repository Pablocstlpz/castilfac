import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { Presupuesto } from '../../../../interfaces/presupuesto'; 
// import { PresupuestosService } from '../../../../services/presupuestos.service';

@Component({
  selector: 'app-presupuesto-detalle',
  standalone: true,
  imports: [
    CommonModule, 
    MatIconModule
  ],
  templateUrl: './presupuesto-detalle.html',
  styleUrl: './presupuesto-detalle.css'
})
export class PresupuestoDetalle {
  
  // --- INYECCIÓN DE DEPENDENCIAS ---
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  // private presupuestosService = inject(PresupuestosService);

  // --- ESTADO DEL COMPONENTE (SIGNALS) ---
  public presupuesto = signal<Presupuesto | null>(null);

  ngOnInit(): void {
    // Escuchamos la URL para coger el ID del presupuesto a mostrar
    this.route.params.subscribe((params) => {
      const idPresupuesto = params['id'];
      
      if (idPresupuesto) {
        this.cargarPresupuesto(Number(idPresupuesto));
      } else {
        console.error('No se ha encontrado el ID del presupuesto en la URL');
        this.volver();
      }
    });
  }

  // --- MÉTODOS PRINCIPALES ---

  cargarPresupuesto(id: number): void {
    // TODO: Sustituir esto por la llamada a tu backend real. Ejemplo:
    /*
    this.presupuestosService.getPresupuestoById(id).subscribe({
      next: (data) => this.presupuesto.set(data),
      error: (err) => console.error('Error al cargar el presupuesto:', err)
    });
    */

    // Datos simulados para visualizar la maquetación
    setTimeout(() => {
      this.presupuesto.set({
        id: id,
        empresa_id: 1,
        numero_presupuesto: 'PRE-2026-0045',
        cliente_id: 10,
        cliente_nombre: 'Carpintería Metálica Hermanos Gómez',
        usuario_id: 2,
        version: 1,
        estado: 'enviado', // Prueba a cambiarlo por 'borrador' o 'rechazado' para ver los colores del ngClass
        coste_materiales: 1250.50,
        coste_mano_obra: 450.00,
        otros_costes: 50.00,
        detalle_otros_costes: 'Transporte a obra',
        porcentaje_beneficio: 30,
        precio_sin_descuento: 2275.65,
        descuento_aplicado: 5,
        precio_final: 2161.86,
        fecha_creacion: new Date().toISOString(),
        fecha_actualizacion: new Date().toISOString(),
        notas_cliente: 'El presupuesto tiene una validez de 15 días desde la fecha de emisión.',
        elementos: [
          {
            id: 101,
            nombre: 'Ventana Corredera Aluminio 120x100',
            cantidad: 2,
            precio_final: 850.00,
            materiales_desglose: [
              {
                id: 1,
                cantidad: 4.5,
                precio_unitario_aplicado: 12.50,
                Material: { id: 10, nombre: 'Perfil Aluminio Blanco', codigo_interno: 'PER-AL-BL', tipo_unidad: 'metros_lineales' }
              }
            ]
          }
        ]
      } as Presupuesto);
    }, 800); 
  }

  // --- MÉTODOS DE NAVEGACIÓN Y ACCIONES ---

  volver(): void {
    this.location.back();
  }

  exportarPDF(): void {
    console.log('Exportando PDF del presupuesto:', this.presupuesto()?.numero_presupuesto);
  }

  editarPresupuesto(): void {
    if(this.presupuesto()) {
      this.router.navigate(['/presupuestos/editar', this.presupuesto()?.id]);
    }
  }

  convertirAPedido(): void {
    console.log('Convirtiendo a pedido...');
  }
}