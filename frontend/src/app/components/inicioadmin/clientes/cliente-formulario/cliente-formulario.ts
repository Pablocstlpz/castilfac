import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Cliente } from '../../../../interfaces/cliente';
import { ClientesServices } from '../../../../services/clientes';
import { Authentication } from '../../../../services/authentication';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-cliente-formulario',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatOptionModule,
    MatRadioModule,
    MatSelectModule,
    MatSnackBarModule,
    TranslatePipe,
  ],
  templateUrl: './cliente-formulario.html',
  styleUrl: './cliente-formulario.css',
})
export class ClienteFormulario {
  public clienteForm!: FormGroup;
  public id!: number; //id del cliente si estamos editando

  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private clientesService = inject(ClientesServices);
  private authentication = inject(Authentication);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);
  private fb = inject(FormBuilder);

  //creo el formulario del cliente con sus validaciones
  constructor() {
    this.clienteForm = this.fb.group({
      id: [''], //solo se rellena cuando estamos editando un cliente existente
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
    //miro si me llega un id por la URL para saber si estoy editando o creando
    this.activatedRoute.queryParams.subscribe((params) => {
      this.id = params['id'];
      if (this.id) {
        //si hay id, pido el cliente y relleno el formulario con sus datos
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

  /**getter's */
  get nombre_empresa_o_particular() {
    return this.clienteForm.get('nombre_empresa_o_particular') as FormControl;
  }
  get email() {
    return this.clienteForm.get('email') as FormControl;
  }
  get tipo_cliente() {
    return this.clienteForm.get('tipo_cliente') as FormControl;
  }

  //funcion que se ejecuta al pulsar guardar
  onSubmit(): void {
    //si el formulario es invalido marco todos los campos como tocados para que se vean los errores
    if (this.clienteForm.invalid) {
      this.clienteForm.markAllAsTouched();
      return;
    }

    //compruebo que hay sesion activa para saber a que empresa pertenece el cliente
    const usuarioSesion = this.authentication.obtenerUsuarioSesion();
    if (!usuarioSesion?.empresa_id) {
      this.router.navigate(['/sesioncerrada']);
      return;
    }

    //construyo el objeto cliente con los datos del formulario y el empresa_id de la sesion
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

    //si no hay id, estoy creando un cliente; si hay id, lo actualizo
    if (!this.id) {
      this.anadirCliente(clienteData);
    } else {
      this.actualizarCliente(clienteData);
    }
  }

  //funcion para añadir un cliente nuevo
  anadirCliente(cliente: Cliente): void {
    this.clientesService.addCliente(cliente).subscribe({
      next: () => {
        //muestro un snackbar de exito y vuelvo al listado de clientes
        this.snackBar.open(
          this.translate.instant('clients.createdSnack'),
          this.translate.instant('common.close'),
          {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['snack-success'],
          },
        );
        this.clienteForm.reset();
        this.router.navigate(['/inicioadmin/clientes']);
      },
      error: (error: Error) => {
        //si falla muestro el mensaje del backend, o uno generico si no llega ninguno
        this.snackBar.open(
          error.message ?? this.translate.instant('clients.createErrorSnack'),
          this.translate.instant('common.close'),
          {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['snack-error'],
          },
        );
      },
    });
  }

  //funcion para actualizar un cliente existente
  actualizarCliente(cliente: Cliente): void {
    this.clientesService.updateCliente(cliente).subscribe({
      next: () => {
        this.snackBar.open(
          this.translate.instant('clients.updatedSnack'),
          this.translate.instant('common.close'),
          {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['snack-success'],
          },
        );
        this.clienteForm.reset();
        this.router.navigate(['/inicioadmin/clientes']);
      },
      error: (error: Error) => {
        this.snackBar.open(
          error.message ?? this.translate.instant('clients.updateErrorSnack'),
          this.translate.instant('common.close'),
          {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['snack-error'],
          },
        );
      },
    });
  }

  //funcion para cancelar y volver al listado
  cancelar(): void {
    this.router.navigate(['/inicioadmin/clientes']);
  }
}
