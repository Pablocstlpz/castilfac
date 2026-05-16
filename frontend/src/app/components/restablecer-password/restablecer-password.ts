import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UsuariosServices } from '../../services/usuarios';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-restablecer-password',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatSnackBarModule, TranslatePipe],
  templateUrl: './restablecer-password.html',
})
export class RestablecerPassword {

  // Inyectamos el servicio Router para poder redirigir al usuario entre las pantallas del flujo de recuperacion
  private router = inject(Router);
  // Inyectamos MatSnackBar para poder mostrar mensajes de aviso o error al usuario
  private snackBar = inject(MatSnackBar);
  // Inyectamos el servicio UsuariosServices para poder llamar al backend y solicitar el correo de recuperacion de contraseña
  private usuarioServicios = inject(UsuariosServices);
  private translate = inject(TranslateService);

  // Variable para almacenar el email que el usuario introduce en el formulario
  public email: string = '';
  // Variable para controlar si se muestra el spinner de carga mientras se procesa la peticion
  public cargando = signal<boolean>(false);
  // Variable que controla el estado del HTML (si ya se envio el correo o no), la usa el @if del template
  public correoEnviado = signal<boolean>(false);

  //cuando se hace submit del formulario de recuperacion de contraseña:
  enviarCorreo(): void {

    //valido que el email sea valido antes de hacer la peticion al backend
    if (!this.email || !this.email.includes('@')) {
      this.snackBar.open(
        this.translate.instant('resetPassword.emailInvalid'),
        this.translate.instant('common.close'),
        { duration: 3000 },
      );
      return;
    }

    //activo el estado de carga para que el boton se deshabilite y se muestre el spinner
    this.cargando.set(true);

    //hago la peticion al backend para solicitar el envio del correo de recuperacion de contraseña
    this.usuarioServicios.solicitarRecuperacion(this.email).subscribe({
      next: (response) => {
        console.log(response);
        //desactivo el estado de carga
        this.cargando.set(false);
        //redirijo a la pantalla de email enviado, pasando el email por el state para poder reenviarlo si es necesario
        this.router.navigate(['/email-enviado'], { state: { email: this.email } });
      },
      error: (error) => {
        //enseño error
        console.error('Error al solicitar la recuperacion de contraseña:', error);
        //desactivo el estado de carga
        this.cargando.set(false);
        //navego igualmente para no revelar al usuario si el email existe en la base de datos o no
        this.router.navigate(['/email-enviado'], { state: { email: this.email } });
      }
    });
  }

  //redirige al usuario de vuelta al inicio de sesion
  volverAlLogin(): void {
    this.router.navigate(['/login']);
  }
}