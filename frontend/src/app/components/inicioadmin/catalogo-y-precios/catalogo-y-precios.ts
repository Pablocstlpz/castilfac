import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { DecimalPipe, TitleCasePipe, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Categorias } from '../../../services/categorias';
import { Materiales } from '../../../services/materiales';
import { Authentication } from '../../../services/authentication';
import { MaterialConPrecio } from '../../../interfaces/material';
import { Categoria } from '../../../interfaces/categoria';

//ARREGLAR ENTERO BUSQUEDAS SQL
@Component({
  selector: 'app-catalogo',
  imports: [FormsModule, MatIconModule, DecimalPipe, TitleCasePipe, NgClass, RouterLink],
  templateUrl: './catalogo-y-precios.html',
  styleUrl: './catalogo-y-precios.css',
})
export class CatalogoYPrecios {
  private categoriasService = inject(Categorias); // Inyectamos el servicio Categorias para poder utilizar sus metodos
  private materialesService = inject(Materiales); // Inyectamos el servicio Materiales para poder utilizar sus metodos
  private authentication = inject(Authentication); // Inyectamos el servicio Authentication para poder utilizar sus metodos

  //signal con todos los materiales ya enriquecidos que llegan del backend
  private _materiales = signal<MaterialConPrecio[]>([]);

  //signal con el total de materiales de la empresa
  public totalMateriales = signal<number>(0);

  //signal con las categorias disponibles para el filtro
  public categorias = signal<Categoria[]>([]);

  //signal con el texto de busqueda actual
  public busqueda = signal<string>('');

  //signal con el filtro de categoria seleccionado
  public filtroCategoria = signal<string>('todas');

  //signal para mostrar o no los materiales inactivos
  public mostrarInactivos = signal<boolean>(false);

  //signal con los materiales filtrados para mostrar en la tabla
  public materialesFiltrados = signal<MaterialConPrecio[]>([]);

  ngOnInit(): void {
    //obtengo el usuario de la sesion
    const usuario = this.authentication.obtenerUsuarioSesion();
    //cargo las categorias para el filtro del select
    this.cargarCategorias();
    //si hay usuario cargo los materiales de su empresa ya enriquecidos
    if (usuario) {
      this.cargarMateriales(usuario.empresa_id);
    }
  }

  //funcion para cargar las categorias del select de filtrado
  cargarCategorias(): void {
    this.categoriasService.getCategorias().subscribe((data) => {
      this.categorias.set(data);
    });
  }

  //funcion para cargar los materiales ya enriquecidos con categoria y precio desde el backend
  cargarMateriales(empresa_id: number): void {
    this.materialesService.getMaterialesConPrecioEmpresa(empresa_id).subscribe((data) => {
      this._materiales.set(data);
      this.totalMateriales.set(data.length);
      this.filtrarMateriales();
    });
  }

  //funcion para filtrar los materiales segun los filtros activos
  filtrarMateriales(): void {
    const q = this.busqueda().toLowerCase().trim();
    //filtro por busqueda, categoria y estado activo y los guardo en el signal
    this.materialesFiltrados.set(
      this._materiales().filter((m) => {
        const matchBusqueda =
          !q ||
          m.nombre.toLowerCase().includes(q) ||
          (m.codigo_interno ?? '').toLowerCase().includes(q) ||
          (m.proveedor ?? '').toLowerCase().includes(q);
        const matchCategoria =
          this.filtroCategoria() === 'todas' ||
          m.categoria_id.toString() === this.filtroCategoria();
        const matchActivo = this.mostrarInactivos() ? true : m.activo !== false && !m.deleted_at;
        return matchBusqueda && matchCategoria && matchActivo;
      }),
    );
  }

  //funcion para activar o desactivar un material
  toggleActivo(id: number): void {
    this.materialesService.toggleActivo(id).subscribe((materialActualizado) => {
      //actualizo el estado activo del material en el signal y vuelvo a filtrar
      const lista = [...this._materiales()];
      lista.forEach((m, index) => {
        if (m.id === id) {
          lista[index].activo = materialActualizado.activo;
        }
      });
      this._materiales.set(lista);
      this.filtrarMateriales();
    });
  }
}
