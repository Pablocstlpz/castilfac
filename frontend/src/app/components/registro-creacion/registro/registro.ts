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

import { Router, RouterLink } from '@angular/router';
import { EmpresasServices, RegistroPayload } from '../../../services/empresas';
import {
  LIMITES,
  REGEX_CIF,
  REGEX_CODIGO_POSTAL,
  REGEX_NOMBRE_GEOGRAFICO,
  REGEX_NOMBRE_PERSONA,
  REGEX_TELEFONO,
} from '../../../shared/regex';

@Component({
  selector: 'app-formulario',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    ReactiveFormsModule,
    MatOptionModule,
    MatSelectModule,
    RouterLink,
  ],
  templateUrl: './registro.html',
  styleUrl: './registro.css',
})
export class Registro {
  public userForm!: FormGroup;
  public hidePassword: boolean = true;

  private router = inject(Router);
  // Ahora solo necesitamos el servicio de empresas: el endpoint transaccional
  // se encarga tanto de crear la empresa como el admin inicial en una sola
  // peticion. Nos ahorramos UsuariosServices y la cadena anidada de subscribes.
  private empresaServicios = inject(EmpresasServices);

  //Formulario.
  //Usamos los regex y limites de shared/regex.ts para que las reglas del frontend
  //coincidan EXACTAMENTE con las del validator del backend (validarCrearEmpresa).
  constructor(private fb: FormBuilder) {
    this.userForm = this.fb.group({
      //parte de las empresas y sus validaciones
      nombre_comercial: [
        '',
        [Validators.required, Validators.maxLength(LIMITES.NOMBRE_COMERCIAL_MAX)],
      ],
      razon_social: [
        '',
        [Validators.required, Validators.maxLength(LIMITES.RAZON_SOCIAL_MAX)],
      ],
      //Regex de CIF identica al backend (antes el FE aceptaba DNI y el BE rechazaba).
      nif: [
        '',
        [
          Validators.required,
          Validators.minLength(9),
          Validators.maxLength(9),
          Validators.pattern(REGEX_CIF),
        ],
      ],
      emailEmpresa: [
        '',
        [Validators.required, Validators.email, Validators.maxLength(LIMITES.EMAIL_MAX)],
      ],
      telefono: ['', [Validators.required, Validators.pattern(REGEX_TELEFONO)]],
      direccion: [
        '',
        [Validators.required, Validators.maxLength(LIMITES.DIRECCION_MAX)],
      ],
      codigo_postal: [
        '',
        [Validators.required, Validators.pattern(REGEX_CODIGO_POSTAL)],
      ],
      ciudad: [
        '',
        [
          Validators.required,
          Validators.maxLength(LIMITES.CIUDAD_MAX),
          Validators.pattern(REGEX_NOMBRE_GEOGRAFICO),
        ],
      ],
      provincia: [
        '',
        [
          Validators.required,
          Validators.maxLength(LIMITES.PROVINCIA_MAX),
          Validators.pattern(REGEX_NOMBRE_GEOGRAFICO),
        ],
      ],

      //parte de los usuarios y sus validaciones
      nombre: [
        '',
        [
          Validators.required,
          Validators.maxLength(LIMITES.NOMBRE_USUARIO_MAX),
          Validators.pattern(REGEX_NOMBRE_PERSONA),
        ],
      ],
      emailUsuario: [
        '',
        [Validators.required, Validators.email, Validators.maxLength(LIMITES.EMAIL_MAX)],
      ],
      password: ['', [Validators.required, Validators.minLength(LIMITES.PASSWORD_MIN)]],
    });
  }

  /**getter's */
  //getters de la empresa
  get nombre_comercial() {
    return this.userForm.get('nombre_comercial') as FormControl;
  }
  get razon_social() {
    return this.userForm.get('razon_social') as FormControl;
  }
  get nif() {
    return this.userForm.get('nif') as FormControl;
  }
  get emailEmpresa() {
    return this.userForm.get('emailEmpresa') as FormControl;
  }
  get telefono() {
    return this.userForm.get('telefono') as FormControl;
  }
  get direccion() {
    return this.userForm.get('direccion') as FormControl;
  }
  get codigo_postal() {
    return this.userForm.get('codigo_postal') as FormControl;
  }
  get ciudad() {
    return this.userForm.get('ciudad') as FormControl;
  }
  get provincia() {
    return this.userForm.get('provincia') as FormControl;
  }

  //getters del usuario
  get empresa_id() {
    return this.userForm.get('empresa_id') as FormControl;
  }
  get nombre() {
    return this.userForm.get('nombre') as FormControl;
  }
  get emailUsuario() {
    return this.userForm.get('emailUsuario') as FormControl;
  }
  get password() {
    return this.userForm.get('password') as FormControl;
  }

  //cuando se da click a registrar:
  onSubmit(): void {
    this.router.navigate(['/creacionespera']);

    //Construimos el payload del endpoint TRANSACCIONAL POST /api/empresas/registro.
    //Es UNA SOLA peticion: si falla cualquier paso (validacion, unicidad de NIF,
    //creacion del admin...) el backend hace rollback y NO queda empresa huerfana.
    //Adios al "addEmpresa + getEmpresaByNif + addUsuario + deleteEmpresaCorreo si falla".
    const payload: RegistroPayload = {
      empresa: {
        nombre_comercial: this.userForm.value.nombre_comercial,
        razon_social: this.userForm.value.razon_social,
        nif: this.userForm.value.nif,
        email: this.userForm.value.emailEmpresa,
        telefono: this.userForm.value.telefono,
        direccion: this.userForm.value.direccion,
        codigo_postal: this.userForm.value.codigo_postal,
        ciudad: this.userForm.value.ciudad,
        provincia: this.userForm.value.provincia,
      },
      admin: {
        nombre: this.userForm.value.nombre,
        email: this.userForm.value.emailUsuario,
        password: this.userForm.value.password,
      },
    };

    this.empresaServicios.registroTransaccional(payload).subscribe({
      next: () => {
        const emailEmpresa = this.userForm.value.emailEmpresa;
        this.userForm.reset();
        setTimeout(() => {
          this.router.navigate(['/registro-verificacion'], {
            state: { email: emailEmpresa },
          });
        }, 700);
      },
      error: (error) => {
        console.error('Error al registrar empresa:', error);
        setTimeout(() => {
          this.router.navigate(['/creacionfallida']);
        }, 700);
      },
    });
  }

  onReset(): void {
    this.userForm.reset();
  }
}
