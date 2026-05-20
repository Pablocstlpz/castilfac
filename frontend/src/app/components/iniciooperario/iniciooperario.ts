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
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SpinnerCargaDatos } from '../partes-html/spinner-carga-datos/spinner-carga-datos';

@Component({
  selector: 'app-iniciooperario',
  imports: [CommonModule, MatIconModule, TranslatePipe, SpinnerCargaDatos],
  templateUrl: './iniciooperario.html',
  styleUrl: './iniciooperario.css',
})
export class Iniciooperario {
  private authentication = inject(Authentication);
  private router = inject(Router);
  //usuario operario en sesion, lo cargo en ngOnInit con null-check para que no rompa si se borra la sesion en otra pestaña
  public usuario!: Usuario;
  private pedidosServices = inject(PedidosServices);
  private presupuestosService = inject(PresupuestosService);
  private pdfService = inject(PdfService);
  //signal con los pedidos en fabricacion que tiene asignados el operario
  public pedidosArray = signal<Pedido[]>([]);
  public cargando = signal<boolean>(true);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);

  ngOnInit(): void {
    //compruebo que hay sesion antes de usar el usuario, si no rebote a /sesioncerrada
    const usuario = this.authentication.obtenerUsuarioSesion();
    if (!usuario) { this.router.navigate(['/sesioncerrada']); return; }
    this.usuario = usuario;
    this.obtenerPedidosEnFabricacion();
  }

  //funcion para cerrar sesion
  cerrarSesion() {
    this.authentication.cerrarSesion();
    this.router.navigate(['/sesioncerrada']);
  }

  //funcion para obtener todos los pedidos de este operario que esten en fabricacion
  obtenerPedidosEnFabricacion() {
    this.cargando.set(true);
    this.pedidosServices.getPedidosByOperario(this.usuario.id).subscribe({
      next: (pedidos) => {
        this.pedidosArray.set(pedidos);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
      },
    });
  }

  //funcion para ver/descargar la hoja de fabricacion del presupuesto vinculado al pedido
  verHojaFabricacion(presupuestoId: number): void {
    //pido el presupuesto completo y se lo paso al servicio de PDF para generar la hoja
    this.presupuestosService.getPresupuesto(presupuestoId).subscribe({
      next: (pres) => this.pdfService.generarHojaFabricacion(pres, []),
      error: () =>
        this.snackBar.open(
          this.translate.instant('operario.sheetLoadError'),
          this.translate.instant('common.close'),
          {
            duration: 3000,
            panelClass: 'snackbar-error',
            horizontalPosition: 'end',
            verticalPosition: 'top',
          },
        ),
    });
  }

  //funcion para marcar un pedido como fabricado cuando el operario da click al boton
  marcarFabricado(id: number): void {
    this.pedidosServices.marcarComoFabricado(id).subscribe({
        next: () => {
          //recargo el listado para que el pedido marcado desaparezca de "en fabricacion"
          this.obtenerPedidosEnFabricacion();
          this.snackBar.open(
            this.translate.instant('operario.orderMarkedFabricated'),
            this.translate.instant('common.close'),
            {
              duration: 3000,
              panelClass: 'snackbar-success',
              horizontalPosition: 'end',
              verticalPosition: 'top',
            },
          );
        },
        error: (err) => {
          this.snackBar.open(
            err?.message ?? this.translate.instant('operario.markOrderError'),
            this.translate.instant('common.close'),
            {
              duration: 4000,
              panelClass: 'snackbar-error',
              horizontalPosition: 'end',
              verticalPosition: 'top',
            },
          );
        },
    });
  }
}
