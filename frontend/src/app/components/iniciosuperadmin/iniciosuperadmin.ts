import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

// Interfaces basadas en tu modelo
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
  private apiUrl = 'http://localhost:3000/api'; // Ajusta a tu URL de entorno

  // Estado del componente
  public empresas = signal<Empresa[]>([]);
  public empresasFiltradas = signal<Empresa[]>([]);
  public usuariosActivos = signal<Usuario[]>([]);
  public empresaSeleccionada = signal<Empresa | null>(null);

  public cargando = signal<boolean>(true);
  public filtroBusqueda = signal<string>('');

  // KPIs
  public kpis = signal({
    total: 0,
    prueba: 0,
    premium: 0,
    ingresos: 0,
  });

  ngOnInit(): void {
    this.cargarEmpresas();
  }

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

  calcularKPIs(empresas: Empresa[]): void {
    let prueba = 0;
    let premium = 0;

    empresas.forEach((emp) => {
      if (!emp.activo || !emp.email_verificado) return;

      const fRegistro = new Date(emp.fecha_registro).getTime();
      const fVencimiento = new Date(emp.fecha_vencimiento).getTime();

      // Calculamos la diferencia en días
      const diffDias = Math.round((fVencimiento - fRegistro) / (1000 * 60 * 60 * 24));

      // Si la diferencia es <= 15 días, consideramos que sigue en su periodo de prueba original
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
      ingresos: premium * 39, // Tus 39€ por empresa premium
    });
  }

  filtrarEmpresas(): void {
    const termino = this.filtroBusqueda().toLowerCase();
    if (!termino) {
      this.empresasFiltradas.set(this.empresas());
      return;
    }

    const filtradas = this.empresas().filter(
      (emp) =>
        emp.nombre_comercial.toLowerCase().includes(termino) ||
        emp.nif.toLowerCase().includes(termino) ||
        emp.email.toLowerCase().includes(termino),
    );
    this.empresasFiltradas.set(filtradas);
  }

  verDetalle(empresa: Empresa): void {
    this.empresaSeleccionada.set(empresa);
    this.usuariosActivos.set([]); // Limpiar anteriores

    // Llamada a tu controlador getUsuarioPorEmpresa
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

  cerrarDetalle(): void {
    this.empresaSeleccionada.set(null);
  }

  toggleEstadoEmpresa(empresa: Empresa): void {
    // Invertimos el estado activo
    const nuevoEstado = !empresa.activo;

    // Preparamos el payload completo para pasar tu validación del controlador updateEmpresa
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
        this.calcularKPIs(this.empresas()); // Recalcular ingresos
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

  extenderSuscripcion(empresa: Empresa): void {
    // Añadimos 30 días a la fecha de vencimiento actual para hacerla "Premium"
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
