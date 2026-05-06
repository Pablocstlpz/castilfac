import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-registro-verificacion',
  standalone: true,
  imports: [MatIconModule, MatSnackBarModule],
  templateUrl: './registro-verificacion.html'
})
export class RegistroVerificacion {
  
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  // Podrías recibir el email por estado de navegación o queryParams
  public emailUsuario = signal<string>('usuario@ejemplo.com');

  abrirCorreo(): void {
    // Intenta abrir el cliente de correo predeterminado
    window.open('mailto:', '_blank');
  }

  reenviarVerificacion(): void {
    // Aquí iría la llamada a tu API de registro/auth
    // this.authService.resendVerification(this.emailUsuario()).subscribe(...)

    this.snackBar.open('Enlace de activación reenviado con éxito.', 'Entendido', {
      duration: 4000,
      panelClass: ['snackbar-success']
    });
  }

  volverAlLogin(): void {
    this.router.navigate(['/login']);
  }
}