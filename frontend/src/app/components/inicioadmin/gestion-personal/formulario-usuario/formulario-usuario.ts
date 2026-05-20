import { Component, inject, signal } from '@angular/core';
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
  public hidePassword: boolean = true; //variable para mostrar u ocultar la contraseña

  private router = inject(Router);
  private usuarioServicios = inject(UsuariosServices);
  private authentication = inject(Authentication);
  private snackBar = inject(MatSnackBar);
  private activatedRoute = inject(ActivatedRoute);
  private translate = inject(TranslateService);
  private fb = inject(FormBuilder);

  //id del usuario que voy a editar, si esta seteado estoy editando y si no estoy creando
  public id!: number;
  public cargando = signal<boolean>(false);

  //creo el formulario del usuario con sus validaciones
  constructor() {
    this.userForm = this.fb.group({
      id: [''], //solo se rellena si estamos editando un usuario existente
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
    //miro si me llega un id por la URL para saber si estoy editando o creando
    this.activatedRoute.queryParams.subscribe((params) => {
      this.id = params['id'];
      if (this.id) {
        //si estoy editando, la contraseña deja de ser obligatoria
        //si el admin la deja en blanco el backend mantiene la actual y no la cambia
        this.password.clearValidators();
        this.password.setValidators([Validators.minLength(LIMITES.PASSWORD_MIN)]);
        this.password.updateValueAndValidity();

        //pido el usuario al backend y relleno el formulario con sus datos
        this.cargando.set(true);
        this.usuarioServicios.getUsuario(this.id).subscribe({
          next: (response: any) => {
            this.userForm.patchValue({
              id: response.id,
              nombre: response.nombre,
              email: response.email,
              rol: response.rol ?? 'operario',
            });
            //importante: NO precargo la contraseña, asi el admin escribe una nueva si quiere cambiarla
            this.password.setValue('');
            this.cargando.set(false);
          },
          error: () => { this.cargando.set(false); },
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

  //funcion que se ejecuta al pulsar guardar
  onSubmit(): void {
    //si el formulario es invalido marco todos los campos como tocados para que se vean los errores
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    //necesito el empresa_id de la sesion para asociar el usuario a la empresa correcta
    const usuarioSesion = this.authentication.obtenerUsuarioSesion();
    if (!usuarioSesion?.empresa_id) {
      this.router.navigate(['/sesioncerrada']);
      return;
    }

    //si estoy editando y la contraseña esta vacia no la mando al backend, asi mantiene la actual
    const passwordPlano = (this.userForm.value.password || '').trim();
    const enviarPassword = !this.id || passwordPlano.length > 0;

    //construyo el objeto usuario con los datos del formulario
    const usuarioNuevo: Usuario = {
      id: this.userForm.value.id,
      nombre: this.userForm.value.nombre,
      email: this.userForm.value.email,
      password: enviarPassword ? passwordPlano : '',
      //empresa_id se coge de la sesion para que el usuario quede en la empresa correcta
      empresa_id: usuarioSesion.empresa_id,
      rol: this.userForm.value.rol,
      fecha_creacion: new Date(),
      fecha_actualizacion: new Date(),
      deleted_at: null,
    };

    //si no hay id estoy creando un usuario nuevo, si lo hay lo estoy actualizando
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
        //muestro un snackbar de exito y vuelvo al listado de personal
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

  //funcion para actualizar un usuario existente
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
        //si el error es del tipo "sin administradores" muestro un mensaje especifico
        //porque es un caso de uso que el usuario tiene que entender bien
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

  //funcion para resetear el formulario
  onReset(): void {
    this.userForm.reset();
  }

  //funcion para volver al listado sin guardar nada
  volver(): void {
    this.router.navigate(['/inicioadmin/gestion-personal']);
  }
}
