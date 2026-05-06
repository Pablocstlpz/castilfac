import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-restablecer-password',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatSnackBarModule],
  templateUrl: './restablecer-password.html',
})
export class RestablecerPassword {
  
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  // Estado del componente
  public email: string = '';
  public cargando = signal<boolean>(false);
  public correoEnviado = signal<boolean>(false);

  enviarCorreo(): void {
    if (!this.email || !this.email.includes('@')) {
      this.snackBar.open('Por favor, introduce un correo electrónico válido.', 'Cerrar', { duration: 3000 });
      return;
    }

    this.cargando.set(true);

    // Aquí llamarías a tu servicio de Backend (NodeMailer)
    // this.authService.solicitarRecuperacion(this.email).subscribe(...)
    
    // Simulamos la llamada a la base de datos
    setTimeout(() => {
      this.cargando.set(false);
      this.correoEnviado.set(true); // Esto cambia el HTML al estado 2
    }, 1500);
  }

  volverAlLogin(): void {
    // Redirige a la pantalla de login. Ajusta la ruta según tu proyecto.
    this.router.navigate(['/login']);
  }
}