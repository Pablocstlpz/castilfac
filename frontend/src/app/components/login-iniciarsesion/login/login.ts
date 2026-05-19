import { AfterViewInit, Component, inject, NgZone } from '@angular/core';
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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { UsuariosServices } from '../../../services/usuarios';
import { Authentication } from '../../../services/authentication';
import { environment } from '../../../../environments/environment';


//objeto google que viene del script de Google Identity Services cargado en index.html
declare const google: any;

//id del cliente de google que se lee del environment para no tenerlo hardcodeado
const GOOGLE_CLIENT_ID = environment.googleClientId;

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
    MatSnackBarModule,
    RouterLink,
    TranslatePipe,
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements AfterViewInit {
  public userForm!: FormGroup;
  public hidePassword: boolean = true; //variable para mostrar u ocultar la contraseña al pulsar el ojo

  private router = inject(Router);
  private usuarioServicios = inject(UsuariosServices);
  private authentication = inject(Authentication);
  private ngZone = inject(NgZone); //necesario para que Angular detecte el callback de google
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar); //para mostrar al usuario el mensaje real del backend (rate limit, etc.)

  //creo el formulario con sus validaciones
  constructor() {
    this.userForm = this.fb.group({
      emailUsuario: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  /**getter's */
  get emailUsuario() {
    return this.userForm.get('emailUsuario') as FormControl;
  }
  get password() {
    return this.userForm.get('password') as FormControl;
  }

  ngOnInit(): void {
    //si ya hay un operario logado lo mando directo a su inicio para que no vuelva a pasar por el login
    const usuarioLocal = this.authentication.obtenerUsuarioSesion();
    if (usuarioLocal !== null && usuarioLocal.rol === 'operario') {
      this.router.navigate(['/iniciooperario']);
    }
  }

  ngAfterViewInit(): void {
    //inicializo google identity services y pinto el boton dentro de su contenedor
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response: { credential: string }) => {
        //envuelvo en NgZone para que Angular se entere del cambio y actualice la vista
        this.ngZone.run(() => this.manejarLoginGoogle(response.credential));
      },
    });

    google.accounts.id.renderButton(document.getElementById('google-signin-btn'), {
      theme: 'outline',
      size: 'large',
      width: '100%',
      text: 'signin_with',
      shape: 'rectangular',
      logo_alignment: 'left',
    });
  }

  //funcion para iniciar sesion con google
  private manejarLoginGoogle(credential: string): void {
    this.router.navigate(['/loginespera']);

    this.usuarioServicios.loginConGoogle(credential).subscribe({
      next: (res) => {
        //res trae el accessToken, el refreshToken y el usuario; lo guardo todo en sesion
        this.authentication.guardarSesion(res);
        setTimeout(() => {
          this.router.navigate(['/logincorrecto']);
        }, 700); //pequeña espera para que el usuario vea la pantalla de espera
      },
      error: (err) => {
        //gestiono el error con el mensaje real del backend (rate limit, credenciales malas, etc.)
        this.gestionarErrorLogin(err);
      },
    });
  }

  //funcion que se ejecuta al pulsar el boton de iniciar sesion
  onSubmit(): void {
    this.router.navigate(['/loginespera']);

    //recojo correo y contraseña del formulario
    const correo = this.userForm.value.emailUsuario;
    const contraseña = this.userForm.value.password;

    this.usuarioServicios.getUsuarioCorreoContraseña(correo, contraseña).subscribe({
      next: (res) => {
        //res trae accessToken, refreshToken y usuario; los guardo en sesion
        this.authentication.guardarSesion(res);
        setTimeout(() => {
          this.router.navigate(['/logincorrecto']);
        }, 700);
      },
      error: (err) => {
        //gestiono el error con el mensaje real del backend (rate limit, credenciales malas, etc.)
        this.gestionarErrorLogin(err);
      },
    });
  }

  //funcion compartida para gestionar el error de login (tanto del manual como del de Google)
  //muestra un snackbar con el mensaje del backend y redirige segun sea rate limit o credenciales malas
  private gestionarErrorLogin(err: Error | undefined): void {
    const mensaje = err?.message;
    //si el backend ha devuelto 429 (rate limit) el mensaje empieza por "Demasiados intentos"
    //en ese caso vuelvo al login (no a /loginfallido) para que el usuario vea el snackbar y pueda esperar
    const esRateLimit = !!mensaje && mensaje.toLowerCase().includes('demasiados');

    //muestro un snackbar con el mensaje real del backend (o uno generico si no llega)
    this.snackBar.open(
      mensaje || 'No se ha podido iniciar sesion',
      'Cerrar',
      {
        duration: esRateLimit ? 8000 : 5000, //rate limit dura mas para que se lea bien
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['snack-error'],
      },
    );

    setTimeout(() => {
      //si es rate limit vuelvo al login; si es otro error voy a la pantalla de loginfallido como hasta ahora
      this.router.navigate([esRateLimit ? '/login' : '/loginfallido']);
    }, 700);
  }

  //funcion para resetear el formulario
  onReset(): void {
    this.userForm.reset();
  }
}
