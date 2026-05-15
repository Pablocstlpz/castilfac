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

import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Usuario } from '../../../interfaces/usuario';
import { UsuariosServices } from '../../../services/usuarios';
import { Empresa } from '../../../interfaces/empresa';
import { EmpresasServices } from '../../../services/empresas';
import { timeout } from 'rxjs';

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
  public hidePassword: boolean = true; // Variable para controlar la visibilidad de la contraseña

  // Inyectamos el servicio Router para poder redirigir al usuario a la página de creación de un nuevo usuario cuando haga clic en el botón "Nuevo Usuario"
  private router = inject(Router); // Inyectamos el servicio Router para poder redirigir al usuario a la página de creación de un nuevo usuario cuando haga clic en el botón "Nuevo Usuario"
  private usuarioServicios = inject(UsuariosServices); // Inyectamos el servicio UsuariosServices para poder utilizar sus métodos y gestionar los usuarios desde este componente, como crear, actualizar o eliminar usuarios.
  private empresaServicios = inject(EmpresasServices); // Inyectamos el servicio EmpresasServices para poder utilizar sus métodos y gestionar las empresas desde este componente, como crear, actualizar o eliminar empresas.
  private idEmpresa!: number;

  //Formulario
  constructor(private fb: FormBuilder) {
    this.userForm = this.fb.group({
      //parte de las empresas y sus validaciones
      nombre_comercial: [
        '',
        [
          Validators.required,
          Validators.maxLength(150),
        ],
      ],
      razon_social: ['', [Validators.required, Validators.maxLength(150)]],
      nif: [
        '',
        [
          Validators.required,
          Validators.minLength(9),
          Validators.maxLength(9),
          Validators.pattern('^[A-Za-z][0-9]{8}$'),
        ],
      ],
      emailEmpresa: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.pattern('^\\+?[1-9]\\d{6,14}$')]],
      direccion: ['', [Validators.required, Validators.maxLength(200)]],
      codigo_postal: [
        '',
        [
          Validators.required,
          Validators.minLength(5),
          Validators.maxLength(5),
          Validators.pattern('^[0-9]{5}$'),
        ],
      ],
      ciudad: [
        '',
        [
          Validators.required,
          Validators.maxLength(150),
          Validators.pattern('^[A-Za-zÁÉÍÓÚáéíóúÑñÜü ]+$'),
        ],
      ],
      provincia: [
        '',
        [
          Validators.required,
          Validators.maxLength(150),
          Validators.pattern('^[A-Za-zÁÉÍÓÚáéíóúÑñÜü ]+$'),
        ],
      ],

      //parte de los usuarios y sus validaciones
      nombre: [
        '',
        [
          Validators.required,
          Validators.maxLength(150),
          Validators.pattern('^[A-Za-zÁÉÍÓÚáéíóúÑñÜü ]+$'),
        ],
      ],
      emailUsuario: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
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

    //SOLO mandamos campos editables por el cliente. El backend ignora suscripcion_activa,
    //activo, email_verificado, fecha_vencimiento y token_verificacion en este endpoint
    //para evitar escalada de privilegios (el trial gratuito y la suscripcion los gestiona
    //el servidor desde createEmpresa y desde el webhook de Stripe).
    const empresa: Empresa = {
      id: 0,
      fecha_registro: new Date(),
      fecha_actualizacion: new Date(),
      nombre_comercial: this.userForm.value.nombre_comercial,
      razon_social: this.userForm.value.razon_social,
      nif: this.userForm.value.nif,
      email: this.userForm.value.emailEmpresa,
      telefono: this.userForm.value.telefono,
      direccion: this.userForm.value.direccion,
      codigo_postal: this.userForm.value.codigo_postal,
      ciudad: this.userForm.value.ciudad,
      provincia: this.userForm.value.provincia,
      //estos cuatro los ignora el backend; los dejamos solo porque la interface Empresa
      //sigue exigiendolos para tipado; el servidor pone los valores reales.
      suscripcion_activa: false,
      fecha_vencimiento: new Date(),
      activo: true,
      logo_url: '',
    };

    //creacion de la empresa. Ahora addEmpresa devuelve la empresa completa con su id,
    //asi que ya no necesitamos llamar a getEmpresaByNif para resolver el id (un round-trip menos
    //y una ruta autenticada menos en el flujo de registro).
    this.empresaServicios.addEmpresa(empresa).subscribe({
      next: (empresaCreada: any) => {
        this.idEmpresa = empresaCreada.id;

        //creo el usuario admin inicial. NO mandamos password al backend dentro del objeto
        //plantilla porque el backend ya marca rol='admin' a fuego. Solo enviamos lo minimo.
        const usuario: Usuario = {
          id: 0,
          empresa_id: this.idEmpresa,
          nombre: this.userForm.value.nombre,
          email: this.userForm.value.emailUsuario,
          password: this.userForm.value.password,
          rol: 'admin',
          fecha_creacion: new Date(),
          fecha_actualizacion: new Date(),
          deleted_at: null,
        };

        //Usamos el endpoint PUBLICO de registro inicial. POST /usuarios ahora exige JWT.
        this.usuarioServicios.registroInicial(usuario).subscribe({
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
            console.error('Error al crear usuario:', error);
            setTimeout(() => {
              this.router.navigate(['/creacionfallida']);
            }, 700);

            //rollback: si falla la creacion del usuario, intentamos borrar la empresa.
            //IMPORTANTE: deleteEmpresaCorreo ahora exige rol superadmin (JWT), por lo que
            //en este flujo publico va a devolver 401/403. Lo dejamos como best-effort hasta
            //que en el Bloque 4 se haga un endpoint transaccional /empresas/registro.
            this.empresaServicios
              .deleteEmpresaCorreo(this.userForm.value.emailEmpresa)
              .subscribe({
                next: () => {},
                error: (error) => console.error('Error al eliminar empresa (best-effort):', error),
              });
          },
        });
      },
      error: (error) => {
        console.error('Error al crear empresa:', error);
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
