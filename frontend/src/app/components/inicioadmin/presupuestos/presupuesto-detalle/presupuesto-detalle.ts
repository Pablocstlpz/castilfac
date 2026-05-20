import { Component, inject, OnInit, signal } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { Presupuesto } from '../../../../interfaces/presupuesto';
import { Usuario } from '../../../../interfaces/usuario';
import { Presupuestos } from '../../../../services/presupuestos';
import { PedidosServices } from '../../../../services/pedidos';
import { UsuariosServices } from '../../../../services/usuarios';
import { Authentication } from '../../../../services/authentication';
import { PdfService } from '../../../../services/pdf';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SpinnerCargaDatos } from '../../../partes-html/spinner-carga-datos/spinner-carga-datos';

@Component({
  selector: 'app-presupuesto-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatSnackBarModule, TranslatePipe, SpinnerCargaDatos],
  templateUrl: './presupuesto-detalle.html',
  styleUrl: './presupuesto-detalle.css',
})
export class PresupuestoDetalle implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private snackBar = inject(MatSnackBar);
  private presupuestosService = inject(Presupuestos);
  private pedidosService = inject(PedidosServices);
  private usuariosService = inject(UsuariosServices);
  private authentication = inject(Authentication);
  private pdfService = inject(PdfService);
  private translate = inject(TranslateService);

  //signal con el presupuesto que estamos viendo
  public presupuesto = signal<Presupuesto | null>(null);
  //signal con la lista de operarios de la empresa, para asignar uno al convertir a pedido
  public operarios = signal<Usuario[]>([]);
  //indica si este presupuesto ya tiene un pedido creado a partir de el (para no permitir crear otro)
  public tienePedido = signal<boolean>(false);
  //controla si el modal de convertir a pedido esta visible
  public modalPedidoVisible = signal(false);
  public cargando = signal<boolean>(true);

  //datos del formulario del modal de creacion de pedido
  public operarioSeleccionado: number | null = null;
  public fechaInicioEstimada: string = '';
  public fechaEntregaEstimada: string = '';

  //listado de estados disponibles que se muestran en el selector
  public estadosDisponibles: { valor: Presupuesto['estado']; etiqueta: string }[] = [];

  ngOnInit(): void {
    //inicializo las etiquetas traducidas de los estados disponibles
    this.estadosDisponibles = [
      { valor: 'borrador', etiqueta: this.translate.instant('quotes.statusDraft') },
      { valor: 'enviado', etiqueta: this.translate.instant('quotes.statusSent') },
      { valor: 'aprobado', etiqueta: this.translate.instant('quotes.statusApproved') },
      { valor: 'rechazado', etiqueta: this.translate.instant('quotes.statusRejected') },
      { valor: 'caducado', etiqueta: this.translate.instant('quotes.statusExpired') },
    ];

    const usuario = this.authentication.obtenerUsuarioSesion();

    //leo el id del presupuesto de la url y cargo los datos en paralelo
    this.route.params.subscribe((params) => {
      const idPresupuesto = params['id'];

      if (idPresupuesto) {
        forkJoin({
          presupuesto: this.presupuestosService.getPresupuesto(Number(idPresupuesto)),
          tienePedido: this.pedidosService.existePedidoDePresupuesto(Number(idPresupuesto)),
          operarios: usuario
            ? this.usuariosService.getUsuarioPorEmpresa(usuario.empresa_id)
            : of([] as Usuario[]),
        }).subscribe({
          next: ({ presupuesto, tienePedido, operarios }) => {
            this.presupuesto.set(presupuesto);
            this.tienePedido.set(tienePedido.existe);
            this.operarios.set(operarios.filter((u) => u.rol === 'operario'));
            this.cargando.set(false);
          },
          error: (err) => {
            const mensaje = err.message || this.translate.instant('quotes.quoteLoadError');
            this.mostrarErrorYVolver(mensaje);
          },
        });
      } else {
        this.mostrarErrorYVolver(this.translate.instant('quotes.noQuoteId'));
      }
    });
  }

  //funcion para cambiar el estado del presupuesto (con rollback visual si falla)
  cambiarEstado(nuevoEstado: string): void {
    const pres = this.presupuesto();
    if (!pres) return;

    //guardo el estado anterior por si la peticion falla y tengo que revertir el signal
    const estadoAnterior = pres.estado;
    this.presupuesto.set({ ...pres, estado: nuevoEstado as Presupuesto['estado'] });

    this.presupuestosService.patchEstadoPresupuesto(pres.id, nuevoEstado).subscribe({
      next: () => {
        this.snackBar.open(this.translate.instant('quotes.statusUpdated'), this.translate.instant('common.close'), { duration: 3000 });
      },
      error: (err) => {
        //revierto al estado anterior porque no se ha guardado en el backend
        this.presupuesto.set({ ...pres, estado: estadoAnterior });
        this.snackBar.open(err.message || this.translate.instant('quotes.statusChangeError'), this.translate.instant('common.close'), { duration: 3000 });
      },
    });
  }

  //funcion para abrir el modal de convertir presupuesto a pedido
  abrirModalPedido(): void {
    this.modalPedidoVisible.set(true);
  }

  //funcion para cerrar el modal y resetear los campos del formulario
  cerrarModalPedido(): void {
    this.modalPedidoVisible.set(false);
    this.operarioSeleccionado = null;
    this.fechaInicioEstimada = '';
    this.fechaEntregaEstimada = '';
  }

  //funcion para confirmar la conversion del presupuesto a pedido
  confirmarConversionAPedido(): void {
    const pres = this.presupuesto();
    if (!pres || !this.operarioSeleccionado) return;

    //monto el objeto del nuevo pedido con los datos del presupuesto y los del modal
    const nuevoPedido = {
      empresa_id: pres.empresa_id,
      presupuesto_id: pres.id,
      cliente_id: pres.cliente_id,
      operario_asignado_id: this.operarioSeleccionado,
      importe_acordado: pres.precio_final || 0,
      fecha_inicio_estimada: this.fechaInicioEstimada || null,
      fecha_entrega_estimada: this.fechaEntregaEstimada || null,
    };

    this.pedidosService.createPedido(nuevoPedido).subscribe({
      next: () => {
        //al crear el pedido, marco el presupuesto como aprobado y actualizo el estado local
        this.cambiarEstado('aprobado');
        this.tienePedido.set(true);
        this.cerrarModalPedido();
        this.snackBar.open(this.translate.instant('quotes.orderCreated'), this.translate.instant('common.close'), { duration: 3000 });
        this.router.navigate(['/inicioadmin/pedidos']);
      },
      error: (err) => {
        this.snackBar.open(err.message || this.translate.instant('quotes.orderCreateError'), this.translate.instant('common.close'), { duration: 3000 });
      },
    });
  }

  //funcion para calcular el coste total de produccion (materiales + mano obra + otros)
  calcularTotalProduccion(pres: Presupuesto): number {
    return (
      Number(pres.coste_materiales || 0) +
      Number(pres.coste_mano_obra || 0) +
      Number(pres.otros_costes || 0)
    );
  }

  //funcion para calcular el descuento total = precio sin descuento - precio final
  calcularDescuentoTotal(pres: Presupuesto): number {
    return Number(pres.precio_sin_descuento || 0) - Number(pres.precio_final || 0);
  }

  //funcion para mostrar un error por snackbar y volver atras
  mostrarErrorYVolver(mensaje: string): void {
    this.snackBar.open(mensaje, this.translate.instant('common.understood'), { duration: 4000 });
    this.volver();
  }

  //funcion para traducir el estado del presupuesto a un texto legible
  etiquetaEstadoPresupuesto(estado: string): string {
    const keys: Record<string, string> = {
      borrador: 'quotes.statusDraft',
      enviado: 'quotes.statusSent',
      aprobado: 'quotes.statusApproved',
      rechazado: 'quotes.statusRejected',
      caducado: 'quotes.statusExpired',
    };
    const key = keys[estado];
    return key ? this.translate.instant(key) : estado;
  }

  //funcion para volver atras a la pantalla anterior
  volver(): void {
    this.location.back();
  }

  //funcion para generar el PDF de la hoja de fabricacion del presupuesto
  exportarPDF(): void {
    const pres = this.presupuesto();
    if (!pres) return;
    //paso [] como lista maestra porque el desglose ya tiene el tipo_unidad guardado
    this.pdfService.generarHojaFabricacion(pres, []);
  }

  //funcion para ir a la pantalla de edicion del presupuesto
  editarPresupuesto(): void {
    if (this.presupuesto()) {
      this.router.navigate(['/inicioadmin/presupuestos/editar', this.presupuesto()?.id]);
    }
  }
}
