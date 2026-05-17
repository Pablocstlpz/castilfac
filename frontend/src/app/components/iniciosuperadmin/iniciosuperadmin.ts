import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

//interfaces basadas en el modelo de la base de datos
export interface Empresa {
  id: number;
  nombre_comercial: string;
  razon_social: string;
  nif: string;
  email: string;
  telefono: string;
  direccion: string;
  codigo_postal: string;
  ciudad: string;
  provincia: string;
  suscripcion_activa: boolean;
  fecha_vencimiento: Date;
  activo: boolean;
  logo_url: string;
  fecha_registro: Date;
  fecha_actualizacion: Date;
  email_verificado?: boolean;
}

export interface Usuario {
  id: number;
  empresa_id: number;
  nombre: string;
  email: string;
  rol: string;
  fecha_creacion: Date;
}

@Component({
  selector: 'app-superadmin',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatSnackBarModule, FormsModule, TranslatePipe],
  templateUrl: './iniciosuperadmin.html',
  styleUrl: './iniciosuperadmin.css',
})
export class InicioSuperadmin implements OnInit {
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);
  private apiUrl = 'http://localhost:3000/api'; //ajustar segun el entorno

  //listado completo de empresas que llega del backend
  public empresas = signal<Empresa[]>([]);
  //empresas filtradas por busqueda que se muestran en la tabla
  public empresasFiltradas = signal<Empresa[]>([]);
  //usuarios de la empresa seleccionada en el panel de detalle
  public usuariosActivos = signal<Usuario[]>([]);
  //empresa que el superadmin ha seleccionado para ver el detalle
  public empresaSeleccionada = signal<Empresa | null>(null);

  //flag para mostrar el spinner mientras se cargan las empresas
  public cargando = signal<boolean>(true);
  //texto que ha escrito el superadmin en la busqueda
  public filtroBusqueda = signal<string>('');

  //KPIs principales que se muestran en las tarjetas superiores
  public kpis = signal({
    total: 0,
    prueba: 0,
    premium: 0,
    ingresos: 0,
  });

  ngOnInit(): void {
    this.cargarEmpresas();
  }

  //funcion para cargar todas las empresas del sistema
  cargarEmpresas(): void {
    this.cargando.set(true);
    this.http.get<Empresa[]>(`${this.apiUrl}/empresas`).subscribe({
      next: (data) => {
        this.empresas.set(data);
        this.empresasFiltradas.set(data);
        this.calcularKPIs(data);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error(err);
        this.snackBar.open(
          this.translate.instant('superadmin.loadError'),
          this.translate.instant('common.close'),
          { duration: 3000 },
        );
        this.cargando.set(false);
      },
    });
  }

  //funcion para calcular los KPIs del dashboard (total, en prueba, premium e ingresos)
  calcularKPIs(empresas: Empresa[]): void {
    let prueba = 0;
    let premium = 0;

    empresas.forEach((emp) => {
      //ignoro empresas inactivas o sin email verificado
      if (!emp.activo || !emp.email_verificado) return;

      const fRegistro = new Date(emp.fecha_registro).getTime();
      const fVencimiento = new Date(emp.fecha_vencimiento).getTime();

      //diferencia en dias entre el registro y el vencimiento
      const diffDias = Math.round((fVencimiento - fRegistro) / (1000 * 60 * 60 * 24));

      //si la diferencia es <= 15 dias, la empresa sigue en periodo de prueba; si no, es premium
      if (diffDias <= 15) {
        prueba++;
      } else {
        premium++;
      }
    });

    this.kpis.set({
      total: empresas.length,
      prueba: prueba,
      premium: premium,
      ingresos: premium * 39, //39€ por empresa premium
    });
  }

  //funcion para filtrar las empresas por el texto que escribe el superadmin
  filtrarEmpresas(): void {
    const termino = this.filtroBusqueda().toLowerCase();
    if (!termino) {
      this.empresasFiltradas.set(this.empresas());
      return;
    }

    //busco por nombre, nif o email
    const filtradas = this.empresas().filter(
      (emp) =>
        emp.nombre_comercial.toLowerCase().includes(termino) ||
        emp.nif.toLowerCase().includes(termino) ||
        emp.email.toLowerCase().includes(termino),
    );
    this.empresasFiltradas.set(filtradas);
  }

  //funcion para abrir el panel de detalle de una empresa y cargar sus usuarios
  verDetalle(empresa: Empresa): void {
    this.empresaSeleccionada.set(empresa);
    this.usuariosActivos.set([]); //limpio los usuarios anteriores antes de cargar los nuevos

    //llamo al endpoint que devuelve los usuarios de esta empresa
    this.http.get<Usuario[]>(`${this.apiUrl}/usuarios/empresa/${empresa.id}`).subscribe({
      next: (usuarios) => this.usuariosActivos.set(usuarios),
      error: () =>
        this.snackBar.open(
          this.translate.instant('superadmin.usersError'),
          this.translate.instant('common.close'),
          { duration: 2000 },
        ),
    });
  }

  //funcion para cerrar el panel de detalle
  cerrarDetalle(): void {
    this.empresaSeleccionada.set(null);
  }

  //funcion para activar o desactivar una empresa
  toggleEstadoEmpresa(empresa: Empresa): void {
    //invierto el estado activo
    const nuevoEstado = !empresa.activo;

    //preparo el payload completo para pasar las validaciones del controller updateEmpresa
    const payload = {
      ...empresa,
      activo: nuevoEstado,
    };

    this.http.put(`${this.apiUrl}/empresas/${empresa.id}`, payload).subscribe({
      next: () => {
        empresa.activo = nuevoEstado;
        this.snackBar.open(
          this.translate.instant(nuevoEstado ? 'superadmin.companyActivated' : 'superadmin.companyDeactivated'),
          this.translate.instant('common.ok'),
          { duration: 3000 },
        );
        //recalculo los KPIs por si cambia el numero de empresas premium o de ingresos
        this.calcularKPIs(this.empresas());
      },
      error: (err) => {
        console.error(err);
        this.snackBar.open(
          this.translate.instant('superadmin.statusChangeError'),
          this.translate.instant('common.close'),
          { duration: 3000 },
        );
      },
    });
  }

  //funcion para extender la suscripcion de una empresa 30 dias mas (convertirla a premium)
  extenderSuscripcion(empresa: Empresa): void {
    //sumo 30 dias a la fecha de vencimiento actual
    const nuevaFecha = new Date(empresa.fecha_vencimiento);
    nuevaFecha.setDate(nuevaFecha.getDate() + 30);

    const payload = {
      ...empresa,
      fecha_vencimiento: nuevaFecha,
    };

    this.http.put(`${this.apiUrl}/empresas/${empresa.id}`, payload).subscribe({
      next: () => {
        empresa.fecha_vencimiento = nuevaFecha;
        this.snackBar.open(
          this.translate.instant('superadmin.subscriptionExtended'),
          this.translate.instant('superadmin.great'),
          { duration: 3000 },
        );
        this.calcularKPIs(this.empresas());
      },
      error: () =>
        this.snackBar.open(
          this.translate.instant('superadmin.extendError'),
          this.translate.instant('common.close'),
          { duration: 3000 },
        ),
    });
  }
}
