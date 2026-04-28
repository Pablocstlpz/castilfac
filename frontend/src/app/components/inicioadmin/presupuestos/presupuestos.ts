import { Component, inject, signal, computed } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { DatePipe, DecimalPipe, NgClass, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Presupuestos as PresupuestosService } from '../../../services/presupuestos';
import { ClientesServices } from '../../../services/clientes';
import { Authentication } from '../../../services/authentication';
import { Presupuesto } from '../../../interfaces/presupuesto';
import { Cliente } from '../../../interfaces/cliente';

@Component({
  selector: 'app-presupuestos',
  imports: [MatIcon, DatePipe, DecimalPipe, NgClass, TitleCasePipe, FormsModule],
  templateUrl: './presupuestos.html',
  styleUrl: './presupuestos.css',
})
export class Presupuestos {
  private presupuestosService = inject(PresupuestosService);
  private clientesServices = inject(ClientesServices);
  private authentication = inject(Authentication);
  private router = inject(Router);

  public presupuestos = signal<Presupuesto[]>([]);
  public clientes = signal<Cliente[]>([]);
  public busqueda = signal<string>('');
  public filtroEstado = signal<string>('todos');

  public presupuestosFiltrados = computed(() => {
    const q = this.busqueda().toLowerCase().trim();
    const estado = this.filtroEstado();
    return this.presupuestos().filter((p) => {
      const coincideEstado = estado === 'todos' || p.estado === estado;
      const coincideBusqueda =
        !q ||
        p.numero_presupuesto.toLowerCase().includes(q) ||
        this.getNombreCliente(p.cliente_id).toLowerCase().includes(q);
      return coincideEstado && coincideBusqueda;
    });
  });

  public statBorradores = computed(
    () => this.presupuestos().filter((p) => p.estado === 'borrador').length,
  );

  public statPendientesRespuesta = computed(
    () => this.presupuestos().filter((p) => p.estado === 'enviado').length,
  );

  public statAprobadosMes = computed(() => {
    const now = new Date();
    return this.presupuestos().filter(
      (p) =>
        (p.estado === 'aprobado' || p.estado === 'aceptado') &&
        new Date(p.fecha_creacion).getMonth() === now.getMonth() &&
        new Date(p.fecha_creacion).getFullYear() === now.getFullYear(),
    ).length;
  });

  public statTasaExito = computed(() => {
    const enviados = this.presupuestos().filter((p) => p.estado !== 'borrador').length;
    if (enviados === 0) return 0;
    const exitosos = this.presupuestos().filter(
      (p) => p.estado === 'aprobado' || p.estado === 'aceptado' || p.estado === 'facturado',
    ).length;
    return Math.round((exitosos / enviados) * 100);
  });

  ngOnInit(): void {
    const usuario = this.authentication.obtenerUsuarioSesion();
    if (!usuario || usuario.rol !== 'admin') {
      this.router.navigate(['/nopermisos']);
      return;
    }
    this.cargarPresupuestos(usuario.empresa_id);
    this.cargarClientes(usuario.empresa_id);
  }

  cargarPresupuestos(empresa_id: number): void {
    this.presupuestosService.getPresupuestosEmpresa(empresa_id).subscribe({
      next: (data) => this.presupuestos.set(data),
      error: (err) => console.error('Error al cargar presupuestos', err),
    });
  }

  cargarClientes(empresa_id: number): void {
    this.clientesServices.getClientePorEmpresa(empresa_id).subscribe({
      next: (data) => this.clientes.set(data),
      error: (err) => console.error('Error al cargar clientes', err),
    });
  }

  getNombreCliente(id: number): string {
    const cliente = this.clientes().find((c) => c.id == id);
    return cliente ? cliente.nombre_empresa_o_particular : '—';
  }

  getTipoCliente(id: number): string {
    const cliente = this.clientes().find((c) => c.id == id);
    return cliente?.tipo_cliente ?? '';
  }
}
