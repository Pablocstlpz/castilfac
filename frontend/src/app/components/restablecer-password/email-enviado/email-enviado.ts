import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-email-enviado',
  standalone: true,
  imports: [
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './email-enviado.html'
})
export class EmailEnviado {

  // Inyectamos el router para la navegación y el snackbar para los avisos
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  volverAlLogin(): void {
    // Redirige al usuario de vuelta a la pantalla de inicio de sesión
    this.router.navigate(['/login']);
  }

  reenviarCorreo(): void {
    // Aquí iría tu llamada al servicio backend para que dispare el email otra vez
    // this.authService.reenviarRecuperacion(email).subscribe(...)

    // Por ahora, mostramos un mensaje visual de éxito al usuario
    this.snackBar.open('¡Correo reenviado! Comprueba de nuevo tu bandeja.', 'Genial', { 
      duration: 4000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }
}