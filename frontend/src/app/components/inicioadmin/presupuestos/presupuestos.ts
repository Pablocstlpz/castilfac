import { Component, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Presupuestos as PresupuestosService } from '../../../services/presupuestos';
import { ClientesServices } from '../../../services/clientes';
import { Authentication } from '../../../services/authentication';
import { PdfService } from '../../../services/pdf';
import { Presupuesto } from '../../../interfaces/presupuesto';
import { Cliente } from '../../../interfaces/cliente';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-presupuestos',
  imports: [MatIcon, DatePipe, DecimalPipe, NgClass, FormsModule, RouterLink, TranslatePipe],
  templateUrl: './presupuestos.html',
  styleUrl: './presupuestos.css',
})
export class Presupuestos {
  private presupuestosService = inject(PresupuestosService);
  private clientesServices = inject(ClientesServices);
  private authentication = inject(Authentication);
  private pdfService = inject(PdfService);
  private router = inject(Router);
  private translate = inject(TranslateService);

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
        p.estado === 'aprobado' &&
        new Date(p.fecha_creacion).getMonth() === now.getMonth() &&
        new Date(p.fecha_creacion).getFullYear() === now.getFullYear(),
    ).length;
  });

  public statTasaExito = computed(() => {
    const enviados = this.presupuestos().filter((p) => p.estado !== 'borrador').length;
    if (enviados === 0) return 0;
    const exitosos = this.presupuestos().filter(
      (p) => p.estado === 'aprobado',
    ).length;
    return Math.round((exitosos / enviados) * 100);
  });

  ngOnInit(): void {
    const usuario = this.authentication.obtenerUsuarioSesion()!;
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

  etiquetaTipoCliente(tipo: string): string {
    if (!tipo) return '';
    const keys: Record<string, string> = {
      particular: 'clients.typeParticular',
      empresa: 'clients.typeCompany',
      vip: 'clients.typeVip',
      mayorista: 'clients.typeWholesaler',
    };
    const key = keys[tipo];
    return key ? this.translate.instant(key) : tipo;
  }

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

  verDetalle(id: number): void {
    this.router.navigate(['/inicioadmin/presupuestos/detalle-presupuesto', id]);
  }

  descargarPDF(id: number): void {
    this.presupuestosService.getPresupuesto(id).subscribe({
      next: (pres) => this.pdfService.generarHojaFabricacion(pres, []),
      error: (err) => console.error('Error al cargar presupuesto para PDF:', err),
    });
  }
}
