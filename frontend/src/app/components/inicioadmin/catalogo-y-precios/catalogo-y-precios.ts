import { Component, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { DecimalPipe, TitleCasePipe } from '@angular/common';
import { NgClass } from '@angular/common';
import { Categorias } from '../../../services/categorias';
import { Materiales } from '../../../services/materiales';
import { PreciosEmpresas } from '../../../services/precios-empresas';
import { Authentication } from '../../../services/authentication';
import { Material } from '../../../interfaces/material';
import { Categoria } from '../../../interfaces/categoria';
import { PrecioEmpresa } from '../../../interfaces/precio-empresa';

interface MaterialVista extends Material {
  categoria_nombre: string;
  precio_venta: number;
  porcentaje_merma: number;
}

@Component({
  selector: 'app-catalogo',
  imports: [FormsModule, MatIconModule, DecimalPipe, TitleCasePipe, NgClass],
  templateUrl: './catalogo-y-precios.html',
  styleUrl: './catalogo-y-precios.css',
})
export class CatalogoYPrecios {
  private categoriasService = inject(Categorias);
  private materialesService = inject(Materiales);
  private preciosEmpresasService = inject(PreciosEmpresas);
  private authentication = inject(Authentication);

  private _materiales = signal<Material[]>([]);
  public totalMateriales = computed(() => this._materiales().length);
  public categorias = signal<Categoria[]>([]);
  private preciosEmpresa = signal<PrecioEmpresa[]>([]);

  public busqueda = signal<string>('');
  public filtroCategoria = signal<string>('todas');
  public mostrarInactivos = signal<boolean>(false);

  public celdaEnEdicion = signal<string | null>(null);
  public valorTemporalEdicion = signal<number>(0);

  private materialesEnriquecidos = computed<MaterialVista[]>(() =>
    this._materiales().map((m) => {
      const cat = this.categorias().find((c) => c.id === m.categoria_id);
      const precio = this.preciosEmpresa().find((p) => p.material_id === m.id);
      return {
        ...m,
        categoria_nombre: cat?.nombre ?? '—',
        precio_venta: precio?.precio_venta ?? m.precio_base,
        porcentaje_merma: precio?.porcentaje_merma ?? m.porcentaje_merma_recomendado ?? 0,
      };
    }),
  );

  public materialesFiltrados = computed(() =>
    this.materialesEnriquecidos().filter((m) => {
      const q = this.busqueda().toLowerCase().trim();
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

  ngOnInit(): void {
    const usuario = this.authentication.obtenerUsuarioSesion();
    this.cargarCategorias();
    this.cargarMateriales();
    if (usuario) {
      this.cargarPreciosEmpresa(usuario.empresa_id);
    }
  }

  cargarCategorias(): void {
    this.categoriasService.getCategorias().subscribe({
      next: (data) => this.categorias.set(data),
      error: (err) => console.error('Error al cargar categorías', err),
    });
  }

  cargarMateriales(): void {
    this.materialesService.getMateriales().subscribe({
      next: (data) => this._materiales.set(data),
      error: (err) => console.error('Error al cargar materiales', err),
    });
  }

  cargarPreciosEmpresa(empresa_id: number): void {
    this.preciosEmpresasService.getPreciosEmpresa(empresa_id).subscribe({
      next: (data) => this.preciosEmpresa.set(data),
      error: (err) => console.error('Error al cargar precios', err),
    });
  }

  iniciarEdicion(id: number, campo: string, valorActual: number): void {
    this.celdaEnEdicion.set(`${id}-${campo}`);
    this.valorTemporalEdicion.set(valorActual);
  }

  guardarEdicion(id: number, campo: string): void {
    const nuevoValor = this.valorTemporalEdicion();
    if (nuevoValor <= 0 || isNaN(nuevoValor)) {
      this.celdaEnEdicion.set(null);
      return;
    }
    this.preciosEmpresa.update((precios) =>
      precios.map((p) => (p.material_id === id ? { ...p, [campo]: nuevoValor } : p)),
    );
    this.celdaEnEdicion.set(null);
  }

  cancelarEdicion(): void {
    this.celdaEnEdicion.set(null);
  }

  toggleActivo(id: number): void {
    this.materialesService.toggleActivo(id).subscribe({
      next: (materialActualizado) => {
        this._materiales.update((lista) =>
          lista.map((m) => (m.id === id ? { ...m, activo: materialActualizado.activo } : m)),
        );
      },
      error: (err) => console.error('Error al cambiar estado del material', err),
    });
  }

  getIconoUnidad(unidad: string): string {
    const iconos: Record<string, string> = {
      metros_lineales: 'straighten',
      metros_cuadrados: 'crop_square',
      unidades: 'tag',
      kilogramos: 'scale',
      litros: 'water_drop',
    };
    return iconos[unidad] || 'category';
  }
}
