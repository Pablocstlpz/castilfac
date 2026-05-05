import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

// Módulos de Material
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// Interfaz y Servicio (Ajusta las rutas según tu estructura de carpetas)
import { Presupuesto } from '../../../../interfaces/presupuesto';
import { Presupuestos } from '../../../../services/presupuestos';

@Component({
  selector: 'app-presupuesto-detalle',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatSnackBarModule],
  templateUrl: './presupuesto-detalle.html',
  styleUrl: './presupuesto-detalle.css',
})
export class PresupuestoDetalle implements OnInit {
  // --- INYECCIÓN DE DEPENDENCIAS ---
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private snackBar = inject(MatSnackBar);

  // Inyectamos tu servicio real
  private presupuestosService = inject(Presupuestos);

  // --- ESTADO DEL COMPONENTE (SIGNALS) ---
  public presupuesto = signal<Presupuesto | null>(null);

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const idPresupuesto = params['id'];

      if (idPresupuesto) {
        this.cargarPresupuesto(Number(idPresupuesto));
      } else {
        this.mostrarErrorYVolver('No se ha encontrado el ID del presupuesto en la URL');
      }
    });
  }

  // --- MÉTODOS PRINCIPALES ---

  cargarPresupuesto(id: number): void {
    this.presupuestosService.getPresupuesto(id).subscribe({
      next: (datosBackend) => {
        this.presupuesto.set(datosBackend);
      },
      error: (err) => {
        console.error('Error al cargar el presupuesto:', err);
        const mensaje = err.message || 'El presupuesto no existe o hubo un error de conexión';
        this.mostrarErrorYVolver(mensaje);
      },
    });
  }

  mostrarErrorYVolver(mensaje: string): void {
    this.snackBar.open(mensaje, 'Entendido', { duration: 4000 });
    this.volver();
  }

  // --- CALCULADORAS SEGURAS (Evitan el error de concatenación de la imagen) ---

  calcularTotalProduccion(pres: Presupuesto): number {
    return (
      Number(pres.coste_materiales || 0) +
      Number(pres.coste_mano_obra || 0) +
      Number(pres.otros_costes || 0)
    );
  }

  calcularDescuentoTotal(pres: Presupuesto): number {
    return Number(pres.precio_sin_descuento || 0) - Number(pres.precio_final || 0);
  }

  // --- MÉTODOS DE NAVEGACIÓN Y ACCIONES ---

  volver(): void {
    this.location.back();
  }

  exportarPDF(): void {
    console.log('Exportando PDF...');
  }

  editarPresupuesto(): void {
    if (this.presupuesto()) {
      this.router.navigate(['/presupuestos/editar', this.presupuesto()?.id]);
    }
  }

  convertirAPedido(): void {
    console.log('Convirtiendo a pedido...');
  }
}
