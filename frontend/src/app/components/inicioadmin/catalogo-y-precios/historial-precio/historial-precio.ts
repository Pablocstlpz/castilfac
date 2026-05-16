import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

// Módulos de Angular Material
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// Interfaces (Separadas como me has indicado)
import { Material } from '../../../../interfaces/material';
import { HistorialPrecioBase } from '../../../../interfaces/historial-precio-base';
import { HistorialPrecioEmpresa } from '../../../../interfaces/historial-precio-empresa';

// Servicios (Inyectamos los tres por separado con sus nombres exactos)
import { Materiales } from '../../../../services/materiales';
import { HistorialPreciosEmpresa } from '../../../../services/historial-precios-empresa';
import { HistorialPreciosBase } from '../../../../services/historial-precios-base';
import { UsuariosServices } from '../../../../services/usuarios';
import { Authentication } from '../../../../services/authentication';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-historial-precios',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatSnackBarModule,
    TranslatePipe,
  ],
  templateUrl: './historial-precio.html',
  styleUrl: './historial-precio.css',
})
export class HistorialPrecio {
  // --- INYECCIÓN DE DEPENDENCIAS ---
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private authentication = inject(Authentication);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);

  // Inyección de tus servicios
  private materialesService = inject(Materiales);
  private historialEmpresaService = inject(HistorialPreciosEmpresa);
  private historialBaseService = inject(HistorialPreciosBase);
  private usuariosService = inject(UsuariosServices);

  // --- ESTADO DEL COMPONENTE (SIGNALS) ---
  // Guardamos el material completo que descargamos de la base de datos
  public materialEncontrado = signal<Material | null>(null);

  // Listas de historiales usando tus interfaces específicas
  public historialEmpresa = signal<HistorialPrecioEmpresa[]>([]);
  public historialBase = signal<HistorialPrecioBase[]>([]);
  public nombresUsuarios = signal<Record<number, string>>({});

  // Control del spinner de carga
  public estaCargando = signal<boolean>(true);

  // Señales para el filtro de rango de fechas de la pestaña PVP Empresa
  public filtroFechaDesdeEmpresa = signal<string>('');
  public filtroFechaHastaEmpresa = signal<string>('');

  // Señales para el filtro de rango de fechas de la pestaña Coste Base Sistema
  public filtroFechaDesdeBase = signal<string>('');
  public filtroFechaHastaBase = signal<string>('');

  // Computed signal que aplica el filtro de fecha sobre el historial de empresa
  // Se recalcula automáticamente cada vez que cambian los signals de filtro o la lista
  public historialEmpresaFiltrado = computed(() => {
    const fechaDesdeTexto = this.filtroFechaDesdeEmpresa();
    const fechaHastaTexto = this.filtroFechaHastaEmpresa();
    const listaCompleta = this.historialEmpresa();

    // Si no hay ningún filtro activo devolvemos la lista completa sin procesar
    if (!fechaDesdeTexto && !fechaHastaTexto) {
      return listaCompleta;
    }

    // Aplicamos el filtro de rango de fechas sobre cada registro del historial
    return listaCompleta.filter((registro) => {
      if (!registro.fecha_registro) return true;

      const fechaRegistro = new Date(registro.fecha_registro).getTime();

      // Comprobamos el límite inferior del rango (fecha desde)
      if (fechaDesdeTexto) {
        const fechaDesde = new Date(fechaDesdeTexto).getTime();
        if (fechaRegistro < fechaDesde) return false;
      }

      // Comprobamos el límite superior del rango (fecha hasta, inclusive todo el día)
      if (fechaHastaTexto) {
        const fechaHasta = new Date(fechaHastaTexto + 'T23:59:59').getTime();
        if (fechaRegistro > fechaHasta) return false;
      }

      return true;
    });
  });

  // Computed signal que aplica el filtro de fecha sobre el historial del coste base
  public historialBaseFiltrado = computed(() => {
    const fechaDesdeTexto = this.filtroFechaDesdeBase();
    const fechaHastaTexto = this.filtroFechaHastaBase();
    const listaCompleta = this.historialBase();

    // Si no hay ningún filtro activo devolvemos la lista completa sin procesar
    if (!fechaDesdeTexto && !fechaHastaTexto) {
      return listaCompleta;
    }

    // Aplicamos el filtro de rango de fechas sobre cada registro del historial
    return listaCompleta.filter((registro) => {
      if (!registro.fecha_registro) return true;

      const fechaRegistro = new Date(registro.fecha_registro).getTime();

      // Comprobamos el límite inferior del rango (fecha desde)
      if (fechaDesdeTexto) {
        const fechaDesde = new Date(fechaDesdeTexto).getTime();
        if (fechaRegistro < fechaDesde) return false;
      }

      // Comprobamos el límite superior del rango (fecha hasta, inclusive todo el día)
      if (fechaHastaTexto) {
        const fechaHasta = new Date(fechaHastaTexto + 'T23:59:59').getTime();
        if (fechaRegistro > fechaHasta) return false;
      }

      return true;
    });
  });

  ngOnInit(): void {
    const usuario = this.authentication.obtenerUsuarioSesion()!;

    // Leemos la URL para sacar el ID del material
    // Soporta tanto /ruta/:id como ?id=5
    const idMaterialRuta = this.route.snapshot.paramMap.get('id');
    const idMaterialQuery = this.route.snapshot.queryParamMap.get('id');
    const idMaterial = idMaterialRuta ?? idMaterialQuery;

    if (idMaterial) {
      // Si hay ID, iniciamos la cascada de peticiones
      this.cargarDatosCompletos(Number(idMaterial), usuario.empresa_id);
    } else {
      // Si no hay ID en la URL, devolvemos al usuario atrás
      this.snackBar.open(this.translate.instant('catalogue.noMaterialSpecified'), this.translate.instant('common.close'), {
        duration: 3000,
      });
      this.volver();
    }
  }

  // --- LÓGICA DE CARGA DE DATOS EN CASCADA ---
  cargarDatosCompletos(idMaterial: number, idEmpresa: number): void {
    this.estaCargando.set(true);

    // PETICIÓN 1: Buscamos los datos del material (para tener el nombre y la info general)
    this.materialesService.getMaterial(idEmpresa, idMaterial).subscribe({
      next: (material) => {
        this.materialEncontrado.set(material);

        // PETICIÓN 2: Buscamos el historial de la empresa
        // (Se ejecuta solo si el material se ha encontrado correctamente)
        this.historialEmpresaService.getHistorialPreciosEmpresa().subscribe({
          next: (historialEmpresas: HistorialPrecioEmpresa[]) => {
            const historialEmp = historialEmpresas
              .filter((item) => item.material_id === idMaterial && item.empresa_id === idEmpresa)
              .sort(
                (a, b) =>
                  new Date(b.fecha_registro ?? 0).getTime() -
                  new Date(a.fecha_registro ?? 0).getTime(),
              );

            // Guardamos el array tipado con tu interfaz
            this.historialEmpresa.set(historialEmp);
            this.cargarNombresUsuarios(historialEmp.map((item) => item.usuario_id));

            // PETICIÓN 3: Buscamos el historial del precio base de fábrica
            // (Se ejecuta cuando ya tenemos el historial de la empresa)
            this.historialBaseService.getHistorialPreciosBase().subscribe({
              next: (historialBases: HistorialPrecioBase[]) => {
                const historialBs = historialBases
                  .filter((item) => item.material_id === idMaterial)
                  .sort(
                    (a, b) =>
                      new Date(b.fecha_registro ?? 0).getTime() -
                      new Date(a.fecha_registro ?? 0).getTime(),
                  );

                // Guardamos el array tipado con tu interfaz
                this.historialBase.set(historialBs);
                this.cargarNombresUsuarios(historialBs.map((item) => item.usuario_admin_id));

                // Cuando terminan las 3 peticiones, ocultamos el spinner de carga
                this.estaCargando.set(false);
              },
              error: (error: Error) => {
                console.error('Error al cargar el historial base:', error);
                this.snackBar.open(
                  this.translate.instant('catalogue.loadBaseHistoryError'),
                  this.translate.instant('common.close'),
                  {
                  duration: 3000,
                });
                this.estaCargando.set(false); // Quitamos la carga aunque falle
              },
            });
          },
          error: (error: Error) => {
            console.error('Error al cargar el historial de la empresa:', error);
            this.snackBar.open(
              this.translate.instant('catalogue.loadCompanyHistoryError'),
              this.translate.instant('common.close'),
              {
              duration: 3000,
            });
            this.estaCargando.set(false);
          },
        });
      },
      error: (error: Error) => {
        console.error('Error al cargar el material:', error);
        this.snackBar.open(
          this.translate.instant('catalogue.materialLoadError'),
          this.translate.instant('common.close'),
          {
          duration: 3000,
        });
        this.volver(); // Si falla el material principal, no tiene sentido seguir en esta vista
      },
    });
  }

  // --- MÉTODOS AUXILIARES ---

  volver(): void {
    this.location.back();
  }

  // Compara precios forzando que sean números para evitar fallos si el backend envía strings
  calcularTendencia(precioAnterior: number | string, precioNuevo: number | string): string {
    // Convertimos ambos valores a números explícitamente
    const anterior = Number(precioAnterior);
    const nuevo = Number(precioNuevo);

    if (nuevo > anterior) {
      return 'subida';
    } else if (nuevo < anterior) {
      return 'bajada';
    } else {
      return 'igual';
    }
  }

  obtenerNombreUsuario(usuarioId: number | null | undefined): string {
    if (usuarioId === null || usuarioId === undefined) {
      return this.translate.instant('catalogue.systemUser');
    }

    return this.nombresUsuarios()[usuarioId] || `Usuario #${usuarioId}`;
  }

  // Limpia los filtros de fecha de la pestaña PVP Empresa
  limpiarFiltrosEmpresa(): void {
    this.filtroFechaDesdeEmpresa.set('');
    this.filtroFechaHastaEmpresa.set('');
  }

  // Limpia los filtros de fecha de la pestaña Coste Base Sistema
  limpiarFiltrosBase(): void {
    this.filtroFechaDesdeBase.set('');
    this.filtroFechaHastaBase.set('');
  }

  private cargarNombresUsuarios(ids: Array<number | null | undefined>): void {
    const idsUnicos = [
      ...new Set(ids.filter((id): id is number => id !== null && id !== undefined)),
    ];

    if (idsUnicos.length === 0) {
      return;
    }

    const nombresActuales = { ...this.nombresUsuarios() };

    idsUnicos.forEach((id) => {
      if (nombresActuales[id]) {
        return;
      }

      this.usuariosService.getUsuario(id).subscribe({
        next: (usuario) => {
          this.nombresUsuarios.set({
            ...this.nombresUsuarios(),
            [usuario.id]: usuario.nombre,
          });
        },
        error: () => {
          this.nombresUsuarios.set({
            ...this.nombresUsuarios(),
            [id]: `Usuario #${id}`,
          });
        },
      });
    });
  }
}
