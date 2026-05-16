import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { DecimalPipe, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Categorias } from '../../../services/categorias';
import { Materiales } from '../../../services/materiales';
import { Authentication } from '../../../services/authentication';
import { MaterialConPrecio } from '../../../interfaces/material';
import { Categoria } from '../../../interfaces/categoria';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-catalogo',
  imports: [FormsModule, MatIconModule, DecimalPipe, NgClass, RouterLink, MatSnackBarModule, TranslatePipe],
  templateUrl: './catalogo-y-precios.html',
  styleUrl: './catalogo-y-precios.css',
})
export class CatalogoYPrecios {
  private categoriasService = inject(Categorias);
  private materialesService = inject(Materiales);
  private authentication = inject(Authentication);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);

  // Signal con todos los materiales ya enriquecidos que llegan del backend
  private _materiales = signal<MaterialConPrecio[]>([]);

  // Signal con el total de materiales de la empresa
  public totalMateriales = signal<number>(0);

  // Signal con las categorias disponibles para el filtro
  public categorias = signal<Categoria[]>([]);

  // Signal con el texto de busqueda actual
  public busqueda = signal<string>('');

  // Signal con el filtro de categoria seleccionado
  public filtroCategoria = signal<string>('todas');

  // Signal para mostrar o no los materiales inactivos
  public mostrarInactivos = signal<boolean>(false);

  // Signal con los materiales filtrados para mostrar en la tabla
  public materialesFiltrados = signal<MaterialConPrecio[]>([]);

  // Signal que almacena el id del material cuyo PVP se está editando en línea (null si ninguno está en edición)
  public materialEditandoId = signal<number | null>(null);

  // Signal que almacena temporalmente el nuevo precio introducido en el input de edición en línea
  public precioEnEdicion = signal<number>(0);

  ngOnInit(): void {
    // Obtengo el usuario de la sesión para identificar la empresa a la que pertenece
    const usuario = this.authentication.obtenerUsuarioSesion();
    // Cargo las categorias disponibles para el select de filtrado
    this.cargarCategorias();
    // Si hay usuario autenticado, cargo los materiales enriquecidos de su empresa
    if (usuario) {
      this.cargarMateriales(usuario.empresa_id);
    }
  }

  // Función para cargar las categorias del select de filtrado desde el backend
  cargarCategorias(): void {
    this.categoriasService.getCategorias().subscribe((data) => {
      this.categorias.set(data);
    });
  }

  // Función para cargar los materiales ya enriquecidos con categoria y precio desde el backend
  cargarMateriales(empresaId: number): void {
    this.materialesService.getMaterialesConPrecioEmpresa(empresaId).subscribe((data) => {
      this._materiales.set(data);
      this.totalMateriales.set(data.length);
      this.filtrarMateriales();
    });
  }

  etiquetaTipoUnidad(tipo: string): string {
    const keys: Record<string, string> = {
      metros_lineales: 'catalogue.unitLinear',
      metros_cuadrados: 'catalogue.unitSquare',
      unidades: 'catalogue.unitEach',
      kilogramos: 'catalogue.unitKg',
      litros: 'catalogue.unitLiters',
    };
    const key = keys[tipo];
    return key ? this.translate.instant(key) : tipo;
  }

  // Función para filtrar los materiales según los filtros activos en cada momento
  filtrarMateriales(): void {
    const textoBusqueda = this.busqueda().toLowerCase().trim();

    // Filtro por texto de búsqueda, categoría y estado activo y guardo el resultado en el signal
    this.materialesFiltrados.set(
      this._materiales().filter((material) => {
        const coincideBusqueda =
          !textoBusqueda ||
          material.nombre.toLowerCase().includes(textoBusqueda) ||
          (material.codigo_interno ?? '').toLowerCase().includes(textoBusqueda) ||
          (material.proveedor ?? '').toLowerCase().includes(textoBusqueda);

        const coincideCategoria =
          this.filtroCategoria() === 'todas' ||
          material.categoria_id.toString() === this.filtroCategoria();

        const coincideActivo =
          this.mostrarInactivos() ? true : material.activo !== false && !material.deleted_at;

        return coincideBusqueda && coincideCategoria && coincideActivo;
      }),
    );
  }

  // Función para activar o desactivar un material desde la columna de estado
  toggleActivo(id: number): void {
    const usuario = this.authentication.obtenerUsuarioSesion();
    if (!usuario) return;
    this.materialesService.toggleActivo(usuario.empresa_id, id).subscribe((materialActualizado) => {
      // Actualizo el estado activo del material directamente en el signal para no recargar la página
      const listaActualizada = [...this._materiales()];
      for (let indice = 0; indice < listaActualizada.length; indice++) {
        if (listaActualizada[indice].id === id) {
          listaActualizada[indice].activo = materialActualizado.activo;
          break;
        }
      }
      this._materiales.set(listaActualizada);
      this.filtrarMateriales();
    });
  }

  // Función para activar el modo de edición en línea del PVP para el material que el usuario ha pulsado
  activarEdicionPvp(materialSeleccionado: MaterialConPrecio): void {
    // Guardo el id del material en edición para que el template muestre el input en su fila
    this.materialEditandoId.set(materialSeleccionado.id);
    // Inicializo el input con el precio actual del material como punto de partida para el usuario
    this.precioEnEdicion.set(materialSeleccionado.precio_venta);
  }

  // Función para cancelar la edición en línea sin guardar ningún cambio
  cancelarEdicionPvp(): void {
    // Limpio el id del material en edición para que el template vuelva al modo de visualización
    this.materialEditandoId.set(null);
    // Reseteo el precio en edición a su valor neutro
    this.precioEnEdicion.set(0);
  }

  // Función para guardar el nuevo PVP de empresa para el material seleccionado
  // Llama al backend para actualizar precios_empresa y crear el registro en historial_precios_empresa
  guardarNuevoPvp(materialSeleccionado: MaterialConPrecio, precioNuevo: number): void {
    // Obtengo el usuario de la sesión para enviar su id y el de su empresa en la petición
    const usuarioSesion = this.authentication.obtenerUsuarioSesion();

    // Verifico que existe sesión activa antes de intentar la actualización
    if (!usuarioSesion) {
      this.snackBar.open(this.translate.instant('catalogue.noSession'), this.translate.instant('common.close'), {
        duration: 3000,
      });
      return;
    }

    // Verifico que el precio introducido es un número válido y mayor que cero
    const precioNuevoNumerico = Number(precioNuevo);
    if (isNaN(precioNuevoNumerico) || precioNuevoNumerico <= 0) {
      this.snackBar.open(
        this.translate.instant('catalogue.priceMustBePositive'),
        this.translate.instant('common.close'),
        { duration: 3000 },
      );
      return;
    }

    // Extraigo los identificadores necesarios para el cuerpo de la petición al backend
    const empresaId = usuarioSesion.empresa_id;
    const usuarioId = usuarioSesion.id;
    const materialId = materialSeleccionado.id;

    // Llamo al servicio para actualizar el precio en el backend con transacción y registro en historial
    this.materialesService
      .actualizarPvpEmpresa(materialId, empresaId, usuarioId, precioNuevoNumerico)
      .subscribe({
        next: () => {
          // Actualizo el precio del material directamente en el signal para refrescar la tabla sin recargar
          const listaActualizada = [...this._materiales()];
          for (let indice = 0; indice < listaActualizada.length; indice++) {
            if (listaActualizada[indice].id === materialId) {
              listaActualizada[indice] = {
                ...listaActualizada[indice],
                precio_venta: precioNuevoNumerico,
              };
              break;
            }
          }
          this._materiales.set(listaActualizada);
          this.filtrarMateriales();

          // Cierro el modo de edición en línea para volver a la vista normal
          this.cancelarEdicionPvp();

          // Informo al usuario de que el precio se ha guardado correctamente
          this.snackBar.open(
            this.translate.instant('catalogue.pvpUpdated'),
            this.translate.instant('common.close'),
            { duration: 3000 },
          );
        },
        error: (error) => {
          // Informo al usuario del error ocurrido durante la actualización
          this.snackBar.open(
            this.translate.instant('catalogue.pvpUpdateError', { message: error.message }),
            this.translate.instant('common.close'),
            { duration: 5000 },
          );
        },
      });
  }
}
