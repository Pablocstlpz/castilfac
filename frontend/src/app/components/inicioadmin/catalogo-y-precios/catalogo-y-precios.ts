import { Component, signal, inject } from '@angular/core';
import { forkJoin, of } from 'rxjs';
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
import { SpinnerCargaDatos } from '../../partes-html/spinner-carga-datos/spinner-carga-datos';

@Component({
  selector: 'app-catalogo',
  imports: [FormsModule, MatIconModule, DecimalPipe, NgClass, RouterLink, MatSnackBarModule, TranslatePipe, SpinnerCargaDatos],
  templateUrl: './catalogo-y-precios.html',
  styleUrl: './catalogo-y-precios.css',
})
export class CatalogoYPrecios {
  private categoriasService = inject(Categorias);
  private materialesService = inject(Materiales);
  private authentication = inject(Authentication);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);

  //signal con todos los materiales enriquecidos que llegan del backend (con precio empresa)
  private _materiales = signal<MaterialConPrecio[]>([]);

  //signal con el total de materiales que tiene la empresa, para la tarjeta de estadistica
  public totalMateriales = signal<number>(0);

  //signal con las categorias disponibles para el selector del filtro
  public categorias = signal<Categoria[]>([]);

  //signal con el texto que ha escrito el usuario en la busqueda
  public busqueda = signal<string>('');

  //signal con la categoria que ha seleccionado el usuario en el filtro
  public filtroCategoria = signal<string>('todas');

  //signal para incluir o no en el listado los materiales que estan desactivados
  public mostrarInactivos = signal<boolean>(false);

  //signal con los materiales ya filtrados que se muestran en la tabla
  public materialesFiltrados = signal<MaterialConPrecio[]>([]);

  //id del material cuyo PVP se esta editando en linea, null si ninguno esta en edicion
  public materialEditandoId = signal<number | null>(null);

  //guarda temporalmente el precio que el usuario esta escribiendo en el input de edicion en linea
  public precioEnEdicion = signal<number>(0);
  public cargando = signal<boolean>(true);

  ngOnInit(): void {
    const usuario = this.authentication.obtenerUsuarioSesion();
    forkJoin({
      categorias: this.categoriasService.getCategorias(),
      materiales: usuario
        ? this.materialesService.getMaterialesConPrecioEmpresa(usuario.empresa_id)
        : of([] as MaterialConPrecio[]),
    }).subscribe({
      next: ({ categorias, materiales }) => {
        this.categorias.set(categorias);
        this._materiales.set(materiales);
        this.totalMateriales.set(materiales.length);
        this.filtrarMateriales();
        this.cargando.set(false);
      },
      error: () => { this.cargando.set(false); },
    });
  }

  //funcion para traducir el tipo de unidad a un texto legible en el idioma actual
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

  //funcion que aplica los filtros activos (busqueda, categoria, inactivos) y actualiza la lista que se ve
  filtrarMateriales(): void {
    const textoBusqueda = this.busqueda().toLowerCase().trim();

    //filtro por texto, categoria y estado activo, y guardo el resultado en el signal de filtrados
    this.materialesFiltrados.set(
      this._materiales().filter((material) => {
        //compruebo si el material coincide con el texto buscado en nombre, codigo o proveedor
        const coincideBusqueda =
          !textoBusqueda ||
          material.nombre.toLowerCase().includes(textoBusqueda) ||
          (material.codigo_interno ?? '').toLowerCase().includes(textoBusqueda) ||
          (material.proveedor ?? '').toLowerCase().includes(textoBusqueda);

        //compruebo si el material coincide con la categoria seleccionada o es "todas"
        const coincideCategoria =
          this.filtroCategoria() === 'todas' ||
          material.categoria_id.toString() === this.filtroCategoria();

        //si no se quieren ver inactivos, descarto los que no esten activos o esten borrados
        const coincideActivo =
          this.mostrarInactivos() ? true : material.activo !== false && !material.deleted_at;

        return coincideBusqueda && coincideCategoria && coincideActivo;
      }),
    );
  }

  //funcion para activar o desactivar un material desde la columna de estado de la tabla
  toggleActivo(id: number): void {
    const usuario = this.authentication.obtenerUsuarioSesion();
    if (!usuario) return;
    this.materialesService.toggleActivo(usuario.empresa_id, id).subscribe((materialActualizado) => {
      //actualizo el material directamente en el signal para no tener que recargar toda la pagina
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

  //funcion para activar el modo de edicion en linea del PVP en la fila del material seleccionado
  activarEdicionPvp(materialSeleccionado: MaterialConPrecio): void {
    //guardo el id del material que se esta editando para que el template muestre el input en su fila
    this.materialEditandoId.set(materialSeleccionado.id);
    //precargo el input con el precio actual para que el usuario tenga el valor de partida
    this.precioEnEdicion.set(materialSeleccionado.precio_venta);
  }

  //funcion para cancelar la edicion en linea sin guardar nada
  cancelarEdicionPvp(): void {
    //limpio el id del material en edicion para que el template vuelva a mostrar el modo normal
    this.materialEditandoId.set(null);
    //reseteo el precio en edicion
    this.precioEnEdicion.set(0);
  }

  //funcion para guardar el nuevo PVP del material en el backend
  //actualiza precios_empresa y crea un registro en historial_precios_empresa de forma transaccional
  guardarNuevoPvp(materialSeleccionado: MaterialConPrecio, precioNuevo: number): void {
    //necesito el usuario en sesion para mandar su id y el de su empresa al backend
    const usuarioSesion = this.authentication.obtenerUsuarioSesion();

    //si no hay sesion activa, aviso por snackbar y no hago nada
    if (!usuarioSesion) {
      this.snackBar.open(this.translate.instant('catalogue.noSession'), this.translate.instant('common.close'), {
        duration: 3000,
      });
      return;
    }

    //compruebo que el precio sea un numero valido y mayor que cero
    const precioNuevoNumerico = Number(precioNuevo);
    if (isNaN(precioNuevoNumerico) || precioNuevoNumerico <= 0) {
      this.snackBar.open(
        this.translate.instant('catalogue.priceMustBePositive'),
        this.translate.instant('common.close'),
        { duration: 3000 },
      );
      return;
    }

    //preparo los ids que necesita la peticion al backend
    const empresaId = usuarioSesion.empresa_id;
    const usuarioId = usuarioSesion.id;
    const materialId = materialSeleccionado.id;

    //llamo al servicio que actualiza el precio y registra el cambio en el historial
    this.materialesService
      .actualizarPvpEmpresa(materialId, empresaId, usuarioId, precioNuevoNumerico)
      .subscribe({
        next: () => {
          //actualizo el precio en el signal para que la tabla se refresque sin recargar
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

          //cierro el modo edicion para volver a la vista normal
          this.cancelarEdicionPvp();

          //aviso al usuario de que el precio se ha guardado bien
          this.snackBar.open(
            this.translate.instant('catalogue.pvpUpdated'),
            this.translate.instant('common.close'),
            { duration: 3000 },
          );
        },
        error: (error) => {
          //aviso al usuario del error que ha devuelto el backend
          this.snackBar.open(
            this.translate.instant('catalogue.pvpUpdateError', { message: error.message }),
            this.translate.instant('common.close'),
            { duration: 5000 },
          );
        },
      });
  }
}
