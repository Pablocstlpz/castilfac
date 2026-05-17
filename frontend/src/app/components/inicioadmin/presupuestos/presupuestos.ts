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

  //signal con todos los presupuestos de la empresa
  public presupuestos = signal<Presupuesto[]>([]);
  //signal con todos los clientes de la empresa, los necesito para mostrar el nombre del cliente en cada presupuesto
  public clientes = signal<Cliente[]>([]);
  //texto que ha escrito el usuario en la busqueda
  public busqueda = signal<string>('');
  //estado por el que el usuario ha filtrado
  public filtroEstado = signal<string>('todos');

  //listado de presupuestos filtrados que se muestran en la tabla
  public presupuestosFiltrados = computed(() => {
    const q = this.busqueda().toLowerCase().trim();
    const estado = this.filtroEstado();
    return this.presupuestos().filter((p) => {
      const coincideEstado = estado === 'todos' || p.estado === estado;
      //busco por numero de presupuesto o por nombre del cliente
      const coincideBusqueda =
        !q ||
        p.numero_presupuesto.toLowerCase().includes(q) ||
        this.getNombreCliente(p.cliente_id).toLowerCase().includes(q);
      return coincideEstado && coincideBusqueda;
    });
  });

  //numero de presupuestos en estado borrador para la tarjeta de estadistica
  public statBorradores = computed(
    () => this.presupuestos().filter((p) => p.estado === 'borrador').length,
  );

  //numero de presupuestos enviados pendientes de respuesta del cliente
  public statPendientesRespuesta = computed(
    () => this.presupuestos().filter((p) => p.estado === 'enviado').length,
  );

  //numero de presupuestos aprobados en el mes actual
  public statAprobadosMes = computed(() => {
    const now = new Date();
    return this.presupuestos().filter(
      (p) =>
        p.estado === 'aprobado' &&
        new Date(p.fecha_creacion).getMonth() === now.getMonth() &&
        new Date(p.fecha_creacion).getFullYear() === now.getFullYear(),
    ).length;
  });

  //tasa de exito = presupuestos aprobados / presupuestos enviados (no borradores)
  public statTasaExito = computed(() => {
    const enviados = this.presupuestos().filter((p) => p.estado !== 'borrador').length;
    if (enviados === 0) return 0;
    const exitosos = this.presupuestos().filter(
      (p) => p.estado === 'aprobado',
    ).length;
    return Math.round((exitosos / enviados) * 100);
  });

  ngOnInit(): void {
    //al cargar la pagina cojo el empresa_id de la sesion y traigo presupuestos y clientes
    const usuario = this.authentication.obtenerUsuarioSesion()!;
    this.cargarPresupuestos(usuario.empresa_id);
    this.cargarClientes(usuario.empresa_id);
  }

  //funcion para cargar todos los presupuestos de una empresa
  cargarPresupuestos(empresa_id: number): void {
    this.presupuestosService.getPresupuestosEmpresa(empresa_id).subscribe({
      next: (data) => this.presupuestos.set(data),
      error: (err) => console.error('Error al cargar presupuestos', err),
    });
  }

  //funcion para cargar todos los clientes de la empresa
  cargarClientes(empresa_id: number): void {
    this.clientesServices.getClientePorEmpresa(empresa_id).subscribe({
      next: (data) => this.clientes.set(data),
      error: (err) => console.error('Error al cargar clientes', err),
    });
  }

  //funcion para transformar el id de cliente en el nombre buscando en el signal de clientes
  getNombreCliente(id: number): string {
    const cliente = this.clientes().find((c) => c.id == id);
    return cliente ? cliente.nombre_empresa_o_particular : '—';
  }

  //funcion para obtener el tipo de cliente a partir de su id
  getTipoCliente(id: number): string {
    const cliente = this.clientes().find((c) => c.id == id);
    return cliente?.tipo_cliente ?? '';
  }

  //funcion para traducir el tipo de cliente a un texto legible
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

  //funcion para ir al detalle de un presupuesto
  verDetalle(id: number): void {
    this.router.navigate(['/inicioadmin/presupuestos/detalle-presupuesto', id]);
  }

  //funcion para generar y descargar el PDF de la hoja de fabricacion del presupuesto
  descargarPDF(id: number): void {
    //primero pido los datos completos del presupuesto y despues genero el PDF con ellos
    this.presupuestosService.getPresupuesto(id).subscribe({
      next: (pres) => this.pdfService.generarHojaFabricacion(pres, []),
      error: (err) => console.error('Error al cargar presupuesto para PDF:', err),
    });
  }
}
