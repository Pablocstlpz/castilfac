import { Component, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { DecimalPipe, TitleCasePipe } from '@angular/common'; // Solo importamos lo que usamos
import { NgClass } from '@angular/common';
import { Categorias } from '../../../services/categorias';
import { Materiales } from '../../../services/materiales';
import { PreciosEmpresas } from '../../../services/precios-empresas';
import { PlantillasProductos } from '../../../services/plantillas-productos';
import { PlantillasMateriales } from '../../../services/plantillas-materiales';
import { Presupuestos } from '../../../services/presupuestos';

@Component({
  selector: 'app-catalogo',
  imports: [FormsModule, MatIconModule, DecimalPipe, TitleCasePipe, NgClass], // Nada de CommonModule
  templateUrl: './catalogo-y-precios.html',
  styleUrl: './catalogo-y-precios.css',
})
export class CatalogoYPrecios {
  // --- ESTADO GLOBAL (WritableSignals) ---
  public materiales = signal<any[]>([]);
  public categorias = signal<any[]>([
    { id: 1, nombre: 'Perfiles Aluminio' },
    { id: 2, nombre: 'Vidrios' },
    { id: 3, nombre: 'Herrajes' },
  ]);

  //inyectar servicio de categorias
  private categoriasService = inject(Categorias);
  //inyectar servicio de materiales
  private materialesService = inject(Materiales);
  //inyectar servicio de precios empresas
  private preciosEmpresasService = inject(PreciosEmpresas);
  //inyectar servicio de plantillas productos
  private plantillasProductosService = inject(PlantillasProductos);
  //inyectar servicio de plantillas materiales
  private plantillasMaterialesService = inject(PlantillasMateriales);
  //inyectar servicio de presupuestos
  private presupuestosService = inject(Presupuestos);

  // --- ESTADO DE FILTROS ---
  public busqueda = signal<string>('');
  public filtroCategoria = signal<string>('todas');
  public filtroUnidad = signal<string>('todas');
  public mostrarInactivos = signal<boolean>(false);

  // --- ESTADO DE EDICION INLINE ---
  public celdaEnEdicion = signal<string | null>(null);
  public valorTemporalEdicion = signal<number>(0);

  // --- COMPUTED: Filtro ultra-reactivo ---
  public materialesFiltrados = computed(() => {
    return this.materiales().filter((m) => {
      const query = this.busqueda().toLowerCase();
      const matchBusqueda =
        !query ||
        m.nombre.toLowerCase().includes(query) ||
        m.codigo_interno.toLowerCase().includes(query) ||
        m.proveedor.toLowerCase().includes(query);

      const matchCategoria =
        this.filtroCategoria() === 'todas' || m.categoria_id.toString() === this.filtroCategoria();
      const matchUnidad = this.filtroUnidad() === 'todas' || m.tipo_unidad === this.filtroUnidad();
      const matchActivo = this.mostrarInactivos() ? true : m.activo === 1 && !m.deleted_at;

      return matchBusqueda && matchCategoria && matchUnidad && matchActivo;
    });
  });

  ngOnInit() {
    this.obtenerCategorias();
    this.obtenerMateriales();
    this.obtenerPreciosEmpresa(1); // Carga precios para empresa con ID 1 (ejemplo)
    this.obtenerPlantillasProductosEmpresa(1); // Carga plantillas para empresa con ID 1 (ejemplo)
    this.obtenerPlantillasMaterialesPorPlantillaProducto(1); // Carga plantillas materiales para la plantilla con ID 1 (ejemplo)
    this.obtenerPresupuestosEmpresa(1); // Carga presupuestos para empresa con ID 1 (ejemplo)
  }

  constructor() {
    this.cargarDatos(); // Cargamos al instanciar
  }

  cargarDatos() {
    this.materiales.set([
      {
        id: 1,
        categoria_id: 1,
        categoria_nombre: 'Perfiles Aluminio',
        codigo_interno: 'PERF-001',
        nombre: 'Perfil Marco Corredera 60mm',
        tipo_unidad: 'metros_lineales',
        precio_base: 12.5,
        precio_venta: 18.0,
        porcentaje_merma: 5,
        proveedor: 'Aluminios del Sur',
        activo: 1,
      },
      {
        id: 2,
        categoria_id: 2,
        categoria_nombre: 'Vidrios',
        codigo_interno: 'VID-044',
        nombre: 'Cristal Templado 8mm Transparente',
        tipo_unidad: 'metros_cuadrados',
        precio_base: 45.0,
        precio_venta: 40.0,
        porcentaje_merma: 10,
        proveedor: 'Cristalerias Norte',
        activo: 1,
      },
      {
        id: 3,
        categoria_id: 3,
        categoria_nombre: 'Herrajes',
        codigo_interno: 'HER-012',
        nombre: 'Bisagra Oculta Inox',
        tipo_unidad: 'unidades',
        precio_base: 4.2,
        precio_venta: 8.5,
        porcentaje_merma: 0,
        proveedor: 'Herrajes Pro',
        activo: 0,
      },
    ]);
  }

  iniciarEdicion(id: number, campo: string, valorActual: number) {
    this.celdaEnEdicion.set(`${id}-${campo}`);
    this.valorTemporalEdicion.set(valorActual);
  }

  guardarEdicion(id: number, campo: string) {
    const nuevoValor = this.valorTemporalEdicion();
    if (nuevoValor <= 0 || isNaN(nuevoValor)) {
      alert('El precio debe ser un numero positivo.');
      this.celdaEnEdicion.set(null);
      return;
    }

    this.materiales.update((actuales) =>
      actuales.map((m) => (m.id === id ? { ...m, [campo]: nuevoValor } : m)),
    );
    this.celdaEnEdicion.set(null);
  }

  cancelarEdicion() {
    this.celdaEnEdicion.set(null);
  }

  getIconoUnidad(unidad: string): string {
    const iconos: Record<string, string> = {
      metros_lineales: 'straighten',
      metros_cuadrados: 'crop_square',
      unidades: 'tag',
      kilogramos: 'scale',
    };
    return iconos[unidad] || 'category';
  }

  //obtener todas las categorias
  obtenerCategorias() {
    this.categoriasService.getCategorias().subscribe({
      next: (data) => {
        console.log('Categorias:', data);
      },
      error: (err) => {
        console.error('Error al cargar categorias', err);
      },
    });
  }

  //obtener todas los materiales
  obtenerMateriales() {
    this.materialesService.getMateriales().subscribe({
      next: (data) => {
        console.log('Materiales:', data);
      },
      error: (err) => {
        console.error('Error al cargar materiales', err);
      },
    });
  }

  //obtener precios de una empresa
  obtenerPreciosEmpresa(id: number) {
    this.preciosEmpresasService.getPreciosEmpresa(id).subscribe({
      next: (data) => {
        console.log('Precios Empresa:', data);
      },
      error: (err) => {
        console.error('Error al cargar precios de empresa', err);
      },
    });
  }

  //obtener todas las plantillas-productos de una empresa
  obtenerPlantillasProductosEmpresa(id: number) {
    this.plantillasProductosService.getPlantillasProductosEmpresa(id).subscribe({
      next: (data) => {
        console.log('Plantillas Productos Empresa:', data);
      },
      error: (err) => {
        console.error('Error al cargar plantillas productos de empresa', err);
      },
    });
  }

  obtenerPlantillasMaterialesPorPlantillaProducto(plantillaId: number) {
    this.plantillasMaterialesService
      .getPlantillaMaterialPorPlantillaProducto(plantillaId)
      .subscribe({
        next: (data) => {
          console.log('Plantillas Materiales por Plantilla Producto:', data);
        },
        error: (err) => {
          console.error('Error al cargar plantillas materiales por plantilla producto', err);
        },
      });
  }

  //obtener presupuestos de una empresa
  obtenerPresupuestosEmpresa(empresaId: number) {
    this.presupuestosService.getPresupuestosEmpresa(empresaId).subscribe({
      next: (data) => {
        console.log('Presupuestos Empresa:', data);
      },
      error: (err) => {
        console.error('Error al cargar presupuestos de empresa', err);
      },
    });
  }
}
