import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-password-nueva',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatSnackBarModule],
  templateUrl: './password-nueva.html',
})
export class PasswordNueva {
  
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  // Variables del formulario
  public password = '';
  public confirmPassword = '';
  public mostrarPassword = false;
  private tokenRecuperacion: string | null = null;

  // Estados visuales
  public cargando = signal<boolean>(false);
  public passwordCambiada = signal<boolean>(false);

  ngOnInit(): void {
    // 1. Capturar el token de la URL (ej: /restablecer?token=xyz)
    this.route.queryParams.subscribe(params => {
      this.tokenRecuperacion = params['token'];
      
      if (!this.tokenRecuperacion) {
        this.snackBar.open('Enlace no válido o caducado.', 'Cerrar', { duration: 4000 });
        // Opcional: Redirigir al login si no hay token
        // this.volverAlLogin(); 
      }
    });
  }

  togglePassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  guardarPassword(): void {
    // Validaciones extra de seguridad
    if (this.password.length < 8) {
      this.snackBar.open('La contraseña debe tener al menos 8 caracteres.', 'Cerrar', { duration: 3000 });
      return;
    }

    if (this.password !== this.confirmPassword) {
      return; // El HTML ya desactiva el botón, pero por seguridad lo bloqueamos en TS
    }

    this.cargando.set(true);

    // TODO: Llamada a tu backend con el token y la nueva clave
    /*
    const payload = {
      token: this.tokenRecuperacion,
      newPassword: this.password
    };
    this.authService.restablecerPassword(payload).subscribe(...)
    */

    // Simulación de respuesta del servidor
    setTimeout(() => {
      this.cargando.set(false);
      this.passwordCambiada.set(true); // Cambia el HTML a la pantalla de éxito
    }, 1500);
  }

  volverAlLogin(): void {
    this.router.navigate(['/login']);
  }
}