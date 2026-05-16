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

import { Router, RouterLink } from '@angular/router';
import { UsuariosServices } from '../../../services/usuarios';
import { Authentication } from '../../../services/authentication';
import { environment } from '../../../../environments/environment';


// El objeto `google` lo inyecta el script de Google Identity Services cargado en index.html
declare const google: any;

// El client id de Google viene del environment (antes estaba hardcodeado).
// Asi podemos tener un client id distinto en dev/prod sin tocar codigo.
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
    RouterLink,
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements AfterViewInit {
  public userForm!: FormGroup;
  public hidePassword: boolean = true;

  private router = inject(Router);
  private usuarioServicios = inject(UsuariosServices);
  private authentication = inject(Authentication);
  private ngZone = inject(NgZone);
  //Unificado a inject() para no mezclar con constructor DI (Angular 21 idiomatico).
  private fb = inject(FormBuilder);

  constructor() {
    this.userForm = this.fb.group({
      emailUsuario: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  get emailUsuario() {
    return this.userForm.get('emailUsuario') as FormControl;
  }
  get password() {
    return this.userForm.get('password') as FormControl;
  }

  ngOnInit(): void {
    const usuarioLocal = this.authentication.obtenerUsuarioSesion();
    if (usuarioLocal !== null && usuarioLocal.rol === 'operario') {
      this.router.navigate(['/iniciooperario']);
    }
  }

  ngAfterViewInit(): void {
    // Inicializa Google Identity Services y renderiza el botón en el contenedor
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response: { credential: string }) => {
        // Ejecutamos dentro de NgZone para que Angular detecte los cambios
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

  private manejarLoginGoogle(credential: string): void {
    this.router.navigate(['/loginespera']);

    this.usuarioServicios.loginConGoogle(credential).subscribe({
      next: (res) => {
        // res = { accessToken, usuario }; guardarSesion guarda ambos.
        this.authentication.guardarSesion(res);
        setTimeout(() => {
          this.router.navigate(['/logincorrecto']);
        }, 700);
      },
      error: (error) => {
        console.error('Error en login con Google:', error);
        setTimeout(() => {
          this.router.navigate(['/loginfallido']);
        }, 700);
      },
    });
  }

  onSubmit(): void {
    this.router.navigate(['/loginespera']);

    const correo = this.userForm.value.emailUsuario;
    const contraseña = this.userForm.value.password;

    this.usuarioServicios.getUsuarioCorreoContraseña(correo, contraseña).subscribe({
      next: (res) => {
        // res = { accessToken, usuario }; guardarSesion guarda token + usuario.
        this.authentication.guardarSesion(res);
        setTimeout(() => {
          this.router.navigate(['/logincorrecto']);
        }, 700);
      },
      error: (error) => {
        console.error('Error al iniciar sesion:', error);
        setTimeout(() => {
          this.router.navigate(['/loginfallido']);
        }, 700);
      },
    });
  }

  onReset(): void {
    this.userForm.reset();
  }
}
