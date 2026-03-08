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
import { timeout } from 'rxjs';
import { Authentication } from '../../../services/authentication';


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
    RouterLink
],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  public userForm!: FormGroup;
  public hidePassword: boolean = true; // Variable para controlar la visibilidad de la contraseña

  // Inyectamos el servicio Router para poder redirigir al usuario a la página de creación de un nuevo usuario cuando haga clic en el botón "Nuevo Usuario"
  private router = inject(Router); // Inyectamos el servicio Router para poder redirigir al usuario a la página de creación de un nuevo usuario cuando haga clic en el botón "Nuevo Usuario"
  private usuarioServicios = inject(UsuariosServices); // Inyectamos el servicio UsuariosServices para poder utilizar sus métodos y gestionar los usuarios desde este componente, como crear, actualizar o eliminar usuarios.
  private authentication = inject(Authentication); // Inyectamos el servicio Authentication para poder utilizar sus métodos y gestionar la sesión del usuario desde este componente, como guardar, recuperar o cerrar la sesión.
  
  //Formulario
  constructor(private fb: FormBuilder) {
    this.userForm = this.fb.group({
      //parte de los usuarios y sus validaciones
      emailUsuario: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  /**getter's */
  //getters del usuario
  get emailUsuario() {
    return this.userForm.get('emailUsuario') as FormControl;
  }
  get password() {
    return this.userForm.get('password') as FormControl;
  }

  //cuando se da click a registrar:
  onSubmit(): void {
    this.router.navigate(['/loginespera']);

    //guardo el correo
    const correo = this.userForm.value.emailUsuario;
    //guardo la contraseña
    const contraseña = this.userForm.value.password;

    //hago la peticion al backend para obtener el usuario por correo y contraseña
    this.usuarioServicios.getUsuarioCorreoContraseña(correo, contraseña).subscribe({
      next: (res) => {
        console.log(res);

        //guardamos el usuario en la sesion
        this.authentication.guardarUsuarioSesion(res);

        //funcion timeout para esperar dos segundos
        setTimeout(() => {
          //si falla redirije a la creacion fallida
          this.router.navigate(['/logincorrecto']);
        }, 700); //espera 2 segundos para que se vea la pagina de espera
      },
      error: (error) => {
        //enseño error
        console.error('Error al iniciar sesion:', error);
        //funcion timeout para esperar dos segundos
        setTimeout(() => {
          //si falla redirije a la creacion fallida
          this.router.navigate(['/loginfallido']);
        }, 700); //espera 2 segundos para que se vea la pagina de espera
      }
    });
  }

  //resetea formulario
  onReset(): void {
    this.userForm.reset();
  }
}
