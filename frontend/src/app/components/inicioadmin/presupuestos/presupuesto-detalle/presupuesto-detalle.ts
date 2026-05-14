import { Component, inject, OnInit, signal } from '@angular/core';
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

@Component({
  selector: 'app-presupuesto-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatSnackBarModule],
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

  public presupuesto = signal<Presupuesto | null>(null);
  public operarios = signal<Usuario[]>([]);
  public tienePedido = signal<boolean>(false);
  public modalPedidoVisible = signal(false);

  //datos del formulario del modal
  public operarioSeleccionado: number | null = null;
  public fechaInicioEstimada: string = '';
  public fechaEntregaEstimada: string = '';

  public estadosDisponibles: { valor: Presupuesto['estado']; etiqueta: string }[] = [
    { valor: 'borrador', etiqueta: 'Borrador' },
    { valor: 'enviado', etiqueta: 'Enviado' },
    { valor: 'aprobado', etiqueta: 'Aprobado' },
    { valor: 'rechazado', etiqueta: 'Rechazado' },
    { valor: 'caducado', etiqueta: 'Caducado' },
  ];

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const idPresupuesto = params['id'];

      if (idPresupuesto) {
        this.cargarPresupuesto(Number(idPresupuesto));
        this.comprobarSiTienePedido(Number(idPresupuesto));
      } else {
        this.mostrarErrorYVolver('No se ha encontrado el ID del presupuesto en la URL');
      }
    });

    const usuario = this.authentication.obtenerUsuarioSesion();
    if (usuario) {
      this.usuariosService.getUsuarioPorEmpresa(usuario.empresa_id).subscribe({
        next: (data) => this.operarios.set(data.filter((u) => u.rol === 'operario')),
        error: () => {},
      });
    }
  }

  cargarPresupuesto(id: number): void {
    this.presupuestosService.getPresupuesto(id).subscribe({
      next: (datos) => this.presupuesto.set(datos),
      error: (err) => {
        const mensaje = err.message || 'El presupuesto no existe o hubo un error de conexión';
        this.mostrarErrorYVolver(mensaje);
      },
    });
  }

  comprobarSiTienePedido(presupuestoId: number): void {
    this.pedidosService.existePedidoDePresupuesto(presupuestoId).subscribe({
      next: (res) => this.tienePedido.set(res.existe),
      error: () => {},
    });
  }

  cambiarEstado(nuevoEstado: string): void {
    const pres = this.presupuesto();
    if (!pres) return;

    const estadoAnterior = pres.estado;
    this.presupuesto.set({ ...pres, estado: nuevoEstado as Presupuesto['estado'] });

    this.presupuestosService.patchEstadoPresupuesto(pres.id, nuevoEstado).subscribe({
      next: () => {
        this.snackBar.open('Estado actualizado correctamente', 'Cerrar', { duration: 3000 });
      },
      error: (err) => {
        this.presupuesto.set({ ...pres, estado: estadoAnterior });
        this.snackBar.open(err.message || 'Error al cambiar el estado', 'Cerrar', { duration: 3000 });
      },
    });
  }

  abrirModalPedido(): void {
    this.modalPedidoVisible.set(true);
  }

  cerrarModalPedido(): void {
    this.modalPedidoVisible.set(false);
    this.operarioSeleccionado = null;
    this.fechaInicioEstimada = '';
    this.fechaEntregaEstimada = '';
  }

  confirmarConversionAPedido(): void {
    const pres = this.presupuesto();
    if (!pres || !this.operarioSeleccionado) return;

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
        this.cambiarEstado('aprobado');
        this.tienePedido.set(true);
        this.cerrarModalPedido();
        this.snackBar.open('Pedido creado correctamente', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/inicioadmin/pedidos']);
      },
      error: (err) => {
        this.snackBar.open(err.message || 'Error al crear el pedido', 'Cerrar', { duration: 3000 });
      },
    });
  }

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

  mostrarErrorYVolver(mensaje: string): void {
    this.snackBar.open(mensaje, 'Entendido', { duration: 4000 });
    this.volver();
  }

  volver(): void {
    this.location.back();
  }

  exportarPDF(): void {
    const pres = this.presupuesto();
    if (!pres) return;
    // El desglose ya almacena tipo_unidad, pasamos [] como lista maestra (fallback interno del servicio)
    this.pdfService.generarHojaFabricacion(pres, []);
  }

  editarPresupuesto(): void {
    if (this.presupuesto()) {
      this.router.navigate(['/inicioadmin/presupuestos/editar', this.presupuesto()?.id]);
    }
  }
}
