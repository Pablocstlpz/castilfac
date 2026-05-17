import { Component, computed, inject, signal } from '@angular/core';
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
    const usuario = this.authentication.obtenerUsuarioSesion()!;
    this.obtenerUsuarios(usuario.empresa_id);
    this.obtenerTrabajos(usuario.empresa_id);
    this.obtenerPresupuestos(usuario.empresa_id);
  }

  //funcion para cerrar la sesion del usuario y redirigir a la pantalla de sesion cerrada
  cerrarSesion() {
    this.authentication.cerrarSesion();
    this.router.navigate(['/sesioncerrada']);
  }

  //funcion para contar cuantos usuarios tiene la empresa
  obtenerUsuarios(empresa_id: number) {
    this.usuariosServices.getUsuarioPorEmpresa(empresa_id).subscribe({
      next: (usuarios) => this.numeroUsuarios.set(usuarios.length),
      error: () => {},
    });
  }

  //funcion para contar cuantos pedidos en fabricacion tiene la empresa
  obtenerTrabajos(empresa_id: number) {
    this.pedidosServices.getPedidosByEmpresa(empresa_id).subscribe({
      next: (pedidos) => {
        //filtro solo los que estan en estado en_fabricacion porque son los trabajos activos
        const enFabricacion = pedidos.filter((p) => p.estado_fabricacion === 'en_fabricacion');
        this.numeroPedidos.set(enFabricacion.length);
      },
      error: () => {},
    });
  }

  //funcion para cargar todos los presupuestos de la empresa
  obtenerPresupuestos(empresa_id: number) {
    this.presupuestosService.getPresupuestosEmpresa(empresa_id).subscribe({
      next: (data) => this.todosPresupuestos.set(data),
      error: () => {},
    });
  }
}
