import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Cliente } from '../../../../interfaces/cliente';
import { ClientesServices } from '../../../../services/clientes';
import { Authentication } from '../../../../services/authentication';

@Component({
  selector: 'app-cliente-formulario',
  imports: [MatIcon, ReactiveFormsModule, MatSnackBarModule],
  templateUrl: './cliente-formulario.html',
  styleUrl: './cliente-formulario.css',
})
export class ClienteFormulario {
  public clienteForm!: FormGroup;

  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private clientesService = inject(ClientesServices);
  private authentication = inject(Authentication);
  private snackBar = inject(MatSnackBar);
  private id!: number;

  constructor(private fb: FormBuilder) {
    this.clienteForm = this.fb.group({
      id: [''],
      nombre_empresa_o_particular: ['', [Validators.required, Validators.maxLength(200)]],
      nif_cif: [''],
      telefono: [''],
      email: ['', [Validators.email]],
      tipo_cliente: ['particular', Validators.required],
      descuento_fijo: [0, [Validators.min(0), Validators.max(100)]],
      direccion: [''],
    });
  }

  ngOnInit(): void {
    const usuario = this.authentication.obtenerUsuarioSesion();
    if (usuario === null || usuario.rol !== 'admin') {
      this.router.navigate(['/nopermisos']);
      return;
    }

    this.activatedRoute.queryParams.subscribe((params) => {
      this.id = params['id'];
      if (this.id) {
        this.clientesService.getCliente(this.id).subscribe({
          next: (cliente) => {
            this.clienteForm.patchValue({
              id: cliente.id,
              nombre_empresa_o_particular: cliente.nombre_empresa_o_particular,
              nif_cif: cliente.nif_cif ?? '',
              telefono: cliente.telefono ?? '',
              email: cliente.email ?? '',
              tipo_cliente: cliente.tipo_cliente,
              descuento_fijo: cliente.descuento_fijo,
              direccion: cliente.direccion ?? '',
            });
          },
        });
      }
    });
  }

  get nombre_empresa_o_particular() {
    return this.clienteForm.get('nombre_empresa_o_particular') as FormControl;
  }
  get email() {
    return this.clienteForm.get('email') as FormControl;
  }
  get tipo_cliente() {
    return this.clienteForm.get('tipo_cliente') as FormControl;
  }

  onSubmit(): void {
    if (this.clienteForm.invalid) {
      this.clienteForm.markAllAsTouched();
      return;
    }

    const usuarioSesion = this.authentication.obtenerUsuarioSesion();
    if (!usuarioSesion?.empresa_id) {
      this.router.navigate(['/sesioncerrada']);
      return;
    }

    const clienteData: Cliente = {
      id: this.clienteForm.value.id,
      empresa_id: usuarioSesion.empresa_id,
      nombre_empresa_o_particular: this.clienteForm.value.nombre_empresa_o_particular,
      nif_cif: this.clienteForm.value.nif_cif || undefined,
      telefono: this.clienteForm.value.telefono || undefined,
      email: this.clienteForm.value.email || undefined,
      tipo_cliente: this.clienteForm.value.tipo_cliente,
      descuento_fijo: this.clienteForm.value.descuento_fijo,
      direccion: this.clienteForm.value.direccion || undefined,
      fecha_creacion: new Date(),
      fecha_actualizacion: new Date(),
      deleted_at: null,
    };

    if (!this.id) {
      this.anadirCliente(clienteData);
    } else {
      this.actualizarCliente(clienteData);
    }
  }

  anadirCliente(cliente: Cliente): void {
    this.clientesService.addCliente(cliente).subscribe({
      next: () => {
        this.snackBar.open('Cliente creado correctamente', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['snack-success'],
        });
        this.clienteForm.reset();
        this.router.navigate(['/inicioadmin/clientes']);
      },
      error: (error: Error) => {
        this.snackBar.open(error.message ?? 'Error al crear el cliente', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['snack-error'],
        });
      },
    });
  }

  actualizarCliente(cliente: Cliente): void {
    this.clientesService.updateCliente(cliente).subscribe({
      next: () => {
        this.snackBar.open('Cliente actualizado correctamente', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['snack-success'],
        });
        this.clienteForm.reset();
        this.router.navigate(['/inicioadmin/clientes']);
      },
      error: (error: Error) => {
        this.snackBar.open(error.message ?? 'Error al actualizar el cliente', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['snack-error'],
        });
      },
    });
  }

  cancelar(): void {
    this.router.navigate(['/inicioadmin/clientes']);
  }
}
