import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Material } from '../../../../interfaces/material';
import { Categoria } from '../../../../interfaces/categoria';
import { Materiales } from '../../../../services/materiales';
import { Categorias } from '../../../../services/categorias';
import { Authentication } from '../../../../services/authentication';

@Component({
  selector: 'app-material-formulario',
  imports: [
    ReactiveFormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatButtonModule,
    MatSnackBarModule,
  ],
  templateUrl: './material-detalle.html',
  styleUrl: './material-detalle.css',
})
export class MaterialDetalle {
  private router = inject(Router); // Inyectamos el servicio Router para poder redirigir
  private activatedRoute = inject(ActivatedRoute); // Inyectamos el servicio ActivatedRoute para poder obtener los parametros de la url
  private materialesService = inject(Materiales); // Inyectamos el servicio Materiales para poder utilizar sus metodos
  private categoriasService = inject(Categorias); // Inyectamos el servicio Categorias para poder utilizar sus metodos
  private authentication = inject(Authentication); // Inyectamos el servicio Authentication para poder utilizar sus metodos
  private snackBar = inject(MatSnackBar); // Inyectamos el servicio MatSnackBar para poder utilizar sus metodos
  private fb = inject(FormBuilder); // Inyectamos el servicio FormBuilder para poder utilizar sus metodos

  //signal con las categorias disponibles para el select
  public categorias = signal<Categoria[]>([]);

  //id del material si estamos editando, null si es nuevo
  public id: number | null = null;

  //formulario reactivo con todos los campos del material
  public materialForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(200)]],
    codigo_interno: ['', [Validators.maxLength(50)]],
    categoria_id: [null, [Validators.required]],
    descripcion: [''],
    tipo_unidad: ['metros_lineales', Validators.required],
    precio_base: [0, [Validators.required, Validators.min(0)]],
    porcentaje_merma_recomendado: [10, [Validators.min(0), Validators.max(100)]],
    proveedor: ['', [Validators.maxLength(150)]],
    referencia_proveedor: ['', [Validators.maxLength(100)]],
    activo: [true],
  });

  ngOnInit(): void {
    //compruebo si el usuario tiene sesion y es admin
    const usuario = this.authentication.obtenerUsuarioSesion();
    if (usuario === null || usuario.rol !== 'admin') {
      this.router.navigate(['/nopermisos']);
      return;
    }
    //cargo las categorias para el select
    this.cargarCategorias();
    //obtengo el id de la url para saber si es edicion o creacion
    const idParam = this.activatedRoute.snapshot.params['id'];
    if (idParam) {
      this.id = Number(idParam);
      this.cargarMaterial(this.id);
    }
  }

  //funcion para cargar las categorias del select
  cargarCategorias(): void {
    this.categoriasService.getCategorias().subscribe((data) => {
      this.categorias.set(data);
    });
  }

  //funcion para cargar los datos del material cuando se edita
  cargarMaterial(id: number): void {
    const usuario = this.authentication.obtenerUsuarioSesion();
    if (!usuario) { this.router.navigate(['/sesioncerrada']); return; }
    this.materialesService.getMaterial(usuario.empresa_id, id).subscribe((material) => {
      this.materialForm.patchValue({
        nombre: material.nombre,
        codigo_interno: material.codigo_interno ?? '',
        categoria_id: material.categoria_id,
        descripcion: material.descripcion ?? '',
        tipo_unidad: material.tipo_unidad,
        precio_base: material.precio_base,
        porcentaje_merma_recomendado: material.porcentaje_merma_recomendado ?? 10,
        proveedor: material.proveedor ?? '',
        referencia_proveedor: material.referencia_proveedor ?? '',
        activo: material.activo,
      });
    });
  }

  //funcion que se ejecuta al hacer submit del formulario
  onSubmit(): void {
    //si el formulario es invalido marco todos los campos como tocados para mostrar errores
    if (this.materialForm.invalid) {
      this.materialForm.markAllAsTouched();
      return;
    }
    //compruebo la sesion por seguridad antes de enviar
    const usuario = this.authentication.obtenerUsuarioSesion();
    if (!usuario?.empresa_id) {
      this.router.navigate(['/sesioncerrada']);
      return;
    }
    //construyo el objeto material con los valores del formulario
    const materialFormulario: Material = {
      empresa_id: usuario.empresa_id,
      nombre: this.materialForm.value.nombre,
      codigo_interno: this.materialForm.value.codigo_interno || undefined,
      categoria_id: this.materialForm.value.categoria_id,
      descripcion: this.materialForm.value.descripcion || undefined,
      tipo_unidad: this.materialForm.value.tipo_unidad,
      precio_base: this.materialForm.value.precio_base,
      porcentaje_merma_recomendado: this.materialForm.value.porcentaje_merma_recomendado ?? 10,
      proveedor: this.materialForm.value.proveedor || undefined,
      referencia_proveedor: this.materialForm.value.referencia_proveedor || undefined,
      activo: this.materialForm.value.activo,
      id: this.id ?? 0,
      fecha_creacion: new Date().toISOString(),
      fecha_actualizacion: new Date().toISOString(),
      usuario_id: usuario.id,
    };
    //si no hay id es una creacion, si hay id es una actualizacion
    if (!this.id) {
      this.crearMaterial(usuario.empresa_id, materialFormulario);
    } else {
      this.actualizarMaterial(usuario.empresa_id, materialFormulario);
    }
  }

  //funcion para crear un nuevo material
  crearMaterial(empresa_id: number, material: Material): void {
    this.materialesService.addMaterial(empresa_id, material).subscribe({
      next: () => {
        this.snackBar.open('Material creado correctamente', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['snack-success'],
        });
        this.router.navigate(['/inicioadmin/catalogo-y-precios']);
      },
      error: (error: Error) => {
        this.snackBar.open(error.message ?? 'Error al crear el material', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['snack-error'],
        });
      },
    });
  }

  //funcion para actualizar un material existente
  actualizarMaterial(empresa_id: number, material: Material): void {
    this.materialesService.updateMaterial(empresa_id, material).subscribe({
      next: () => {
        this.snackBar.open('Material actualizado correctamente', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['snack-success'],
        });
        this.router.navigate(['/inicioadmin/catalogo-y-precios']);
      },
      error: (error: Error) => {
        this.snackBar.open(error.message ?? 'Error al actualizar el material', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['snack-error'],
        });
      },
    });
  }

  //funcion para cancelar y volver al catalogo
  cancelar(): void {
    this.router.navigate(['/inicioadmin/catalogo-y-precios']);
  }
}
