import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// Tus interfaces
import { Cliente } from '../../../../interfaces/cliente';
import { MaterialConPrecio } from '../../../../interfaces/material';
import { Presupuesto } from '../../../../interfaces/presupuesto';

// Tus servicios
import { Authentication } from '../../../../services/authentication';
import { ClientesServices } from '../../../../services/clientes';
import { Materiales } from '../../../../services/materiales';
import { Presupuestos } from '../../../../services/presupuestos';

@Component({
  selector: 'app-presupuesto-formulario',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatSnackBarModule],
  templateUrl: './formulario-presupuesto.html',
  styleUrl: './formulario-presupuesto.css',
})
export class FormularioPresupuesto implements OnInit {
  public id!: number;

  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private authentication = inject(Authentication);
  private clientesService = inject(ClientesServices);
  private materialesService = inject(Materiales);
  private presupuestosService = inject(Presupuestos);
  private snackBar = inject(MatSnackBar);

  // Arrays tipados con tus interfaces
  public clientesLista: Cliente[] = [];
  public materialesLista: MaterialConPrecio[] = [];

  public precioHoraTaller: number = 30;
  public totalMinutosFabricacion: number = 0;

  // Objeto base que cumple con los campos de tus tablas e interfaces
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
    elementos: [], // Array de Elementos y sus ElementoMaterial
  };

  ngOnInit(): void {
    const usuario = this.authentication.obtenerUsuarioSesion();
    if (usuario === null || usuario.rol !== 'admin') {
      this.router.navigate(['/nopermisos']);
      return;
    }

    this.cargarListas(usuario.empresa_id);

    this.activatedRoute.paramMap.subscribe((params) => {
      this.id = Number(params.get('id'));

      if (!Number.isNaN(this.id) && this.id > 0) {
        this.cargarPresupuesto(this.id);
      } else {
        this.presupuesto.empresa_id = usuario.empresa_id;
        this.presupuesto.usuario_id = usuario.id;
        this.presupuesto.numero_presupuesto = 'PRE-' + Date.now();

        const d = new Date();
        d.setDate(d.getDate() + 30);
        this.presupuesto.valido_hasta = d.toISOString().split('T')[0];
      }
    });
  }

  cargarListas(empresaId: number): void {
    this.clientesService
      .getClientePorEmpresa(empresaId)
      .subscribe((data) => (this.clientesLista = data));
    this.materialesService
      .getMaterialesConPrecioEmpresa(empresaId)
      .subscribe((data) => (this.materialesLista = data));
  }

  cargarPresupuesto(id: number): void {
    this.presupuestosService.getPresupuesto(id).subscribe({
      next: (res) => {
        this.presupuesto = res;
        this.totalMinutosFabricacion = this.presupuesto.elementos.reduce(
          (acc: number, el: any) => acc + (el.tiempo_estimado_minutos || 0) * (el.cantidad || 1),
          0,
        );
        if (this.totalMinutosFabricacion > 0 && this.presupuesto.coste_mano_obra > 0) {
          this.precioHoraTaller =
            this.presupuesto.coste_mano_obra / (this.totalMinutosFabricacion / 60);
        }
        this.recalcularTodo();
        this.cdr.detectChanges();
      },
      error: () => {
        this.snackBar.open('Error al cargar el presupuesto', 'Cerrar', {
          duration: 3000,
          panelClass: ['snack-error'],
        });
        this.cancelar();
      },
    });
  }

  // --- AUTOMATIZACIÓN DEL DESCUENTO DEL CLIENTE ---
  onClienteChange(): void {
    const clienteSel = this.clientesLista.find((c) => c.id == this.presupuesto.cliente_id);
    if (clienteSel) {
      // Si el cliente tiene un descuento en su ficha, se aplica automáticamente
      this.presupuesto.descuento_aplicado = clienteSel.descuento_fijo || 0;
      this.presupuesto.motivo_descuento =
        this.presupuesto.descuento_aplicado > 0 ? 'Descuento comercial por ficha de cliente' : '';
      this.recalcularTodo();
    }
  }

  // --- LÓGICA DE ELEMENTOS ---
  agregarElemento(): void {
    this.presupuesto.elementos.push({
      descripcion: '',
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

  eliminarElemento(index: number): void {
    this.presupuesto.elementos.splice(index, 1);
    this.recalcularTodo();
  }

  // --- LÓGICA DE MATERIALES ---
  agregarMaterial(elemento: any, materialId: string): void {
    const matId = parseInt(materialId);
    if (!matId) return;

    const infoMaterial = this.materialesLista.find((m) => m.id === matId);
    if (!infoMaterial) return;

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

  eliminarMaterial(elemento: any, index: number): void {
    elemento.materiales_desglose.splice(index, 1);
    this.recalcularTodo();
  }

  // --- MOTOR DE CÁLCULO ---
  recalcularTodo(): void {
    let costeMatTotal = 0;
    this.totalMinutosFabricacion = 0;

    this.presupuesto.elementos.forEach((el: any) => {
      let costeEl = 0;
      const cantidad = Number(el.cantidad) || 0;
      const ancho = Number(el.medida_ancho) || 0;
      const alto = Number(el.medida_alto) || 0;
      this.totalMinutosFabricacion += (Number(el.tiempo_estimado_minutos) || 0) * (cantidad || 1);

      el.materiales_desglose.forEach((mat: any) => {
        const merma = 1 + (Number(mat.factor_desperdicio) || 0) / 100;

        if (mat.tipo_unidad === 'metros_cuadrados') {
          mat.cantidad_calculada = ancho * alto * cantidad * merma;
        } else if (mat.tipo_unidad === 'metros_lineales') {
          mat.cantidad_calculada = (ancho * 2 + alto * 2) * cantidad * merma;
        } else {
          mat.cantidad_calculada = cantidad * merma;
        }

        mat.coste_total = mat.cantidad_calculada * (Number(mat.precio_congelado) || 0);
        costeEl += mat.coste_total;
      });

      el.coste_linea = costeEl;
      costeMatTotal += costeEl;
    });

    this.presupuesto.coste_materiales = costeMatTotal || 0;
    this.presupuesto.coste_mano_obra =
      this.totalMinutosFabricacion > 0
        ? (this.totalMinutosFabricacion / 60) * this.precioHoraTaller
        : 0;

    const otrosCostes = this.presupuesto.otros_costes || 0;
    const subtotal =
      (this.presupuesto.coste_materiales || 0) +
      (this.presupuesto.coste_mano_obra || 0) +
      otrosCostes;

    // Rentabilidad y Descuentos
    const beneficio = this.presupuesto.porcentaje_beneficio || 0;
    this.presupuesto.precio_sin_descuento = subtotal * (1 + beneficio / 100) || 0;

    const descuento = this.presupuesto.descuento_aplicado || 0;
    this.presupuesto.precio_final =
      (this.presupuesto.precio_sin_descuento || 0) * (1 - descuento / 100) || 0;
  }

  // --- GUARDADO EXACTAMENTE COMO LO HACES EN CLIENTES ---
  onSubmit(): void {
    if (!this.presupuesto.cliente_id || this.presupuesto.elementos.length === 0) {
      this.snackBar.open('Debes seleccionar un cliente y añadir al menos un elemento.', 'Cerrar', {
        duration: 3000,
        panelClass: ['snack-error'],
      });
      return;
    }

    if (this.id) {
      this.presupuesto.version = (this.presupuesto.version || 1) + 1;

      this.presupuestosService.updatePresupuesto(this.id, this.presupuesto).subscribe({
        next: () => {
          this.snackBar.open('Presupuesto actualizado correctamente', 'Cerrar', {
            duration: 3000,
            panelClass: ['snack-success'],
          });
          this.router.navigate(['/inicioadmin/presupuestos']);
        },
        error: (err: Error) => {
          this.snackBar.open(err.message ?? 'Error al actualizar', 'Cerrar', {
            duration: 3000,
            panelClass: ['snack-error'],
          });
        },
      });
    } else {
      this.presupuestosService.addPresupuesto(this.presupuesto).subscribe({
        next: () => {
          this.snackBar.open('Presupuesto creado correctamente', 'Cerrar', {
            duration: 3000,
            panelClass: ['snack-success'],
          });
          this.router.navigate(['/inicioadmin/presupuestos']);
        },
        error: (err: Error) => {
          this.snackBar.open(err.message ?? 'Error al crear', 'Cerrar', {
            duration: 3000,
            panelClass: ['snack-error'],
          });
        },
      });
    }
  }

  cancelar(): void {
    this.router.navigate(['/inicioadmin/presupuestos']);
  }
}
