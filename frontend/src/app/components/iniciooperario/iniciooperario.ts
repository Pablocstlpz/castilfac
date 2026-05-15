import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Authentication } from '../../services/authentication';
import { Router } from '@angular/router';
import { Usuario } from '../../interfaces/usuario';
import { PedidosServices } from '../../services/pedidos';
import { Presupuestos as PresupuestosService } from '../../services/presupuestos';
import { PdfService } from '../../services/pdf';
import { Pedido } from '../../interfaces/pedido';
import { Signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-iniciooperario',
  imports: [CommonModule, MatIconModule],
  templateUrl: './iniciooperario.html',
  styleUrl: './iniciooperario.css',
})
export class Iniciooperario {
  private authentication = inject(Authentication);
  private router = inject(Router);
  public usuario: Usuario = this.authentication.obtenerUsuarioSesion()!;
  private pedidosServices = inject(PedidosServices);
  private presupuestosService = inject(PresupuestosService);
  private pdfService = inject(PdfService);
  public pedidosArray = signal<Pedido[]>([]);
  private snackBar = inject(MatSnackBar);

  ngOnInit(): void {
    this.obtenerPedidosEnFabricacion();
  }

  //cerrar sesion
  cerrarSesion() {
    this.authentication.cerrarSesion();
    this.router.navigate(['/sesioncerrada']);
  }

  //obtener todos los pedidos de este operario que esten en fabricacion
  obtenerPedidosEnFabricacion() {
    this.pedidosServices.getPedidosByOperario(this.usuario.id).subscribe((pedidos) => {
      this.pedidosArray.set(pedidos);
    });
  }

  verHojaFabricacion(presupuestoId: number): void {
    this.presupuestosService.getPresupuesto(presupuestoId).subscribe({
      next: (pres) => this.pdfService.generarHojaFabricacion(pres, []),
      error: () => this.snackBar.open('No se pudo cargar la hoja de fabricacion', 'Cerrar', {
        duration: 3000,
        panelClass: 'snackbar-error',
        horizontalPosition: 'end',
        verticalPosition: 'top',
      }),
    });
  }

  //marcar como fabricado cuando se da click al boton
  marcarFabricado(id: number): void {
    try {
      this.pedidosServices.marcarComoFabricado(id).subscribe({
        next: () => {
          this.obtenerPedidosEnFabricacion();
          this.snackBar.open('Pedido marcado como fabricado', 'Cerrar', {
            duration: 3000,
            panelClass: 'snackbar-success',
            horizontalPosition: 'end',
            verticalPosition: 'top',
          });
        },
        error: (err) => {
          console.error(err);
          this.snackBar.open(err?.message ?? 'No se pudo marcar el pedido', 'Cerrar', {
            duration: 4000,
            panelClass: 'snackbar-error',
            horizontalPosition: 'end',
            verticalPosition: 'top',
          });
        },
      });
    } catch (error) {
      console.log(error);
    }
  }
}
