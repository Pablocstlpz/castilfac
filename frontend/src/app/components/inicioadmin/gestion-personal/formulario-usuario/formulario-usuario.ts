import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { ActivatedRoute, Router } from '@angular/router';
import { Usuario } from '../../../../interfaces/usuario';
import { UsuariosServices } from '../../../../services/usuarios';
import { Authentication } from '../../../../services/authentication';
import {
  LIMITES,
  REGEX_NOMBRE_PERSONA,
} from '../../../../shared/regex';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-formulario-usuario',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    ReactiveFormsModule,
    MatOptionModule,
    MatSelectModule,
    MatSnackBarModule,
    TranslatePipe,
  ],
  templateUrl: './formulario-usuario.html',
})
export class FormularioUsuario {
  public userForm!: FormGroup;
  public hidePassword: boolean = true;

  private router = inject(Router);
  private usuarioServicios = inject(UsuariosServices);
  private authentication = inject(Authentication);
  private snackBar = inject(MatSnackBar);
  private activatedRoute = inject(ActivatedRoute);
  private translate = inject(TranslateService);
  private fb = inject(FormBuilder);

  //Si esta seteado estamos editando; si es null/undefined estamos creando.
  public id!: number;

  constructor() {
    //La contraseña arranca como REQUIRED + minLength 8 (para alinearse con el backend);
    //al editar la desactivamos como required y la dejamos opcional para no obligar a
    //cambiarla. Si el usuario la deja vacia, el backend mantiene la actual.
    this.userForm = this.fb.group({
      id: [''],
      nombre: [
        '',
        [
          Validators.required,
          Validators.maxLength(LIMITES.NOMBRE_USUARIO_MAX),
          Validators.pattern(REGEX_NOMBRE_PERSONA),
        ],
      ],
      email: [
        '',
        [Validators.required, Validators.email, Validators.maxLength(LIMITES.EMAIL_MAX)],
      ],
      password: ['', [Validators.required, Validators.minLength(LIMITES.PASSWORD_MIN)]],
      rol: ['operario', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe((params) => {
      this.id = params['id'];
      if (this.id) {
        //Modo EDICION: la contraseña pasa a ser opcional (>= 8 si llega, vacia si no).
        //ANTES: este metodo precargaba response.password en el input, lo que mostraba
        //el HASH bcrypt en claro y, al guardar sin cambiarlo, hacia doble-hash y rompia
        //el login del usuario editado. Ya NO se hace.
        this.password.clearValidators();
        this.password.setValidators([Validators.minLength(LIMITES.PASSWORD_MIN)]);
        this.password.updateValueAndValidity();

        this.usuarioServicios.getUsuario(this.id).subscribe({
          next: (response: any) => {
            this.userForm.patchValue({
              id: response.id,
              nombre: response.nombre,
              email: response.email,
              rol: response.rol ?? 'operario',
            });
            //Importante: NO seteamos password — el backend ya filtra el hash via
            //toJSON, pero aun asi nunca queremos precargar nada en este campo.
            this.password.setValue('');
          },
        });
      }
    });
  }

  /**getter's */
  get nombre() {
    return this.userForm.get('nombre') as FormControl;
  }
  get email() {
    return this.userForm.get('email') as FormControl;
  }
  get password() {
    return this.userForm.get('password') as FormControl;
  }
  get rol() {
    return this.userForm.get('rol') as FormControl;
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const usuarioSesion = this.authentication.obtenerUsuarioSesion();
    if (!usuarioSesion?.empresa_id) {
      this.router.navigate(['/sesioncerrada']);
      return;
    }

    //En edicion: si el campo password viene vacio, NO lo enviamos al backend.
    //updateUsuario en el backend detecta password vacio/ausente y mantiene la actual.
    const passwordPlano = (this.userForm.value.password || '').trim();
    const enviarPassword = !this.id || passwordPlano.length > 0;

    const usuarioNuevo: Usuario = {
      id: this.userForm.value.id,
      nombre: this.userForm.value.nombre,
      email: this.userForm.value.email,
      password: enviarPassword ? passwordPlano : '',
      empresa_id: usuarioSesion.empresa_id,
      rol: this.userForm.value.rol,
      fecha_creacion: new Date(),
      fecha_actualizacion: new Date(),
      deleted_at: null,
    };

    if (!this.id) {
      this.anadirUsuario(usuarioNuevo);
    } else {
      this.actualizarUsuario(usuarioNuevo);
    }
  }

  //funcion para añadir un usuario en la empresa
  anadirUsuario(usuarioNuevo: Usuario): void {
    this.usuarioServicios.addUsuario(usuarioNuevo).subscribe({
      next: () => {
        this.snackBar.open(
          this.translate.instant('staff.createdSnack'),
          this.translate.instant('common.close'),
          {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['snack-success'],
          },
        );
        this.userForm.reset();
        this.router.navigate(['/inicioadmin/gestion-personal']);
      },
      error: (error) => {
        console.error('Error al crear usuario:', error);
        this.snackBar.open(
          error?.message ?? this.translate.instant('staff.createErrorSnack'),
          this.translate.instant('common.close'),
          {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['snack-error'],
          },
        );
      },
    });
  }

  actualizarUsuario(usuario: Usuario): void {
    this.usuarioServicios.updateUsuario(usuario).subscribe({
      next: () => {
        this.snackBar.open(
          this.translate.instant('staff.updatedSnack'),
          this.translate.instant('common.close'),
          {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['snack-success'],
          },
        );
        this.userForm.reset();
        this.router.navigate(['/inicioadmin/gestion-personal']);
      },
      error: (error: unknown) => {
        console.error('Error al actualizar usuario:', error);
        const mensaje =
          error instanceof Error && error.message.includes('sin administradores')
            ? this.translate.instant('staff.noAdminsError')
            : error instanceof Error && error.message
              ? error.message
              : this.translate.instant('staff.updateErrorSnack');

        this.snackBar.open(mensaje, this.translate.instant('common.close'), {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['snack-error'],
        });
      },
    });
  }

  onReset(): void {
    this.userForm.reset();
  }

  volver(): void {
    this.router.navigate(['/inicioadmin/gestion-personal']);
  }
}
