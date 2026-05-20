import { Component, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Authentication } from '../../services/authentication';
import { UsuariosServices } from '../../services/usuarios';
import { PedidosServices } from '../../services/pedidos';
import { Presupuestos as PresupuestosService } from '../../services/presupuestos';
import { Presupuesto } from '../../interfaces/presupuesto';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-inicioadmin',
  imports: [MatIconModule, CommonModule, DecimalPipe, RouterLink, TranslatePipe],
  templateUrl: './inicioadmin.html',
  styleUrl: './inicioadmin.css',
})
export class Inicioadmin {
  private authentication = inject(Authentication);
  private router = inject(Router);
  private usuariosServices = inject(UsuariosServices);
  private pedidosServices = inject(PedidosServices);
  private presupuestosService = inject(PresupuestosService);

  //numero total de usuarios de la empresa que se muestra en las tarjetas
  public numeroUsuarios = signal<number>(0);
  //numero de pedidos en fabricacion que se muestra en las tarjetas
  public numeroPedidos = signal<number>(0);
  //todos los presupuestos de la empresa, los uso para calcular las estadisticas
  public todosPresupuestos = signal<Presupuesto[]>([]);
  public cargando = signal<boolean>(true);

  //numero de presupuestos creados en el mes actual
  public presupuestosMes = computed(() => {
    const ahora = new Date();
    return this.todosPresupuestos().filter((p) => {
      const fecha = new Date(p.fecha_creacion);
      return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear();
    }).length;
  });

  //numero de presupuestos creados en el mes anterior, para comparar con el actual
  public presupuestosUltimoMes = computed(() => {
    const ahora = new Date();
    const mesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
    return this.todosPresupuestos().filter((p) => {
      const fecha = new Date(p.fecha_creacion);
      return (
        fecha.getMonth() === mesAnterior.getMonth() &&
        fecha.getFullYear() === mesAnterior.getFullYear()
      );
    }).length;
  });

  //porcentaje de cambio entre el mes actual y el anterior para mostrar la subida o bajada
  public porcentajeCambioMes = computed(() => {
    const anterior = this.presupuestosUltimoMes();
    //si el mes anterior fue 0 no se puede calcular porcentaje, devuelvo null
    if (anterior === 0) return null;
    return Math.round(((this.presupuestosMes() - anterior) / anterior) * 100);
  });

  //suma de todos los presupuestos aprobados como ingresos estimados
  public ingresosEstimados = computed(() => {
    return this.todosPresupuestos()
      .filter((p) => p.estado === 'aprobado')
      .reduce((acc, p) => acc + (Number(p.precio_final) || 0), 0);
  });

  ngOnInit() {
    //al cargar el panel, traigo los datos del usuario para sacar el empresa_id
    const usuario = this.authentication.obtenerUsuarioSesion();
    if (!usuario) { this.router.navigate(["/sesioncerrada"]); return; }
    forkJoin({
      usuarios: this.usuariosServices.getUsuarioPorEmpresa(usuario.empresa_id),
      pedidos: this.pedidosServices.getPedidosByEmpresa(usuario.empresa_id),
      presupuestos: this.presupuestosService.getPresupuestosEmpresa(usuario.empresa_id),
    }).subscribe({
      next: ({ usuarios, pedidos, presupuestos }) => {
        this.numeroUsuarios.set(usuarios.length);
        //filtro solo los que estan en estado en_fabricacion porque son los trabajos activos
        this.numeroPedidos.set(pedidos.filter((p) => p.estado_fabricacion === 'en_fabricacion').length);
        this.todosPresupuestos.set(presupuestos);
        this.cargando.set(false);
      },
      error: () => { this.cargando.set(false); },
    });
  }

  //funcion para cerrar la sesion del usuario y redirigir a la pantalla de sesion cerrada
  cerrarSesion() {
    this.authentication.cerrarSesion();
    this.router.navigate(['/sesioncerrada']);
  }
}
