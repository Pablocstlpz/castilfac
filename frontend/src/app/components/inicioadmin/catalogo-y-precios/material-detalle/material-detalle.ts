import { Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

// Imports de Angular Material necesarios para el HTML
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// Imports de tus interfaces y servicios (Ajusta las rutas a tu proyecto)
import { Material } from '../../../../interfaces/material';
import { Materiales } from '../../../../services/materiales';
import { Authentication } from '../../../../services/authentication';

@Component({
  selector: 'app-material-formulario',
  standalone: true,
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
export class MaterialDetalle implements OnInit {
  public materialForm!: FormGroup;

  // Inyectamos servicios usando el patrón moderno de Angular
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private materialesService = inject(Materiales);
  private authentication = inject(Authentication);
  private snackBar = inject(MatSnackBar);

  // Guardará el ID de la URL si estamos editando
  private id!: number;

  constructor(private fb: FormBuilder) {
    // Definimos la estructura del formulario y sus validaciones (Reflejando la BD)
    this.materialForm = this.fb.group({
      id: [''],
      nombre: ['', [Validators.required, Validators.maxLength(200)]],
      codigo_interno: ['', [Validators.maxLength(50)]],
      categoria_id: ['', [Validators.required]],
      descripcion: [''],
      tipo_unidad: ['metros_lineales', Validators.required], // Valor por defecto
      precio_base: [0, [Validators.required, Validators.min(0)]],
      porcentaje_merma_recomendado: [10, [Validators.min(0), Validators.max(100)]], // 10% por defecto
      proveedor: ['', [Validators.maxLength(150)]],
      referencia_proveedor: ['', [Validators.maxLength(100)]],
      activo: [true], // El material está activo por defecto
    });
  }

  ngOnInit(): void {
    // 1. Verificamos que el usuario tiene sesión y rol de administrador
    const usuario = this.authentication.obtenerUsuarioSesion();
    if (usuario === null || usuario.rol !== 'admin') {
      this.router.navigate(['/nopermisos']);
      return;
    }

    // 2. Revisamos si en la URL viene un ?id= para saber si es edición
    this.activatedRoute.queryParams.subscribe((params) => {
      this.id = params['id'];

      // Si hay ID, llamamos al backend para traer los datos y rellenar el formulario
      if (this.id) {
        this.materialesService.getMaterial(this.id).subscribe({
          next: (material) => {
            // patchValue rellena los campos del formulario automáticamente
            this.materialForm.patchValue({
              id: material.id,
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
          },
          error: (error) => {
            console.error('Error al cargar el material', error);
            this.snackBar.open('Error al cargar los datos del material', 'Cerrar', {
              duration: 3000,
            });
            this.router.navigate(['/inicioadmin/materiales']);
          },
        });
      }
    });
  }

  // --- GETTERS PARA LAS VALIDACIONES EN EL HTML ---
  get nombre() {
    return this.materialForm.get('nombre') as FormControl;
  }
  get codigo_interno() {
    return this.materialForm.get('codigo_interno') as FormControl;
  }
  get categoria_id() {
    return this.materialForm.get('categoria_id') as FormControl;
  }
  get precio_base() {
    return this.materialForm.get('precio_base') as FormControl;
  }

  // --- LÓGICA PRINCIPAL AL HACER SUBMIT ---
  onSubmit(): void {
    // Si el formulario es inválido, marcamos todos los campos como "tocados" para mostrar los errores en rojo
    if (this.materialForm.invalid) {
      this.materialForm.markAllAsTouched();
      return;
    }

    // Volvemos a comprobar la sesión por seguridad
    const usuarioSesion = this.authentication.obtenerUsuarioSesion();
    if (!usuarioSesion?.empresa_id) {
      this.router.navigate(['/sesioncerrada']);
      return;
    }

    // Montamos el objeto Material extrayendo los valores del formulario reactivo
    const materialData: Material = {
      id: this.materialForm.value.id,
      categoria_id: this.materialForm.value.categoria_id,
      codigo_interno: this.materialForm.value.codigo_interno || undefined,
      nombre: this.materialForm.value.nombre,
      descripcion: this.materialForm.value.descripcion || undefined,
      tipo_unidad: this.materialForm.value.tipo_unidad,
      precio_base: this.materialForm.value.precio_base,
      porcentaje_merma_recomendado: this.materialForm.value.porcentaje_merma_recomendado,
      proveedor: this.materialForm.value.proveedor || undefined,
      referencia_proveedor: this.materialForm.value.referencia_proveedor || undefined,
      activo: this.materialForm.value.activo,
      fecha_creacion: new Date().toISOString(),
      fecha_actualizacion: new Date().toISOString(),
      // deleted_at no hace falta enviarlo, el backend o la BD lo manejan
    };

    // Si no teníamos ID al entrar a la vista, estamos creando. Si teníamos ID, actualizamos.
    if (!this.id) {
      this.anadirMaterial(materialData);
    } else {
      this.actualizarMaterial(materialData);
    }
  }

  anadirMaterial(material: Material): void {
    this.materialesService.addMaterial(material).subscribe({
      next: () => {
        this.snackBar.open('Material creado correctamente', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['snack-success'],
        });
        this.materialForm.reset();
        this.router.navigate(['/inicioadmin/materiales']);
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

  actualizarMaterial(material: Material): void {
    this.materialesService.updateMaterial(material).subscribe({
      next: () => {
        this.snackBar.open('Material actualizado correctamente', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['snack-success'],
        });
        this.materialForm.reset();
        this.router.navigate(['/inicioadmin/materiales']);
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

  cancelar(): void {
    // Redirige al listado general de materiales
    this.router.navigate(['/inicioadmin/materiales']);
  }
}
