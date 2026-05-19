import { ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin, of } from 'rxjs';

// interfaces
import { Cliente } from '../../../../interfaces/cliente';
import { MaterialConPrecio } from '../../../../interfaces/material';
import { Presupuesto } from '../../../../interfaces/presupuesto';
import { Categoria } from '../../../../interfaces/categoria';

// servicios
import { Authentication } from '../../../../services/authentication';
import { ClientesServices } from '../../../../services/clientes';
import { Materiales } from '../../../../services/materiales';
import { Presupuestos } from '../../../../services/presupuestos';
import { Categorias } from '../../../../services/categorias';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-presupuesto-formulario',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatSnackBarModule, TranslatePipe],
  templateUrl: './formulario-presupuesto.html',
  styleUrl: './formulario-presupuesto.css',
})
export class FormularioPresupuesto implements OnInit {
  //id del presupuesto cuando estamos editando uno existente
  public id!: number;

  //cdr para forzar refresco de la vista cuando llegan los datos asincronos
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private authentication = inject(Authentication);
  private clientesService = inject(ClientesServices);
  private materialesService = inject(Materiales);
  private presupuestosService = inject(Presupuestos);
  private categoriasService = inject(Categorias);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);

  //flag de carga para mostrar el spinner en el HTML mientras llegan los datos
  public cargando = signal<boolean>(true);

  //listas que rellenan los desplegables del formulario (clientes, materiales y categorias de la empresa)
  public clientesLista: Cliente[] = [];
  public materialesLista: MaterialConPrecio[] = [];
  public categoriasLista: Categoria[] = []; //lista para el select de tipos de producto

  //precio/hora del taller, se usa para calcular la mano de obra a partir de los minutos estimados
  public precioHoraTaller: number = 30;
  //suma de minutos de fabricacion de todos los elementos, lo uso para calcular la mano de obra
  public totalMinutosFabricacion: number = 0;

  //objeto presupuesto que se va rellenando con el formulario y se manda al backend al guardar
  public presupuesto: any = {
    id: null,
    empresa_id: 0,
    usuario_id: 0,
    cliente_id: null,
    numero_presupuesto: '',
    version: 1,
    coste_materiales: 0,
    coste_mano_obra: 0,
    otros_costes: 0,
    porcentaje_beneficio: 20,
    precio_sin_descuento: 0,
    descuento_aplicado: 0,
    motivo_descuento: '',
    precio_final: 0,
    estado: 'borrador',
    valido_hasta: '',
    notas_internas: '',
    notas_cliente: '',
    elementos: [], //array de elementos del presupuesto, cada uno con su lista de materiales
  };

  ngOnInit(): void {
    const usuario = this.authentication.obtenerUsuarioSesion()!;

    //miro si me llega un id por la URL para saber si estoy editando o creando
    this.activatedRoute.paramMap.subscribe((params) => {
      this.id = Number(params.get('id'));
      const editMode = !Number.isNaN(this.id) && this.id > 0;

      //si estoy creando, precargo los datos basicos del presupuesto nuevo
      if (!editMode) {
        this.presupuesto.empresa_id = usuario.empresa_id;
        this.presupuesto.usuario_id = usuario.id;
        //genero un numero de presupuesto unico usando la fecha actual en milisegundos
        this.presupuesto.numero_presupuesto = 'PRE-' + Date.now();
        //asigno por defecto 30 dias de validez al presupuesto
        const d = new Date();
        d.setDate(d.getDate() + 30);
        this.presupuesto.valido_hasta = d.toISOString().split('T')[0];
      }

      this.cargando.set(true);

      //hago todas las peticiones en paralelo con forkJoin para no anidar subscribes
      //si estoy editando tambien pido el presupuesto, si no devuelvo null con of()
      forkJoin({
        clientes: this.clientesService.getClientePorEmpresa(usuario.empresa_id),
        materiales: this.materialesService.getMaterialesConPrecioEmpresa(usuario.empresa_id),
        categorias: this.categoriasService.getCategorias(),
        presupuesto: editMode ? this.presupuestosService.getPresupuesto(this.id) : of(null),
      }).subscribe({
        next: ({ clientes, materiales, categorias, presupuesto }) => {
          this.clientesLista = clientes;
          this.materialesLista = materiales;
          //solo pongo en el select las categorias que sigan activas
          this.categoriasLista = categorias.filter((c) => c.activo !== false);

          //si he traido un presupuesto del backend, relleno el formulario con sus datos
          if (presupuesto) {
            this.presupuesto = presupuesto;
            //recalculo el total de minutos sumando los de cada elemento
            this.totalMinutosFabricacion = this.presupuesto.elementos.reduce(
              (acc: number, el: any) => acc + (el.tiempo_estimado_minutos || 0) * (el.cantidad || 1),
              0,
            );
            //si tengo minutos y mano de obra, calculo el precio/hora del taller
            if (this.totalMinutosFabricacion > 0 && this.presupuesto.coste_mano_obra > 0) {
              this.precioHoraTaller =
                this.presupuesto.coste_mano_obra / (this.totalMinutosFabricacion / 60);
            }
            //recalculo todos los precios para que cuadren con los datos cargados
            this.recalcularTodo();
          }

          this.cargando.set(false);
          //fuerzo el refresco de la vista por si Angular no detecta el cambio en this.presupuesto
          this.cdr.detectChanges();
        },
        error: () => {
          this.cargando.set(false);
          this.snackBar.open(
            this.translate.instant('quotes.loadError'),
            this.translate.instant('common.close'),
            { duration: 3000, panelClass: ['snack-error'] },
          );
          this.cancelar();
        },
      });
    });
  }

  //funcion que se ejecuta al cambiar el cliente del presupuesto
  //si el cliente tiene descuento fijo lo aplico automaticamente al presupuesto
  onClienteChange(): void {
    const clienteSel = this.clientesLista.find((c) => c.id == this.presupuesto.cliente_id);
    if (clienteSel) {
      this.presupuesto.descuento_aplicado = clienteSel.descuento_fijo || 0;
      //si hay descuento pongo un motivo predefinido, si no lo dejo vacio
      this.presupuesto.motivo_descuento =
        this.presupuesto.descuento_aplicado > 0
          ? this.translate.instant('quotes.clientDiscountReason')
          : '';
      this.recalcularTodo();
    }
  }

  //funcion para añadir un nuevo elemento al presupuesto (linea de producto a fabricar)
  agregarElemento(): void {
    this.presupuesto.elementos.push({
      descripcion: '',
      tipo_producto: null, //el usuario selecciona el tipo desde el selector
      medida_ancho: 1,
      medida_alto: 1,
      cantidad: 1,
      tiempo_estimado_minutos: 60,
      orden: this.presupuesto.elementos.length + 1,
      notas_fabricacion: '',
      coste_linea: 0,
      materiales_desglose: [],
    });
    this.recalcularTodo();
  }

  //funcion para eliminar un elemento del presupuesto
  eliminarElemento(index: number): void {
    this.presupuesto.elementos.splice(index, 1);
    this.recalcularTodo();
  }

  //funcion para añadir un material al desglose de un elemento
  agregarMaterial(elemento: any, materialId: string): void {
    const matId = parseInt(materialId);
    if (!matId) return;

    //busco el material en la lista de materiales para coger sus datos (precio, merma, tipo de unidad)
    const infoMaterial = this.materialesLista.find((m) => m.id === matId);
    if (!infoMaterial) return;

    //al añadirlo congelo el precio actual para que no cambie si el material sube de precio mas adelante
    elemento.materiales_desglose.push({
      material_id: infoMaterial.id,
      nombre_material_snapshot: infoMaterial.nombre,
      precio_congelado: infoMaterial.precio_venta,
      factor_desperdicio: infoMaterial.porcentaje_merma || 10,
      tipo_unidad: infoMaterial.tipo_unidad,
      cantidad_calculada: 0,
      coste_total: 0,
    });

    this.recalcularTodo();
  }

  //funcion para eliminar un material del desglose de un elemento
  eliminarMaterial(elemento: any, index: number): void {
    elemento.materiales_desglose.splice(index, 1);
    this.recalcularTodo();
  }

  //funcion que recalcula todos los importes del presupuesto (cantidades, costes, mano de obra y precio final)
  //se llama cada vez que cambia algo en el formulario para que los totales esten siempre actualizados
  recalcularTodo(): void {
    let costeMatTotal = 0;
    this.totalMinutosFabricacion = 0;

    //recorro cada elemento para calcular sus costes de material
    this.presupuesto.elementos.forEach((el: any) => {
      let costeEl = 0;
      const cantidad = Number(el.cantidad) || 0;
      const ancho = Number(el.medida_ancho) || 0;
      const alto = Number(el.medida_alto) || 0;
      //sumo los minutos de fabricacion del elemento multiplicados por su cantidad
      this.totalMinutosFabricacion += (Number(el.tiempo_estimado_minutos) || 0) * (cantidad || 1);

      //recorro cada material del elemento para calcular su cantidad y coste segun la unidad de medida
      el.materiales_desglose.forEach((mat: any) => {
        //factor de merma: si el material tiene 10% de merma hay que pedir 10% mas
        const merma = 1 + (Number(mat.factor_desperdicio) || 0) / 100;

        //segun la unidad la cantidad necesaria se calcula de una manera distinta
        if (mat.tipo_unidad === 'metros_cuadrados') {
          //metros cuadrados: ancho * alto * cantidad * merma
          mat.cantidad_calculada = ancho * alto * cantidad * merma;
        } else if (mat.tipo_unidad === 'metros_lineales') {
          //metros lineales: perimetro de cada elemento * cantidad * merma
          mat.cantidad_calculada = (ancho * 2 + alto * 2) * cantidad * merma;
        } else {
          //unidades, kilos, etc: solo cantidad * merma
          mat.cantidad_calculada = cantidad * merma;
        }

        //coste de este material = cantidad calculada * precio congelado
        mat.coste_total = mat.cantidad_calculada * (Number(mat.precio_congelado) || 0);
        costeEl += mat.coste_total;
      });

      //coste total del elemento es la suma de sus materiales
      el.coste_linea = costeEl;
      costeMatTotal += costeEl;
    });

    //actualizo los costes generales del presupuesto
    this.presupuesto.coste_materiales = costeMatTotal || 0;
    //la mano de obra se calcula con los minutos totales y el precio/hora del taller
    this.presupuesto.coste_mano_obra =
      this.totalMinutosFabricacion > 0
        ? (this.totalMinutosFabricacion / 60) * this.precioHoraTaller
        : 0;

    //subtotal = materiales + mano de obra + otros costes
    const otrosCostes = this.presupuesto.otros_costes || 0;
    const subtotal =
      (this.presupuesto.coste_materiales || 0) +
      (this.presupuesto.coste_mano_obra || 0) +
      otrosCostes;

    //aplico el porcentaje de beneficio sobre el subtotal para sacar el precio sin descuento
    const beneficio = this.presupuesto.porcentaje_beneficio || 0;
    this.presupuesto.precio_sin_descuento = subtotal * (1 + beneficio / 100) || 0;

    //aplico el descuento (si lo hay) para sacar el precio final
    const descuento = this.presupuesto.descuento_aplicado || 0;
    this.presupuesto.precio_final =
      (this.presupuesto.precio_sin_descuento || 0) * (1 - descuento / 100) || 0;
  }

  //funcion que se ejecuta al pulsar guardar el presupuesto
  onSubmit(): void {
    //validacion minima: tiene que haber cliente y al menos un elemento
    if (!this.presupuesto.cliente_id || this.presupuesto.elementos.length === 0) {
      this.snackBar.open(this.translate.instant('quotes.validationClientElement'), this.translate.instant('common.close'), {
        duration: 3000,
        panelClass: ['snack-error'],
      });
      return;
    }

    //si hay id estoy editando un presupuesto existente
    if (this.id) {
      //subo la version del presupuesto para llevar control de cambios
      this.presupuesto.version = (this.presupuesto.version || 1) + 1;

      this.presupuestosService.updatePresupuesto(this.id, this.presupuesto).subscribe({
        next: () => {
          this.snackBar.open(this.translate.instant('quotes.updatedSnack'), this.translate.instant('common.close'), {
            duration: 3000,
            panelClass: ['snack-success'],
          });
          this.router.navigate(['/inicioadmin/presupuestos']);
        },
        error: (err: Error) => {
          this.snackBar.open(err.message ?? this.translate.instant('quotes.updateErrorSnack'), this.translate.instant('common.close'), {
            duration: 3000,
            panelClass: ['snack-error'],
          });
        },
      });
    } else {
      //si no hay id estoy creando un presupuesto nuevo
      this.presupuestosService.addPresupuesto(this.presupuesto).subscribe({
        next: () => {
          this.snackBar.open(this.translate.instant('quotes.createdSnack'), this.translate.instant('common.close'), {
            duration: 3000,
            panelClass: ['snack-success'],
          });
          this.router.navigate(['/inicioadmin/presupuestos']);
        },
        error: (err: Error) => {
          this.snackBar.open(err.message ?? this.translate.instant('quotes.createErrorSnack'), this.translate.instant('common.close'), {
            duration: 3000,
            panelClass: ['snack-error'],
          });
        },
      });
    }
  }

  //funcion para cancelar y volver al listado de presupuestos sin guardar
  cancelar(): void {
    this.router.navigate(['/inicioadmin/presupuestos']);
  }
}
