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

    //cojo los datos desde los getters que el usuario ha introducido y creo un objeto de empresa
    const empresa: Empresa = {
      id: 0, //se asigna 0 para que el backend lo genere automaticamente ya que es autoincremental
      fecha_registro: new Date(), //la fecha en la que se ha creado, por lo que es la actual al momento
      fecha_actualizacion: new Date(), //la fecha en la que se ha actualizado, por lo que es la actual al momento hasta que se actualice otra vez
      nombre_comercial: this.userForm.value.nombre_comercial,
      razon_social: this.userForm.value.razon_social,
      nif: this.userForm.value.nif,
      email: this.userForm.value.emailEmpresa,
      telefono: this.userForm.value.telefono,
      direccion: this.userForm.value.direccion,
      codigo_postal: this.userForm.value.codigo_postal,
      ciudad: this.userForm.value.ciudad,
      provincia: this.userForm.value.provincia,
      suscripcion_activa: true, //true si tiene subscripcion, false si no
      fecha_vencimiento: new Date(new Date().setDate(new Date().getDate() + 14)), //la fecha en la que vence la suscripcion
      activo: true, //la empresa esta activa por defecto al crearla, se puede desactivar desde el panel de administración
      logo_url: '',
    };

    //creacion de la empresa
    //le paso a la funcion de addEMpresa el objeto creado de la empresa
    this.empresaServicios.addEmpresa(empresa).subscribe({
      next: (response) => {
        console.log(response);

        //creacion del usuario (necesito buscar la empresa para el id de la empresa) por lo que se debe de poner en el next al ser asincrono
        this.empresaServicios.getEmpresaByNif(this.userForm.value.nif).subscribe({
          next: (response) => {
            console.log(response);
            //cuando llegue la respuesta al next, guardo el id de la empresa buscada
            this.idEmpresa = response.id;

            //creo el objeto de usuario con los datos de los getters y el id de la emoresa
            const usuario: Usuario = {
              id: 0, //se generara en el backend
              empresa_id: this.idEmpresa, //ID que he guardado de la empresa buscada
              nombre: this.userForm.value.nombre,
              email: this.userForm.value.emailUsuario,
              password: this.userForm.value.password,
              rol: 'admin',
              fecha_creacion: new Date(), //la fecha en la que se ha creado, por lo que es la actual al momento
              fecha_actualizacion: new Date(), //la fecha en la que se ha actualizado, por lo que es la actual al momento hasta que se actualice otra vez
              deleted_at: null, //null porque no se ha borrado
            };

            //Le paso a la funcion de crear usuario el objeto
            this.usuarioServicios.addUsuario(usuario).subscribe({
              next: (response) => {
                console.log(response);
                //guardo el email de empresa antes de resetear el formulario
                const emailEmpresa = this.userForm.value.emailEmpresa;
                //reseteo el formulario
                this.userForm.reset();

                //funcion timeout para esperar dos segundos
                setTimeout(() => {
                  //redirijo a la pantalla de verificación por email, pasando el email de la empresa
                  this.router.navigate(['/registro-verificacion'], {
                    state: { email: emailEmpresa }
                  });
                }, 700); //espera 2 segundos para que se vea la pagina de espera
              },
              error: (error) => {
                //enseño error
                console.error('Error al crear usuario:', error);
                //funcion timeout para esperar dos segundos
                setTimeout(() => {
                  //si falla redirije a la creacion fallida
                  this.router.navigate(['/creacionfallida']);
                }, 700); //espera 2 segundos para que se vea la pagina de espera

                //si falla, borro tambien la empresa creada para que no haya empresas sin admins
                this.empresaServicios
                  .deleteEmpresaCorreo(this.userForm.value.emailEmpresa)
                  .subscribe({
                    next: (response) => {
                      console.log(response);
                    },
                    error: (error) => {
                      console.error('Error al eliminar empresa:', error);
                    },
                  });
              },
            });
          },
          error: (error) => {
            console.error('Error al obtener empresa por NIF:', error);
            //funcion timeout para esperar dos segundos
            setTimeout(() => {
              //si falla redirije a la creacion fallida
              this.router.navigate(['/creacionfallida']);
            }, 700); //espera 2 segundos para que se vea la pagina de espera

            //si falla, borro tambien la empresa creada buscando por su correo para que no haya empresas sin admins
            this.empresaServicios.deleteEmpresaCorreo(this.userForm.value.emailEmpresa).subscribe({
              next: (response) => {
                console.log(response);
              },
              error: (error) => {
                console.error('Error al eliminar empresa:', error);
              },
            });
          },
        });
      },
      error: (error) => {
        console.error('Error al crear empresa:', error);
        //funcion timeout para esperar dos segundos
        setTimeout(() => {
          //si falla redirije a la creacion fallida
          this.router.navigate(['/creacionfallida']);
        }, 700); //espera 2 segundos para que se vea la pagina de espera
      },
    });
  }

  onReset(): void {
    this.userForm.reset();
  }
}
