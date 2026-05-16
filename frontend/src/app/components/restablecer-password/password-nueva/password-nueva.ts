import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UsuariosServices } from '../../../services/usuarios';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-password-nueva',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatSnackBarModule, TranslatePipe],
  templateUrl: './password-nueva.html',
})
export class PasswordNueva implements OnInit {

  // Inyectamos el Router para poder redirigir al usuario a la pantalla de exito cuando cambie la contraseña
  private router = inject(Router);
  // Inyectamos ActivatedRoute para poder leer el token que viene en los parametros de la URL del enlace del correo
  private route = inject(ActivatedRoute);
  // Inyectamos MatSnackBar para poder mostrar mensajes de aviso o error al usuario
  private snackBar = inject(MatSnackBar);
  // Inyectamos el servicio UsuariosServices para poder llamar al backend y restablecer la contraseña con el token
  private usuarioServicios = inject(UsuariosServices);
  private translate = inject(TranslateService);

  // Variables del formulario de nueva contraseña
  public password = '';
  public confirmPassword = '';
  // Variable para controlar si se muestra la contraseña en texto plano o como puntos
  public mostrarPassword = false;
  // Variable donde guardamos el token que viene en la URL del enlace del correo de recuperacion
  private tokenRecuperacion: string | null = null;

  // Variable para controlar si se muestra el spinner de carga mientras se hace la peticion
  public cargando = signal<boolean>(false);
  // Variable para controlar si ya se ha cambiado la contraseña y mostrar la pantalla de exito
  public passwordCambiada = signal<boolean>(false);

  ngOnInit(): void {
    //capturo el token de recuperacion que viene en los parametros de la URL (ej: /password-nueva?token=xyz)
    this.route.queryParams.subscribe(params => {
      this.tokenRecuperacion = params['token'] || null;

      //si no hay token, el enlace no es valido, aviso al usuario
      if (!this.tokenRecuperacion) {
        this.snackBar.open(
          this.translate.instant('resetPassword.linkInvalid'),
          this.translate.instant('common.close'),
          { duration: 4000 },
        );
      }
    });
  }

  //alterna la visibilidad de la contraseña entre texto plano y puntos
  togglePassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  //cuando se hace submit del formulario para guardar la nueva contraseña:
  guardarPassword(): void {

    //el boton ya esta desactivado en el HTML si no cumple las condiciones, pero lo valido tambien aqui por seguridad
    if (this.password.length < 8 || this.password !== this.confirmPassword) return;

    //valido que tengamos token antes de hacer la peticion
    if (!this.tokenRecuperacion) {
      this.snackBar.open(
        this.translate.instant('resetPassword.linkInvalidNew'),
        this.translate.instant('common.close'),
        { duration: 4000 },
      );
      return;
    }

    //activo el estado de carga para que el boton se deshabilite y se muestre el spinner
    this.cargando.set(true);

    //hago la peticion al backend con el token y la nueva contraseña para restablecerla
    this.usuarioServicios.restablecerPassword(this.tokenRecuperacion, this.password).subscribe({
      next: (response) => {
        console.log(response);
        //desactivo el estado de carga
        this.cargando.set(false);
        //redirijo a la pantalla de contraseña cambiada correctamente
        this.router.navigate(['/password-cambiada']);
      },
      error: (error) => {
        //enseño error
        console.error('Error al restablecer la contraseña:', error);
        //desactivo el estado de carga
        this.cargando.set(false);
        //muestro el mensaje de error que devuelve el backend (token expirado, no valido, etc)
        this.snackBar.open(
          error.message || this.translate.instant('resetPassword.linkExpired'),
          this.translate.instant('common.close'),
          { duration: 5000 },
        );
      }
    });
  }

  //redirige al usuario de vuelta al inicio de sesion
  volverAlLogin(): void {
    this.router.navigate(['/login']);
  }
}