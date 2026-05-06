import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-password-cambiada',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './password-cambiada.html'
})
export class PasswordCambiada {
  
  private router = inject(Router);
  private timer: any;

  ngOnInit(): void {
    // Redirección automática tras 8 segundos por si el usuario se queda mirando la pantalla
    this.timer = setTimeout(() => {
      this.irAlLogin();
    }, 8000);
  }

  ngOnDestroy(): void {
    // Limpiamos el timer si el usuario navega manualmente antes de los 8 segundos
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }

  irAlLogin(): void {
    this.router.navigate(['/login']);
  }
}